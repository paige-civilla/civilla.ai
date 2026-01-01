import { useEffect, useRef } from "react";

/**
 * Auto-logout after inactivity + logout on page unload.
 * - Resets timer on: mouse, keyboard, touch, scroll, pointer
 * - Logs out on idle timeout (default 5 minutes)
 * - Attempts logout on tab close/refresh/navigate away (best-effort)
 */
export function useIdleLogout(options?: {
  idleMs?: number;
  logoutEndpoint?: string;
  redirectTo?: string;
}) {
  const idleMs = options?.idleMs ?? 300000; // 5 minutes default
  const logoutEndpoint = options?.logoutEndpoint ?? "/api/auth/logout";
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

    // Best-effort logout for unload events (uses sendBeacon or keepalive fetch)
    const doUnloadLogout = () => {
      if (isLoggingOutRef.current) return;
      isLoggingOutRef.current = true;

      // Try sendBeacon first (most reliable for unload)
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify({})], { type: "application/json" });
        navigator.sendBeacon(logoutEndpoint, blob);
      }

      // Also try fetch with keepalive as backup
      try {
        fetch(logoutEndpoint, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          keepalive: true,
          body: JSON.stringify({}),
        });
      } catch {
        // Ignore errors during unload
      }
    };

    // Logout with redirect (for idle timeout)
    const doIdleLogout = async () => {
      if (isLoggingOutRef.current) return;
      isLoggingOutRef.current = true;
      try {
        await fetch(logoutEndpoint, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
      } catch {
        // Even if request fails, redirect to exit app UI
      } finally {
        window.location.href = redirectTo;
      }
    };

    const reset = () => {
      if (isLoggingOutRef.current) return;
      clearTimer();
      timerRef.current = window.setTimeout(doIdleLogout, idleMs);
    };

    // Activity events that reset the idle timer
    const activityEvents = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "pointerdown"];
    activityEvents.forEach((e) => window.addEventListener(e, reset, { passive: true }));

    // Reset timer when tab becomes visible
    const onVisibilityChange = () => {
      if (!document.hidden) reset();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    // Unload handlers for tab close/refresh/navigate away
    const onBeforeUnload = () => doUnloadLogout();
    const onPageHide = () => doUnloadLogout();

    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("pagehide", onPageHide);

    // Start the timer immediately
    reset();

    return () => {
      clearTimer();
      activityEvents.forEach((e) => window.removeEventListener(e, reset));
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [idleMs, logoutEndpoint, redirectTo]);
}
