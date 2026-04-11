"use server";

import { GoogleGenerativeAI } from '@google/generative-ai';
import { stadiumNodes, stadiumEdges } from './data/stadiumGraph';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

/**
 * IMPORTANT: The Gemini API key must be a Google AI Studio key (makersuite.google.com/app/apikey)
 * stored as GEMINI_API_KEY (server-side only). Falls back to the Firebase API key for demo.
 */
const API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '';

const genAI = new GoogleGenerativeAI(API_KEY);

// Compact node summary for the prompt (avoids sending full problemCauses JSON)
const nodesSummary = stadiumNodes.map(n => ({
  id: n.id,
  label: n.label,
  type: n.type,
  load: `${n.currentLoad}/${n.capacity}`,
  pct: Math.round((n.currentLoad / n.capacity) * 100),
  congestion: n.congestion,
  alerts: n.problemCauses.map(c => `[${c.severity.toUpperCase()}] ${c.title}`).join(' | '),
}));

const edgesSummary = stadiumEdges
  .filter(e => !e.blocked)
  .map(e => `${e.from} → ${e.to} (w:${e.weight})`)
  .join(', ');

const SYSTEM_INSTRUCTION = `
You are the SVES (Smart Venue Experience System) AI Operations Assistant, embedded in a real-time stadium intelligence dashboard.

REAL-TIME VENUE STATE:
Nodes: ${JSON.stringify(nodesSummary, null, 0)}
Open routes: ${edgesSummary}

GUIDELINES:
1. Give accurate recommendations based on the live load data above.
2. If a zone is >80% capacity, immediately recommend the best alternative route or zone.
3. For food queries, compare currentLoad% across food nodes and recommend lowest-wait option.
4. Keep responses crisp, data-driven, and under 3 sentences unless the user asks for detail.
5. User's assumed location: Section 110 (sec_110) unless stated otherwise.
6. You are an enterprise AI — be precise, professional, and technically fluent.
7. Always cite specific zone IDs and real metrics from the data when making recommendations.
`;

export async function getAssistantResponseAction(
  userMessage: string, 
  chatHistory: { role: 'user' | 'model'; parts: { text: string }[] }[]
) {
  try {
    if (!API_KEY) {
      return "⚠ SVES AI kernel offline — API credentials not configured. Contact system administrator.";
    }

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash-8b',
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: {
        maxOutputTokens: 300,
        temperature: 0.4,
      }
    });

    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(userMessage);
    return result.response.text();
  } catch (error: unknown) {
    console.error('[SVES] Gemini error:', error);
    if (error instanceof Error && error.message.includes('API_KEY_INVALID')) {
      return "⚠ AI kernel authentication failure. Please reconfigure GEMINI_API_KEY in environment settings.";
    }
    return "⚠ Connectivity issue with SVES telemetry grid. Please try again momentarily.";
  }
}

export async function logSafetyAlertAction(alertType: string, details: string) {
  try {
    const docRef = await addDoc(collection(db, 'telemetry'), {
      type: alertType,
      details,
      timestamp: serverTimestamp() as Timestamp,
      environment: process.env.NODE_ENV,
      source: 'sves_dashboard_v2',
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('[SVES] Firestore write error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function logRouteCalculationAction(from: string, to: string, steps: number) {
  try {
    await addDoc(collection(db, 'route_logs'), {
      from,
      to,
      steps,
      timestamp: serverTimestamp() as Timestamp,
      environment: process.env.NODE_ENV,
    });
    return { success: true };
  } catch (_) {
    return { success: false };
  }
}
