import { useEffect, useRef, type RefObject } from "react";

/**
 * useClickOutside - Hook to detect clicks outside an element
 * @param handler - Callback function when click outside is detected
 * @returns Ref to attach to the element
 */
export const useClickOutside = <T extends HTMLElement = HTMLElement>(
  handler: () => void
): RefObject<T | null> => {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handler]);

  return ref;
};
