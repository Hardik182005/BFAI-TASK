import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-surface-container-high rounded ${className}`} />;
}

function SensitivityBadge({ level }) {
  const map = {
    public: "bg-green-100 text-green-700",
    internal: "bg-blue-100 text-blue-700",
    confidential: "bg-orange-100 text-orange-700",
    strictly_confidential: "bg-red-100 text-red-700",
  };
  const cls = map[(level || "").toLowerCase().replace(/ /g, "_")] || "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${cls}`}>
      {level || "unknown"}
    </span>
  );
}

function TypeBadge({ type }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-container text-on-surface-variant border border-outline-variant/30">
      {(type || "other").replace(/_/g, " ")}
    </span>
  );
}

function DocCard({ doc, onDelete }) {
  const navigate = useNavigate();
  const cl = doc.classification || {};
  const indexedDate = doc.indexed_at
    ? new Date(doc.indexed_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  return (
    <div className="glass-card rounded-xl card-inner-stroke p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      {/* Icon + filename */}
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-primary text-2xl shrink-0" style={{ fontVariationSettings: "'FILL' 0" }}>description</span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-on-surface text-[13px] leading-tight truncate" title={doc.filename}>{doc.filename}</p>
          <p className="text-[10px] text-on-surface-variant mt-0.5">{doc.page_count ?? "?"} pages · {indexedDate}</p>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        {cl.document_type && <TypeBadge type={cl.document_type} />}
        {cl.sensitivity_level && <SensitivityBadge level={cl.sensitivity_level} />}
      </div>

      {/* Summary */}
      {cl.summary && (
        <p className="text-[12px] text-on-surface-variant line-clamp-2">{cl.summary}</p>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-1">
        <button
          onClick={() => navigate("/chat")}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-[12px] font-semibold hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-[14px]">chat</span>
          Ask about this
        </button>
        <button
          onClick={() => onDelete(doc.doc_id)}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-error/10 text-error hover:bg-error/20 transition-colors"
          title="Delete document"
        >
          <span className="material-symbols-outlined text-[16px]">delete</span>
        </button>
      </div>
    </div>
  );
}

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    let active = true;
    api.getDocuments()
      .then(d => { if (active && Array.isArray(d)) setDocs(d); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const handleDelete = async (docId) => {
    if (!window.confirm("Delete this document? This cannot be undone.")) return;
    try {
      await api.deleteDocument(docId);
      setDocs(prev => prev.filter(d => d.doc_id !== docId));
    } catch {
      alert("Failed to delete document. Please try again.");
    }
  };

  // Group by document_type
  const byType = docs.reduce((acc, doc) => {
    const type = doc.classification?.document_type || "other";
    if (!acc[type]) acc[type] = [];
    acc[type].push(doc);
    return acc;
  }, {});

  return (
    <div className="p-gutter max-w-container-max mx-auto w-full">
      {/* Header */}
      <div className="mb-6 glass-card p-6 rounded-xl card-inner-stroke flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-3xl">folder_open</span>
          <div>
            <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">My Documents</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {loading ? "Loading…" : `${docs.length} document${docs.length === 1 ? "" : "s"} indexed`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full bg-purple-50 text-purple-700">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            {docs.length} indexed
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-outline-variant/30">
        {[
          { id: "all", label: "All Documents" },
          { id: "bytype", label: "By Type" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-[13px] font-semibold transition-all border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-52" />)}
        </div>
      )}

      {/* Tab: All Documents */}
      {!loading && activeTab === "all" && (
        docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl opacity-30">folder_open</span>
            <p className="text-[15px] font-medium">No documents yet</p>
            <p className="text-[13px]">Upload some files to get started.</p>
            <a href="#/upload" className="mt-2 px-5 py-2.5 bg-primary text-on-primary rounded-lg text-[13px] font-semibold hover:opacity-90">
              Upload Documents
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
            {docs.map(doc => (
              <DocCard key={doc.doc_id} doc={doc} onDelete={handleDelete} />
            ))}
          </div>
        )
      )}

      {/* Tab: By Type */}
      {!loading && activeTab === "bytype" && (
        Object.keys(byType).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl opacity-30">category</span>
            <p className="text-[15px] font-medium">No documents yet</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(byType).map(([type, typeDocs]) => (
              <section key={type}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="material-symbols-outlined text-secondary text-lg">label</span>
                  <h3 className="font-title-md text-on-surface font-semibold capitalize">{type.replace(/_/g, " ")}</h3>
                  <span className="text-[11px] text-on-surface-variant">({typeDocs.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
                  {typeDocs.map(doc => (
                    <DocCard key={doc.doc_id} doc={doc} onDelete={handleDelete} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )
      )}
    </div>
  );
}
