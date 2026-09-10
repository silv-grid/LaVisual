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
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComments, faXmark, faPaperPlane, faRobot } from "@fortawesome/free-solid-svg-icons";
import { API_URL } from "../../lib/config";

const WELCOME_MESSAGE = {
  role: "assistant",
  text: "Hi! I'm LaVisual's assistant. Ask me about our packages, pricing, or booking process.",
};

function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const send = async () => {
    const question = input.trim();
    if (!question || sending) return;

    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setInput("");
    setSending(true);

    try {
      const res = await axios.post(`${API_URL}/api/chatbot/ask`, { question });
      const answer = res.data?.data?.answer || "Sorry, I couldn't come up with an answer for that.";
      setMessages((prev) => [...prev, { role: "assistant", text: answer }]);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        "Sorry, something went wrong. Please try again or use the Contact page.";
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

  return (
    <div className="fixed bottom-5 right-5 z-[100]">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-3 w-[90vw] max-w-sm h-[28rem] bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-white">
                <FontAwesomeIcon icon={faRobot} />
                <span className="font-semibold">LaVisual Assistant</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white hover:cursor-pointer">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-purple-600 text-white rounded-br-sm"
                        : "bg-gray-800 text-gray-100 rounded-bl-sm"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 text-gray-400 rounded-2xl rounded-bl-sm px-3 py-2 text-sm">
                    Thinking...
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-gray-800 flex items-center space-x-2">
              <input
                className="flex-1 bg-gray-800 border border-gray-700 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                placeholder="Ask about packages, pricing..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={sending}
              />
              <button
                onClick={send}
                disabled={sending || !input.trim()}
                className="w-9 h-9 rounded-full bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white flex items-center justify-center hover:cursor-pointer shrink-0"
              >
                <FontAwesomeIcon icon={faPaperPlane} className="text-xs" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((o) => !o)}
        className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 shadow-xl text-white flex items-center justify-center hover:cursor-pointer"
        aria-label="Open chat assistant"
      >
        <FontAwesomeIcon icon={open ? faXmark : faComments} className="text-xl" />
      </motion.button>
    </div>
  );
}

export default ChatWidget;
