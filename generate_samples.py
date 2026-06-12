"""
generate_samples.py — run once to create sample_documents/
Generates 5 sample documents covering all parser paths.

Usage: python generate_samples.py
Requires: fpdf2 (pip install fpdf2)
"""
import os
from fpdf import FPDF

os.makedirs("sample_documents", exist_ok=True)


# ── Helper ────────────────────────────────────────────────────────────────────
def new_pdf() -> FPDF:
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    return pdf


# ── 1. Invoice with table ─────────────────────────────────────────────────────
def create_invoice():
    pdf = new_pdf()
    pdf.add_page()

    # Header
    pdf.set_font("Helvetica", "B", 18)
    pdf.cell(0, 12, "INVOICE", ln=True, align="C")
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(0, 6, "Invoice Number: INV-2024-089", ln=True)
    pdf.cell(0, 6, "Date: 2024-11-15", ln=True)
    pdf.cell(0, 6, "Due Date: 2024-12-15  (Net-30)", ln=True)
    pdf.ln(4)

    # Billed to / from
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(90, 6, "Bill To:", border=0)
    pdf.cell(90, 6, "From:", border=0, ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(90, 5, "Acme Corp Pvt Ltd", border=0)
    pdf.cell(90, 5, "BFAI Technologies Pvt Ltd", border=0, ln=True)
    pdf.cell(90, 5, "42, Business Park, Mumbai 400001", border=0)
    pdf.cell(90, 5, "Suite 7, Tech Tower, Bengaluru 560001", border=0, ln=True)
    pdf.cell(90, 5, "GSTIN: 27AABCA1234Z1Z5", border=0)
    pdf.cell(90, 5, "GSTIN: 29AABCB5678Z1Z2", border=0, ln=True)
    pdf.ln(6)

    # Table header
    pdf.set_fill_color(50, 50, 150)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 10)
    col_widths = [70, 20, 35, 35, 35]
    headers = ["Description", "Qty", "Unit Price (INR)", "GST 18%", "Total (INR)"]
    for w, h in zip(col_widths, headers):
        pdf.cell(w, 8, h, border=1, fill=True)
    pdf.ln()

    # Table rows
    pdf.set_text_color(0, 0, 0)
    pdf.set_font("Helvetica", "", 10)
    rows = [
        ("AI Document Analysis Package", "1", "1,50,000", "27,000", "1,77,000"),
        ("OCR Processing Module (annual)", "1", "75,000", "13,500", "88,500"),
        ("RAG Chatbot Integration", "1", "1,00,000", "18,000", "1,18,000"),
        ("Cloud Storage (500 GB/yr)", "1", "25,000", "4,500", "29,500"),
        ("Priority Support SLA", "1", "10,000", "1,800", "11,800"),
    ]
    fill = False
    for row in rows:
        pdf.set_fill_color(240, 240, 255)
        for w, val in zip(col_widths, row):
            pdf.cell(w, 7, val, border=1, fill=fill)
        pdf.ln()
        fill = not fill

    # Totals
    pdf.ln(4)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(155, 7, "Sub-total:", border=0, align="R")
    pdf.cell(40, 7, "INR 3,60,000", border=1, align="R", ln=True)
    pdf.cell(155, 7, "GST (18%):", border=0, align="R")
    pdf.cell(40, 7, "INR 64,800", border=1, align="R", ln=True)
    pdf.set_font("Helvetica", "B", 13)
    pdf.cell(155, 9, "TOTAL AMOUNT DUE:", border=0, align="R")
    pdf.cell(40, 9, "INR 4,24,800", border=1, align="R", ln=True)

    pdf.ln(6)
    pdf.set_font("Helvetica", "I", 9)
    pdf.multi_cell(0, 5,
        "Payment Terms: Net-30. Late payments incur 2% monthly interest. "
        "Bank: HDFC Bank, A/C: 50200012345678, IFSC: HDFC0001234. "
        "Please quote invoice number in the payment reference.")

    pdf.output("sample_documents/sample_invoice.pdf")
    print("[OK] sample_invoice.pdf")


