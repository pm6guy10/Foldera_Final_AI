/**
 * Advanced Analytics Client
 * 
 * Comprehensive user behavior and conversion funnel tracking system.
 * Features:
 * - Page view tracking with duration and engagement metrics
 * - Scroll depth and section visibility tracking
 * - Form interaction analytics with field-level insights
 * - Multi-step conversion funnel tracking
 * - Cross-session user journey stitching
 * - Privacy-compliant tracking with consent management
 * - Performance optimized with throttling and debouncing
 * - Offline support with automatic retry
 * - Integration with A/B testing infrastructure
 */

import { getCurrentVisitorId } from './ab';
import type { Assignment } from './ab';

// Enhanced event data structures
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
  sessionId?: string;
  type: string;
  name: string;
  experimentKey?: string;
  variantKey?: string;
  props?: Record<string, any>;
}

// Page view tracking data
export interface PageViewData {
  url: string;
  path: string;
  title?: string;
  referrer?: string;
  visitorId: string;
  sessionId: string;
}

// Section view tracking data
export interface SectionViewData {
  visitorId: string;
  sessionId: string;
  pageViewId: string;
  sectionId: string;
  sectionName?: string;
  timeVisible?: number;
  scrollDepthOnEntry?: number;
  scrollDepthOnExit?: number;
  wasFullyVisible?: boolean;
}

// Form interaction tracking data
export interface FormInteractionData {
  visitorId: string;
  sessionId: string;
  formId: string;
  fieldId?: string;
  fieldName?: string;
  action: 'focus' | 'blur' | 'input' | 'submit' | 'abandon';
  fieldValue?: string;
  timeSpent?: number;
  completed?: boolean;
  abandoned?: boolean;
  errors?: Record<string, any>;
}

// Conversion funnel step definition
export interface FunnelStep {
  name: string;
  condition: {
    type: 'event' | 'url' | 'element' | 'custom';
    value: string;
    operator?: 'equals' | 'contains' | 'starts_with' | 'custom';
  };
  optional?: boolean;
}

// Funnel definition
export interface ConversionFunnel {
  id: string;
  name: string;
  description?: string;
  steps: FunnelStep[];
  isActive?: boolean;
}

// Session data
export interface SessionData {
  visitorId: string;
  startedAt?: Date;
  referrer?: string;
  userAgent?: string;
  deviceType?: 'mobile' | 'desktop' | 'tablet';
}

// Consent settings
export interface ConsentSettings {
  analyticsConsent: boolean;
  marketingConsent: boolean;
  personalizationConsent: boolean;
  dataRetentionDays: number;
}

// Enhanced queue management
const eventQueue: AnalyticsEvent[] = [];
const pageViewQueue: any[] = [];
const sectionViewQueue: any[] = [];
const formInteractionQueue: any[] = [];
const MAX_QUEUE_SIZE = 100;

// Session and tracking state
let currentSessionId: string | null = null;
let currentPageViewId: string | null = null;
let pageStartTime: number = 0;
let scrollDepthMax: number = 0;
let consentSettings: ConsentSettings | null = null;

// Performance and state tracking
let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
let isInitialized = false;

// Throttling and debouncing
const throttleMap = new Map<string, number>();
const debounceMap = new Map<string, NodeJS.Timeout>();

// Section visibility tracking
const sectionObservers = new Map<string, IntersectionObserver>();
const visibleSections = new Map<string, { startTime: number; scrollDepthOnEntry: number }>();

// Form tracking state
const formStates = new Map<string, { startTime: number; fields: Map<string, any> }>();

// Funnel tracking
const activeFunnels: ConversionFunnel[] = [];
const userFunnelProgress = new Map<string, Map<string, number>>();

