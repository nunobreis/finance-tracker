# Remaining Norte User Journeys (`new_design.pen`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the remaining 18 screen frames across 9 user journeys (`02 — Transactions` through `10 — Login`) in `new_design/new_design.pen`, strictly in the `.pen` file with zero changes to the Next.js codebase.

**Architecture:** Organize the 18 screens into 3 horizontal journey rows below Row 1 (`01 — Dashboard` & `01b — Dashboard (Desktop)`):
- **Task 1 (Row 2, `y: 1080`):** `02 — Transactions`, `02b — Add Transaction`, `02c — Transactions (Desktop)` (using the exact `#182235e0` → `#0d1525` sidebar gradient saved by Nuno), and the 4 CSV Import steps (`03-Import / 1-Upload`, `03-Import / 2-Map`, `03-Import / 3-Preview`, `03-Import / 4-Confirm`).
- **Task 2 (Row 3, `y: 2060`):** `04 — Accounts`, `04b — Add Account`, `05 — Budgets`, `05b — Add Budget`, `06 — Recurring Bills`, `06b — Add Bill`.
- **Task 3 (Row 4, `y: 3040`):** `07 — Investments`, `07b — Add Holding`, `08 — Net Worth`, `09 — Settings & Account`, `10 — Login`.

**Tech Stack:** Pencil MCP (`execute`, `save`), `.pen` schema v2.11.

---

### Task 1: Build Row 2 (`y: 1080`) — Activity (`Transactions`) & `CSV Import` (7 Artboards)

**Files:**
- Modify: `new_design/new_design.pen`

- [x] **Step 1: Create `02 — Transactions` (`390×844`), `02b — Add Transaction` (`390×844`), and `02c — Transactions (Desktop)` (`1440×900`)**
- [x] **Step 2: Create `03-Import / 1-Upload`, `03-Import / 2-Map`, `03-Import / 3-Preview`, `03-Import / 4-Confirm` (`390×844` each)**
- [x] **Step 3: Take screenshots and verify Row 2 layouts**

---

### Task 2: Build Row 3 (`y: 2060`) — `Accounts`, `Budgets` & `Recurring Bills` (6 Artboards)

**Files:**
- Modify: `new_design/new_design.pen`

- [x] **Step 1: Create `04 — Accounts` & `04b — Add Account`, `05 — Budgets` & `05b — Add Budget`, `06 — Recurring Bills` & `06b — Add Bill` (`390×844` each)**
- [x] **Step 2: Take screenshots and verify Row 3 layouts**

---

### Task 3: Build Row 4 (`y: 3040`) — `Investments`, `Net Worth`, `Settings & Account` & `Login` (5 Artboards)

**Files:**
- Modify: `new_design/new_design.pen`

- [x] **Step 1: Create `07 — Investments` & `07b — Add Holding`, `08 — Net Worth`, `09 — Settings & Account`, and `10 — Login` (`390×844` each)**
- [x] **Step 2: Take screenshots, verify Row 4 layouts, and save `new_design/new_design.pen` to disk**
