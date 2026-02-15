import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  SHORTCUT_KEYS,
  SHORTCUT_LABELS,
  SHORTCUT_TRIGGER_KEYS,
  type ShortcutKeyId,
} from "./shortcutsRegistry";

type ShortcutHandler = () => void;

type HandlersMap = Partial<Record<ShortcutKeyId, ShortcutHandler>>;

interface ShortcutsContextValue {
  overlayOpen: boolean;
  setOverlayOpen: (open: boolean) => void;
  /** Register a handler for a shortcut (pass undefined to unregister). */
  registerHandler: (key: ShortcutKeyId, handler: ShortcutHandler | undefined) => void;
  /** Shortcuts that currently have a handler (for overlay list). */
  availableShortcuts: Array<{ id: ShortcutKeyId; label: string; keys: string }>;
  /** Run the handler for a shortcut key if registered. */
  runHandler: (key: ShortcutKeyId) => void;
}

const ShortcutsContext = createContext<ShortcutsContextValue | null>(null);

export function ShortcutsProvider({ children }: { children: ReactNode }) {
  const [overlayOpen, setOverlayOpen] = useState(false);
  const handlersRef = useRef<HandlersMap>({});
  const [tick, setTick] = useState(0);

  const registerHandler = useCallback((key: ShortcutKeyId, handler: ShortcutHandler | undefined) => {
    handlersRef.current[key] = handler;
    setTick((t) => t + 1);
  }, []);

  const runHandler = useCallback((key: ShortcutKeyId) => {
    const fn = handlersRef.current[key];
    if (fn) fn();
  }, []);

  // Memoize availableShortcuts to prevent creating new array on every render
  const availableShortcuts = useMemo(
    () =>
      Object.values(SHORTCUT_KEYS)
        .filter((id) => typeof handlersRef.current[id] === "function")
        .map((id) => ({
          id,
          label: SHORTCUT_LABELS[id].label,
          keys: SHORTCUT_LABELS[id].keys,
        })),
    [tick]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Alt" && !e.repeat) {
        e.preventDefault();
        e.stopPropagation();
        setOverlayOpen(true);
        return;
      }
      if (overlayOpen) {
        const key = e.key.toLowerCase();
        const id = (Object.entries(SHORTCUT_TRIGGER_KEYS).find(
          ([, v]) => v === key
        ) as [ShortcutKeyId, string] | undefined)?.[0];
        if (id && handlersRef.current[id]) {
          e.preventDefault();
          e.stopPropagation();
          runHandler(id);
          setOverlayOpen(false);
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Alt" && !e.repeat) {
        e.preventDefault();
        e.stopPropagation();
        setOverlayOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOverlayOpen(false);
    };
    // Listen on window with capture so Alt is received without requiring a prior click (works even when no element has focus).
    const opts = { capture: true };
    window.addEventListener("keydown", handleKeyDown, opts);
    window.addEventListener("keyup", handleKeyUp, opts);
    window.addEventListener("keydown", handleEscape, opts);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, opts);
      window.removeEventListener("keyup", handleKeyUp, opts);
      window.removeEventListener("keydown", handleEscape, opts);
    };
  }, [overlayOpen, runHandler]);

  // Memoize context value to prevent consumers from re-rendering unnecessarily
  const value: ShortcutsContextValue = useMemo(
    () => ({
      overlayOpen,
      setOverlayOpen,
      registerHandler,
      availableShortcuts,
      runHandler,
    }),
    [overlayOpen, registerHandler, availableShortcuts, runHandler]
  );

  return (
    <ShortcutsContext.Provider value={value}>
      {children}
    </ShortcutsContext.Provider>
  );
}

export function useShortcuts(): ShortcutsContextValue {
  const ctx = useContext(ShortcutsContext);
  if (!ctx) throw new Error("useShortcuts must be used within ShortcutsProvider");
  return ctx;
}