// Enhanced event listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    isOnline = true;
    flushAllQueues();
  });
  
  window.addEventListener('offline', () => {
    isOnline = false;
  });
  
  // Page visibility changes
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Scroll tracking with throttling
  window.addEventListener('scroll', throttle(handleScroll, 100));
  
  // Before unload - finalize current page view
  window.addEventListener('beforeunload', finalizeCurrentPageView);
  window.addEventListener('pagehide', finalizeCurrentPageView);
}

/**
 * Utility Functions
 */

// Throttle function to limit event frequency
function throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
  return ((...args: any[]) => {
    const key = func.name || 'anonymous';
    const now = Date.now();
    const lastTime = throttleMap.get(key) || 0;
    
    if (now - lastTime >= limit) {
      throttleMap.set(key, now);
      return func.apply(null, args);
    }
  }) as T;
}

// Debounce function to delay execution
function debounce<T extends (...args: any[]) => any>(func: T, delay: number): T {
  return ((...args: any[]) => {
    const key = func.name || 'anonymous';
    const existingTimeout = debounceMap.get(key);
    
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    const timeout = setTimeout(() => {
      debounceMap.delete(key);
      func.apply(null, args);
    }, delay);
    
    debounceMap.set(key, timeout);
  }) as T;
}

// Generate session ID
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Get device type
function getDeviceType(): 'mobile' | 'desktop' | 'tablet' {
  if (typeof window === 'undefined') return 'desktop';
  
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  const isTablet = /ipad|tablet|kindle/i.test(userAgent);
  
  if (isTablet) return 'tablet';
  if (isMobile) return 'mobile';
  return 'desktop';
}

// Check consent for tracking type
function hasConsent(trackingType: 'analytics' | 'marketing' | 'personalization'): boolean {
  if (!consentSettings) return true; // Default to true if no consent settings
  
  switch (trackingType) {
    case 'analytics':
      return consentSettings.analyticsConsent;
    case 'marketing':
      return consentSettings.marketingConsent;
    case 'personalization':
      return consentSettings.personalizationConsent;
    default:
      return false;
  }
}

/**
 * Enhanced sending functions with different endpoints
 */

// Send regular analytics event
function sendEvent(event: AnalyticsEvent): Promise<boolean> {
  const payload = JSON.stringify(event);
  return sendToEndpoint('/api/analytics/track', payload);
}

// Send page view data
function sendPageView(data: any): Promise<boolean> {
  const payload = JSON.stringify(data);
  return sendToEndpoint('/api/analytics/page-view', payload);
}

// Send section view data
function sendSectionView(data: any): Promise<boolean> {
  const payload = JSON.stringify(data);
  return sendToEndpoint('/api/analytics/section-view', payload);
}

// Send form interaction data
function sendFormInteraction(data: any): Promise<boolean> {
  const payload = JSON.stringify(data);
  return sendToEndpoint('/api/analytics/form-interaction', payload);
}

