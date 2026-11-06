# Norte — Remaining User Journeys Design (`new_design.pen`)

**Date:** 2026-11-06
**Scope:** Complete all remaining Norte user journeys in `new_design/new_design.pen` (`02 — Transactions` through `10 — Login`, 18 artboards total) following `new_design/DESIGN_BRIEF.md`, the `00 — Foundations` component library, the Dark Smoked Liquid Glass `TabBar` (`CIhfk`), and the updated Desktop Sidebar linear gradient (`#182235e0` → `#0d1525`).

---

## Visual & Domain Principles

1. **Consistent Mobile Architecture (`390 × 844`):**
   - Top Norte Gradient Hero (`#0D1525` → `#0EB5D4` → `#0A6C82`, `rotation: 180`) with status bar (`9:41`), Norte shield logo (`./logo.png`) or journey title, primary metric, and pill actions.
   - Overlapping rounded white/light-grey content sheet (`cornerRadius: [24, 24, 0, 0]`).
   - Floating **Dark Smoked Liquid Glass `TabBar`** (`ref: "CIhfk"`) at `x: 16, y: 756`, with descendant overrides moving the luminous active glass pill (`#FFFFFF33` → `#FFFFFF1A`, stroke `#FFFFFF40`, `#FFFFFF` icon/label) to the active tab for each journey (`Home`, `Activity`, `Budgets`, `Wealth`, or `More`).
2. **Consistent Desktop Architecture (`1440 × 900` for `02c — Transactions (Desktop)`):**
   - Left Sidebar (`260px`) using Nuno's exact saved linear gradient (`rotation: 180`, `#182235e0` at `0` → `#0d1525` at `1`), `1px` right inner border `#FFFFFF14`, Norte shield logo (`./logo.png`), and the luminous Liquid Glass active pill on `Transactions`.
   - Light grey `#F4F5F7` main canvas with top utility bar, 3-card summary strip, filter bar, and flexbox table.
3. **Domain Rules Respected:**
   - Multi-currency: native currency (`EUR` or `GBP`) shown per account/transaction/bill/holding; totals aggregated in `EUR`.
   - Transfers between own accounts shown as linked pairs (`Revolut EUR → Monzo GBP`) and excluded from spending totals.
   - CSV imports grouped into reversible batches (`Batch #104 · Revolut_Nov2026.csv`) with explicit `"Undo batch"` actions.
   - Single-user private auth (`Login` has no public sign-up link).

---

## Canvas Grid Layout & Artboard Specifications

### Row 2 (`y: 1080`) — Activity (`Transactions`) & `CSV Import`

1. **`02 — Transactions` (`390 × 844`, `x: 1540, y: 1080`)**
   - Top gradient header (`height: 236`): Status bar, `"Activity"` title + `"+ Add"` & `"Import CSV"` pills, summary metrics (`Spent: - € 1,240.00` · `Income: + € 2,400.00` · `Transfers excluded`).
   - White sheet (`y: 212, height: 632`):
     - Search bar (`"Search merchant, category, notes..."`) + horizontal filter chips (`All`, `Revolut EUR`, `Monzo GBP`, `Uncategorised (2)`, `Transfers`).
     - Batch banner (`"Batch #104 · Revolut_Nov2026.csv (13 rows)"` + `"Undo"` action).
     - Transaction rows (`YeYyc` instances): `Lidl (- € 34.50)`, `Revolut → Monzo Transfer (€ 500.00 → £ 422.10 · Excluded)`, `Coffee (- £ 3.55 · ≈ € 4.20)`, `Salary (+ £ 2,026.68 · ≈ € 2,400.00)`, `Continente (- € 62.10)`.
   - `TabBar` (`CIhfk`) with `Activity` (`tab-1`) active.

2. **`02b — Add Transaction` (`390 × 844`, `x: 1990, y: 1080`)**
   - Dimmed header + `BottomSheet` (`y: 140, height: 704`):
     - Drag handle + `"Add transaction"` title.
     - Segmented pill (`Expense` active | `Income` | `Transfer`).
     - Big amount display (`- € 45.00`) + currency badge (`EUR`).
     - Borderless filled inputs (`Merchant: Farmácia Portuguesa`, `Category: Health (IRS 15%)`, `Account: Revolut EUR`, `Date: 6 Nov 2026`).
     - Primary pill CTA (`"Save transaction"`).

3. **`02c — Transactions (Desktop)` (`1440 × 900`, `x: 2440, y: 1080`)**
   - Left Sidebar (`260px`, `#182235e0` → `#0d1525`) with `Transactions` active.
   - Main Column (`1180px`, `padding: [28, 36]`, `gap: 20`):
     - Header: `"Transactions"` + `"Import CSV"` secondary pill + `"+ Add transaction"` primary pill.
     - 3 Summary Cards (`Spent in Nov: - € 1,240.00`, `Income in Nov: + € 2,400.00`, `Latest CSV Batch: Revolut_Nov2026.csv · 13 rows · Undo batch`).
     - Filter bar: Search input + `All accounts`, `All categories`, `Uncategorised (2)`, `Transfers` pills.
     - Flexbox Table (`Date`, `Merchant`, `Account`, `Category & Rule`, `Native Amount`, `EUR Total`) with 6 rows including a linked Transfer pair and an inline-editable category pill.

