# UI Blueprint: Operations Center (Enterprise Control Room)

## 1. Executive Strategy & UX Vision

### 1.1 The Operational Command Center of ROWAD
Traditional digital calendars (Google Calendar, Microsoft Outlook, FullCalendar) are designed for single-resource personal schedules and standard chronological listings. For large-scale infrastructure construction firms managing dozens of concurrent mega-projects, complex site logistics, and hundreds of compliance dates across the portfolio, these tools fail under density. Standard calendar grids with overlapping text lines become unreadable and lose business intelligence.

The **ROWAD Operations Center** is an high-density Enterprise Control Room. It is not an owner of data, but a unified viewer. It aggregates, filters, and analyzes event nodes generated across the platform from:
* **Pre-Award (Tender Proposals & Submissions)**
* **Project Controls (IPCs, Claims, Variation Orders, NOCs)**
* **Document Control (Drawings, Engineering Submittals, Transmittals)**
* **Manual Logs (Internal alignments, site visits, client negotiations)**

Rather than overloading estimators and PMO directors with noisy visual blocks, the Operations Center focuses on **Operational Load density**, **Capacity balancing**, **Automated schedule propagation via Event Dependencies**, and **Immediate direct actions** directly on the active views.

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  ROWAD ENTERPRISE  │  Operations Center                                                                    Language: EN │
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  [TABS]  [● My Work]  [○ Calendar]  [○ Agenda]  [○ Timeline]  [○ Kanban]  [○ Workload]  [○ Conflicts]  [○ Analytics]  ... │
├───────────────────────────────────────┬────────────────────────────────────────────────────────┬───────────────────────┤
│ FILTERS & CONTROL PANEL               │ CENTER ACTIVE SCREEN (e.g. My Work Dashboard)          │ ACTIVE DIAGNOSTICS    │
│ 🔎 Search Events...                   │ ◄ [ Prev ]  Today  [ Next ]   Search...                │                       │
│ ───────────────────────────────────── │ 📅 MY WORK FOR TODAY                                   │ ⚙️ Resource Workload   │
│ 📁 SAVED VIEWS                        │ ☑ [PC-NEOM] Complete Bidding Bond Review (09:00)       │ Ahmed   [░░░░░░░░    ] 08/20   │
│ [★ Pre-Award Deadlines]               │ ☐ [PC-JED] Risk Assessment Submission (14:00)          │ Sara    [▒▒▒▒▒▒▒▒▒▒▒▒] 15/20   │
│ [★ Active Claim Disputes]             │ ───────────────────────────────────────────────────────│ Mohamed [████████████] 19/20 ⚠ │
│                                       │ ⌛ OVERDUE TASKS                                        │                       │
│ 🏗️ PROJECTS                           │ ⚠ [PC-RCL] Commercial Tender Qualification [2 Days Late]│ ⌛ Critical Deadlines   │
│ ☑ All Projects                        │ ───────────────────────────────────────────────────────│ - NEOM Tech (24h)     │
│ ☒ NEOM Ring Road (NEOM)               │ 💬 RECENT NOTES & UPDATE LOGS                           │ - JED Claim #3 (48h)  │
│ ☒ Jeddah Port (JED)                   │ - Sara: "Aramco requested additional soil test records"│                       │
│                                       │                                                        │ ⚠ Active Conflicts    │
│ 🏷️ EVENT MODULE                       │ ┌────────────────────────────────────────────────────┐ │ - Ahmed Dual-Booking  │
│ ☑ Pre-Award Proposals                 │ │ [DDEPENDENCY SEQUENCE PATH]                        │ │ - Riyadh Chronology   │
│ ☑ Project Controls Ledger             │ │ Tech Submission ──► Risk Check ──► Comm. Submission │ │                       │
│                                       │ └────────────────────────────────────────────────────┘ │                       │
└───────────────────────────────────────┴────────────────────────────────────────────────────────┴───────────────────────┘
│ 💡 AI COMMAND BAR (FUTURE): [ "Show overdue claims for NEOM project"                                              ]  [Go]│
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Tabs and Navigation Hierarchy

The Operations Center features a 9-tab navigation system, tailored to provide diverse angles on construction operations:

1. **My Work Tab**: *Personalized Daily Hub*. Automatically filtered for the logged-in user, grouping priorities cleanly by timeframe and progress tracking lists.
2. **Calendar Tab**: *Chronological Workload Matrix*. Highlights month/week chronological grids styled with **Operational Load** intensity indicators to track days of portfolio saturation.
3. **Agenda Tab**: *Chronicle List View*. High-density, scrollable timeline logging events sequentially with nested meta tags, direct-action buttons, and source hyperlinks.
4. **Timeline Tab**: *Portfolio Gantt Scheduler*. Visualizes project durations, milestone pins, and overlapping phase lifecycles on a horizontal axis over 14-day and 30-day spans.
5. **Kanban Tab**: *Agile Operations Board*. Organizes systemwide events into workflow state columns (*To Do*, *In Progress*, *Waiting For Others*, *Under Review*, *Resolved*) to monitor bottleneck statuses.
6. **Workload Tab**: *Capacity Balancing Meter*. Horizontal, color-shaded bar charts showing active coordinator/estimator weight indexes to prevent team burnout.
7. **Conflicts Tab**: *Diagnostic Quality Guard*. Identifies real-time scheduling traps, engineer dual-bookings, missing prerequisite documents, and chronologically invalid milestone dates.
8. **Analytics Tab**: *Operations PMO Dash*. Translates calendar metrics into visual KPIs: average submission lead times, historical claims response metrics, and project slip rates.
9. **AI Assistant Tab (Future Vision)**: *Conversational Scheduling Oracle*. Integrates NLP parsing to adjust internal project milestone sequences and optimize estimator timelines based on historical performance models.

---

## 3. High-Density Event Data Model (TypeScript Schema)

To avoid duplicating data structures, the Calendar treats events as **synthesized, read-only consumer projections**. This unified model incorporates event deep links and dependency maps.

```typescript
export enum EventModuleType {
  PRE_AWARD = 'pre-award',
  PROJECT_CONTROLS = 'project-controls',
  DOCUMENT_CONTROL = 'document-control',
  MANUAL = 'manual'
}

export enum EventCategory {
  TECH_SUBMISSION = 'tech_submission',
  COMM_SUBMISSION = 'comm_submission',
  RISK_ASSESSMENT = 'risk_assessment',
  QUALIFICATION_DUE = 'qualification_due',
  ALIGNMENT_MEETING = 'alignment_meeting',
  CLIENT_MEETING = 'client_meeting',
  NEGOTIATION = 'negotiation',
  KICK_OFF = 'kick_off',
  IPC_DEADLINE = 'ipc_deadline',
  CLAIM_DEADLINE = 'claim_deadline',
  VO_DEADLINE = 'vo_deadline',
  NOC_DEADLINE = 'noc_deadline',
  SUBMITTAL_REVIEW = 'submittal_review',
  INTERNAL_MEETING = 'internal_meeting',
  REMINDER = 'reminder'
}

export enum EventPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum EventStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  WAITING_FOR_ME = 'waiting_for_me',
  WAITING_FOR_OTHERS = 'waiting_for_others',
  COMPLETED = 'completed',
  OVERDUE = 'overdue'
}

export interface EventNote {
  id: string;
  authorName: string;
  timestamp: string;
  text: string;
}

export interface EventAttachment {
  id: string;
  fileName: string;
  fileSize: string;
  uploadedBy: string;
  uploadDate: string;
  downloadUrl: string;
}

export interface CalendarEvent {
  id: string;                         // Unique ID mapped from source
  title: {
    en: string;
    ar: string;
  };
  description?: {
    en: string;
    ar: string;
  };
  projectCode: string;                // Mapped Project Code (e.g., PC-2026-NEOM)
  projectName: {
    en: string;
    ar: string;
  };
  module: EventModuleType;
  eventType: EventCategory;
  ownerId: string;                    // Primary responsible person
  ownerName: string;
  assignedToIds: string[];            // List of engineers/estimators on task
  assignedToNames: string[];
  priority: EventPriority;
  status: EventStatus;
  startDate: string;                  // ISO Date String (YYYY-MM-DD)
  endDate: string;                    // ISO Date String (YYYY-MM-DD)
  startTime?: string;                 // ISO Time String (HH:MM:SS) Optional
  endTime?: string;                   // ISO Time String (HH:MM:SS) Optional
  
  // Dependency DAG Mapping
  predecessorIds: string[];           // Event IDs that must complete first
  successorIds: string[];             // Event IDs triggered by this event
  lagDays?: number;                   // Required buffer spacing between tasks
  
  // Deep Linking Metadata
  sourceId: string;                   // Internal ID in parent database
  deepLinkPath: string;               // URL path pointing to source (e.g., /pre-award/tenders/42)
  deepLinkLabel: {
    en: string;
    ar: string;
  };
  
  // Interactive Elements
  notes: EventNote[];                 // Inline logged remarks
  attachments: EventAttachment[];     // Attached engineering sheets or proofs
  hasConflict: boolean;               // Calculated dynamically on read
  
  colorTheme: {
    bg: string;                       // Fluent soft background (e.g., bg-slate-50)
    border: string;                   // Border highlight (e.g., border-slate-200)
    text: string;                     // Core text (e.g., text-slate-800)
    iconColor: string;
  };
  lucideIconName: string;             // Icon lookup tag
}
```