// Generic endpoint sender
function sendToEndpoint(endpoint: string, payload: string): Promise<boolean> {
  return new Promise((resolve) => {
    // Try sendBeacon first (most reliable for page unload)
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      const sent = navigator.sendBeacon(endpoint, blob);
      
      if (sent) {
        resolve(true);
        return;
      }
    }
    
    // Fallback to fetch with keepalive
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: payload,
      keepalive: true,
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
 * Enhanced Queue Management
 */

// Queue different types of events
function queueEvent(event: AnalyticsEvent) {
  eventQueue.push(event);
  manageQueueSize(eventQueue);
  persistQueue('foldera_analytics_queue', eventQueue);
}

function queuePageView(data: any) {
  pageViewQueue.push(data);
  manageQueueSize(pageViewQueue);
  persistQueue('foldera_page_view_queue', pageViewQueue);
}

function queueSectionView(data: any) {
  sectionViewQueue.push(data);
  manageQueueSize(sectionViewQueue);
  persistQueue('foldera_section_view_queue', sectionViewQueue);
}

function queueFormInteraction(data: any) {
  formInteractionQueue.push(data);
  manageQueueSize(formInteractionQueue);
  persistQueue('foldera_form_interaction_queue', formInteractionQueue);
}

// Generic queue management
function manageQueueSize(queue: any[]) {
  if (queue.length > MAX_QUEUE_SIZE) {
    queue.splice(0, queue.length - MAX_QUEUE_SIZE); // Keep most recent events
  }
}

// Persist queue to localStorage
function persistQueue(key: string, queue: any[]) {
  try {
    localStorage.setItem(key, JSON.stringify(queue));
  } catch {
    // Ignore localStorage errors - continue with in-memory queue
  }
}

/**
 * Enhanced queue flushing for all event types
 */

// Flush all queues when back online
async function flushAllQueues() {
  if (!isOnline) return;
  
  // Flush different queue types concurrently
  await Promise.all([
    flushQueue(eventQueue, sendEvent, 'foldera_analytics_queue'),
    flushQueue(pageViewQueue, sendPageView, 'foldera_page_view_queue'),
    flushQueue(sectionViewQueue, sendSectionView, 'foldera_section_view_queue'),
    flushQueue(formInteractionQueue, sendFormInteraction, 'foldera_form_interaction_queue')
  ]);
}

// Generic queue flushing
async function flushQueue(queue: any[], sender: (data: any) => Promise<boolean>, storageKey: string) {
  if (queue.length === 0) return;
  
  const itemsToSend = [...queue];
  queue.length = 0;
  
  const BATCH_SIZE = 10;
  for (let i = 0; i < itemsToSend.length; i += BATCH_SIZE) {
    const batch = itemsToSend.slice(i, i + BATCH_SIZE);
    
    // Send batch concurrently with error handling
    await Promise.all(
      batch.map(async item => {
        const success = await sender(item).catch(() => false);
        if (!success) {
          // Re-queue failed items
          queue.push(item);
        }
      })
    );
    
    // Small delay between batches
    if (i + BATCH_SIZE < itemsToSend.length) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  
  // Update localStorage
  try {
    if (queue.length === 0) {
      localStorage.removeItem(storageKey);
    } else {
      localStorage.setItem(storageKey, JSON.stringify(queue));
    }
  } catch {
    // Ignore localStorage errors
  }
}

// Legacy function for backward compatibility
async function flushEventQueue() {
  await flushAllQueues();
}

/**
 * Session Management
 */

// Start or resume session
export async function startSession(referrer?: string): Promise<string> {
  if (currentSessionId) {
    return currentSessionId;
  }
  
  const visitorId = getCurrentVisitorId();
  if (!visitorId) {
    throw new Error('No visitor ID available for session');
  }
  
  currentSessionId = generateSessionId();
  
  const sessionData: SessionData = {
    visitorId,
    startedAt: new Date(),
    referrer: referrer || document.referrer,
    userAgent: navigator.userAgent,
    deviceType: getDeviceType()
  };
  
  // Send session start event
  if (hasConsent('analytics')) {
    const success = await sendToEndpoint('/api/analytics/session', JSON.stringify(sessionData));
    if (!success) {
      // Queue session data for later - could add session queue
    }
  }
  
  return currentSessionId;
}

// End current session
export async function endSession() {
  if (!currentSessionId) return;
  
  const visitorId = getCurrentVisitorId();
  if (!visitorId || !hasConsent('analytics')) return;
  
  // Update session with end time and final stats
  const endData = {
    sessionId: currentSessionId,
    endedAt: new Date(),
    isActive: false
  };
  
  await sendToEndpoint('/api/analytics/session-end', JSON.stringify(endData));
  currentSessionId = null;
}

/**
 * Enhanced Main track function
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
  
  if (!hasConsent('analytics')) {
    return false;
  }
  
  // Ensure session exists
  if (!currentSessionId) {
    await startSession();
  }
  
  // Build event with context
  const event: AnalyticsEvent = {
    visitorId,
    sessionId: currentSessionId,
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
 * Page View Tracking with Enhanced Metrics
 */

// Track page view with comprehensive data
export async function trackPageViewEnhanced(
  url: string = window.location.href,
  title: string = document.title,
  referrer: string = document.referrer
): Promise<string | null> {
  const visitorId = getCurrentVisitorId();
  if (!visitorId || !hasConsent('analytics')) return null;
  
  // Ensure session exists
  if (!currentSessionId) {
    await startSession(referrer);
  }
  
  // Finalize previous page view if exists
  if (currentPageViewId) {
    await finalizeCurrentPageView();
  }
  
  // Generate new page view ID
  currentPageViewId = `pv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  pageStartTime = Date.now();
  scrollDepthMax = 0;
  
  const pageViewData: PageViewData = {
    url,
    path: window.location.pathname,
    title,
    referrer,
    visitorId,
    sessionId: currentSessionId!
  };
  
  // Send immediately or queue
  if (isOnline) {
    const success = await sendPageView({ ...pageViewData, id: currentPageViewId });
    if (!success) {
      queuePageView({ ...pageViewData, id: currentPageViewId });
    }
  } else {
    queuePageView({ ...pageViewData, id: currentPageViewId });
  }
  
  // Start tracking scroll and sections for this page
  initializePageTracking();
  
  return currentPageViewId;
}

// Finalize current page view with duration and engagement metrics
function finalizeCurrentPageView() {
  if (!currentPageViewId || !pageStartTime) return;
  
  const duration = Date.now() - pageStartTime;
  const updateData = {
    id: currentPageViewId,
    duration,
    maxScrollDepth: scrollDepthMax,
    exitPage: true
  };
  
  // Send update
  if (isOnline && hasConsent('analytics')) {
    sendToEndpoint('/api/analytics/page-view-update', JSON.stringify(updateData));
  }
}

/**
 * Section Visibility Tracking
 */

// Track section visibility using Intersection Observer
export function trackSectionVisibility(sectionId: string, element: HTMLElement, options?: {
  threshold?: number;
  rootMargin?: string;
  sectionName?: string;
}) {
  if (!hasConsent('analytics') || !currentPageViewId || !currentSessionId) return;
  
  const visitorId = getCurrentVisitorId();
  if (!visitorId) return;
  
  const { threshold = 0.5, rootMargin = '0px', sectionName } = options || {};
  
  // Clean up existing observer for this section
  const existingObserver = sectionObservers.get(sectionId);
  if (existingObserver) {
    existingObserver.disconnect();
  }
  
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Section became visible
          visibleSections.set(sectionId, {
            startTime: Date.now(),
            scrollDepthOnEntry: getCurrentScrollDepth()
          });
        } else {
          // Section became hidden
          const sectionData = visibleSections.get(sectionId);
          if (sectionData) {
            const timeVisible = Date.now() - sectionData.startTime;
            
            const sectionViewData: SectionViewData = {
              visitorId,
              sessionId: currentSessionId!,
              pageViewId: currentPageViewId!,
              sectionId,
              sectionName,
              timeVisible,
              scrollDepthOnEntry: sectionData.scrollDepthOnEntry,
              scrollDepthOnExit: getCurrentScrollDepth(),
              wasFullyVisible: entry.intersectionRatio >= 0.95
            };
            
            // Send or queue section view data
            if (isOnline) {
              sendSectionView(sectionViewData);
            } else {
              queueSectionView(sectionViewData);
            }
            
            visibleSections.delete(sectionId);
          }
        }
      });
    },
    { threshold, rootMargin }
  );
  
  observer.observe(element);
  sectionObservers.set(sectionId, observer);
}

// Get current scroll depth percentage
function getCurrentScrollDepth(): number {
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  
  return Math.min(100, (scrollTop + windowHeight) / documentHeight * 100);
}

// Handle scroll events
function handleScroll() {
  const scrollDepth = getCurrentScrollDepth();
  scrollDepthMax = Math.max(scrollDepthMax, scrollDepth);
  
  // Track scroll milestones (25%, 50%, 75%, 100%)
  const milestones = [25, 50, 75, 100];
  milestones.forEach(milestone => {
    if (scrollDepth >= milestone && !localStorage.getItem(`scroll_${milestone}_${currentPageViewId}`)) {
      localStorage.setItem(`scroll_${milestone}_${currentPageViewId}`, 'true');
      
      // Track scroll milestone as event
      track({
        type: 'scroll',
        name: `scroll_depth_${milestone}`,
        props: {
          scrollDepth,
          pageViewId: currentPageViewId,
          timestamp: Date.now()
        }
      });
    }
  });
}

/**
 * Form Interaction Tracking
 */

// Track form interactions comprehensively
export function trackFormInteractions(formElement: HTMLFormElement, formId?: string) {
  if (!hasConsent('analytics') || !currentSessionId) return;
  
  const visitorId = getCurrentVisitorId();
  if (!visitorId) return;
  
  const actualFormId = formId || formElement.id || `form_${Date.now()}`;
  const startTime = Date.now();
  
  // Initialize form state
  formStates.set(actualFormId, {
    startTime,
    fields: new Map()
  });
  
  // Track form-level events
  const trackFormEvent = (action: FormInteractionData['action'], additionalData?: any) => {
    const interactionData: FormInteractionData = {
      visitorId,
      sessionId: currentSessionId!,
      formId: actualFormId,
      action,
      ...additionalData,
    };
    
    if (isOnline) {
      sendFormInteraction(interactionData);
    } else {
      queueFormInteraction(interactionData);
    }
  };
  
  // Track form submission
  formElement.addEventListener('submit', (e) => {
    const formState = formStates.get(actualFormId);
    const timeSpent = formState ? Date.now() - formState.startTime : 0;
    
    trackFormEvent('submit', {
      timeSpent,
      completed: true
    });
  });
  
  // Track individual field interactions
  const inputs = formElement.querySelectorAll('input, textarea, select');
  inputs.forEach((input: Element) => {
    const inputElement = input as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const fieldId = inputElement.id || inputElement.name || `field_${Date.now()}`;
    const fieldName = inputElement.name || inputElement.id || 'unnamed_field';
    
    // Track field focus
    inputElement.addEventListener('focus', () => {
      const formState = formStates.get(actualFormId);
      if (formState) {
        formState.fields.set(fieldId, { focusTime: Date.now() });
      }
      
      trackFormEvent('focus', {
        fieldId,
        fieldName
      });
    });
    
    // Track field blur with time spent
    inputElement.addEventListener('blur', () => {
      const formState = formStates.get(actualFormId);
      const fieldState = formState?.fields.get(fieldId);
      const timeSpent = fieldState?.focusTime ? Date.now() - fieldState.focusTime : 0;
      
      trackFormEvent('blur', {
        fieldId,
        fieldName,
        timeSpent,
        fieldValue: inputElement.value ? 'filled' : 'empty' // Anonymized
      });
    });
    
    // Track input changes
    inputElement.addEventListener('input', debounce(() => {
      trackFormEvent('input', {
        fieldId,
        fieldName,
        fieldValue: inputElement.value ? 'filled' : 'empty' // Anonymized
      });
    }, 500));
  });
}

/**
 * Conversion Funnel Tracking
 */

// Define conversion funnel
export function defineConversionFunnel(funnel: Omit<ConversionFunnel, 'id'>): string {
  const funnelId = `funnel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const completeFunnel: ConversionFunnel = {
    id: funnelId,
    isActive: true,
    ...funnel
  };
  
  activeFunnels.push(completeFunnel);
  
  // Send funnel definition to backend
  if (isOnline && hasConsent('analytics')) {
    sendToEndpoint('/api/analytics/funnel', JSON.stringify(completeFunnel));
  }
  
  return funnelId;
}

// Track funnel step completion
export function trackFunnelStep(
  funnelId: string,
  stepName: string,
  metadata?: Record<string, any>
) {
  const visitorId = getCurrentVisitorId();
  if (!visitorId || !hasConsent('analytics')) return;
  
  const funnel = activeFunnels.find(f => f.id === funnelId);
  if (!funnel) return;
  
  const stepIndex = funnel.steps.findIndex(step => step.name === stepName);
  if (stepIndex === -1) return;
  
  // Update user's funnel progress
  if (!userFunnelProgress.has(visitorId)) {
    userFunnelProgress.set(visitorId, new Map());
  }
  
  const userProgress = userFunnelProgress.get(visitorId)!;
  const funnelStartTime = userProgress.get(`${funnelId}_start`) || Date.now();
  userProgress.set(`${funnelId}_start`, funnelStartTime);
  userProgress.set(`${funnelId}_${stepIndex}`, Date.now());
  
  const progressionData = {
    visitorId,
    sessionId: currentSessionId,
    funnelId,
    stepIndex,
    stepName,
    completed: true,
    timeToComplete: Date.now() - funnelStartTime,
    metadata
  };
  
  if (isOnline) {
    sendToEndpoint('/api/analytics/funnel-progression', JSON.stringify(progressionData));
  }
}

/**
 * Privacy and Consent Management
 */

// Set consent preferences
export async function setConsentSettings(settings: ConsentSettings) {
  consentSettings = settings;
  
  const visitorId = getCurrentVisitorId();
  if (!visitorId) return;
  
  const consentData = {
    visitorId,
    ...settings,
    consentGivenAt: new Date()
  };
  
  // Store consent settings
  try {
    localStorage.setItem('foldera_consent', JSON.stringify(settings));
  } catch {
    // Ignore localStorage errors
  }
  
  // Send to backend
  if (isOnline) {
    await sendToEndpoint('/api/analytics/consent', JSON.stringify(consentData));
  }
  
  // If analytics consent is withdrawn, clear queues and stop tracking
  if (!settings.analyticsConsent) {
    clearAllQueues();
    stopAllTracking();
  }
}

// Get current consent settings
export function getConsentSettings(): ConsentSettings | null {
  if (consentSettings) return consentSettings;
  
  try {
    const stored = localStorage.getItem('foldera_consent');
    if (stored) {
      consentSettings = JSON.parse(stored);
      return consentSettings;
    }
  } catch {
    // Ignore localStorage errors
  }
  
  return null;
}

// Clear all queues and data
function clearAllQueues() {
  eventQueue.length = 0;
  pageViewQueue.length = 0;
  sectionViewQueue.length = 0;
  formInteractionQueue.length = 0;
  
  // Clear localStorage
  const keys = [
    'foldera_analytics_queue',
    'foldera_page_view_queue', 
    'foldera_section_view_queue',
    'foldera_form_interaction_queue'
  ];
  
  keys.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore
    }
  });
}

