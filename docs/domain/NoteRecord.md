# Domain Specification: Note Record
**Subdomain:** Common  
**Status:** Approved Product Specification  

---

## 1. Purpose
The `NoteRecord` represents a threaded communication entry. It captures administrative remarks, tender analysis comments, site issues, and general collaborative feedback exchanged between PMO coordinators, estimators, and site execution supervisors.

---

## 2. Structural Composition (UML Field Mapping)

| Field Name | Data Type | Required? | Purpose / Business Scope |
| :--- | :--- | :--- | :--- |
| `id` | `string` (UUID v4) | **Yes** | Persistent record ID. |
| `author` | `string` | **Yes** | User email or full name of the creator (e.g. `m.gamlahmed@gmail.com`). |
| `date` | `string` (ISO Timestamp) | **Yes** | Full timestamp when the note was submitted. |
| `text` | `string` | **Yes** | Rich or plain-text statement of the communication entry. |

---

## 3. General Architecture & Shared Scope
*   To coordinate collaboration across cross-functional team structures, `NoteRecord` resides inside `src/domain/common/`.
*   This generic model can be appended to any transaction document:
    *   Estimators leave questions for the Coordinator inside a Tender file.
    *   Project Managers explain delays on site transactions inside an IPC claim log.

---

## 4. Business Validation Rules
1.  **Immutability**: Once saved to the PostgreSQL backend, the `author` and `date` properties of a `NoteRecord` are immutable to support professional compliance tracking.
2.  **Maximum Length Limits**: Note content supports up to **4,000 characters** in a single entry block to restrict database space clutter.
3.  **Sanitized Input**: Direct validation cleans script elements (`<script>`) to prevent cross-site scripting (XSS) risks inside the ROWAD corporate portal.

---

## 5. Domain Relationships
*   Mapped via parent context linkages. Linked records are cleaned from databases upon structural deletion of the parent aggregate document.

---

## 6. Future Extension Roadmap
*   **User Mentions (@mention)**: Integrate notifications triggering real-time emails or corporate chat channels (Google Chat, Slack) when a team member is addressed in comments.
*   **AI Smart Suggestions**: Analyze engineering notes with Gemini models, translating complex technical complaints into standardized commercial claims.
