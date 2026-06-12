import React, { useState, useRef, useEffect } from "react";
import { api } from "../api/client";
import CitationCard from "../components/CitationCard";

// Browser SpeechRecognition — Chrome/Edge expose it prefixed.
const SpeechRecognition =
  typeof window !== "undefined"
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null;

const SUGGESTED_QUESTIONS = [
  "What is the total amount due on the invoice?",
  "Summarise the key findings of the research paper",
  "What is the sensitivity level of each document?",
  "Are there any tables in the uploaded documents?",
  "What documents mention revenue or financial data?",
  "Which pages contain handwritten content?",
];

export default function Chat() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hello! I'm BFAI. Ask me anything about your uploaded documents — I'll answer with exact citations showing the source page. If something isn't in the documents, I'll tell you that too.",
      citations: [],
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [docs, setDocs] = useState([]);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load document list for left panel
  useEffect(() => {
    api.getDocuments().then(d => { if (Array.isArray(d)) setDocs(d); }).catch(() => {});
  }, []);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: "user", text: text.trim(), citations: [] };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const history = messages.map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.text }));
      const data = await api.chat(text.trim(), history);
      setMessages(prev => [...prev, {
        role: "assistant",
        text: data.answer,
        citations: data.citations || []
      }]);
      if (voiceEnabled && data.answer) speakText(data.answer);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        text: "Sorry, I couldn't connect to the backend. Please check the server is running.",
        citations: []
      }]);
    } finally {
      setLoading(false);
    }
  };

  // TTS via ElevenLabs backend
  const speakText = async (text) => {
    try {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      const url = await api.speak(text);
      const audio = new Audio(url);
      audioRef.current = audio;
      setIsSpeaking(true);
      audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); audioRef.current = null; };
      audio.onerror = () => { setIsSpeaking(false); audioRef.current = null; };
      await audio.play().catch(() => { setIsSpeaking(false); });
    } catch {
      setIsSpeaking(false);
    }
  };

  // Voice input with live transcript
  const startVoiceInput = () => {
    if (isListening) { stopListening(); return; }
    if (!SpeechRecognition) {
      alert("Voice input not supported in this browser. Use Chrome or Edge.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => { setIsListening(false); setLiveTranscript(""); recognitionRef.current = null; };
    recognition.onresult = (e) => {
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t;
        else interim += t;
      }
      setLiveTranscript(interim || final);
      if (final) {
        setInput(final);
        setLiveTranscript("");
        stopListening();
      }
    };
    recognition.onerror = () => { setIsListening(false); setLiveTranscript(""); };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setLiveTranscript("");
  };

  const sensitivityColor = (level) => {
    const map = {
      public: "bg-green-100 text-green-700",
      internal: "bg-blue-100 text-blue-700",
      confidential: "bg-orange-100 text-orange-700",
      strictly_confidential: "bg-red-100 text-red-700",
    };
    return map[(level || "").toLowerCase().replace(/ /g, "_")] || "bg-gray-100 text-gray-600";
  };

  return (
    <div className="p-gutter max-w-container-max mx-auto w-full h-full flex flex-col">
      {/* Page Header */}
      <div className="mb-6 glass-card p-6 rounded-xl card-inner-stroke">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-3xl">chat</span>
          <div>
            <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">Ask BFAI</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">Ask anything about your uploaded documents. Get grounded answers with citations.</p>
          </div>
        </div>
      </div>

      <div className="flex gap-gutter flex-1 min-h-0">
        {/* Left: Document list (desktop only) */}
        <aside className="hidden lg:flex flex-col w-[240px] shrink-0 gap-2">
          <div className="glass-card rounded-xl card-inner-stroke flex flex-col" style={{ maxHeight: "70vh" }}>
            <div className="px-4 py-3 border-b border-outline-variant/30 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-sm">folder_open</span>
              <span className="font-label-caps text-label-caps text-on-surface-variant">INDEXED DOCS</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {docs.length === 0 ? (
                <p className="text-[12px] text-on-surface-variant text-center py-4">No documents yet.<br />Upload some files first.</p>
              ) : docs.map(doc => (
                <div key={doc.doc_id} className="flex items-start gap-2 px-2 py-2 rounded-lg hover:bg-surface-container-low transition-colors">
                  <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">description</span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-on-surface truncate" title={doc.filename}>{doc.filename}</p>
                    {doc.classification?.document_type && (
                      <p className="text-[10px] text-on-surface-variant">{doc.classification.document_type}</p>
                    )}
                    {doc.classification?.sensitivity_level && (
                      <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded-full font-semibold mt-0.5 ${sensitivityColor(doc.classification.sensitivity_level)}`}>
                        {doc.classification.sensitivity_level}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Right: Chat interface */}
        <div className="flex-1 flex flex-col gap-gutter min-w-0">
          {/* Messages */}
          <div className="glass-card rounded-xl card-inner-stroke flex flex-col flex-1" style={{ minHeight: 0, maxHeight: "65vh" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/30">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
                <span className="font-label-caps text-label-caps text-on-surface-variant">BFAI — DOCUMENT INTELLIGENCE</span>
              </div>
              <button
                onClick={() => { setVoiceEnabled(v => !v); if (isSpeaking && audioRef.current) { audioRef.current.pause(); setIsSpeaking(false); } }}
                className={`flex items-center gap-1 px-3 py-1 rounded font-label-caps text-xs transition-colors ${voiceEnabled ? "bg-primary text-white" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"}`}
              >
                <span className="material-symbols-outlined text-sm">{voiceEnabled ? "volume_up" : "volume_off"}</span>
                {voiceEnabled ? "Voice ON" : "Voice OFF"}
              </button>
            </div>

            {/* Message List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-sm">auto_awesome</span>
                    </div>
                  )}
                  <div className="max-w-[80%] flex flex-col gap-2">
                    <div className={`px-4 py-3 rounded-xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-white rounded-br-sm"
                        : "bg-surface-container-low text-on-surface rounded-bl-sm border border-outline-variant/30"
                    }`}>
                      {msg.text}
                    </div>
                    {/* Citation cards */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-1 pl-2">
                        {msg.citations.map((c, i) => (
                          <CitationCard key={i} citation={c} />
                        ))}
                      </div>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-secondary text-sm">person</span>
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-sm animate-spin">sync</span>
                  </div>
                  <div className="bg-surface-container-low border border-outline-variant/30 px-4 py-3 rounded-xl rounded-bl-sm">
                    <span className="font-data-mono text-xs text-on-surface-variant animate-pulse">Searching documents…</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-outline-variant/30">
              {/* Live transcript preview */}
              {isListening && liveTranscript && (
                <p className="text-[11px] text-primary mb-1.5 px-1 italic">"{liveTranscript}"</p>
              )}
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
                  placeholder="Ask about your documents..."
                  className="flex-1 bg-surface-container rounded-lg px-4 py-2.5 text-sm text-on-surface placeholder-on-surface-variant border border-outline-variant/40 focus:outline-none focus:border-primary font-body-md"
                />
                {/* Speak button — voice ONLY starts on explicit tap */}
                <button
                  onClick={() => isListening ? stopListening() : startVoiceInput()}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${isListening ? "bg-error text-white animate-pulse" : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant"}`}
                  title={isListening ? "Stop listening" : "Speak (tap to start voice input)"}
                >
                  <span className="material-symbols-outlined text-lg">{isListening ? "stop" : "mic"}</span>
                </button>
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading}
                  className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-opacity"
                >
                  <span className="material-symbols-outlined text-lg">send</span>
                </button>
              </div>
              {isSpeaking && (
                <div className="flex items-center gap-2 mt-2 text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-sm text-primary animate-pulse">graphic_eq</span>
                  <span>Speaking…</span>
                  <button onClick={() => { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } setIsSpeaking(false); }} className="text-primary hover:underline">Stop</button>
                </div>
              )}
            </div>
          </div>

          {/* Suggested Questions */}
          <div className="glass-card rounded-xl p-6 card-inner-stroke">
            <h3 className="font-title-md text-title-md text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">tips_and_updates</span>
              Suggested Questions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(q)}
                  className="w-full text-left px-3 py-2.5 text-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors border border-outline-variant/30 hover:border-primary/30"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
