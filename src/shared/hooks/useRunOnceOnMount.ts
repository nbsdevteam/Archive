import { useEffect, useRef } from "react";

/**
 * useRunOnceOnMount - Run a callback once when the component mounts.
 * @param fn - Callback to run (e.g. fetchDocuments)
 */
export function useRunOnceOnMount(fn: () => void): void {
  const didRun = useRef(false);
  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;
    fn();
  }, [fn]);
}