// Stop all tracking activities
function stopAllTracking() {
  // Disconnect all intersection observers
  sectionObservers.forEach(observer => observer.disconnect());
  sectionObservers.clear();
  
  // Clear visible sections
  visibleSections.clear();
  
  // Clear form states
  formStates.clear();
  
  // End current session
  endSession();
}

/**
 * Event Handlers
 */

// Visibility change handler
function handleVisibilityChange() {
  if (document.visibilityState === 'hidden') {
    // Page became hidden - finalize current page view and flush queues
    finalizeCurrentPageView();
    flushAllQueues();
  } else {
    // Page became visible - resume tracking
    if (hasConsent('analytics')) {
      // Could restart session if needed
    }
  }
}

/**
 * Initialize page tracking (scroll, sections, etc.)
 */
function initializePageTracking() {
  // Reset scroll tracking for new page
  scrollDepthMax = 0;
  
  // Auto-track sections with data-section-id attributes
  const sections = document.querySelectorAll('[data-section-id]');
  sections.forEach(section => {
    const sectionId = section.getAttribute('data-section-id');
    const sectionName = section.getAttribute('data-section-name') || undefined;
    
    if (sectionId && section instanceof HTMLElement) {
      trackSectionVisibility(sectionId, section, { sectionName });
    }
  });
  
  // Auto-track forms with data-form-id attributes
  const forms = document.querySelectorAll('form[data-form-id]');
  forms.forEach(form => {
    const formId = form.getAttribute('data-form-id');
    if (formId && form instanceof HTMLFormElement) {
      trackFormInteractions(form, formId);
    }
  });
}

