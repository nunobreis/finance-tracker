# Liquid Glass TabBar (`new_design.pen`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the reusable `TabBar` component (`CIhfk`) in `new_design/new_design.pen` to use an iOS-inspired Dark Smoked Liquid Glass design so that both `00 — Foundations` and `01 — Dashboard` (`YwPCu`) have crisp contrast against the white bottom sheet.

**Architecture:** Modify only `new_design/new_design.pen` via the Pencil MCP `execute` and `save` tools (no Next.js application code changes). Since `dash-tabbar` (`YwPCu`) in `01 — Dashboard` (`abtTa`) is an instance (`ref: "CIhfk"`) of the `TabBar` component in `00 — Foundations`, updating `CIhfk` and its children (`ZiaRE`, `i7gkpy`, `U0vEpT`, `X3MIG`, `B1KuY7`) updates all instances automatically.

**Tech Stack:** Pencil MCP (`execute`, `save`), `.pen` schema v2.11.

---

### Task 1: Apply Dark Smoked Liquid Glass to `TabBar` (`CIhfk`) in `new_design/new_design.pen`

**Files:**
- Modify: `new_design/new_design.pen` (nodes `CIhfk`, `ZiaRE`, `ETD3p`, `M9ylM`, `J95kWc`, `eruKj`, `zUTTJ`, `s2r6h`, `XVJCS`, `ts8w9`, `IfMid`, `o5dIm`)

- [x] **Step 1: Execute Pencil update on `CIhfk` and its tab children**

Run via Pencil MCP `execute` on `file:///Users/satoridigital/Development/2026/00_PERSONAL_WORK/norte/finance-tracker/new_design/new_design.pen`:

```javascript
Update('CIhfk', {
  padding: [4, 6],
  fill: {
    type: 'gradient',
    gradientType: 'linear',
    enabled: true,
    rotation: 180,
    size: { height: 1 },
    colors: [
      { color: '#182235CC', position: 0 },
      { color: '#0D1525E0', position: 1 }
    ]
  },
  stroke: {
    type: 'gradient',
    gradientType: 'linear',
    enabled: true,
    rotation: 165,
    size: { height: 1 },
    colors: [
      { color: '#FFFFFF66', position: 0 },
      { color: '#FFFFFF1A', position: 0.5 },
      { color: '#FFFFFF33', position: 1 }
    ]
  },
  strokeWidth: 1,
  strokeAlignment: 'inner',
  effect: [
    { type: 'background_blur', radius: 28 },
    { type: 'shadow', shadowType: 'inner', offset: { x: 0, y: 1 }, blur: 1, color: '#FFFFFF40' },
    { type: 'shadow', shadowType: 'inner', offset: { x: 0, y: -1 }, blur: 2, color: '#FFFFFF1A' },
    { type: 'shadow', shadowType: 'outer', offset: { x: 0, y: 10 }, blur: 28, color: '#0D152547' }
  ]
});

Update('ZiaRE', {
  fill: {
    type: 'gradient',
    gradientType: 'linear',
    enabled: true,
    rotation: 180,
    size: { height: 1 },
    colors: [
      { color: '#FFFFFF33', position: 0 },
      { color: '#FFFFFF1A', position: 1 }
    ]
  },
  stroke: '#FFFFFF40',
  strokeWidth: 1,
  strokeAlignment: 'inner',
  effect: [
    { type: 'shadow', shadowType: 'inner', offset: { x: 0, y: 1 }, blur: 1, color: '#FFFFFF4D' }
  ]
});

Update('ETD3p', { fill: '#FFFFFF' });
Update('M9ylM', { fill: '#FFFFFF', fontWeight: '600' });

for (const id of ['J95kWc', 'eruKj', 'zUTTJ', 's2r6h', 'XVJCS', 'ts8w9', 'IfMid', 'o5dIm']) {
  Update(id, { fill: '#FFFFFF99' });
}

TakeScreenshot(['CIhfk', 'abtTa']);
```

- [x] **Step 2: Visually verify screenshots of `CIhfk` and `abtTa`**

Inspect the returned screenshots:
- Confirm `CIhfk` shows the dark smoked glass capsule, 1px specular rim, luminous active "Home" droplet pill with `#FFFFFF` icon and label, and `#FFFFFF99` inactive icons/labels.
- Confirm `abtTa` (`01 — Dashboard`) shows `dash-tabbar` (`YwPCu`) floating with strong contrast over the `#FFFFFF` sheet while blurring `tx-train` underneath.

- [x] **Step 3: Save `new_design/new_design.pen` to disk**

Call Pencil MCP `save`:
```json
{
  "uri": "file:///Users/satoridigital/Development/2026/00_PERSONAL_WORK/norte/finance-tracker/new_design/new_design.pen"
}
```
