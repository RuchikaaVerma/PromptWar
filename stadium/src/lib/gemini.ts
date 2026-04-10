import { GoogleGenerativeAI } from '@google/generative-ai';
import { stadiumNodes, stadiumEdges } from '../app/data/stadiumGraph';

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

const SYSTEM_INSTRUCTION = `
You are the SVES (Smart Venue Experience System) AI Assistant. 
Your goal is to help fans navigate the stadium, find food, and manage their venue experience.

CONTEXT:
Below is the real-time stadium layout and status:
Nodes (Locations): ${JSON.stringify(stadiumNodes)}
Edges (Paths): ${JSON.stringify(stadiumEdges)}

GUIDELINES:
1. Use the data provided to give accurate recommendations. 
2. If a section is crowded (>80% load), recommend an alternative.
3. If someone asks for food, check "currentLoad" vs "capacity" of food stalls. Suggest stalls with low utilization.
4. Keep responses professional, helpful, and concise.
5. You are an enterprise-level agent, use technical but accessible language.
6. If asked about your "current location", assume the user is at Section 110 unless they state otherwise.
`;

export async function getAssistantResponse(userMessage: string, chatHistory: {role: 'user' | 'model', parts: {text: string}[]}[]) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash-8b',
      systemInstruction: SYSTEM_INSTRUCTION 
    });

    const chat = model.startChat({
      history: chatHistory,
    });

    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API Error:', error);
    return "I am currently experiencing connectivity issues with the SVES telemetry grid. Please try again or check the manual wayfinding signs.";
  }
}