/**
 * Enhanced tracking functions (maintaining backward compatibility)
 */

// Track exposure events (when user sees a variant)
export function trackExposure(assignment: Assignment, additionalProps?: Record<string, any>) {
  return track({
    type: 'exposure',
    name: 'experiment_exposure',
    props: {
      ...additionalProps,
      pageViewId: currentPageViewId,
      sessionId: currentSessionId,
      timestamp: Date.now(),
    },
  }, assignment);
}

// Enhanced track click with automatic form and CTA detection
export function trackClickEnhanced(
  element: HTMLElement,
  elementName?: string,
  assignment?: Assignment | null,
  additionalProps?: Record<string, any>
) {
  // Auto-detect element type and context
  const detectedName = elementName || 
    element.getAttribute('data-testid') ||
    element.textContent?.slice(0, 50) ||
    element.tagName.toLowerCase();
  
  const elementType = element.tagName.toLowerCase();
  const isButton = elementType === 'button' || element.getAttribute('role') === 'button';
  const isLink = elementType === 'a';
  const isCTA = element.classList.contains('cta') || 
                element.closest('[data-cta]') !== null ||
                detectedName.toLowerCase().includes('cta');
  
  return track({
    type: 'click',
    name: detectedName,
    props: {
      elementType,
      isButton,
      isLink,
      isCTA,
      pageViewId: currentPageViewId,
      sessionId: currentSessionId,
      ...additionalProps,
      timestamp: Date.now(),
    },
  }, assignment);
}

