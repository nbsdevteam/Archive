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
import { useViewport } from "../hooks/useViewport";
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
  const { isDesktopView } = useViewport();
  const [overlayOpen, setOverlayOpen] = useState(false);
  /** Mirrors overlayOpen for key handlers; updated synchronously so Alt then / never reads stale state, and keyboard listeners stay mounted (effect does not depend on overlayOpen). */
  const overlayOpenRef = useRef(false);
  const handlersRef = useRef<HandlersMap>({});
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!isDesktopView) {
      overlayOpenRef.current = false;
      setOverlayOpen(false);
    }
  }, [isDesktopView]);

  useEffect(() => {
    overlayOpenRef.current = overlayOpen;
  }, [overlayOpen]);

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

  /** Alt toggles overlay; shortcut keys run handlers; Escape closes overlay. AbortController for multiple listeners. */
  useEffect(() => {
    if (!isDesktopView) return;
    const abortController = new AbortController();
    const { signal } = abortController;
    const opts = { capture: true, signal };
    const handleKeyDown = (e: KeyboardEvent) => {
      /** Alt + / focuses global search; use e.code so the physical slash key works when Alt changes e.key (layouts / OS). */
      const isSlashChord =
        e.altKey &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.repeat &&
        (e.code === "Slash" ||
          e.code === "NumpadDivide" ||
          e.key === "/" ||
          e.key === "Divide");

      if (isSlashChord) {
        const fn = handlersRef.current[SHORTCUT_KEYS.GLOBAL_SEARCH];
        if (typeof fn === "function") {
          e.preventDefault();
          e.stopPropagation();
          fn();
          overlayOpenRef.current = false;
          setOverlayOpen(false);
          return;
        }
      }
      if (e.key === "Alt" && !e.repeat) {
        e.preventDefault();
        e.stopPropagation();
        overlayOpenRef.current = true;
        setOverlayOpen(true);
        return;
      }
      if (overlayOpenRef.current) {
        const raw = e.key;
        const key = raw.length === 1 ? raw.toLowerCase() : raw;
        const id = (Object.entries(SHORTCUT_TRIGGER_KEYS).find(
          ([idEntry, v]) => v === key && typeof handlersRef.current[idEntry as ShortcutKeyId] === "function"
        ) as [ShortcutKeyId, string] | undefined)?.[0];
        if (id) {
          e.preventDefault();
          e.stopPropagation();
          runHandler(id);
          overlayOpenRef.current = false;
          setOverlayOpen(false);
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Alt" && !e.repeat) {
        e.preventDefault();
        e.stopPropagation();
        overlayOpenRef.current = false;
        setOverlayOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        overlayOpenRef.current = false;
        setOverlayOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown, opts);
    window.addEventListener("keyup", handleKeyUp, opts);
    window.addEventListener("keydown", handleEscape, opts);
    /** Intentionally omit overlayOpen from deps: including it removed listeners on every Alt press and dropped the first "/" keydown. */
    return () => abortController.abort();
  }, [isDesktopView, runHandler]);

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
