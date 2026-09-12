/**
 * Toast notifications
 *
 * Replaces the native alert() calls the admin panel used for feedback. Native
 * dialogs block the whole page, can't be styled, and give no sense of whether
 * an action succeeded or failed beyond the text. These stack in the corner,
 * colour-code by outcome, and dismiss themselves.
 *
 * Usage:
 *   const toast = useToast();
 *   toast.success("Package saved");
 *   toast.error("Upload failed", err.message);
 */
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleExclamation,
  faCircleInfo,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

const ToastContext = createContext(null);

const VARIANTS = {
  success: {
    icon: faCircleCheck,
    // Tinted from the variant's own hue rather than gray, so the text stays
    // legible against the coloured surface.
    ring: "ring-emerald-500/30",
    bg: "bg-emerald-950/90",
    iconColor: "text-emerald-400",
    titleColor: "text-emerald-50",
    bodyColor: "text-emerald-200/80",
  },
  error: {
    icon: faCircleExclamation,
    ring: "ring-red-500/30",
    bg: "bg-red-950/90",
    iconColor: "text-red-400",
    titleColor: "text-red-50",
    bodyColor: "text-red-200/80",
  },
  info: {
    icon: faCircleInfo,
    ring: "ring-purple-500/30",
    bg: "bg-purple-950/90",
    iconColor: "text-purple-400",
    titleColor: "text-purple-50",
    bodyColor: "text-purple-200/80",
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (variant, title, body, duration = 4500) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, variant, title, body }]);
      // Errors stay longer - they usually carry something worth reading.
      const ms = variant === "error" ? Math.max(duration, 7000) : duration;
      setTimeout(() => dismiss(id), ms);
      return id;
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      success: (title, body) => push("success", title, body),
      error: (title, body) => push("error", title, body),
      info: (title, body) => push("info", title, body),
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="fixed top-4 right-4 z-[200] flex flex-col gap-2 w-[min(22rem,calc(100vw-2rem))]"
        role="status"
        aria-live="polite"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const v = VARIANTS[toast.variant] ?? VARIANTS.info;
            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, x: 24, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 24, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                className={`flex items-start gap-3 rounded-xl px-3.5 py-3 backdrop-blur-md ring-1 ${v.ring} ${v.bg} shadow-[0_12px_32px_-8px_rgba(0,0,0,0.7)]`}
              >
                <FontAwesomeIcon icon={v.icon} className={`${v.iconColor} mt-0.5 shrink-0`} />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${v.titleColor}`}>{toast.title}</p>
                  {toast.body && (
                    <p className={`text-xs mt-0.5 break-words ${v.bodyColor}`}>{toast.body}</p>
                  )}
                </div>
                <button
                  onClick={() => dismiss(toast.id)}
                  aria-label="Dismiss notification"
                  className={`${v.bodyColor} hover:text-white transition-colors duration-150 hover:cursor-pointer shrink-0`}
                >
                  <FontAwesomeIcon icon={faXmark} className="text-xs" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

/**
 * Returns the toast API. Falls back to a no-op-ish console shim if used outside
 * the provider, so a component can't crash the page over a notification.
 */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      success: (t) => console.log("[toast]", t),
      error: (t, b) => console.error("[toast]", t, b ?? ""),
      info: (t) => console.log("[toast]", t),
      dismiss: () => {},
    };
  }
  return ctx;
}