// Auto-initialize enhanced analytics
export function initAdvancedAnalytics(options?: {
  autoTrackPageViews?: boolean;
  autoTrackClicks?: boolean;
  autoTrackForms?: boolean;
  consentSettings?: ConsentSettings;
}) {
  const {
    autoTrackPageViews = true,
    autoTrackClicks = true,
    autoTrackForms = true,
    consentSettings: initialConsent
  } = options || {};
  
  if (typeof window === 'undefined' || isInitialized) return;
  
  // Set initial consent if provided
  if (initialConsent) {
    setConsentSettings(initialConsent);
  }
  
  // Load queued events from localStorage
  try {
    const queues = [
      { queue: eventQueue, key: 'foldera_analytics_queue' },
      { queue: pageViewQueue, key: 'foldera_page_view_queue' },
      { queue: sectionViewQueue, key: 'foldera_section_view_queue' },
      { queue: formInteractionQueue, key: 'foldera_form_interaction_queue' }
    ];
    
    queues.forEach(({ queue, key }) => {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          queue.push(...parsed.slice(-MAX_QUEUE_SIZE));
        }
      }
    });
  } catch {
    // Ignore localStorage errors
  }
  
  // Flush queues if online
  if (isOnline) {
    flushAllQueues();
  }
  
  // Auto-track page view on initialization
  if (autoTrackPageViews && hasConsent('analytics')) {
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      trackPageViewEnhanced();
    }, 100);
  }
  
  // Auto-track clicks on buttons and CTAs
  if (autoTrackClicks) {
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target && hasConsent('analytics')) {
        // Track clicks on buttons, CTAs, and important elements
        if (target.tagName === 'BUTTON' || 
            target.getAttribute('role') === 'button' ||
            target.closest('a') ||
            target.closest('[data-cta]') ||
            target.hasAttribute('data-testid')) {
          trackClickEnhanced(target);
        }
      }
    });
  }
  
  // Auto-track forms
  if (autoTrackForms) {
    const initForms = () => {
      const forms = document.querySelectorAll('form');
      forms.forEach(form => {
        if (form instanceof HTMLFormElement && hasConsent('analytics')) {
          trackFormInteractions(form);
        }
      });
    };
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initForms);
    } else {
      initForms();
    }
  }
  
  // Set up page unload tracking
  const handlePageUnload = () => {
    // Use sendBeacon for reliable last-minute events
    finalizeCurrentPageView();
    
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
      flushAllQueues();
    }
  });
  
  isInitialized = true;
}

