import { useState, useEffect, useRef } from 'react';
import { api } from '../api.js';
import AnalysisCard from './AnalysisCard.jsx';
import { Icon } from './icons.jsx';

// Example questions to help the owner get started.
const SUGGESTIONS = [
  'Is 10% off on biscuits a good idea?',
  'Give 20% off on milk to inactive customers',
  'Can I give Rs 20 off on juice?',
  'I want to clear old stock. Which product can I discount?',
];

export default function AskAI({ open, onClose, products, onOfferSaved, onToast }) {
  // The chat history, the typed text, the "thinking" flag, and the
  // name of the AI that last answered.
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiMode, setAiMode] = useState(null);
  const listRef = useRef(null);

  // Keep the newest message in view after anything changes.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading, open]);

  // Send a question to the backend and show its answer.
  async function ask(prompt) {
    const trimmed = prompt.trim();
    if (!trimmed || loading) return; // nothing to ask, or already thinking

    setInput('');
    setMessages((prev) => [...prev, { id: Date.now(), role: 'user', text: trimmed }]);
    setLoading(true);

    try {
      const result = await api.askAI(trimmed);
      setAiMode(result.aiMode === 'gemini' ? 'Gemini' : 'Mock AI');
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: 'ai', result }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'ai', error: err.message },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // Save the offer from a full answer: create it, refresh the offers
  // panel, show a toast, and mark this bubble as saved.
  async function saveOffer(result) {
    const discountType = result.extraction.discountType === 'fixed' ? 'fixed' : 'percentage';
    const offer = {
      productId: result.product.id,
      customerGroupId: result.extraction.customerGroupId || null,
      discountType,
      discountValue: result.extraction.discountValue,
    };

    await api.createOffer(offer);
    onOfferSaved();
    onToast('Offer saved');
    setMessages((prev) =>
      prev.map((m) => (m.result === result ? { ...m, saved: true } : m))
    );
  }

  return (
    <div className={`drawer ${open ? 'open' : ''}`} role="dialog" aria-modal="true" aria-label="Ask AI">
      {/* The drawer header: title, AI chip, close button */}
      <div className="drawer-head">
        <div className="grow">
          <h2>Ask AI</h2>
          <p>Describe the offer you're thinking of, in your own words.</p>
          {/* Honest tag: which AI actually answered. */}
          {aiMode && (
            <span className="ai-chip">
              <span className="pulse" />
              {aiMode}
            </span>
          )}
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Close chat">
          <Icon.X />
        </button>
      </div>

      {/* The scrollable message column */}
      <div className="chat-list" ref={listRef}>
        {/* Before any messages: a welcome + example questions. */}
        {messages.length === 0 && (
          <div className="welcome">
            <p style={{ margin: '0 0 2px' }}>Ask naturally, in plain words.</p>
            <p style={{ margin: 0 }}>For example:</p>
            <div className="suggestions">
              {SUGGESTIONS.map((s) => (
                <span key={s} onClick={() => ask(s)}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Every message in the conversation. */}
        {messages.map((m) => (
          <div key={m.id} className={`msg ${m.role}`}>
            {/* The little assistant avatar on AI messages. */}
            {m.role === 'ai' && (
              <div className="avatar">
                <Icon.Sparkles size={16} />
              </div>
            )}
            {m.role === 'user' ? (
              // The owner's own question.
              <div className="bubble">{m.text}</div>
            ) : m.error ? (
              // A failure bubble.
              <div className="bubble error">{m.error}</div>
            ) : m.result.needsMoreInfo ? (
              // The AI only has words (asks for the missing detail).
              <div className="bubble">{m.result.explanation}</div>
            ) : m.result ? (
              // A full answer with numbers - the analysis card.
              <AnalysisCard
                result={m.result}
                saved={m.saved}
                onSave={() => saveOffer(m.result)}
              />
            ) : null}
          </div>
        ))}

        {/* A gentle "thinking..." row while the backend works. */}
        {loading && (
          <div className="msg ai">
            <div className="avatar">
              <Icon.Sparkles size={16} />
            </div>
            <div className="thinking">
              <span className="dots">
                <i />
                <i />
                <i />
              </span>
              Thinking…
            </div>
          </div>
        )}
      </div>

      {/* The input row at the bottom */}
      <form
        className="chat-input"
        onSubmit={(e) => {
          e.preventDefault(); // stop the page from reloading
          ask(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Try: "Give high-spending customers 10% off on biscuits"'
          aria-label="Your question"
        />
        <button className="send-btn" type="submit" disabled={loading} aria-label="Send">
          <Icon.Send size={18} />
        </button>
      </form>
    </div>
  );
}