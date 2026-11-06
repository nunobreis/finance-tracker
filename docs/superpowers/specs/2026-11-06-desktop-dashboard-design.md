# Norte — Desktop Dashboard Design (`new_design.pen`)

**Date:** 2026-11-06
**Scope:** Create the desktop variant of the Dashboard (`01b — Dashboard (Desktop)`, `1440 × 900`) in `new_design/new_design.pen`, consistent with `00 — Foundations`, `01 — Dashboard` (mobile), and the Dark Smoked Liquid Glass visual language.

---

## Context & Goals

- `new_design/DESIGN_BRIEF.md` specifies designing mobile (`390px`) first and then a desktop variant of the Dashboard and Transactions.
- The desktop Dashboard (`1440 × 900`, positioned at `x: 2010, y: 100` to the right of `01 — Dashboard`) must feel like the exact same product as `01 — Dashboard` while adapting naturally to a desktop widescreen viewport:
  - Uses a **Dark Smoked Liquid Glass Left Sidebar (`260px`)** with the Norte shield logo (`./logo.png`) and a luminous glass active nav pill for `Dashboard`.
  - Uses a **Light Grey canvas (`#F4F5F7`)** with a top utility header (`Dashboard` title, `GBP / EUR · 1.1842` rate badge, `Nov 2026` period pill, notification bell).
  - Features a full-width **Norte Teal Gradient Hero Banner (`196px` tall, `24px` radius)** containing Total Net Worth (`€ 24,350.00`), GBP exposure, the `AccountPill` (`ref: "kKfB9"`), and the 4 `QuickAction` buttons (`ref: "toLWw"`).
  - Uses an asymmetric **2-Column Content Grid** below the Hero:
    - **Left Column (`640px`)**: `Recent transactions` card reusing `TransactionRow` (`ref: "YeYyc"`) for the 5 transactions (`Lidl`, `Coffee`, `Salary`, `Netflix`, `Train`).
    - **Right Column (`fill_container`)**: Stacked `Spending this month` card (`€ 1,240 of € 2,000 budget`, `62%` progress bar) and `Upcoming bills` card (next 30 days: `Vodafone Fibra`, `EDP Comercial`, `Apple iCloud+`).

---

## Component & Node Architecture (`new_design/new_design.pen`)

### 1. Top-Level Screen Frame (`01b — Dashboard (Desktop)`)
- **Position & Size:** `x: 2010, y: 100, width: 1440, height: 900`
- **Layout:** `layout: "horizontal"`, `clip: true`, `fill: "#F4F5F7"`

### 2. Left Sidebar (`desktop-sidebar`)
- **Dimensions & Layout:** `width: 260, height: "fill_container"`, `layout: "vertical"`, `justifyContent: "space_between"`, `padding: [28, 16, 24, 16]`
- **Fill & Stroke:**
  - `fill`: Linear gradient (`180°`, `#0D1525` at `0` → `#0A0F1C` at `1`)
  - `stroke`: `#FFFFFF14`, `strokeWidth: { right: 1 }`, `strokeAlignment: "inner"`
- **Top Section (`sidebar-top`, `layout: "vertical"`, `gap: 28`, `width: "fill_container"`):**
  - **Brand Row (`sidebar-brand`, `padding: [0, 12]`, `gap: 10`, `alignItems: "center"`):**
    - Logo frame (`30 × 30`, image fill `./logo.png`, `mode: "contain"`)
    - Text `"Norte"` (`Manrope`, `20px`, `fontWeight: "700"`, `#FFFFFF`)
  - **Primary Nav List (`sidebar-nav`, `layout: "vertical"`, `gap: 6`, `width: "fill_container"`):**
    - **Active Item (`nav-dashboard`):**
      - `height: 44`, `width: "fill_container"`, `cornerRadius: 22`, `padding: [0, 14]`, `gap: 12`, `alignItems: "center"`
      - `fill`: Linear gradient (`180°`, `#FFFFFF33` → `#FFFFFF1A`)
      - `stroke`: `#FFFFFF40`, `strokeWidth: 1`, `strokeAlignment: "inner"`
      - `effect`: `[{ type: "shadow", shadowType: "inner", offset: { x: 0, y: 1 }, blur: 1, color: "#FFFFFF4D" }]`
      - Icon: `house` (`18 × 18`, `#FFFFFF`) + Text `"Dashboard"` (`14px`, `fontWeight: "600"`, `#FFFFFF`)
    - **Inactive Items (`height: 44`, `padding: [0, 14]`, `gap: 12`, `alignItems: "center"`, `#FFFFFF99`):**
      - `Transactions` (`arrow-left-right`)
      - `Budgets` (`chart-pie`)
      - `Recurring Bills` (`refresh-cw`)
      - `Accounts` (`wallet`)
      - `Investments` (`trending-up`)
      - `Net Worth` (`chart-column`)
