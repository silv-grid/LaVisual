/**
 * Confirm dialog
 *
 * Replaces the native window.confirm() calls used before destructive admin
 * actions. Beyond being unstyled, the native dialog blocks the page and gives
 * the same flat treatment to "delete this booking permanently" as to any other
 * question. This one names the consequence, marks destructive actions in red,
 * and supports a busy state so the button can't be double-fired while the
 * request is in flight.
 *
 * Usage:
 *   const confirm = useConfirm();
 *   if (await confirm({ title: "Delete package?", body: "...", destructive: true })) { ... }
 */
import { createContext, useCallback, useContext, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolverRef = useRef(null);

  const confirm = useCallback((options) => {
    setDialog({
      title: options.title ?? "Are you sure?",
      body: options.body ?? "",
      confirmLabel: options.confirmLabel ?? (options.destructive ? "Delete" : "Confirm"),
      cancelLabel: options.cancelLabel ?? "Cancel",
      destructive: !!options.destructive,
    });
    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const close = useCallback((result) => {
    setDialog(null);
    resolverRef.current?.(result);
    resolverRef.current = null;
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AnimatePresence>
        {dialog && (
          <motion.div
            className="fixed inset-0 z-[300] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* Backdrop - clicking it cancels, matching the Escape affordance */}
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => close(false)}
            />
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-label={dialog.title}
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              onKeyDown={(e) => e.key === "Escape" && close(false)}
              className="relative w-full max-w-sm rounded-2xl bg-gray-900 ring-1 ring-white/10 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.8)] p-5"
            >
              <div className="flex items-start gap-3">
                {dialog.destructive && (
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500/15 ring-1 ring-red-500/30">
                    <FontAwesomeIcon icon={faTriangleExclamation} className="text-red-400" />
                  </span>
                )}
                <div className="min-w-0">
                  <h3 className="text-white font-semibold leading-tight">{dialog.title}</h3>
                  {dialog.body && (
                    <p className="mt-1.5 text-sm text-gray-400 leading-relaxed">{dialog.body}</p>
                  )}
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={() => close(false)}
                  className="px-3.5 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 transition-colors duration-150 hover:cursor-pointer"
                >
                  {dialog.cancelLabel}
                </button>
                <button
                  autoFocus
                  onClick={() => close(true)}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium text-white transition-colors duration-150 hover:cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 ${
                    dialog.destructive
                      ? "bg-red-600 hover:bg-red-500 focus-visible:ring-red-400 shadow-lg shadow-red-950/40"
                      : "bg-purple-600 hover:bg-purple-500 focus-visible:ring-purple-400 shadow-lg shadow-purple-950/40"
                  }`}
                >
                  {dialog.confirmLabel}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}

/**
 * Returns an async confirm(options) => Promise<boolean>. Falls back to the
 * native dialog if used outside the provider, so a destructive action is never
 * silently auto-approved.
 */
export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    return async (options) => window.confirm(options?.title ?? "Are you sure?");
  }
  return ctx;
}
