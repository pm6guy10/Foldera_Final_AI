/**
 * Analytics Client
 * 
 * Provides reliable event tracking with navigator.sendBeacon fallback to fetch,
 * includes experiment context in all events, and handles page unload scenarios.
 */

import { getCurrentVisitorId } from './ab';
import type { Assignment } from './ab';

// Event data structure
export interface EventData {
  type: string;
  name: string;
  props?: Record<string, any>;
  experimentKey?: string;
  variantKey?: string;
}

// Event with context added
interface AnalyticsEvent {
  visitorId: string;
  type: string;
  name: string;
  experimentKey?: string;
  variantKey?: string;
  props?: Record<string, any>;
}

// Queue for offline events
const eventQueue: AnalyticsEvent[] = [];
const MAX_QUEUE_SIZE = 50;

// Track if we're online
let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

// Listen for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    isOnline = true;
    flushEventQueue();
  });
  
  window.addEventListener('offline', () => {
    isOnline = false;
  });
}

/**
 * Send event using navigator.sendBeacon with fetch fallback
 */
function sendEvent(event: AnalyticsEvent): Promise<boolean> {
  const payload = JSON.stringify(event);
  
  return new Promise((resolve) => {
    // Try sendBeacon first (most reliable for page unload)
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      const sent = navigator.sendBeacon('/api/analytics/track', blob);
      
      if (sent) {
        resolve(true);
        return;
      }
    }
    
    // Fallback to fetch with keepalive
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: payload,
      keepalive: true, // Important for page unload events
    })
      .then(response => {
        resolve(response.ok);
      })
      .catch(() => {
        resolve(false);
      });
  });
}

/**
 * Add event to offline queue
 */
function queueEvent(event: AnalyticsEvent) {
  eventQueue.push(event);
  
  // Keep queue size manageable
  if (eventQueue.length > MAX_QUEUE_SIZE) {
    eventQueue.shift(); // Remove oldest event
  }
  
  // Try to store in localStorage for persistence
  try {
    localStorage.setItem('foldera_analytics_queue', JSON.stringify(eventQueue));
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Flush queued events when back online
 */
async function flushEventQueue() {
  if (!isOnline || eventQueue.length === 0) return;
  
  // Create copy and clear queue
  const eventsToSend = [...eventQueue];
  eventQueue.length = 0;
  
  // Send events in batches
  const BATCH_SIZE = 5;
  for (let i = 0; i < eventsToSend.length; i += BATCH_SIZE) {
    const batch = eventsToSend.slice(i, i + BATCH_SIZE);
    
    // Send batch events concurrently
    await Promise.all(
      batch.map(event => 
        sendEvent(event).catch(() => {
          // Re-queue failed events
          queueEvent(event);
        })
      )
    );
    
    // Small delay between batches to avoid overwhelming server
    if (i + BATCH_SIZE < eventsToSend.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Clear localStorage queue if successful
  try {
    localStorage.removeItem('foldera_analytics_queue');
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Main track function
 */
export async function track(
  eventData: EventData, 
  assignment?: Assignment | null
): Promise<boolean> {
  const visitorId = getCurrentVisitorId();
  
  if (!visitorId) {
    console.warn('Analytics: No visitor ID found');
    return false;
  }
  
  // Build event with context
  const event: AnalyticsEvent = {
    visitorId,
    type: eventData.type,
    name: eventData.name,
    props: eventData.props,
  };
  
  // Add experiment context from assignment or eventData
  if (assignment) {
    event.experimentKey = assignment.experimentKey;
    event.variantKey = assignment.variantKey;
  } else if (eventData.experimentKey && eventData.variantKey) {
    event.experimentKey = eventData.experimentKey;
    event.variantKey = eventData.variantKey;
  }
  
  // If offline, queue the event
  if (!isOnline) {
    queueEvent(event);
    return true; // Queued successfully
  }
  
  // Try to send immediately
  const sent = await sendEvent(event);
  
  // If failed and we're still "online", queue it
  if (!sent) {
    queueEvent(event);
  }
  
  return sent;
}

/**
 * Track exposure events (when user sees a variant)
 */
export function trackExposure(assignment: Assignment, additionalProps?: Record<string, any>) {
  return track({
    type: 'exposure',
    name: 'experiment_exposure',
    props: {
      ...additionalProps,
      timestamp: Date.now(),
    },
  }, assignment);
}

/**
 * Track conversion events
 */
export function trackConversion(
  conversionName: string, 
  assignment?: Assignment | null,
  additionalProps?: Record<string, any>
) {
  return track({
    type: 'conversion',
    name: conversionName,
    props: {
      ...additionalProps,
      timestamp: Date.now(),
    },
  }, assignment);
}

/**
 * Track click events
 */
export function trackClick(
  elementName: string,
  assignment?: Assignment | null,
  additionalProps?: Record<string, any>
) {
  return track({
    type: 'click',
    name: elementName,
    props: {
      ...additionalProps,
      timestamp: Date.now(),
    },
  }, assignment);
}

/**
 * Track page view events
 */
export function trackPageView(
  pageName: string,
  assignment?: Assignment | null,
  additionalProps?: Record<string, any>
) {
  return track({
    type: 'view',
    name: pageName,
    props: {
      url: window.location.href,
      referrer: document.referrer,
      ...additionalProps,
      timestamp: Date.now(),
    },
  }, assignment);
}

/**
 * Initialize analytics - load queued events and set up page unload tracking
 */
export function initAnalytics() {
  if (typeof window === 'undefined') return;
  
  // Load queued events from localStorage
  try {
    const queuedStr = localStorage.getItem('foldera_analytics_queue');
    if (queuedStr) {
      const queued = JSON.parse(queuedStr);
      if (Array.isArray(queued)) {
        eventQueue.push(...queued.slice(-MAX_QUEUE_SIZE)); // Keep most recent events
      }
    }
  } catch {
    // Ignore localStorage errors
  }
  
  // Flush queue if online
  if (isOnline) {
    flushEventQueue();
  }
  
  // Set up page unload tracking
  const handlePageUnload = () => {
    // Use sendBeacon for reliable last-minute events
    eventQueue.forEach(event => {
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(event)], { type: 'application/json' });
        navigator.sendBeacon('/api/analytics/track', blob);
      }
    });
  };
  
  // Use both events for maximum compatibility
  window.addEventListener('beforeunload', handlePageUnload);
  window.addEventListener('pagehide', handlePageUnload);
  
  // Also flush on visibility change (when tab becomes hidden)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushEventQueue();
    }
  });
}

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
  // Initialize after a short delay to avoid blocking initial page load
  setTimeout(initAnalytics, 100);
}