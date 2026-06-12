// frontend/src/api/client.js — BFAI Document Intelligence API client

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export const api = {
  // Health check — returns { status, documents_indexed }
  getHealth: () => request("/api/health"),

  // Upload files — FormData with multiple files
  // Returns [{ doc_id, filename, status }]
  uploadDocuments: (formData) =>
    fetch(`${API_BASE}/api/upload`, { method: "POST", body: formData }).then(r => r.json()),

  // Get processing status for a doc
  // Returns { status: "parsing|classifying|embedding|indexed", progress: 0-100 }
  getProcessingStatus: (docId) => request(`/api/processing-status/${docId}`),

  // Get all indexed documents
  // Returns [{ doc_id, filename, classification: {...}, page_count, indexed_at }]
  getDocuments: () => request("/api/documents"),

  // Get a single document detail
  getDocument: (docId) => request(`/api/documents/${docId}`),

  // Delete a document
  deleteDocument: (docId) => request(`/api/documents/${docId}`, { method: "DELETE" }),

  // Get the URL for a rendered page image
  getPageImageUrl: (docId, pageNumber) =>
    `${API_BASE}/api/documents/${docId}/page/${pageNumber}/image`,

  // Chat with the RAG agent
  // Body: { message: string, conversation_history: [{role, content}] }
  // Returns: { answer: string, citations: [{doc_name, doc_id, page_number, chunk_text}], conversation_history: [...] }
  chat: (message, conversationHistory) =>
    request("/api/chat", {
      method: "POST",
      body: JSON.stringify({ message, conversation_history: conversationHistory }),
    }),

  // Text-to-speech — returns object URL for audio (ElevenLabs via backend)
  speak: (text) =>
    fetch(`${API_BASE}/api/voice/speak`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    }).then(r => { if (!r.ok) throw new Error(); return r.blob(); })
      .then(blob => {
        const audioBlob = blob.type.startsWith("audio/") ? blob : new Blob([blob], { type: "audio/mpeg" });
        return URL.createObjectURL(audioBlob);
      }),

  // Voice transcription fallback — POST multipart blob, returns { text }
  transcribe: (blob) => {
    const formData = new FormData();
    formData.append("audio", blob, "recording.webm");
    return fetch(`${API_BASE}/api/voice/transcribe`, { method: "POST", body: formData }).then(r => r.json());
  },

  // Backend health alias for Settings page
  health: () => request("/api/health").catch(() => null),
};