# ── 2. Multi-page research paper ─────────────────────────────────────────────
def create_research():
    pdf = new_pdf()

    abstract = (
        "Abstract. This paper proposes a novel attention mechanism, termed Sparse "
        "Rotary Cross-Attention (SRCA), that improves translation quality on the "
        "WMT-2024 English-German benchmark by 4.2 BLEU points over the standard "
        "multi-head attention baseline. SRCA selectively attends to a learned subset "
        "of key-value pairs using a differentiable top-k gate, reducing compute by "
        "38% while maintaining representational capacity. We further introduce a "
        "curriculum warm-up schedule that stabilises training under large batch sizes. "
        "Experiments on WMT-EN-DE, WMT-EN-FR, and FLORES-200 confirm consistent "
        "improvements across language pairs."
    )

    sections = [
        ("1. Introduction",
         "Neural machine translation (NMT) has achieved human-level performance on "
         "several language pairs, yet inference cost and attention quadratic complexity "
         "remain barriers for production deployment. Prior work on sparse attention "
         "(Child et al., 2019; Beltagy et al., 2020) focused on language modelling; "
         "its application to cross-lingual generation is under-explored. This work "
         "bridges that gap by combining rotary position embeddings with a learned "
         "top-k gate that prunes the attention matrix at each layer. Our contributions "
         "are: (i) the SRCA module, (ii) a curriculum warm-up scheduler, and (iii) "
         "ablation studies across six language pairs demonstrating consistent gains."),

        ("2. Related Work",
         "Vaswani et al. (2017) introduced the Transformer architecture. Subsequent "
         "sparse attention variants include Longformer (Beltagy et al., 2020), "
         "BigBird (Zaheer et al., 2020), and Routing Transformer (Roy et al., 2021). "
         "Rotary Position Embeddings (RoPE) were proposed by Su et al. (2022) and "
         "adopted widely in LLaMA and Mistral models. Our work is the first to combine "
         "RoPE with sparse cross-attention for NMT."),

        ("3. Methodology",
         "Given source representations H_s in R^{T_s x d} and target prefix H_t in "
         "R^{T_t x d}, the SRCA module computes a gate score g_i = softmax(W_g h_i) "
         "for each source position i, retains the top-k positions with highest score, "
         "and applies rotary embeddings before scaled dot-product attention. The gate "
         "is trained end-to-end with the main cross-entropy objective. We set k=64 "
         "for sequences up to 512 tokens. The curriculum warm-up linearly increases "
         "batch size from 1k to 32k tokens over the first 10k steps, then holds "
         "constant. This stabilises gradient variance in the early training phase."),

        ("4. Experiments",
         "We train on WMT-2024 EN-DE (4.5M pairs) using 4x A100-80GB GPUs for 48 "
         "hours. Tokenisation uses a shared 32k BPE vocabulary. Baseline is a "
         "standard 6-layer Transformer (big) with full attention. SRCA achieves "
         "BLEU 34.7 vs baseline 30.5 on newstest2024, a +4.2 improvement. On EN-FR "
         "the gain is +3.1 BLEU (42.3 vs 39.2). FLORES-200 macro-average across "
         "40 language pairs shows +2.8 BLEU. Inference throughput improves by 22% "
         "owing to the reduced attention footprint."),

        ("5. Ablation Study",
         "Removing the top-k gate (dense cross-attention + RoPE) yields BLEU 31.9, "
         "confirming the gate contributes +2.8 points. Removing RoPE (sparse gate "
         "only) gives 32.4. The curriculum warm-up adds a further +0.5 over a fixed "
         "learning-rate schedule. Combined, all three components deliver the full "
         "+4.2 improvement."),

        ("6. Conclusion",
         "We presented SRCA, a sparse rotary cross-attention mechanism that improves "
         "NMT quality by 4.2 BLEU on WMT-2024 while reducing compute by 38%. Future "
         "work includes extending SRCA to multi-modal translation and scaling to "
         "100B-parameter models via mixture-of-experts integration. Code and model "
         "checkpoints will be released at github.com/bfai-research/srca."),

        ("References",
         "Vaswani, A. et al. (2017). Attention is all you need. NeurIPS.\n"
         "Beltagy, I. et al. (2020). Longformer. arXiv:2004.05150.\n"
         "Zaheer, M. et al. (2020). Big Bird. NeurIPS.\n"
         "Roy, A. et al. (2021). Efficient Content-Based Sparse Attention. TACL.\n"
         "Su, J. et al. (2022). RoFormer. arXiv:2104.09864.\n"
         "Child, R. et al. (2019). Generating Long Sequences with Sparse Transformers. arXiv:1904.10509."),
    ]

    # Title page
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 16)
    pdf.multi_cell(0, 10, "Sparse Rotary Cross-Attention for Neural Machine Translation", align="C")
    pdf.ln(4)
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(0, 7, "Authors: A. Sharma, B. Mehta, C. Patel - BFAI Research Lab", ln=True, align="C")
    pdf.cell(0, 7, "Submitted to ACL 2024 | arXiv:2411.09999", ln=True, align="C")
    pdf.ln(6)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 7, "Abstract", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.multi_cell(0, 6, abstract)

    # Content pages
    for title, body in sections:
        pdf.add_page()
        pdf.set_font("Helvetica", "B", 12)
        pdf.cell(0, 8, title, ln=True)
        pdf.set_font("Helvetica", "", 10)
        pdf.multi_cell(0, 6, body)

    pdf.output("sample_documents/sample_research.pdf")
    print("[OK] sample_research.pdf")


