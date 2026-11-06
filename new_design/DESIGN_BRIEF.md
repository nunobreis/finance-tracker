# Norte — New Design Brief (Revolut-inspired)

Context for a Claude Code session that works on `new_design/new_design.pen`
with the Pencil tools. Read this file first, then the project's `CLAUDE.md`.

## Goal
Redesign Norte's existing user journeys in `new_design.pen`. Use the screens in
`revolut_reference/` as **inspiration for the visual language**, not as
something to copy. Norte keeps its own name, logo and identity: no Revolut
wordmark, coin or card art, and no copied illustrations.

## Starting state
- `new_design.pen` is **empty (0 bytes)**, so build it from scratch.
- `../finance-tracker-ui.pen` is the **current** design. Read it to see the
  existing screens and components. Don't edit it.
- `revolut_reference/` holds 18 phone screens (onboarding, sign-up/OTP,
  identity, home, profile, card picker). They are 360x900 Mobbin captures with
  a "curated by Mobbin" footer, which you should ignore.

## Visual language to take from the reference
- **Type:** large, bold, sentence-case page titles (about 32px), with muted
  grey helper text underneath. Welcome/hero moments use heavy UPPERCASE
  display type.
- **Colour:** mostly white or very light grey (#F4F5F7-ish) backgrounds. One
  strong primary blue for main CTAs and links. Black for secondary emphasis.
  The home hero uses a saturated blue-to-purple gradient.
- **Buttons:** full-width pill buttons. Primary is solid blue. Secondary is a
  pale tint of blue with blue text, or a black/white pill pair. Disabled is a
  washed-out tint of the primary.
- **Inputs:** borderless, light-grey filled fields with rounded corners
  (about 12px) and a floating label once filled. Segmented fields for codes
  and dates.
- **Cards:** white cards with 16–20px radius on a grey canvas, and generous
  padding. A section title with a chevron (for example "Total wealth >").
- **List rows:** a circular coloured icon, then title and subtitle on the
  left, with the amount on the right and a muted secondary value (% or
  count) below it.
- **Home:** a big balance figure, a row of 4 circular quick actions with
  labels, then widget cards. A text tab row along the top and a bottom tab
  bar (icon + label).
- **Empty and promo states:** a soft 3D-style illustration placeholder, a
  short headline and a single CTA.

## Norte journeys to redesign (from `app/`)
1. **Auth:** Login (email/password, Supabase). There is no public sign-up.
2. **Dashboard:** spending card, upcoming bills, recent transactions.
3. **Accounts:** account cards (EUR/GBP), summary, Add account drawer.
4. **Transactions:** list + filters, summary, Add transaction drawer.
5. **CSV import:** a 4-step flow: Upload → Map columns → Preview → Confirm.
6. **Budgets:** summary, budget table/variance, Add budget drawer.
7. **Recurring bills:** summary, bills list, Mark paid, Add bill drawer.
8. **Investments:** summary, holdings, Refresh prices, Add holding.
9. **Net worth:** summary, chart, breakdown, snapshot history.
10. **Settings and Account:** settings form, change password.

## Domain rules the design must respect
- Multi-currency. Each account and transaction shows its native currency
  (EUR or GBP). Totals are in EUR.
- Transfers between own accounts are shown as linked pairs and are excluded
  from spending.
- CSV imports are batches that can be undone as a unit, so show batch
  info and a way to delete a batch.
- The app is bilingual (PT-PT / EN; see `messages/`), so leave room for
  longer Portuguese labels.

## Open decision (confirm with Nuno before going wide)
- **Mobile-first only, or mobile + desktop?** The reference is all phone, and
  the current app has a desktop sidebar with a responsive mobile layout.
  Suggested approach: design mobile (390px) first, then a desktop variant of
  the Dashboard and Transactions only.
- Bottom tab set suggestion: Home · Transactions · Budgets · Wealth · More.

## Suggested working order
1. Read the current `.pen` file and a sample of the reference images.
   Summarise your understanding back to Nuno before drawing anything.
2. Build a foundations artboard: colour tokens, type scale, spacing, radii,
   buttons, inputs, list row, card, tab bar and drawer/bottom sheet.
3. Design the Dashboard (home) and get feedback on it.
4. Then Transactions + CSV import, Accounts, Budgets, Bills, Investments,
   Net worth, Settings, Login.
5. Name artboards by journey and step (for example `05-Import / 2-Map`).
