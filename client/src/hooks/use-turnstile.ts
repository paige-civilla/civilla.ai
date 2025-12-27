import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

type TurnstileStatus = "loading" | "ready" | "error" | "missing_config" | "script_failed";

export function useTurnstile(containerId: string) {
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<TurnstileStatus>("loading");
  const widgetIdRef = useRef<string | null>(null);
  const renderedRef = useRef(false);
  const scriptCheckAttempts = useRef(0);

  const { data: siteKeyData, isLoading: siteKeyLoading } = useQuery<{ siteKey: string }>({
    queryKey: ["/api/turnstile/site-key"],
  });

  const { data: turnstileStatusData } = useQuery<{ enabled: boolean; siteKeyPresent: boolean; isProduction: boolean }>({
    queryKey: ["/api/auth/turnstile-status"],
  });

  const siteKey = siteKeyData?.siteKey || "";
  const isEnabled = turnstileStatusData?.enabled ?? false;
  const siteKeyPresent = turnstileStatusData?.siteKeyPresent ?? false;

  useEffect(() => {
    if (siteKeyLoading) {
      setStatus("loading");
      return;
    }

    if (!siteKey) {
      if (process.env.NODE_ENV === "development") {
        console.log("Turnstile: siteKey missing or empty");
      }
      setStatus("missing_config");
      return;
    }

    if (process.env.NODE_ENV === "development") {
      console.log("Turnstile: siteKey fetched:", siteKey.substring(0, 10) + "...");
    }

    if (renderedRef.current) return;

    const renderWidget = () => {
      const container = document.getElementById(containerId);
      if (!container) {
        if (process.env.NODE_ENV === "development") {
          console.log("Turnstile: container not found:", containerId);
        }
        return;
      }

      if (!window.turnstile) {
        if (process.env.NODE_ENV === "development") {
          console.log("Turnstile: script not loaded yet");
        }
        return;
      }

      if (widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
      }

      try {
        widgetIdRef.current = window.turnstile.render(container, {
          sitekey: siteKey,
          callback: (newToken: string) => {
            setToken(newToken);
            setStatus("ready");
          },
          "expired-callback": () => {
            setToken(null);
          },
          "error-callback": () => {
            setToken(null);
            setStatus("error");
          },
          theme: "light",
        });
        renderedRef.current = true;
        setStatus("ready");
        if (process.env.NODE_ENV === "development") {
          console.log("Turnstile: widget rendered successfully");
        }
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error("Turnstile: render error:", err);
        }
        setStatus("error");
      }
    };

    if (window.turnstile) {
      if (process.env.NODE_ENV === "development") {
        console.log("Turnstile: script already loaded");
      }
      renderWidget();
    } else {
      const maxAttempts = 50;
      const interval = setInterval(() => {
        scriptCheckAttempts.current++;
        if (window.turnstile) {
          clearInterval(interval);
          if (process.env.NODE_ENV === "development") {
            console.log("Turnstile: script loaded after", scriptCheckAttempts.current, "attempts");
          }
          renderWidget();
        } else if (scriptCheckAttempts.current >= maxAttempts) {
          clearInterval(interval);
          if (process.env.NODE_ENV === "development") {
            console.log("Turnstile: script failed to load after", maxAttempts, "attempts");
          }
          setStatus("script_failed");
        }
      }, 100);
      return () => clearInterval(interval);
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
        renderedRef.current = false;
      }
    };
  }, [siteKey, siteKeyLoading, containerId]);

  const reset = useCallback(() => {
    setToken(null);
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, []);

  return { 
    token, 
    reset, 
    status,
    hasSiteKey: !!siteKey,
    isEnabled,
    siteKeyPresent,
  };
}