# ── 3. Medical record (sensitive) ────────────────────────────────────────────
def create_medical():
    pdf = new_pdf()
    pdf.add_page()

    pdf.set_font("Helvetica", "B", 14)
    pdf.cell(0, 10, "PATIENT MEDICAL REPORT", ln=True, align="C")
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 5, "Strictly Confidential - For Authorised Medical Personnel Only", ln=True, align="C")
    pdf.ln(4)

    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 7, "Patient Details", ln=True)
    pdf.set_font("Helvetica", "", 10)
    details = [
        ("Patient Name", "Rajesh Kumar (anonymised)"),
        ("Patient ID", "PT-2024-004821"),
        ("Date of Birth", "14 March 1978  (Age: 46)"),
        ("Gender", "Male"),
        ("Blood Group", "O+"),
        ("Consulting Physician", "Dr. Priya Nair, MD (Internal Medicine)"),
        ("Visit Date", "10 November 2024"),
        ("Hospital", "Sunrise Multi-specialty Hospital, Pune"),
    ]
    for label, value in details:
        pdf.cell(60, 6, f"{label}:", border=0)
        pdf.cell(0, 6, value, border=0, ln=True)

    pdf.ln(4)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 7, "Chief Complaint", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.multi_cell(0, 6,
        "Patient presents with persistent fatigue, mild shortness of breath on exertion, "
        "and occasional palpitations over the past 6 weeks. Denies chest pain, syncope, "
        "or haemoptysis. No significant travel history.")

    pdf.ln(3)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 7, "Complete Blood Count (CBC)", ln=True)
    pdf.set_font("Helvetica", "", 10)

    # CBC table
    headers = ["Parameter", "Result", "Unit", "Reference Range", "Flag"]
    col_w = [50, 30, 20, 55, 25]
    pdf.set_fill_color(200, 220, 255)
    pdf.set_font("Helvetica", "B", 9)
    for h, w in zip(headers, col_w):
        pdf.cell(w, 7, h, border=1, fill=True)
    pdf.ln()
    pdf.set_font("Helvetica", "", 9)
    cbc_rows = [
        ("Haemoglobin", "11.8", "g/dL", "13.5 - 17.5", "LOW"),
        ("WBC Count", "7,400", "cells/uL", "4,500 - 11,000", "Normal"),
        ("Platelet Count", "2,10,000", "cells/uL", "1,50,000 - 4,00,000", "Normal"),
        ("MCV", "72", "fL", "80 - 100", "LOW"),
        ("MCH", "23", "pg", "27 - 33", "LOW"),
    ]
    for row in cbc_rows:
        for val, w in zip(row, col_w):
            pdf.cell(w, 6, val, border=1)
        pdf.ln()

    pdf.ln(4)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 7, "Lipid Panel", ln=True)
    pdf.set_font("Helvetica", "", 9)
    lipid_headers = ["Parameter", "Result", "Unit", "Reference Range", "Flag"]
    for h, w in zip(lipid_headers, col_w):
        pdf.cell(w, 7, h, border=1, fill=True)
    pdf.ln()
    lipid_rows = [
        ("Total Cholesterol", "218", "mg/dL", "< 200", "HIGH"),
        ("LDL Cholesterol", "142", "mg/dL", "< 100", "HIGH"),
        ("HDL Cholesterol", "38", "mg/dL", "> 40", "LOW"),
        ("Triglycerides", "195", "mg/dL", "< 150", "HIGH"),
        ("VLDL", "39", "mg/dL", "< 30", "HIGH"),
    ]
    pdf.set_fill_color(200, 220, 255)
    for row in lipid_rows:
        for val, w in zip(row, col_w):
            pdf.cell(w, 6, val, border=1)
        pdf.ln()

    pdf.ln(4)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 7, "Assessment & Plan", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.multi_cell(0, 6,
        "1. Iron-deficiency anaemia: initiate oral iron supplementation (ferrous sulfate 200 mg TDS). "
        "Dietary counselling for iron-rich foods. Repeat CBC in 8 weeks.\n"
        "2. Dyslipidaemia: lifestyle modification advised (low-fat diet, 30 min aerobic exercise daily). "
        "If LDL remains >130 mg/dL at 3-month review, commence statin therapy.\n"
        "3. Palpitations: ECG ordered - normal sinus rhythm confirmed. Likely secondary to anaemia.\n"
        "Follow-up appointment: 10 February 2025.")

    pdf.output("sample_documents/sample_medical.pdf")
    print("[OK] sample_medical.pdf")


