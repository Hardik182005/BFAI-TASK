// Lightweight global store — describes what the user is currently viewing
// so the VoiceOrb chat assistant can answer with context of the current doc.
// Plain module singleton; no provider/wrapping needed.

let _context = "";

export function setPageContext(ctx) {
  _context = (ctx || "").toString().slice(0, 2000);
}

export function clearPageContext() {
  _context = "";
}

export function getPageContext() {
  return _context;
}

// Build a context string from a document payload.
export function buildDocContext(docId, data) {
  if (!data) return "";
  const c = data.classification || {};
  return [
    `The user is viewing the BFAI document: ${data.filename || docId}.`,
    c.document_type ? `Type: ${c.document_type}. Topic: ${c.topic || "unknown"}.` : "",
    c.sensitivity_level ? `Sensitivity: ${c.sensitivity_level}.` : "",
    c.summary ? `Summary: ${c.summary}` : "",
    "Answer questions using the retrieved document context.",
  ].filter(Boolean).join(" ");
}
