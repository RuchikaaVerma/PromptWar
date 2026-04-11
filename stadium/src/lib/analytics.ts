import { logEvent, Analytics } from 'firebase/analytics';
import { initAnalytics } from './firebase';

let _analytics: Analytics | null = null;

/**
 * Lazy-initializes Firebase Analytics and caches the instance.
 * Safe for SSR — returns null on server.
 */
const getOrInitAnalytics = async (): Promise<Analytics | null> => {
  if (typeof window === 'undefined') return null;
  if (_analytics) return _analytics;
  _analytics = await initAnalytics();
  return _analytics;
};

/**
 * Log a custom event to Firebase Analytics
 * @param eventName Name of the event
 * @param params Additional event parameters
 */
export const trackEvent = async (eventName: string, params?: Record<string, unknown>) => {
  try {
    const analytics = await getOrInitAnalytics();
    if (analytics) {
      logEvent(analytics, eventName, params);
      if (process.env.NODE_ENV === 'development') {
        console.log(`[SVES Analytics] ${eventName}`, params);
      }
    }
  } catch (error) {
    // Fail silently — telemetry should never break the app
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[SVES Analytics] Failed to log: ${eventName}`, error);
    }
  }
};

/**
 * Track a page view (called on tab switches)
 */
export const trackPageView = async (pageName: string) => {
  try {
    const analytics = await getOrInitAnalytics();
    if (analytics) {
      logEvent(analytics, 'page_view', { page_title: pageName, page_location: window.location.href });
    }
  } catch (_) { /* fail silently */ }
};

/**
 * Standard telemetry event catalogue for SVES
 */
export const TelemetryEvents = {
  TAB_SWITCH:        'tab_switch',
  AI_CHAT_MSG:       'ai_chat_message',
  INCIDENT_CLICK:    'incident_click',
  MAP_NODE_SELECT:   'map_node_select',
  ROUTE_CALCULATED:  'route_calculated',
  SAFETY_ALERT_ACK:  'safety_alert_acknowledged',
  FOOD_ORDER:        'food_order_initiated',
  TICKET_VIEW:       'ticket_viewed',
  SATELLITE_TOGGLE:  'satellite_view_toggled',
} as const;
