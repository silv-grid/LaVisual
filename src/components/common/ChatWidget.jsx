/**
 * Chat Widget
 *
 * Floating FAQ/info chatbot for site visitors, backed by the RAG chatbot
 * endpoint (POST /api/chatbot/ask). Scoped to answering questions about
 * packages, pricing, policies, and process using CMS content - it does
 * not create or modify bookings itself, and points visitors to the
 * Booking/Contact pages for anything it can't answer.
 */
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faArrowUp, faComment } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { API_URL } from "../../lib/config";

const LOGO_SRC = "/lavisual-logo.ico";

const WELCOME_MESSAGE = {
  role: "assistant",
  text: "Hi! Ask me anything about our packages, pricing, or how booking works.",
};

// Shown only on the empty state - gives visitors a way in without having to
// guess what the bot knows about.
const SUGGESTIONS = [
  "What packages do you offer?",
  "How much is a wedding shoot?",
  "How do I book a session?",
];

/**
 * Brand mark used in the header and launcher. Falls back to the "LaVisual"
 * wordmark initial if the logo file fails to load, so the widget never
 * renders a broken-image icon.
 */
function BrandMark({ className = "", imgClassName = "" }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className={`flex items-center justify-center font-bold text-white ${className}`}>
        La
      </span>
    );
  }

  return (
    <span className={`flex items-center justify-center overflow-hidden ${className}`}>
      <img
        src={LOGO_SRC}
        alt="LaVisual"
        className={imgClassName}
        onError={() => setFailed(true)}
      />
    </span>
  );
}

