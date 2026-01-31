import { useState, useCallback } from "react";

/**
 * useToggle - Hook for boolean toggle state
 * @param initialValue - Initial boolean value (default: false)
 * @returns [value, toggle, setValue] tuple
 */
export const useToggle = (
  initialValue: boolean = false
): [boolean, () => void, (value: boolean) => void] => {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue((prev) => !prev);
  }, []);

  return [value, toggle, setValue];
};