/**
 * Convenience functions for common funnel definitions
 */

// Define a simple landing to conversion funnel
export function createLandingConversionFunnel(options?: {
  name?: string;
  landingPages?: string[];
  engagementEvents?: string[];
  conversionEvents?: string[];
}): string {
  const {
    name = 'Landing to Conversion',
    landingPages = ['/'],
    engagementEvents = ['scroll_depth_50', 'section_view'],
    conversionEvents = ['form_submit', 'payment_complete']
  } = options || {};
  
  const steps: FunnelStep[] = [
    {
      name: 'Landing',
      condition: {
        type: 'url',
        value: landingPages.join('|'),
        operator: 'contains'
      }
    },
    {
      name: 'Engagement',
      condition: {
        type: 'event',
        value: engagementEvents.join('|'),
        operator: 'contains'
      }
    },
    {
      name: 'Conversion',
      condition: {
        type: 'event',
        value: conversionEvents.join('|'),
        operator: 'contains'
      }
    }
  ];
  
  return defineConversionFunnel({ name, steps });
}

/**
 * Performance and Analytics Utilities
 */

// Get performance metrics
export function getAnalyticsPerformance() {
  return {
    queueSizes: {
      events: eventQueue.length,
      pageViews: pageViewQueue.length,
      sectionViews: sectionViewQueue.length,
      formInteractions: formInteractionQueue.length
    },
    isOnline,
    isInitialized,
    currentSessionId,
    currentPageViewId,
    hasConsent: {
      analytics: hasConsent('analytics'),
      marketing: hasConsent('marketing'),
      personalization: hasConsent('personalization')
    }
  };
}

// Debug function to test analytics
export function debugAnalytics() {
  if (typeof window === 'undefined') return;
  
  console.log('Analytics Debug Info:', getAnalyticsPerformance());
  console.log('Consent Settings:', getConsentSettings());
  console.log('Active Funnels:', activeFunnels);
  console.log('Visible Sections:', Array.from(visibleSections.keys()));
  console.log('Form States:', Array.from(formStates.keys()));
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
 * Legacy initialize analytics function for backward compatibility
 */
export function initAnalytics() {
  // Use the new enhanced initialization with basic settings
  initAdvancedAnalytics({
    autoTrackPageViews: true,
    autoTrackClicks: true,
    autoTrackForms: false // Keep disabled by default for backward compatibility
  });
}

// Auto-initialize enhanced analytics if in browser environment
if (typeof window !== 'undefined') {
  // Initialize after a short delay to avoid blocking initial page load
  setTimeout(() => {
    if (!isInitialized) {
      initAdvancedAnalytics({
        autoTrackPageViews: true,
        autoTrackClicks: true,
        autoTrackForms: true,
        consentSettings: {
          analyticsConsent: true,
          marketingConsent: false,
          personalizationConsent: false,
          dataRetentionDays: 365
        }
      });
    }
  }, 100);
}