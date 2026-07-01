# Architectural Decision Record: ADR-016
**Title:** Centralized Presentation Mappers & Reusable Badges  
**Status:** Approved  
**Date:** 2026-07-01  

---

## Context
Project statuses, workflow states, and lifecycle stages are rendered on multiple views (Portfolio Grid, Workspace header, Dashboard tab, Setup Center, and Reports).

Previously, the CSS styling classes (e.g. `bg-emerald-50 text-emerald-600`) and translation strings (e.g. `"Active" ↔ "نشط"`) were duplicated and hardcoded inside individual React components. This created visual styling drift, code duplication, and localization inconsistencies across panels.

---

## Decision
We centralize all status presentation logic into dedicated, stateless mapping services:
1. **StatusPresentationService**: Maps workflow states (`Draft`, `Setup`, `Active`, etc.) and operational statuses (`Inactive`, `Mobilizing`, `Active`, etc.) to bilingual text labels (EN/AR), color palettes, Lucide icons, and Tailwind badge classes.
2. **LifecyclePresentationService**: Maps lifecycle stages to presentation metadata, and correctly maps intermediate stages (`Pending Project Setup`, `Ready for Mobilization`) to the visual milestone tracker point `Awarded`.

Additionally, we create a unified set of reusable badge components under `src/components/ProjectStatusBadges.tsx`:
- `<ProjectWorkflowStateBadge />`
- `<ProjectStatusBadge />`
- `<ProjectLifecycleBadge />`

All views, tables, and headers are refactored to consume these reusable components instead of declaring custom inline badge markup.

---

## Consequences
* **UI Consistency**: Every screen displays the exact same color, translation label, and icon representation for any given project state.
* **Localization Safety**: Ensures correct RTL text alignment and bilingual support (EN/AR) in status pills.
* **Maintenance Ease**: Changes to styling tokens, brand guidelines, or status translations are made in a single mapping file rather than searching multiple views.
* **Dry Codebase**: Removes redundant switch/ternary expressions from grid and workspace layouts.