# ── 4. Mixed financial report ─────────────────────────────────────────────────
def create_report():
    pdf = new_pdf()

    pdf.add_page()
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 12, "Q3 FY2024 Financial Performance Report", ln=True, align="C")
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 6, "BFAI Analytics Pvt Ltd  |  For Internal Distribution Only", ln=True, align="C")
    pdf.cell(0, 6, "Reporting Period: July 1 - September 30, 2024", ln=True, align="C")
    pdf.ln(6)

    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "Executive Summary", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.multi_cell(0, 6,
        "Q3 FY2024 delivered strong top-line growth, with revenue reaching INR 18.4 crore, "
        "representing an 18% year-on-year increase. Operating profit grew by 24% to INR 4.1 crore, "
        "driven by improved gross margins in the SaaS segment and cost optimisation in cloud "
        "infrastructure. EBITDA margin expanded to 22.3% from 19.1% in Q3 FY2023. "
        "Net cash position stands at INR 6.8 crore after repayment of term loan tranche.")

    pdf.ln(4)
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "Income Statement Summary (INR Crore)", ln=True)

    # P&L table
    col_w = [80, 35, 35, 40]
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_fill_color(50, 100, 200)
    pdf.set_text_color(255, 255, 255)
    for h, w in zip(["Metric", "Q3 FY2024", "Q3 FY2023", "YoY Change"], col_w):
        pdf.cell(w, 8, h, border=1, fill=True)
    pdf.ln()
    pdf.set_text_color(0, 0, 0)
    pdf.set_font("Helvetica", "", 10)
    rows = [
        ("Revenue from Operations", "18.4", "15.6", "+18.0%"),
        ("Cost of Revenue", "8.1", "7.2", "+12.5%"),
        ("Gross Profit", "10.3", "8.4", "+22.6%"),
        ("Operating Expenses", "6.2", "5.1", "+21.6%"),
        ("EBITDA", "4.1", "3.3", "+24.2%"),
        ("Depreciation & Amortisation", "0.6", "0.5", "+20.0%"),
        ("EBIT", "3.5", "2.8", "+25.0%"),
        ("Interest Expense", "0.2", "0.4", "-50.0%"),
        ("Profit Before Tax", "3.3", "2.4", "+37.5%"),
        ("Tax (25%)", "0.8", "0.6", "+33.3%"),
        ("Net Profit", "2.5", "1.8", "+38.9%"),
    ]
    fill = False
    for row in rows:
        pdf.set_fill_color(240, 245, 255)
        for val, w in zip(row, col_w):
            pdf.cell(w, 6, val, border=1, fill=fill)
        pdf.ln()
        fill = not fill

    pdf.add_page()
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "Segment Revenue Breakdown", ln=True)
    pdf.set_font("Helvetica", "", 10)
    seg_rows = [
        ("SaaS Subscriptions", "9.8", "7.6", "+28.9%"),
        ("Professional Services", "5.2", "4.9", "+6.1%"),
        ("Data & API Products", "2.6", "2.0", "+30.0%"),
        ("Hardware & Licensing", "0.8", "1.1", "-27.3%"),
    ]
    pdf.set_fill_color(50, 100, 200)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 10)
    for h, w in zip(["Segment", "Q3 FY2024", "Q3 FY2023", "YoY Change"], col_w):
        pdf.cell(w, 8, h, border=1, fill=True)
    pdf.ln()
    pdf.set_text_color(0, 0, 0)
    pdf.set_font("Helvetica", "", 10)
    fill = False
    for row in seg_rows:
        pdf.set_fill_color(240, 245, 255)
        for val, w in zip(row, col_w):
            pdf.cell(w, 6, val, border=1, fill=fill)
        pdf.ln()
        fill = not fill

    pdf.ln(6)
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "Key Operational Metrics", ln=True)
    pdf.set_font("Helvetica", "", 10)
    metrics = [
        ("Total Active Customers", "1,248", "1,012", "+23.3%"),
        ("Monthly Recurring Revenue (MRR)", "INR 2.9 Cr", "INR 2.3 Cr", "+26.1%"),
        ("Customer Churn Rate", "1.8%", "2.4%", "-0.6 pp"),
        ("Documents Processed (million)", "14.2", "8.7", "+63.2%"),
        ("Average Revenue Per User (ARPU)", "INR 23,300", "INR 18,900", "+23.3%"),
    ]
    col_w2 = [75, 40, 40, 40]
    pdf.set_fill_color(50, 100, 200)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 10)
    for h, w in zip(["Metric", "Q3 FY2024", "Q3 FY2023", "Change"], col_w2):
        pdf.cell(w, 8, h, border=1, fill=True)
    pdf.ln()
    pdf.set_text_color(0, 0, 0)
    pdf.set_font("Helvetica", "", 10)
    fill = False
    for row in metrics:
        pdf.set_fill_color(240, 245, 255)
        for val, w in zip(row, col_w2):
            pdf.cell(w, 6, val, border=1, fill=fill)
        pdf.ln()
        fill = not fill

    pdf.ln(6)
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "Outlook & Guidance", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.multi_cell(0, 6,
        "Management raises full-year FY2024 revenue guidance to INR 72-75 crore (previously "
        "INR 68-72 crore), reflecting strong pipeline conversion and improved retention rates. "
        "Q4 FY2024 revenue is expected to be in the range of INR 19-21 crore. The Board recommends "
        "an interim dividend of INR 2.50 per share, payable December 20, 2024.")

    pdf.output("sample_documents/sample_report.pdf")
    print("[OK] sample_report.pdf")


