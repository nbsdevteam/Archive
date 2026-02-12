import { useEffect, useRef } from "react";

/**
 * useRunOnceOnMount - Run a callback once when the component mounts.
 * @param fn - Callback to run (e.g. fetchDocuments)
 * @remarks This hook ensures the callback runs exactly once, even in React.StrictMode
 */
export function useRunOnceOnMount(fn: () => void): void {
  const didRun = useRef(false);
  const fnRef = useRef(fn);
  
  // Keep fnRef updated without triggering effect
  fnRef.current = fn;
  
  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;
    fnRef.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - truly run once
}
