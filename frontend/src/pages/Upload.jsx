import React, { useState, useRef } from "react";
import { api } from "../api/client";

function StatusBadge({ status }) {
  const MAP = {
    uploading:   { label: "Uploading…",   color: "bg-blue-100 text-blue-700",    icon: "cloud_upload" },
    parsing:     { label: "Parsing…",     color: "bg-yellow-100 text-yellow-700", icon: "document_scanner" },
    classifying: { label: "Classifying…", color: "bg-orange-100 text-orange-700", icon: "label" },
    embedding:   { label: "Indexing…",    color: "bg-purple-100 text-purple-700", icon: "hub" },
    indexed:     { label: "✓ Indexed",    color: "bg-green-100 text-green-700",   icon: "check_circle" },
    error:       { label: "Error",        color: "bg-red-100 text-red-700",       icon: "error" },
  };
  const m = MAP[status] || { label: "Queued", color: "bg-gray-100 text-gray-500", icon: "schedule" };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${m.color}`}>
      <span className="material-symbols-outlined text-[13px]">{m.icon}</span>
      {m.label}
    </span>
  );
}

function ClassificationBadge({ classification }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(!open)}
        className="text-[11px] text-primary underline underline-offset-2">
        {open ? "Hide" : "View"} classification
      </button>
      {open && (
        <pre className="mt-2 p-2 bg-surface-container rounded text-[11px] text-on-surface max-w-xs overflow-auto">
          {JSON.stringify(classification, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function Upload() {
  const [files, setFiles] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);
  const pollIntervals = useRef({});

  const addFiles = (newFiles) => {
    const arr = Array.from(newFiles);
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name));
      const toAdd = arr.filter(f => !existing.has(f.name));
      return [...prev, ...toAdd];
    });
    handleUpload(arr);
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e) => {
    if (e.target.files.length) addFiles(e.target.files);
  };

  const handleUpload = async (selectedFiles) => {
    if (!selectedFiles.length) return;
    const formData = new FormData();
    selectedFiles.forEach(f => formData.append("files", f));

    // Set initial status
    selectedFiles.forEach(f => {
      setStatuses(prev => ({ ...prev, [f.name]: { status: "uploading", progress: 10 } }));
    });

    try {
      const result = await api.uploadDocuments(formData);
      (result || []).forEach(({ doc_id, filename, status }) => {
        if (status === "rejected") {
          setStatuses(prev => ({ ...prev, [filename]: { status: "error", progress: 0, error: "Rejected by server" } }));
          return;
        }
        setStatuses(prev => ({ ...prev, [filename]: { ...prev[filename], docId: doc_id, status: "parsing", progress: 30 } }));
        pollStatus(doc_id, filename);
      });
    } catch {
      selectedFiles.forEach(f => {
        setStatuses(prev => ({ ...prev, [f.name]: { status: "error", progress: 0 } }));
      });
    }
  };

  const pollStatus = (docId, filename) => {
    if (pollIntervals.current[docId]) clearInterval(pollIntervals.current[docId]);
    pollIntervals.current[docId] = setInterval(async () => {
      try {
        const s = await api.getProcessingStatus(docId);
        setStatuses(prev => ({ ...prev, [filename]: { ...prev[filename], status: s.status, progress: s.progress } }));
        if (s.status === "indexed") {
          clearInterval(pollIntervals.current[docId]);
          delete pollIntervals.current[docId];
          try {
            const doc = await api.getDocument(docId);
            setStatuses(prev => ({ ...prev, [filename]: { ...prev[filename], classification: doc.classification } }));
          } catch { /* ignore */ }
        }
      } catch { /* ignore */ }
    }, 2000);
  };

  return (
    <div className="p-gutter max-w-container-max mx-auto w-full">
      {/* Header */}
      <div className="mb-6 glass-card p-6 rounded-xl card-inner-stroke">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-3xl">upload_file</span>
          <div>
            <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">Upload Documents</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">Upload PDFs, images, or text files. They'll be parsed, classified, and indexed automatically.</p>
          </div>
        </div>
      </div>

      {/* Pre-loaded samples notice */}
      <div className="mb-6 p-4 rounded-xl bg-purple-50 border border-purple-200">
        <p className="text-[13px] text-gray-800">
          <span className="font-semibold text-purple-900">5 sample documents are pre-loaded.</span> You can go to{" "}
          <a href="#/chat" className="text-purple-700 font-semibold underline hover:text-purple-900">Ask DocVault AI</a> and start chatting right away.
        </p>
      </div>

      {/* Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
          dragging
            ? "border-primary bg-primary-fixed/30"
            : "border-outline-variant hover:border-primary/50 hover:bg-surface-container-low"
        }`}
      >
        <span className="material-symbols-outlined text-5xl text-primary mb-3 block" style={{ fontVariationSettings: "'FILL' 0" }}>upload_file</span>
        <p className="font-semibold text-on-surface text-[16px]">Drop documents here</p>
        <p className="text-on-surface-variant text-[13px] mt-1">PDF, PNG, JPG, TXT — up to 20MB each, 10 files at once</p>
        <button
          type="button"
          className="mt-4 px-5 py-2.5 bg-primary text-on-primary rounded-lg text-[13px] font-semibold hover:bg-primary/90"
          onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
        >
          Browse Files
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.txt"
          className="hidden"
          onChange={handleFileInput}
        />
      </div>

      {/* File status table */}
      {files.length > 0 && (
        <div className="glass-card rounded-xl card-inner-stroke overflow-hidden mt-6">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-outline-variant/30 bg-surface-container-low">
                <th className="px-4 py-3 text-left font-semibold text-on-surface-variant">Filename</th>
                <th className="px-4 py-3 text-left font-semibold text-on-surface-variant">Type</th>
                <th className="px-4 py-3 text-left font-semibold text-on-surface-variant">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-on-surface-variant">Progress</th>
                <th className="px-4 py-3 text-left font-semibold text-on-surface-variant">Classification</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => {
                const s = statuses[file.name] || {};
                return (
                  <tr key={file.name} className="border-b border-outline-variant/20 last:border-b-0">
                    <td className="px-4 py-3 font-data-mono text-on-surface max-w-[180px] truncate" title={file.name}>{file.name}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{file.type || "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-3">
                      <div className="w-24 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${s.progress || 0}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-on-surface-variant mt-0.5 block">{s.progress || 0}%</span>
                    </td>
                    <td className="px-4 py-3">
                      {s.classification && <ClassificationBadge classification={s.classification} />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Supported formats info */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: "picture_as_pdf", title: "PDF Files", desc: "Scanned or text-based. Table extraction + OCR fallback." },
          { icon: "image", title: "Images", desc: "PNG, JPG — full-page OCR via Tesseract." },
          { icon: "text_snippet", title: "Text Files", desc: "Plain .txt — direct ingestion, no OCR needed." },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="glass-card rounded-xl p-5 card-inner-stroke flex items-start gap-3">
            <span className="material-symbols-outlined text-primary text-2xl shrink-0">{icon}</span>
            <div>
              <p className="font-semibold text-on-surface text-[13px]">{title}</p>
              <p className="text-[12px] text-on-surface-variant mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