# ── 5. Plain text notes ───────────────────────────────────────────────────────
def create_notes():
    content = """\
BFAI Project — Internal Meeting Notes
Date: 2024-11-12
Attendees: Hardik H. (Product), Priya N. (Engineering Lead), Arjun S. (ML), Divya R. (Design)
Location: Conference Room 3B / Google Meet hybrid

AGENDA ITEMS & DECISIONS
=========================

1. MVP Feature Scope
   - Agreed to ship 5 core features for v1.0:
     (a) PDF upload with OCR fallback
     (b) LLM classification (document type + sensitivity)
     (c) Agentic RAG with citations
     (d) Page-level thumbnail viewer in chat
     (e) Voice input (Whisper STT) + voice output (ElevenLabs TTS)
   - Deferred to v1.1: batch upload API, webhook notifications, admin dashboard

2. Model Choices
   - Classifier: Groq llama-3.3-70b-versatile — fast, free tier, structured JSON output
   - Embedder: all-MiniLM-L6-v2 (sentence-transformers) — lightweight, runs CPU
   - Vector store: ChromaDB local PersistentClient (no infra to manage for MVP)
   - RAG agent: LangChain create_tool_calling_agent over Groq LLM
   - STT: OpenAI Whisper-1 (server-side fallback when browser mic blocked)
   - TTS: ElevenLabs multilingual v2

3. Security Concerns Raised
   - Validate file extension AND MIME type (python-magic on server)
   - Max upload 20 MB per file, 10 files per request
   - Sanitise filenames to prevent path traversal
   - Rate limit: 10 uploads/min, 30 chat requests/min per IP
   - All docs stored in private /storage volume, not served publicly except via /api
   - No PII logging — strip API keys from logs, mask document content

4. Infrastructure Plan
   - Backend: FastAPI in Docker → Google Cloud Run (auto-scales to 0)
   - Frontend: React + Vite → Firebase Hosting
   - Storage: Cloud Run volume mount for MVP; migrate to GCS for production
   - CI/CD: Cloud Build trigger on main branch push

5. Sample Documents
   - Hardik to generate 5 synthetic PDFs using fpdf2 (no copyright issues)
   - Must cover: invoice with table, multi-page research, medical (sensitive), financial report, plain text
   - Auto-ingested on first boot if ChromaDB empty

ACTION ITEMS
============
- [ ] Arjun: finalize ChromaDB schema + chunk overlap tuning (by Nov 14)
- [ ] Priya: write Dockerfile + Cloud Run deploy script (by Nov 15)
- [ ] Divya: design chat citation cards in Figma (by Nov 14)
- [ ] Hardik: generate sample docs + write generate_samples.py (by Nov 13)
- [ ] All: review PR before EOD Nov 16

NEXT MEETING
============
Date: 2024-11-19 at 10:00 IST
Focus: Integration testing + demo walkthrough

Notes taken by: Hardik H.
"""
    with open("sample_documents/sample_notes.txt", "w", encoding="utf-8") as f:
        f.write(content)
    print("[OK] sample_notes.txt")


# ── Run all generators ────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("Generating sample documents...")
    create_invoice()
    create_research()
    create_medical()
    create_report()
    create_notes()
    print("Done. Files are in sample_documents/")