---

## 4. Tab Component Specifications

### 4.1 My Work Tab (Personal Operations Hub)
* **Goal**: Provide a focused personal list for the logged-in user to see their immediate actions.
* **Layout Design**:
  * Centered linear dashboard divided into 7 distinct sections:
    1. **Today**: Immediate critical items due or scheduled for today.
    2. **Tomorrow**: Preparation items for the next day.
    3. **This Week**: Medium-term schedule objectives.
    4. **Overdue**: Late compliance documents, expired NOC approvals, or missed tender milestones.
    5. **Waiting For Me**: Workflow approvals (e.g., PMO Check signature) blocked on the logged-in user.
    6. **Waiting For Others**: Items where the user is an owner, but blocked on external input.
    7. **Completed Today**: Feedback log showing finished items from the current shift.
  * **Micro-interactions**: Direct inline tick-boxes to complete, change dates, reassign, or add notes immediately without screen transitions.

### 4.2 Calendar Tab & "Operational Load" Grid
* **Goal**: Enable visual scanning showing days of high operational risk and days of open capacity.
* **Operational Load Indicator**:
  * Traditional month grids crowd multiple colorful boxes in a small square, creating visual clutter.
  * The Operational Load system replaces text boxes with a **Soft Density Shading Indicator** mapped to the day background:
    * **Empty / Zero Load**: Clear background with soft grid lines.
    * **Low Shading (1-3 events)**: Very light brand tint (e.g., `bg-slate-50/60`).
    * **Medium Shading (4-7 events)**: Soft pastel tint (e.g., `bg-slate-100/80` or `bg-blue-50/50`).
    * **High Shading (8-11 events)**: Subtle textured slate tint (e.g., `bg-slate-200` or `bg-blue-100/70`).
    * **Critical Saturation (12+ events or active Conflict alerts)**: Distinct warning tint (e.g., soft warm amber `bg-amber-100/80` with a sharp border indicator).
  * Clicking a day expands an inline details list immediately below that row, using a smooth sliding panel transition.

### 4.3 Timeline Tab (Operations Gantt Dashboard)
* **Goal**: Map multiple projects horizontally over 14-day and 30-day lookaheads.
* **Layout Design**:
  * Left column lists active projects (e.g., PC-2026-NEOM).
  * Right column contains horizontal Gantt tracks illustrating running preparation phases.
  * Milestone flags (indicated with sharp categories) point to exact submission and delivery hours.
  * Dependency lines (curved visual paths) link predecessor and successor milestones. Clicking a path highlights the schedule chain.

### 4.4 Kanban Tab (Agile Operations Board)
* **Goal**: Agile visualization of operational tasks across stages.
* **Layout Design**:
  * Columns represent statuses: **To Do**, **In Progress**, **Waiting For Others**, **Under Review**, **Resolved**.
  * Cards contain: Project code, priority indicators, days-to-deadline, and primary owner avatar.
  * Drag-and-drop operations automatically shift statuses on parent modules (e.g., dragging an IPC card from "In Progress" to "Under Review" triggers a transmittal review record in the Document repository).

### 4.5 Workload Tab (Engineering Capacity Index)
* **Goal**: Visual balancing of PMO staff resources to identify and isolate bottlenecks.
* **Integration System**:
  * Generates horizontal progress bars for every estimator and contracts engineer in the division.
  * Capacity Calculation Score:
    $$\text{Capacity Index} = (\text{Meetings} \times 1) + (\text{Active Tenders Studied} \times 4) + (\text{Due Submissions this week} \times 3)$$
  * Shading adapts smoothly: Low capacity is light gray, stable operations are soft teal/slate, and saturated workloads (Index > 18) trigger an amber alert flag indicating overload.

