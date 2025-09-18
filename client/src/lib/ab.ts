/**
 * A/B Testing Module
 * 
 * Provides deterministic bucketing, persistent assignment storage,
 * and once-per-session exposure tracking for experiments.
 */

// Simple hash function for deterministic bucketing
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Generate or retrieve visitor ID
function getVisitorId(): string {
  const VISITOR_ID_KEY = 'foldera_visitor_id';
  
  // Check localStorage first
  let visitorId = localStorage.getItem(VISITOR_ID_KEY);
  
  if (!visitorId) {
    // Generate new visitor ID using crypto.randomUUID if available, fallback to timestamp + random
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      visitorId = crypto.randomUUID();
    } else {
      visitorId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
  }
  
  return visitorId;
}

// Set/get cookie for cross-session persistence
function setCookie(name: string, value: string, days: number = 365) {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

// Experiment configuration
export interface ExperimentConfig {
  key: string;
  variants: Array<{
    key: string;
    weight: number;
  }>;
  allocation?: number; // Percentage of users to include (0-100)
}

// Assignment result
export interface Assignment {
  experimentKey: string;
  variantKey: string;
  visitorId: string;
}

// Exposure tracking
const exposedExperiments = new Set<string>();
const EXPOSED_KEY = 'foldera_exposed_experiments';

function getExposedExperiments(): Set<string> {
  try {
    const stored = sessionStorage.getItem(EXPOSED_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function markExperimentExposed(experimentKey: string) {
  const exposed = getExposedExperiments();
  exposed.add(experimentKey);
  exposedExperiments.add(experimentKey);
  
  try {
    sessionStorage.setItem(EXPOSED_KEY, JSON.stringify([...exposed]));
  } catch {
    // Ignore sessionStorage errors
  }
}

// Main assignment function
export function assignVariant(config: ExperimentConfig): Assignment {
  const visitorId = getVisitorId();
  const { key: experimentKey, variants, allocation = 100 } = config;
  
  // Check for cached assignment first
  const assignmentKey = `ab_${experimentKey}`;
  let cachedAssignment = localStorage.getItem(assignmentKey);
  
  // Also check cookies as backup
  if (!cachedAssignment) {
    cachedAssignment = getCookie(assignmentKey);
  }
  
  if (cachedAssignment) {
    try {
      const parsed = JSON.parse(cachedAssignment);
      if (parsed.experimentKey === experimentKey && parsed.visitorId === visitorId) {
        return parsed;
      }
    } catch {
      // Invalid cached data, continue with new assignment
    }
  }
  
  // Determine if user is in experiment based on allocation
  const allocationHash = hashString(`${experimentKey}:allocation:${visitorId}`);
  const isInExperiment = (allocationHash % 100) < allocation;
  
  if (!isInExperiment) {
    // Return control/default variant if not in experiment
    const defaultVariant = variants[0] || { key: 'control', weight: 100 };
    const assignment: Assignment = {
      experimentKey,
      variantKey: defaultVariant.key,
      visitorId,
    };
    
    // Cache assignment
    const assignmentStr = JSON.stringify(assignment);
    localStorage.setItem(assignmentKey, assignmentStr);
    setCookie(assignmentKey, assignmentStr);
    
    return assignment;
  }
  
  // Calculate total weight
  const totalWeight = variants.reduce((sum, variant) => sum + variant.weight, 0);
  
  // Generate deterministic hash for variant assignment
  const hash = hashString(`${experimentKey}:${visitorId}`);
  const bucket = hash % totalWeight;
  
  // Find assigned variant based on cumulative weights
  let cumulativeWeight = 0;
  let assignedVariant = variants[0]; // fallback
  
  for (const variant of variants) {
    cumulativeWeight += variant.weight;
    if (bucket < cumulativeWeight) {
      assignedVariant = variant;
      break;
    }
  }
  
  const assignment: Assignment = {
    experimentKey,
    variantKey: assignedVariant.key,
    visitorId,
  };
  
  // Cache assignment in both localStorage and cookies
  const assignmentStr = JSON.stringify(assignment);
  localStorage.setItem(assignmentKey, assignmentStr);
  setCookie(assignmentKey, assignmentStr);
  
  return assignment;
}

// Check if experiment has been exposed in this session
export function isExperimentExposed(experimentKey: string): boolean {
  return exposedExperiments.has(experimentKey) || getExposedExperiments().has(experimentKey);
}

// Mark experiment as exposed and fire exposure event
export function exposeExperiment(experimentKey: string, variantKey: string, onExposure?: (assignment: Assignment) => void) {
  if (isExperimentExposed(experimentKey)) {
    return; // Already exposed in this session
  }
  
  markExperimentExposed(experimentKey);
  
  const assignment: Assignment = {
    experimentKey,
    variantKey,
    visitorId: getVisitorId(),
  };
  
  // Fire exposure callback if provided
  if (onExposure) {
    onExposure(assignment);
  }
}

// Utility function to get current visitor ID without generating new one
export function getCurrentVisitorId(): string | null {
  return localStorage.getItem('foldera_visitor_id') || getCookie('foldera_visitor_id');
}

// Initialize exposed experiments from session storage on module load
if (typeof window !== 'undefined') {
  const storedExposed = getExposedExperiments();
  storedExposed.forEach(exp => exposedExperiments.add(exp));
}