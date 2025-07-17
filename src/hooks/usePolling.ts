import { useEffect, useRef } from "react";

interface UsePollingOptions {
  callback: () => void;
  interval: number;
  enabled: boolean;
}

export function usePolling({ callback, interval, enabled }: UsePollingOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isVisible = useRef(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisible.current = !document.hidden;

      if (isVisible.current && enabled) {
        // When page becomes visible, immediately fetch data
        callback();
        startPolling();
      } else {
        stopPolling();
      }
    };

    const handleFocus = () => {
      isVisible.current = true;
      if (enabled) {
        callback();
        startPolling();
      }
    };

    const handleBlur = () => {
      isVisible.current = false;
      stopPolling();
    };

    const startPolling = () => {
      stopPolling();
      if (enabled && isVisible.current) {
        intervalRef.current = setInterval(() => {
          if (isVisible.current) {
            callback();
          }
        }, interval);
      }
    };

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    // Set up event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    // Start polling if enabled
    if (enabled) {
      startPolling();
    }

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, [callback, interval, enabled]);
}