/** Three-dot typing indicator shown while the assistant is composing a reply. */
function TypingIndicator({ reduceMotion }) {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3" aria-label="Assistant is typing">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-purple-300/70"
          animate={reduceMotion ? {} : { opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{
            duration: 1.1,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const reduceMotion = useReducedMotion();

  // Keep the latest message in view as the conversation grows.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: reduceMotion ? "auto" : "smooth" });
  }, [messages, sending, open, reduceMotion]);

  // Focus the input when the panel opens, so visitors can just start typing.
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 250);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Close on Escape while the panel is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const send = async (presetQuestion) => {
    const question = (presetQuestion ?? input).trim();
    if (!question || sending) return;

    // Send the recent turns along with the question so the assistant can resolve
    // follow-ups ("how much is that one?"). The welcome message is ours, not part
    // of the conversation, so it's excluded.
    const history = messages
      .slice(1)
      .map((m) => ({ role: m.role, content: m.text }));

    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setInput("");
    setSending(true);

    try {
      const res = await axios.post(`${API_URL}/api/chatbot/ask`, { question, history });
      const payload = res.data;
      // The API returns HTTP 200 even for handled failures, carrying the real
      // status in the body - so check success, and surface its message rather
      // than a generic "no answer" line that hides what went wrong.
      const answer = payload?.success
        ? payload?.data?.answer
        : payload?.message;
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: answer || "Sorry, I couldn't answer that just now. Please try again, or use the Contact page.",
        },
      ]);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        "Sorry, I couldn't reach the server. Please check your connection and try again.";
      setMessages((prev) => [...prev, { role: "assistant", text: message }]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const showSuggestions = messages.length === 1 && !sending;

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 320, damping: 30, mass: 0.8 }}
            style={{ transformOrigin: "bottom right" }}
            className="mb-3 w-[calc(100vw-2.5rem)] max-w-[23rem] h-[min(30rem,70vh)] flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0F131C] shadow-[0_18px_50px_-12px_rgba(0,0,0,0.75)]"
            role="dialog"
            aria-label="LaVisual chat"
          >
            {/* Header */}
            <div className="relative flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-600">
              <BrandMark
                className="w-9 h-9 shrink-0 rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm text-sm"
                imgClassName="w-6 h-6 object-contain"
              />
              <div className="min-w-0 flex-1">
                <p className="text-white font-semibold leading-tight tracking-tight">LaVisual</p>
                <p className="flex items-center gap-1.5 text-[11px] text-purple-100/80 leading-tight">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
                  Usually replies instantly
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-white/75 hover:text-white hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 transition-colors duration-150 hover:cursor-pointer"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              role="log"
              aria-live="polite"
              className="flex-1 overflow-y-auto px-3.5 py-4 space-y-2.5 [scrollbar-width:thin] [scrollbar-color:rgba(168,85,247,0.35)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-purple-500/30 hover:[&::-webkit-scrollbar-thumb]:bg-purple-500/50"
            >
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap selection:bg-purple-500/40 ${
                      m.role === "user"
                        ? "bg-purple-600 text-white rounded-2xl rounded-br-md shadow-lg shadow-purple-950/40"
                        : "bg-white/[0.06] text-gray-100 rounded-2xl rounded-bl-md ring-1 ring-white/5"
                    }`}
                  >
                    {m.text}
                  </div>
                </motion.div>
              ))}

              {sending && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-white/[0.06] ring-1 ring-white/5 rounded-2xl rounded-bl-md">
                    <TypingIndicator reduceMotion={reduceMotion} />
                  </div>
                </motion.div>
              )}

              {/* Empty-state suggestions - give visitors a starting point */}
              <AnimatePresence>
                {showSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ delay: 0.15 }}
                    className="pt-1.5 flex flex-wrap gap-1.5"
                  >
                    {SUGGESTIONS.map((s, i) => (
                      <motion.button
                        key={s}
                        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + i * 0.07 }}
                        onClick={() => send(s)}
                        className="px-3 py-1.5 text-[12px] rounded-full text-purple-200 bg-purple-500/10 ring-1 ring-purple-400/25 hover:bg-purple-500/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 transition-colors duration-150 hover:cursor-pointer"
                      >
                        {s}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Composer */}
            <div className="px-3 pt-2.5 pb-3 border-t border-white/5 bg-white/[0.02]">
              <div className="flex items-end gap-2">
                <input
                  ref={inputRef}
                  className="flex-1 bg-white/[0.06] ring-1 ring-white/10 rounded-full px-4 py-2.5 text-[13px] text-white placeholder:text-gray-500 caret-purple-400 selection:bg-purple-500/40 focus:outline-none focus:ring-2 focus:ring-purple-500/70 transition-shadow duration-150"
                  placeholder="Ask about packages, pricing..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={sending}
                  aria-label="Your question"
                />
                <motion.button
                  onClick={() => send()}
                  disabled={sending || !input.trim()}
                  whileHover={input.trim() && !sending ? { scale: 1.06 } : {}}
                  whileTap={input.trim() && !sending ? { scale: 0.92 } : {}}
                  aria-label="Send message"
                  className="w-10 h-10 shrink-0 rounded-full bg-purple-600 hover:bg-purple-500 disabled:opacity-35 disabled:hover:bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-950/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F131C] transition-colors duration-150 hover:cursor-pointer disabled:hover:cursor-default"
                >
                  <FontAwesomeIcon icon={faArrowUp} className="text-sm" />
                </motion.button>
              </div>
              <p className="mt-2 text-center text-[10.5px] text-gray-600">
                For bookings, head to the{" "}
                <Link to="/booking" className="text-purple-400/80 hover:text-purple-300 underline underline-offset-2">
                  booking page
                </Link>
                .
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Launcher */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: "spring", stiffness: 400, damping: 18 }}
        aria-label={open ? "Close chat" : "Open chat"}
        aria-expanded={open}
        className="relative w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 shadow-[0_10px_30px_-6px_rgba(88,28,135,0.8)] ring-1 ring-white/15 text-white flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent hover:cursor-pointer"
      >
        {/* Soft attention halo, only while closed and only if motion is allowed */}
        {!open && !reduceMotion && (
          <motion.span
            className="absolute inset-0 rounded-full ring-2 ring-purple-400/50"
            animate={{ scale: [1, 1.35], opacity: [0.5, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="close"
              initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
              transition={{ duration: 0.18 }}
              className="flex items-center justify-center"
            >
              <FontAwesomeIcon icon={faXmark} className="text-xl" />
            </motion.span>
          ) : (
            <motion.span
              key="logo"
              initial={{ opacity: 0, rotate: 90, scale: 0.6 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: -90, scale: 0.6 }}
              transition={{ duration: 0.18 }}
              className="flex items-center justify-center"
            >
              <BrandMark className="w-8 h-8 text-sm" imgClassName="w-8 h-8 object-contain drop-shadow" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

export default ChatWidget;
