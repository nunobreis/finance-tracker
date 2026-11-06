# Norte — Liquid Glass TabBar Design (`new_design.pen`)

**Date:** 2026-11-06
**Scope:** Redesign the reusable `TabBar` component (`CIhfk`) in `new_design/new_design.pen` to use an iOS-inspired Dark Smoked Liquid Glass aesthetic, providing strong visual separation against the white (`#FFFFFF`) Dashboard sheet while preserving background blur translucency.

---

## Problem Statement

In `new_design/new_design.pen`, the `01 — Dashboard` screen (`abtTa`) places a floating bottom `TabBar` (`YwPCu`, instance of `CIhfk`) over a white (`#FFFFFF`) bottom sheet (`YAfWL`). Because `TabBar` used a light translucent fill (`#FFFFFFB8`), it blended into the underlying white card and transaction rows with minimal contrast.

Reference designs (Revolut, WhatsApp, Instagram on iOS 26) use a **Dark Smoked Liquid Glass** floating capsule with a specular outer rim, background blur, and a luminous convex glass pill for the active tab.

---

## Design Specification

### 1. Outer Capsule (`TabBar` — node `CIhfk`)

- **Dimensions & Layout:** `width: 358`, `height: 64`, `cornerRadius: 32`, `padding: [4, 6]`, `justifyContent: "space_between"`, `alignItems: "center"`
- **Smoked Glass Fill (`fill`):**
  - Type: `gradient` (`linear`, `rotation: 180`)
  - Stops:
    - `0`: `#182235CC` (80% opacity dark slate-navy at top)
    - `1`: `#0D1525E0` (88% opacity deep navy at bottom)
- **Specular Glass Rim (`stroke`):**
  - `strokeWidth: 1`, `strokeAlignment: "inner"`
  - Type: `gradient` (`linear`, `rotation: 165`)
  - Stops:
    - `0`: `#FFFFFF66` (40% white top-left catch-light)
    - `0.5`: `#FFFFFF1A` (10% white mid transition)
    - `1`: `#FFFFFF33` (20% white bottom-right rim reflection)
- **Layered Effects (`effect`):**
  1. `background_blur`: `{ type: "background_blur", radius: 28 }`
  2. Top inner specular highlight: `{ type: "shadow", shadowType: "inner", offset: { x: 0, y: 1 }, blur: 1, color: "#FFFFFF40" }`
  3. Bottom inner glass glow: `{ type: "shadow", shadowType: "inner", offset: { x: 0, y: -1 }, blur: 2, color: "#FFFFFF1A" }`
  4. Floating elevation shadow: `{ type: "shadow", shadowType: "outer", offset: { x: 0, y: 10 }, blur: 28, color: "#0D152547" }`

### 2. Active Tab Pill (`tab-0` — node `ZiaRE`)

- **Dimensions & Layout:** `width: "fill_container"`, `height: "fill_container"`, `cornerRadius: 28`, `layout: "vertical"`, `gap: 2`, `padding: [4, 6]`, `justifyContent: "center"`, `alignItems: "center"`
- **Luminous Glass Fill (`fill`):**
  - Type: `gradient` (`linear`, `rotation: 180`)
  - Stops:
    - `0`: `#FFFFFF33` (20% white top)
    - `1`: `#FFFFFF1A` (10% white bottom)
- **Inner Rim (`stroke`):**
  - `stroke: "#FFFFFF40"`, `strokeWidth: 1`, `strokeAlignment: "inner"`
- **Inner Highlight (`effect`):**
  - `{ type: "shadow", shadowType: "inner", offset: { x: 0, y: 1 }, blur: 1, color: "#FFFFFF4D" }`
- **Active Icon (`ETD3p`) & Label (`M9ylM`):**
  - `fill: "#FFFFFF"`
  - Label `fontWeight: "600"`

### 3. Inactive Tabs (`tab-1`..`tab-4`)

- **Nodes:**
  - `i7gkpy` (`icon-1`: `J95kWc`, `label-1`: `eruKj` — Activity)
  - `U0vEpT` (`icon-2`: `zUTTJ`, `label-2`: `s2r6h` — Budgets)
  - `X3MIG` (`icon-3`: `XVJCS`, `label-3`: `ts8w9` — Wealth)
  - `B1KuY7` (`icon-4`: `IfMid`, `label-4`: `o5dIm` — More)
- **Container Fill:** `#00000000` (transparent)
- **Inactive Icon & Label Fill:** `#FFFFFF99` (60% frosted white)

---

## Verification Criteria

1. `CIhfk` (`TabBar` in `00 — Foundations`) renders with the dark smoked liquid glass gradient, specular rim, and luminous active pill without layout or clipping warnings.
2. `YwPCu` (`dash-tabbar` in `01 — Dashboard`) inherits all updates automatically and contrasts clearly against the `#FFFFFF` sheet (`YAfWL`) while blurring the underlying transaction rows (`tx-train`).
3. The updated `new_design/new_design.pen` file is saved to disk.
