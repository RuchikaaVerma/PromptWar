import { logEvent } from 'firebase/analytics';
import { initAnalytics } from './firebase';

/**
 * Log a custom event to Firebase Analytics
 * @param eventName Name of the event
 * @param params Additional event parameters
 */
export const trackEvent = async (eventName: string, params?: Record<string, unknown>) => {
  try {
    const analytics = await initAnalytics();
    if (analytics) {
      logEvent(analytics, eventName, params);
      
      // Development logging
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Analytics] ${eventName}`, params);
      }
    }
  } catch (error) {
    console.error(`[Analytics Error] Failed to log event: ${eventName}`, error);
  }
};

/**
 * Standard event names for SVES telemetry
 */
export const TelemetryEvents = {
  TAB_SWITCH: 'tab_switch',
  AI_CHAT_MSG: 'ai_chat_message',
  INCIDENT_CLICK: 'incident_click',
  MAP_NODE_SELECT: 'map_node_select',
  ROUTE_CALCULATED: 'route_calculated',
  SAFETY_ALERT_ACK: 'safety_alert_acknowledged',
};