- **Bottom Section (`sidebar-bottom`, `layout: "vertical"`, `gap: 6`, `width: "fill_container"`):**
  - Divider (`height: 1`, `width: "fill_container"`, `fill: "#FFFFFF14"`)
  - `Settings` (`settings`, `#FFFFFF99`)
  - `My Account` (`user`, `#FFFFFF99`)

### 3. Main Content Column (`desktop-main`)
- **Dimensions & Layout:** `width: "fill_container"`, `height: "fill_container"`, `layout: "vertical"`, `padding: [28, 36]`, `gap: 24`

#### 3a. Top Utility Header (`desktop-header`)
- **Layout:** `width: "fill_container"`, `height: 44`, `justifyContent: "space_between"`, `alignItems: "center"`
- **Left:** `"Dashboard"` (`Manrope`, `28px`, `fontWeight: "700"`, `#0D1525`)
- **Right (`gap: 12`, `alignItems: "center"`):**
  - **FX Rate Pill:** `height: 38`, `padding: [0, 14]`, `cornerRadius: 19`, `fill: "#FFFFFF"`, `stroke: "#E2E8F0"`, `strokeWidth: 1`, `gap: 8`, `alignItems: "center"` — `globe` icon (`16px`, `#0EB5D4`) + `"GBP / EUR · 1.1842"` (`12px`, `fontWeight: "600"`, `#0D1525`)
  - **Date Picker Pill:** `height: 38`, `padding: [0, 14]`, `cornerRadius: 19`, `fill: "#FFFFFF"`, `stroke: "#E2E8F0"`, `strokeWidth: 1`, `gap: 8`, `alignItems: "center"` — `calendar` icon (`16px`, `#64748B`) + `"As of: Today, 6 Nov"` (`12px`, `fontWeight: "500"`, `#0D1525`)
  - **Notification Button:** `40 × 40`, `cornerRadius: 20`, `fill: "#FFFFFF"`, `stroke: "#E2E8F0"`, `strokeWidth: 1`, centered `bell` icon (`18px`, `#0D1525`)

#### 3b. Hero Banner Card (`desktop-hero`)
- **Dimensions & Layout:** `width: "fill_container"`, `height: 196`, `cornerRadius: 24`, `padding: [28, 36]`, `justifyContent: "space_between"`, `alignItems: "center"`
- **Fill & Shadow:**
  - `fill`: Linear gradient (`135°`, `#0D1525` at `0` → `#0EB5D4` at `0.68` → `#0A6C82` at `1`)
  - `effect`: `[{ type: "shadow", shadowType: "outer", offset: { x: 0, y: 12 }, blur: 28, color: "#0D15251F" }]`
- **Left Cluster (`layout: "vertical"`, `gap: 8`):**
  - `"Total net worth"` (`13px`, `#FFFFFFB3`)
  - `"€ 24,350.00"` (`42px`, `fontWeight: "800"`, `#FFFFFF`)
  - Bottom meta row (`gap: 12`, `alignItems: "center"`):
    - Instance of `AccountPill` (`ref: "kKfB9"`, `"2 accounts"`)
    - `"GBP exposure: £6,200.42  ·  +2.3% today"` (`13px`, `#FFFFFFCC`)