### 4.6 Conflicts Tab (Automated Quality Guard)
* **Goal**: Real-time diagnostic panel calling out project anomalies.
* **Warning Engine detects**:
  * **Resource Dual-Bookings**: Ahmed is assigned to join a Riyadh meeting and a Neom alignment at the same hour.
  * **Chronology Volatility**: Commercial proposal date scheduled prior to the completion of technical estimation drafts.
  * **Dependency Slippage**: A predecessor milestone is delayed by 5 days, pushing a critical tender submission past the client's hard deadline.

---

## 5. Event Dependency & Propagation Model

To preserve scheduling consistency across multi-stage tenders, the Operations Center implements a robust **Directed Acyclic Graph (DAG) Dependency Model**:

```
[Technical Kickoff] ──► [Risk Assessment] ──► [Technical Submission] ──► [Commercial Submission] ──► [Contract Award]
```

### 5.1 Predecessor & Successor Schema
Every calendar event contains optional relational pointers:
* `predecessorIds`: Array of unique event IDs that must be completed before this task can begin.
* `successorIds`: Array of subsequent event IDs that depend on this task's completion.
* `lagDays`: The minimum required operational gap between predecessor completion and successor commencement (e.g., a 12-day commercial offset limit).

### 5.2 Automatic Rescheduling Propagation Logic
When a parent event shifts, the system propagates the changes down the sequence using an automatic calculation loop:

```
Predecessor End Date shifts by +D Days
              │
              ▼
    Does Successor Start Date violate Lag Buffer?
         /          \
       YES           NO
       /              \
      ▼                ▼
Shift Successor     No Change
Start Date by +D
      │
      ▼
Check Next Successor in DAG Chain
```

1. **Conflict Evaluation**: If a user changes a technical bid submission date by $+5$ days, the system evaluates all succeeding nodes in the DAG.
2. **Auto-Update Propagations**: Successors are automatically shifted forward to maintain the required `lagDays` buffer.
3. **Interactive Adjustment Confirmation**: Instead of modifying source documents without review, the interface presents a clear sequence preview:
   *"Delaying NEOM Technical Submission by 5 days will push Commercial Submission and Negotiation Meetings forward. Do you want to propagate these shifts?"*
4. **Resolution Logs**: Every automatic date shift logs a system note on the event record: *"Date shifted automatically due to predecessor delay."*

---

## 6. Operations Command Panel (Replaces Drawer)

Selecting an event card opens the **Operations Command Panel**, an immersive side-bezel screen designed for rapid decision-making.

```
┌───────────────────────────────────────────────────────────────┐
│ OPERATIONS COMMAND PANEL                             [x] Close│
├───────────────────────────────────────────────────────────────┤
│ 🏷️ EVENT: Technical Submission - PC-2026-NEOM                  │
│                                                               │
│ PROJECT SUMMARY                                               │
│ Code: PC-2026-NEOM | Stage: Pre-Award Proposals                │
│ Budget: AED 150,000,000.00 | Client: NEOM Authority           │
│                                                               │
│ OWNER                                                         │
│ 👤 Sara Al-Mansoori (PMO Coordinator) | Dept: Estimating     │
│                                                               │
│ DETAILS                                                       │
│ Status: [In Progress] | Priority: [CRITICAL]                  │
│ Start: 2026-06-25 09:00 | End: 2026-06-25 11:30               │
├───────────────────────────────────────────────────────────────┤
│ 🔗 DEEP LINKS & SOURCE RECORDS                                 │
│ [Open Tender (Pre-Award)]    [Open Timeline (Gantt)]          │
│ [Open Project Profile]       [Open Document Transmittals]     │
├───────────────────────────────────────────────────────────────┤
│ 📁 RELATED DOCUMENTS & MATERIALS                               │
│ - 📄 BOQ_Draft_Rev2.xlsx (Excel Sheet - 4.2 MB)                │
│ - 📄 Risk_Matrix_v1.pdf (PDF Document - 1.1 MB)               │
│                                                               │
│ 📅 RELATED MEETINGS                                           │
│ - 👥 Internal Technical Review (Today, 14:00)                  │
│                                                               │
│ 📈 DEPENDENCY CHAIN                                           │
│ Predecessor: Risk Assessment Check (Completed)                │
│ Successor: Commercial Submission (Lag: +12 Days)              │
├───────────────────────────────────────────────────────────────┤
│ ⚡ QUICK OPERATIONS DIRECT ACTIONS                             │
│ [✔ Complete Task]   [📅 Reschedule Date]   [👤 Reassign Owner]│
│ [📝 Add Comment]    [📎 Attach New File]                      │
└───────────────────────────────────────────────────────────────┘
```

