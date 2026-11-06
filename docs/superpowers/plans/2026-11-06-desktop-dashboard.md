# Desktop Dashboard (`new_design.pen`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `01b — Dashboard (Desktop)` (`1440 × 900`) screen frame in `new_design/new_design.pen` to the right of `01 — Dashboard`, strictly in the `.pen` file with zero changes to the Next.js codebase.

**Architecture:** Create top-level frame `01b — Dashboard (Desktop)` (`1440 × 900` at `x: 2010, y: 100`) containing a `260px` Dark Smoked Liquid Glass left sidebar (`desktop-sidebar`) and a `fill_container` main column (`desktop-main`) with a top utility bar, a full-width Norte gradient Hero Banner reusing `AccountPill` (`kKfB9`) and `QuickAction` (`toLWw`), and a 2-column content grid reusing `TransactionRow` (`YeYyc`) for Recent Transactions and Upcoming Bills alongside the Spending This Month card.

**Tech Stack:** Pencil MCP (`execute`, `save`), `.pen` schema v2.11.

---

### Task 1: Build `01b — Dashboard (Desktop)` in `new_design/new_design.pen`

**Files:**
- Modify: `new_design/new_design.pen`

- [x] **Step 1: Insert `01b — Dashboard (Desktop)` frame, Left Sidebar, and Top Header + Hero Banner**
- [x] **Step 2: Insert 2-Column Content Grid (Recent Transactions, Spending This Month, Upcoming Bills) and take screenshot**
- [x] **Step 3: Visually verify screenshot for layout, contrast, and alignment, then save `new_design.pen`**