4. **`03-Import / 1-Upload` (`390 × 844`, `x: 3940, y: 1080`)**
   - Header: `"CSV Import · Step 1 of 4"` (`Upload file`).
   - Sheet: Account selector (`Revolut Main (EUR)` selected, `Monzo Current (GBP)`), dashed upload dropzone card (`"Drop or tap to select Revolut / Monzo CSV"`), and `Recent import batches` list (`Revolut_Nov2026.csv · 13 rows · Undo`, `Monzo_Oct2026.csv · 28 rows · Undo`) + `"Continue"` CTA.

5. **`03-Import / 2-Map` (`390 × 844`, `x: 4390, y: 1080`)**
   - Header: `"CSV Import · Step 2 of 4"` (`Map columns`).
   - Sheet: Auto-detected banner (`"Revolut EUR preset applied"`), column mapping cards (`Occurred date → Completed Date`, `Merchant → Description`, `Amount → Amount`, `Currency → Currency`), sample row preview, and `"Preview 14 rows"` CTA.

6. **`03-Import / 3-Preview` (`390 × 844`, `x: 4840, y: 1080`)**
   - Header: `"CSV Import · Step 3 of 4"` (`Preview & rules`).
   - Sheet: Summary pills (`11 Auto-categorised`, `2 Transfers linked`, `1 Duplicate skipped`), preview list of parsed rows with rule badges (`Rule: Lidl → Groceries`, `Linked transfer → Monzo GBP`), and `"Import 13 transactions"` CTA.

7. **`03-Import / 4-Confirm` (`390 × 844`, `x: 5290, y: 1080`)**
   - Header: `"CSV Import · Step 4 of 4"` (`Complete`).
   - Sheet: Emerald success icon circle, `"13 transactions imported"`, Batch details card (`Batch #104 · Revolut_Nov2026.csv · Reversible as a unit`), `"Undo this import batch"` secondary pill, and `"Back to Activity"` primary pill CTA.

---

### Row 3 (`y: 2060`) — `Accounts`, `Budgets` & `Recurring Bills`

8. **`04 — Accounts` (`390 × 844`, `x: 1540, y: 2060`)**
   - Header: `"Accounts"`, total cash in EUR (`€ 12,963.04` across 3 accounts) + `"+ Add account"` pill.
   - Sheet:
     - `Revolut Main (EUR)` card (`Checking · PT`, `€ 4,120.50`)
     - `Monzo Current (GBP)` card (`Checking · GB`, `£ 6,200.42` + muted `≈ € 7,342.54 at 1.1842`)
     - `Revolut Vault (EUR)` card (`Savings · PT`, `€ 1,500.00`)
   - `TabBar` (`CIhfk`) with `Home` active.

9. **`04b — Add Account` (`390 × 844`, `x: 1990, y: 2060`)**
   - Bottom sheet (`"Add account"`): `Account name (e.g. Millennium BCP)`, `Account type (Checking / Savings / Investment)`, `Native currency (EUR / GBP)`, `Country (PT / GB)`, `Initial balance (0.00)`, and `"Create account"` pill CTA.

10. **`05 — Budgets` (`390 × 844`, `x: 2440, y: 2060`)**
    - Header: `"Budgets · Nov 2026"`, `€ 1,240 spent of € 2,000` (`62% used · € 760 remaining`) + `"+ Add budget"` pill.
    - Sheet: Category budget cards with progress bars:
      - `Housing` (`€ 650 / € 650 · 100%`, teal bar)
      - `Groceries` (`€ 380 / € 450 · 84%`, teal bar)
      - `Eating Out` (`€ 195 / € 150 · 130% · € 45 over`, danger/coral bar `#EF4444`)
      - `Transport` (`€ 15 / € 100 · 15%`, emerald bar `#059669`)
    - `TabBar` (`CIhfk`) with `Budgets` (`tab-2`) active.

11. **`05b — Add Budget` (`390 × 844`, `x: 2890, y: 2060`)**
    - Bottom sheet (`"Set monthly budget"`): `Category (Groceries)`, `Monthly target in EUR (€ 450.00)`, `Month (November 2026)`, and `"Save budget"` pill CTA.