- **Right Cluster (`gap: 24`, `alignItems: "center"`):**
  - 4 instances of `QuickAction` (`ref: "toLWw"`):
    1. `Add` (`#FFFFFF` circle, `#0EB5D4` `plus` icon)
    2. `Import CSV` (`#FFFFFF1F` circle, `#FFFFFF` `upload` icon)
    3. `Transfer` (`#FFFFFF1F` circle, `#FFFFFF` `arrow-left-right` icon)
    4. `Add Bill` (`#FFFFFF1F` circle, `#FFFFFF` `receipt` icon)

#### 3c. 2-Column Content Grid (`desktop-grid`)
- **Dimensions & Layout:** `width: "fill_container"`, `height: "fill_container"`, `gap: 24`, `alignItems: "start"`
- **Left Column — Recent Transactions Card (`width: 640`, `height: "fill_container"`, `cornerRadius: 20`, `fill: "#FFFFFF"`, `padding: 24`, `layout: "vertical"`, `gap: 18`):**
  - Header row (`justifyContent: "space_between"`, `alignItems: "center"`):
    - `"Recent transactions"` (`18px`, `fontWeight: "700"`, `#0D1525`)
    - `"See all"` (`13px`, `fontWeight: "600"`, `#0EB5D4`)
  - 5 instances of `TransactionRow` (`ref: "YeYyc"`) separated by `1px` `#F1F5F9` dividers:
    1. `Lidl` (`Groceries · Revolut EUR · Today`, `- € 34.50`)
    2. `Coffee` (`Eating Out · Revolut GBP · Yesterday`, `- € 4.20`)
    3. `Salary` (`Income · Monzo GBP · 31 Oct`, `+ € 2,400`)
    4. `Netflix` (`Subscriptions · Revolut EUR · 29 Oct`, `- € 13.99`)
    5. `Train` (`Transport · Monzo GBP · 28 Oct`, `- € 4.75`)
- **Right Column (`width: "fill_container"`, `height: "fill_container"`, `layout: "vertical"`, `gap: 24`):**
  - **Card 1 — Spending This Month (`width: "fill_container"`, `cornerRadius: 20`, `fill: "#FFFFFF"`, `padding: 24`, `layout: "vertical"`, `gap: 12`):**
    - Header: `"Spending this month"` (`16px`, `fontWeight: "700"`, `#0D1525`) + `"Nov 2026"` (`12px`, `#64748B`)
    - Amount row (`alignItems: "end"`, `gap: 8`): `"€ 1,240"` (`28px`, `fontWeight: "800"`, `#0D1525`) + `"of € 2,000 budget"` (`13px`, `#64748B`)
    - Progress bar (`width: "fill_container"`, `height: 8`, `cornerRadius: 4`, `fill: "#E5E7EB"`) with inner fill (`width: 248`, `height: 8`, `cornerRadius: 4`, `fill: "#0EB5D4"`)
    - Footer meta (`justifyContent: "space_between"`): `"62% of monthly budget"` (`12px`, `#64748B`) + `"€ 760 left"` (`12px`, `fontWeight: "600"`, `#059669`)
  - **Card 2 — Upcoming Bills (`width: "fill_container"`, `height: "fill_container"`, `cornerRadius: 20`, `fill: "#FFFFFF"`, `padding: 24`, `layout: "vertical"`, `gap: 16`):**
    - Header: `"Upcoming bills"` (`16px`, `fontWeight: "700"`, `#0D1525`) + `"Next 30 days"` (`12px`, `fontWeight: "600"`, `#0EB5D4`)
    - 3 bill rows (reusing `TransactionRow` `ref: "YeYyc"` for visual consistency):
      1. `Vodafone Fibra` (`Utilities · Due 12 Nov · Direct Debit`, `- € 39.90`, icon `wifi` in `#E0F2FE` / `#0284C7`)
      2. `EDP Comercial` (`Electricity · Due 18 Nov · Direct Debit`, `- € 64.20`, icon `zap` in `#FEF3C7` / `#D97706`)
      3. `Apple iCloud+` (`Subscriptions · Due 24 Nov · Revolut EUR`, `- € 2.99`, icon `cloud` in `#F3E8FF` / `#9333EA`)
