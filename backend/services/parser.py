"""
Document parser: handles PDFs, scanned images, plain text.
For every page, produces:
  - extracted text (via pdfplumber or pytesseract OCR)
  - tables as structured list-of-lists (via pdfplumber)
  - rendered page image (via pdf2image) saved to storage/pages/{doc_id}/page_N.png
"""
import os
import pdfplumber
from pdf2image import convert_from_path
import pytesseract
from PIL import Image

STORAGE_DIR = os.getenv("STORAGE_DIR", "./storage")


def parse_document(file_path: str, doc_id: str) -> list:
    """
    Returns list of page dicts:
    [{ page_number, text, tables, image_path }]
    """
    pages_dir = os.path.join(STORAGE_DIR, "pages", doc_id)
    os.makedirs(pages_dir, exist_ok=True)

    ext = os.path.splitext(file_path)[1].lower()

    if ext == ".txt":
        return _parse_text_file(file_path, pages_dir)
    elif ext in (".png", ".jpg", ".jpeg"):
        return _parse_image_file(file_path, pages_dir, doc_id)
    elif ext == ".pdf":
        return _parse_pdf(file_path, pages_dir, doc_id)
    else:
        raise ValueError(f"Unsupported file type: {ext}")


def _parse_pdf(file_path: str, pages_dir: str, doc_id: str) -> list:
    results = []
    # Render all pages as images first (used for OCR fallback and thumbnails)
    page_images = convert_from_path(file_path, dpi=150)

    with pdfplumber.open(file_path) as pdf:
        for i, (plumber_page, pil_image) in enumerate(zip(pdf.pages, page_images)):
            page_number = i + 1
            image_path = os.path.join(pages_dir, f"page_{page_number}.png")
            pil_image.save(image_path, "PNG")

            # Try pdfplumber text extraction first
            text = plumber_page.extract_text() or ""

            # If less than 50 chars, fall back to OCR
            if len(text.strip()) < 50:
                text = pytesseract.image_to_string(pil_image, config="--psm 6")

            # Extract tables as structured data
            raw_tables = plumber_page.extract_tables()
            tables = [t for t in raw_tables if t] if raw_tables else []

            results.append({
                "page_number": page_number,
                "text": text.strip(),
                "tables": tables,
                "image_path": image_path,
            })
    return results


def _parse_image_file(file_path: str, pages_dir: str, doc_id: str) -> list:
    img = Image.open(file_path)
    image_path = os.path.join(pages_dir, "page_1.png")
    img.save(image_path, "PNG")
    text = pytesseract.image_to_string(img, config="--psm 6")
    return [{"page_number": 1, "text": text.strip(), "tables": [], "image_path": image_path}]


def _parse_text_file(file_path: str, pages_dir: str) -> list:
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
    # Create a simple white image as placeholder for text files
    img = Image.new("RGB", (800, 1000), color="white")
    image_path = os.path.join(pages_dir, "page_1.png")
    img.save(image_path)
    return [{"page_number": 1, "text": content, "tables": [], "image_path": image_path}]
