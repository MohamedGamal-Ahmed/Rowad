# UI Blueprint: Document Control Center Screen
**Status:** Approved Specification  

---

## 1. Purpose
The **Document Control Center** provides a clean overview of all digital files, drawing files, letters, and bidding specs registered across every project.

---

## 2. Data Sources
*   Durable document metadata table.

---

## 3. Services and Mappers Used
*   `TenderService`: Direct attachment management actions.
*   `ImportService`: Parsing and mapping of attachments metadata.

---

## 4. Domain Objects Involved
*   `DocumentRecord` (Residing inside `src/domain/common/`).

---

## 5. Applied Business Rules & Calculations
*   **Whitelisted Formats validation**: Enforces that only whitelisted document formats (e.g. PDF, XLSX, DWG) are uploaded.
*   **Size Formatting**: Converts byte integers into readable strings on-the-fly inside helper methods.

---

## 6. User Actions
*   **Search**: Search and filter documents by title or project type.
*   **Download**: Re-route secure token streams to download target objects fromCDN drives.

---

## 7. Future Extensions
*   **Automatic Drawing Revision Comparer**: Run visual comparisons between versions of DWG or PDF files to highlight structural variations.
