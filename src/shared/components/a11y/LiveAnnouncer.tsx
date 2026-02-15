import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

/** Default no-op so useAnnounce works even without a provider (e.g. in tests). */
const noop = () => {};

type AnnounceFn = (message: string) => void;

const LiveAnnouncerContext = createContext<AnnounceFn>(noop);

const CLEAR_DELAY_MS = 1500;

/**
 * Visually hidden aria-live region for screen reader announcements.
 * Call announce(message) to have the message read; it is cleared after a delay
 * so the same message can be re-announced if triggered again.
 */
function LiveAnnouncerRegion({ message }: { message: string }) {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      role="status"
      className="visually-hidden"
      style={{
        position: "absolute",
        width: "1px",
        height: "1px",
        padding: 0,
        margin: "-1px",
        overflow: "hidden",
        clip: "rect(0,0,0,0)",
        whiteSpace: "nowrap",
        border: 0,
      }}
    >
      {message}
    </div>
  );
}

/**
 * Provider that renders the live region and exposes announce() via context.
 * Mount once at app root (e.g. in App.tsx).
 */
export function LiveAnnouncerProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const announce = useCallback((msg: string) => {
    if (clearTimeoutRef.current) {
      clearTimeout(clearTimeoutRef.current);
      clearTimeoutRef.current = null;
    }
    setMessage(msg);
    clearTimeoutRef.current = setTimeout(() => {
      setMessage("");
      clearTimeoutRef.current = null;
    }, CLEAR_DELAY_MS);
  }, []);

  return (
    <LiveAnnouncerContext.Provider value={announce}>
      {children}
      <LiveAnnouncerRegion message={message} />
    </LiveAnnouncerContext.Provider>
  );
}

/** Hook to get the announce function for screen-reader announcements (e.g. upload/download status). */
export function useAnnounce(): AnnounceFn {
  return useContext(LiveAnnouncerContext);
}