The Command Panel integrates:
* **Deep Links**: Direct links to open parent modules (`Open Tender`, `Open IPC`, `Open Claim`, `Open VO`, `Open NOC`, `Open Document`).
* **Direct Actions**: Perform workflow operations on the spot:
  * **Complete Event**: Marks status as completed and triggers successor notifications.
  * **Reschedule**: Directly shifts dates, automatically evaluating lag constraints.
  * **Reassign**: Search-and-select field to shift task ownership, validating availability to prevent dual-bookings.
  * **Add Note**: Standard logging interface keeping an audit trail.
  * **Attach File**: Direct drag-and-drop file upload target.

---

## 7. Global AI Command Bar (Future Capability)

Designed for future natural language integration, the **Global AI Command Bar** acts as an instant conversational interface positioned at the top of the Operations Center:

```
💡 AI Command Bar: [ "Show me all Benin project deadlines due this week" ] [Go]
```

### 7.1 Parsed Query Patterns
The future AI parser will match natural language queries to dynamic filter states:
* *"Show my work today."* ──► Filters **My Work** tab to today's active tasks for the current user.
* *"Show overdue claims."* ──► Navigates to **Conflicts** or **Kanban**, filtering Module to *Project Controls* and Status to *Overdue*.
* *"Show Benin deadlines."* ──► Filters the entire Operations Center by project code `PC-BENIN` and active milestones.
* *"Show this week's meetings."* ──► Navigates to **Calendar** or **Agenda**, filtering Event Category to *Alignment, Client, Negotiation, and Internal Meetings* for the current week.
* *"Who is overloaded?"* ──► Navigates to the **Workload** tab, highlighting profiles where capacity score exceeds 18.
* *"What deadlines are at risk?"* ──► Filters **Conflicts** and **Deadlines**, highlighting overdue predecessor tasks that block critical path submissions.

---

## 8. UX Guidelines & Visual System

### 8.1 Microsoft Fluent Design & Color Shading
ROWAD avoids aggressive colors to protect executive readability. High-contrast indicators are restricted to alert status indicators:
* **Slate Gray Palette**: Default theme base, utilizing soft gradients, light borders, and spacious text margins.
* **Operational Load Shading**: Subtle tints of slate-blue and steel-gray represent daily density. High density transitions elegantly into soft amber, reserving red borders strictly for actual workflow errors.
* **Category Color Accent (RESTRICTED)**:
  * **Pre-Award (Tenders)**: Royal Blue accents (`bg-blue-50/60`, `border-blue-150`, `text-blue-900`).
  * **Project Controls (Financials)**: Emerald Green accents (`bg-emerald-50/60`, `border-emerald-150`, `text-emerald-900`).
  * **Document Control (Submittals)**: Cool Slate accents (`bg-slate-50`, `border-slate-200`, `text-slate-800`).
  * **Meetings / Reminders**: Cool Gray accents (`bg-zinc-100`, `border-zinc-200`, `text-zinc-700`).

### 8.2 Responsive Layout Adjustments
* **Desktop Views (Width >= 1280px)**: Displays full 3-pane dashboard with Left Filters, Center active view, and Right diagnostics panel.
* **Tablet Views (Width >= 768px)**: Collapses Left filters and Right diagnostics into floating sidebars, retaining the Center operational views.
* **Mobile Views (Width < 768px)**: Adjusts all active views into a simplified daily checklist. Calendar views switch to a horizontal 7-day Operational Load bar. Clicking any slot launches a responsive bottom-sheet detailing task details and quick action buttons.

---

*This updated UI Blueprint is verified as the official Design, UX, and Flow Specification for the ROWAD Operations Center.*
