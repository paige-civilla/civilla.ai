import { useEffect, useRef } from "react";

/**
 * Auto-logout after inactivity.
 * - Resets timer on: mouse, keyboard, touch, scroll
 * - Logs out on: 15 minutes idle
 */
export function useIdleLogout(options?: {
  idleMs?: number;
  logoutEndpoint?: string;   // default: /api/logout
  redirectTo?: string;       // default: /
}) {
  const idleMs = options?.idleMs ?? 900000;
  const logoutEndpoint = options?.logoutEndpoint ?? "/api/logout";
  const redirectTo = options?.redirectTo ?? "/";

  const timerRef = useRef<number | null>(null);
  const isLoggingOutRef = useRef(false);

  useEffect(() => {
    const clearTimer = () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const doLogout = async () => {
      if (isLoggingOutRef.current) return;
      isLoggingOutRef.current = true;
      try {
        await fetch(logoutEndpoint, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
      } catch {
        // Even if the request fails, force redirect to exit the app UI.
      } finally {
        window.location.href = redirectTo;
      }
    };

    const reset = () => {
      if (isLoggingOutRef.current) return;
      clearTimer();
      timerRef.current = window.setTimeout(doLogout, idleMs);
    };

    // Activity events
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));

    // If the tab becomes visible again, reset timer
    const onVis = () => {
      if (!document.hidden) reset();
    };
    document.addEventListener("visibilitychange", onVis);

    // Start the timer immediately
    reset();

    return () => {
      clearTimer();
      events.forEach((e) => window.removeEventListener(e, reset));
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [idleMs, logoutEndpoint, redirectTo]);
}
