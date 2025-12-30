// src/lib/demoModeGuard.ts
// Centralized demo mode detection and write operation blocking

const DEMO_UNLOCK_STORAGE_KEY = "rcms_demo_unlocked_v1";

/**
 * Checks if demo is unlocked in localStorage.
 * This is the single source of truth for demo unlock state.
 */
export function isDemoUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const unlocked = window.localStorage.getItem(DEMO_UNLOCK_STORAGE_KEY);
    return unlocked === "true";
  } catch {
    return false;
  }
}

/**
 * Detects if the application is running in demo mode.
 * Demo mode is active when:
 * 1. User is on a demo route (/demo or /demo/*)
 * 2. AND demo is unlocked in localStorage
 */
export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false;

  // Check if we're on a demo route (only /demo and /demo/*, NOT /)
  const pathname = window.location.pathname || "/";
  const hash = window.location.hash || "";
  
  const isDemoRoute =
    pathname === "/demo" ||
    pathname.startsWith("/demo/") ||
    hash === "#/demo" ||
    hash.startsWith("#/demo/");

  if (isDemoRoute) {
    return isDemoUnlocked();
  }

  return false;
}

/**
 * Blocks write operations in demo mode.
 * Returns true if the operation should be blocked.
 */
export function shouldBlockWrite(operation: "insert" | "update" | "delete" | "upsert"): boolean {
  if (!isDemoMode()) {
    return false;
  }

  // In demo mode, block all writes
  console.warn(
    `[Demo Mode] Write operation blocked: ${operation}. Demo mode is read-only.`
  );
  return true;
}

/**
 * Creates a mock success response for blocked write operations.
 * This allows the calling code to continue without errors.
 */
export function createMockWriteResponse<T = any>(mockData?: T): {
  data: T | null;
  error: null;
} {
  return {
    data: mockData || null,
    error: null,
  };
}

/**
 * Creates a mock error response for blocked write operations.
 * Returns an error in Supabase's standard format so calling code can handle it safely.
 */
export function createMockWriteError(operation: string): {
  data: null;
  error: {
    message: string;
    code: string;
    details?: string;
    hint?: string;
  };
} {
  return {
    data: null,
    error: {
      message: `Write operation blocked: ${operation}. Demo mode is read-only.`,
      code: "DEMO_MODE_BLOCKED",
      details: "This is a demo environment. Write operations are disabled.",
      hint: "Demo mode is read-only. No data will be saved.",
    },
  };
}