12. **`06 — Recurring Bills` (`390 × 844`, `x: 3340, y: 2060`)**
    - Header: `"Recurring bills"`, `€ 278.80 / month total` (`3 due in next 30 days`) + `"+ Add bill"` pill.
    - Sheet: Bill cards with due badges and **`"Mark paid"`** pill buttons:
      - `Vodafone Fibra` (`€ 39.90 · Monthly · Due 12 Nov`) + `"Mark paid"` pill
      - `EDP Comercial` (`€ 64.20 · Monthly · Due 18 Nov`) + `"Mark paid"` pill
      - `London Flat Council Tax` (`£ 145.00 · ≈ € 171.71 · Due 28 Nov`) + `"Mark paid"` pill
      - `Apple iCloud+` (`€ 2.99 · Paid 24 Oct · Next 24 Nov`)
    - `TabBar` (`CIhfk`) with `More` (`tab-4`) active.

13. **`06b — Add Bill` (`390 × 844`, `x: 3790, y: 2060`)**
    - Bottom sheet (`"Add recurring bill"`): `Bill name`, `Amount & Currency (EUR / GBP)`, `Frequency (Monthly / Quarterly / Yearly)`, `Next due date`, and `"Save bill"` pill CTA.

---

### Row 4 (`y: 3040`) — `Investments`, `Net Worth`, `Settings & Account`, `Login`

14. **`07 — Investments` (`390 × 844`, `x: 1540, y: 3040`)**
    - Header: `"Investments"`, `€ 12,929.50` (`+ € 1,840.20 · +16.6% total return`) + `"Refresh prices"` & `"+ Add holding"` pills.
    - Sheet: Holdings cards:
      - `VWCE · Vanguard FTSE All-World` (`85 sh · € 114.00 · € 9,690.00 · +18.2%`)
      - `VUAG · Vanguard S&P 500 (GBP)` (`28 sh · £ 86.07 · £ 2,410.00 ≈ € 2,853.92 · +12.4%`)
      - `BTC · Bitcoin` (`0.006 BTC · € 385.58 · +9.1%`)
    - `TabBar` (`CIhfk`) with `Wealth` (`tab-3`) active.

15. **`07b — Add Holding` (`390 × 844`, `x: 1990, y: 3040`)**
    - Bottom sheet (`"Add holding"`): `Ticker / Symbol (VWCE.DE)`, `Asset class (ETF / Stock / Crypto)`, `Shares / Quantity (85)`, `Average cost basis & Currency (EUR)`, and `"Save holding"` pill CTA.

16. **`08 — Net Worth` (`390 × 844`, `x: 2440, y: 3040`)**
    - Header (`height: 310`): `"Net worth"`, `€ 24,350.00` (`+ € 3,120.00 · +14.7% past 6M`), range pills (`1M`, `3M`, `6M` active, `1Y`, `ALL`), and visual SVG/path trend chart + `"Take snapshot"` pill.
    - Sheet:
      - **Asset Allocation card**: `Cash & Checking: € 11,420.50 (46.9%)` · `Investments: € 12,929.50 (53.1%)` with dual-tone progress bar.
      - **Snapshot History**: `6 Nov 2026: € 24,350.00`, `1 Oct 2026: € 23,110.00`, `1 Sep 2026: € 22,480.00`.
    - `TabBar` (`CIhfk`) with `Wealth` (`tab-3`) active.

17. **`09 — Settings & Account` (`390 × 844`, `x: 2890, y: 3040`)**
    - Header: `"Settings & Account"`, `nuno@norte.app · Personal workspace`.
    - Sheet:
      - **Regional & Reporting**: `Reporting Currency (EUR € | GBP £)`, `Language (English | Português PT)`.
      - **Merchant Category Rules**: `12 active rules (Lidl → Groceries, Uber → Transport...)` + `"Re-run rules on uncategorised"` pill button.
      - **Security**: `New password` & `Confirm password` inputs + `"Update password"` primary pill + `"Sign out"` ghost danger pill.
    - `TabBar` (`CIhfk`) with `More` (`tab-4`) active.

18. **`10 — Login` (`390 × 844`, `x: 3340, y: 3040`)**
    - Full-bleed Norte gradient (`#0D1525` → `#0EB5D4` → `#0A0F1C`) with status bar.
    - Top hero brand block: Norte shield logo (`56 × 56`, `./logo.png`), `"NORTE"` (`36px`, `ExtraBold`), `"Personal Finance & Wealth Tracker"` (`14px`, `#FFFFFFCC`).
    - Authentication Card (`#FFFFFF`, `cornerRadius: 24`, `padding: 24`, `gap: 16`):
      - `"Welcome back, Nuno"` (`22px`, `Bold`, `#0D1525`) + `"Sign in with your Supabase credentials"` (`13px`, `#64748B`).
      - Borderless light-grey filled inputs (`Email: nuno@norte.app`, `Password: ••••••••••••`).
      - Full-width solid `#0EB5D4` pill CTA (`"Sign in"`).
      - Security note (`lock` icon + `"Private single-user instance · Public sign-up is disabled"`).
