# Sprint 2 Workflow Matrix - Tender Award Slice

| Workflow | Source State | Destination | Guard | Result |
|---|---|---|---|---|
| Award Tender | Submitted | Awarded | Estimated value > 0, record not archived | Project created and linked |
| Award Tender | Under Negotiation | Awarded | Estimated value > 0, record not archived | Project created and linked |
| Award Tender | Preferred Bidder | Awarded | Estimated value > 0, record not archived | Project created and linked |
| Award Tender | Draft / Preparing / Initial | Awarded | Blocked | No Project created |
| Award Tender | Archived | Awarded | Blocked | No Project created |
| Repeat Award | Awarded | Awarded | Existing relationship detected | No duplicate Project created |

## Relationship Rules

| Entity | Relationship Field | Purpose |
|---|---|---|
| Tender | `awardedProjectId` | Points to the generated or linked Project |
| Tender | `awardedAt` | Captures Award timestamp |
| Project | `sourceTenderId` | Points back to the originating Tender |
| Project | `sourceTenderNumber` | Keeps business-readable source reference |
| Project | `awardedAt` | Captures Award timestamp on the Project side |
