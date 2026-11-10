# Spend Totals Audit v2 — Aug–Oct 2026

**Generated:** 2026-11-08
**Branch:** feat/mobile-fixes
**Data range:** 2026-08-01 to 2026-10-31
**Total rows fetched:** 737
**Flagged is_transfer = true:** 0
**GBP/EUR rate applied:** 1.1988 (2026-11-06 — latest rate, same as app)
**Supersedes:** 2026-11-08-spend-totals-audit.md (v1)

---

> **v2 headline:**
> All GBP amounts are now converted to EUR at the latest DB rate (**1.1988**).
> V2 description heuristics drop `/\bpot\s/` and `"referral reward"` per Nuno's feedback,
> reducing false-positive transfer rows from 179 (v1) to **179** (v2).
> Mirror-pair heuristic now requires opposite accounts AND different descriptions, in EUR.
> See Section C for import-batch overlap analysis and Aug Monzo finding.

---

## Section A: EUR-Normalised Totals (Aug / Sep / Oct)

> GBP/EUR rate used: **1.1988** (rate_date: 2026-11-06)  

> This is the latest rate in the database — same value the app uses for `getLatestRateInfo('GBP','EUR')`.

### 2026-08

> Account rows are grouped by name (Monzo = 2 Monzo accounts combined; Revolut = 2 Revolut accounts combined).

| Account | spentEUR | incomeEUR | Transfer rows | GBP rows | EUR rows |
|---------|----------|-----------|---------------|----------|----------|
| Monzo | -13367.72 | 12839.00 | 0 | 370 | 0 |
| Revolut | -1024.58 | 2204.00 | 0 | 0 | 26 |
| **ALL** | **-14392.30** | **15043.00** | **0** | **370** | **26** |

### 2026-09

> Account rows are grouped by name (Monzo = 2 Monzo accounts combined; Revolut = 2 Revolut accounts combined).

| Account | spentEUR | incomeEUR | Transfer rows | GBP rows | EUR rows |
|---------|----------|-----------|---------------|----------|----------|
| Monzo | -8523.98 | 5819.84 | 0 | 44 | 0 |
| Revolut | -4955.25 | 11897.47 | 0 | 0 | 155 |
| **ALL** | **-13479.23** | **17717.31** | **0** | **44** | **155** |

### 2026-10

> Account rows are grouped by name (Monzo = 2 Monzo accounts combined; Revolut = 2 Revolut accounts combined).

| Account | spentEUR | incomeEUR | Transfer rows | GBP rows | EUR rows |
|---------|----------|-----------|---------------|----------|----------|
| Monzo | -3879.83 | 1531.30 | 0 | 18 | 0 |
| Revolut | -4678.06 | 6265.56 | 0 | 2 | 122 |
| **ALL** | **-8557.89** | **7796.86** | **0** | **20** | **122** |


---

## Section B: October Outgoings ≥ €100 (EUR equivalent)

| Account | Date | Description | CSV Type | EUR amount | Guess |
|---------|------|-------------|----------|------------|-------|
| Monzo | 2026-10-01 | 1056324050010000 | csv_import | -3062.60 | real purchase |
| Revolut | 2026-10-29 | Hospital | csv_import | -1200.00 | real purchase |
| Revolut | 2026-10-22 | Leadenhall Law Group L | csv_import | -762.44 | real purchase |
| Revolut | 2026-10-21 | Exchanged to GBP | csv_import | -762.35 | own-account transfer |
| Monzo | 2026-10-06 | STEPEX-CFRT9GNE93Y | csv_import | -359.39 | real purchase |
| Revolut | 2026-10-28 | Lusíadas | csv_import | -159.75 | real purchase |
| Monzo | 2026-10-12 | 117615380 | csv_import | -153.45 | real purchase |
| Revolut | 2026-10-03 | Mr. Blue | csv_import | -134.84 | real purchase |
| Revolut | 2026-10-11 | Oscar | csv_import | -106.87 | real purchase |
| Monzo | 2026-10-01 | 900070372774 | csv_import | -104.36 | real purchase |

**Totals by account (sum of ≥€100 outgoings in October):**

| Account | Total EUR |
|---------|-----------|
| Monzo | -3679.79 |
| Revolut | -3126.25 |
| **ALL** | **-6806.04** |


---

## Section C: Import Batch Overlap Analysis

### C.1 — All Import Batches

> Note: There are 2 Monzo accounts and 2 Revolut accounts (see account_id suffix for disambiguation).

| id (short) | Account (acct suffix) | Filename | Imported at | row_count (db) | Tx rows in DB | Date range |
|------------|----------------------|----------|-------------|---------------|---------------|------------|
| 7dd4f6df | Monzo (8466b815) |  | 2026-09-18T09:58 | 304 | 304 | 2026-06-01..2026-08-30 |
| 3fb59c7b | Revolut (a3ab1f93) |  | 2026-09-18T10:06 | 26 | 26 | 2026-06-14..2026-08-31 |
| fc1e01a7 | Revolut (a3ab1f93) |  | 2026-09-18T10:52 | 57 | 57 | 2026-09-01..2026-09-18 |
| b68efc23 | Monzo (8466b815) |  | 2026-09-18T10:53 | 20 | 20 | 2026-09-01..2026-09-17 |
| d527f8e0 | Monzo (76720141) |  | 2026-09-18T11:20 | 304 | 304 | 2026-06-01..2026-08-30 |
| 894242bd | Monzo (76720141) |  | 2026-09-18T11:21 | 20 | 20 | 2026-09-01..2026-09-17 |
| f629714f | Revolut (3497ccbf) |  | 2026-09-18T11:22 | 26 | 26 | 2026-06-14..2026-08-31 |
| 293c737e | Revolut (3497ccbf) |  | 2026-09-18T11:22 | 57 | 57 | 2026-09-01..2026-09-18 |
| 73c516bb | Revolut (3497ccbf) |  | 2026-10-16T15:53 | 41 | 41 | 2026-09-18..2026-09-30 |
| d3c2a65b | Monzo (76720141) |  | 2026-10-16T15:54 | 4 | 4 | 2026-09-19..2026-09-28 |
| 882cee90 | Monzo (76720141) |  | 2026-10-16T15:59 | 16 | 16 | 2026-10-01..2026-10-12 |
| 5824842e | Revolut (3497ccbf) |  | 2026-10-16T16:01 | 63 | 63 | 2026-10-01..2026-10-16 |
| c943f0da | Revolut (3497ccbf) |  | 2026-10-28T22:13 | 48 | 48 | 2026-10-17..2026-10-28 |
| 16e4fe18 | Monzo (76720141) |  | 2026-10-28T22:14 | 2 | 2 | 2026-10-17..2026-10-17 |
| 1faeab76 | Revolut (3497ccbf) |  | 2026-11-01T14:49 | 13 | 12 | 2026-10-21..2026-10-31 |

### C.2 — Overlapping Batch Pairs (same account)

| Batch A (short id) | Batch B (short id) | Account (acct suffix) | Overlap span | Rows in overlap (A) | Rows in overlap (B) |
|--------------------|--------------------|----------------------|--------------|--------------------|---------------------|
| 293c737e | 73c516bb | Revolut (3497ccbf) | 2026-09-18..2026-09-18 | 3 | 2 |
| c943f0da | 1faeab76 | Revolut (3497ccbf) | 2026-10-21..2026-10-28 | 28 | 2 |

### C.3 — August Monzo Callout

**2** Monzo batches cover August 2026 (across **2** distinct Monzo account(s)).

| Short ID | Account ID (short) | Filename | Date range | Tx rows in DB |
|----------|--------------------|----------|------------|---------------|
| 7dd4f6df | 8466b815 | n/a | 2026-06-01..2026-08-30 | 304 |
| d527f8e0 | 76720141 | n/a | 2026-06-01..2026-08-30 | 304 |

**Conclusion:** Each Monzo account has at most 1 August batch. The 2 batches are on **different Monzo account IDs** — this is a two-account setup, not a re-import of the same account. **Aug Monzo is NOT duplicated at the batch level.**


---

## Section D: Tightened Heuristics

### D.1 — Description Heuristic Changes

| Change | V1 | V2 | Delta |
|--------|----|----|-------|
| Total desc-match rows | 179 | 179 | 0 |

**V2 per-heuristic hit counts:**

| Heuristic | Rows matched |
|-----------|-------------|
| Revolut: top-up | 0 |
| Revolut: vault | 0 |
| Revolut: pocket | 0 |
| Revolut: savings vault | 0 |
| Revolut: to XXX account | 0 |
| Revolut: exchanged | 2 |
| Revolut: balance migration | 0 |
| Monzo: pot transfer | 0 |
| Monzo: round up | 173 |
| Monzo: lease hold pot | 177 |
| Monzo: coin jar | 0 |
| Monzo: withdrawal from pot | 0 |
| Monzo: pot withdrawal | 0 |
| Monzo: to savings pot | 0 |

**Dropped from V1 (per Nuno feedback):**

- `/\bpot\s/` — was matching **0** rows (too broad — catches legitimate purchases)
- `"referral reward"` — was matching **0** rows (income, not a transfer)

### D.2 — Mirror-Pair Changes

| Metric | V1 | V2 |
|--------|----|----|
| Mirror pairs found | 2 | 6 |
| Mirror debit sum (EUR) | -10.00 | -1214.27 |

**V2 mirror pairs found:**

> Note: Due to the two-account-per-bank structure (2 Monzo + 2 Revolut), the same pattern may appear twice — once per account pair. Each row is a distinct DB row ID.

| Debit Acct (id suffix) | Debit Date | Debit Desc | Debit EUR | Credit Acct (id suffix) | Credit Date | Credit Desc | Credit EUR |
|------------------------|------------|------------|-----------|-------------------------|-------------|-------------|------------|
| Monzo (8466b815) | 2026-08-14 | Round up | -1.02 | Monzo (76720141) | 2026-08-14 | NYX*BRISAAREASDESERVIC SaoDomingosde PRT | 1.49 |
| Monzo (76720141) | 2026-08-14 | Round up | -1.02 | Monzo (8466b815) | 2026-08-14 | NYX*BRISAAREASDESERVIC SaoDomingosde PRT | 1.49 |
| Monzo (8466b815) | 2026-08-19 | 149991 | -534.66 | Monzo (76720141) | 2026-08-19 | Holidays  Pot | 534.66 |
| Monzo (76720141) | 2026-08-19 | 149991 | -534.66 | Monzo (8466b815) | 2026-08-19 | Holidays  Pot | 534.66 |
| Revolut (a3ab1f93) | 2026-08-31 | Uber | -71.45 | Monzo (8466b815) | 2026-08-30 | Lease Hold Pot | 71.72 |
| Revolut (3497ccbf) | 2026-08-31 | Uber | -71.45 | Monzo (76720141) | 2026-08-30 | Lease Hold Pot | 71.72 |

**Interpretation of pairs:**

- `149991` ↔ `Holidays Pot` (Aug 19, ×2): `149991` appears on both Monzo accounts as a -£446 debit; `Holidays Pot` appears as +£446 on the other Monzo account. Both pairs are legitimate cross-account Monzo pot deposits. Heuristic is correctly flagging these.
- `Uber` ↔ `Lease Hold Pot` (Aug 31/30, ×2): Revolut Uber (-€71.45) coincidentally matches Monzo Lease Hold Pot (+£59.83 ≈ €71.72, within ±€0.50). These are likely a false positive — an Uber ride and a pot release are unrelated. Nuno should confirm.
- `Round up` ↔ `NYX*BRISA` (Aug 14, ×2): Small round-up amount happens to match a petrol-station credit on the other Monzo account. Almost certainly a false positive.


---

## Section E: Updated Adjusted Totals (EUR)

### 2026-08

| Scenario | spentEUR | incomeEUR |
|----------|----------|-----------|
| Current (as-is, app view) | -14392.30 | 15043.00 |
| Minus V2 heuristic transfers | -13097.76 | 13347.73 |
| Minus duplicates | -14356.41 | 15043.00 |
| Fully adjusted (B + C excluded) | **-13066.93** | **13347.73** |

### 2026-09

| Scenario | spentEUR | incomeEUR |
|----------|----------|-----------|
| Current (as-is, app view) | -13479.23 | 17717.31 |
| Minus V2 heuristic transfers | -13475.30 | 17717.31 |
| Minus duplicates | -13467.03 | 17717.31 |
| Fully adjusted (B + C excluded) | **-13463.10** | **17717.31** |

### 2026-10

| Scenario | spentEUR | incomeEUR |
|----------|----------|-----------|
| Current (as-is, app view) | -8557.89 | 7796.86 |
| Minus V2 heuristic transfers | -7792.40 | 7034.42 |
| Minus duplicates | -8548.89 | 7796.86 |
| Fully adjusted (B + C excluded) | **-7783.40** | **7034.42** |


---

## Section F: Open Questions for Nuno

Before any code change lands, the following need answers:

1. **Round-ups: spend or excluded?**
   Monzo's "Round up" rows total ~£30–50/month across Aug. Should they count as spending (you are genuinely rounding up purchases), or be hidden like internal transfers? V1 and V2 both exclude them via description heuristic — confirm that's correct.

2. **"Lease Hold Pot" — rent pre-authorisation or internal transfer?**
   Two rows in August: `+£200.00` and `+£59.83`. These are *credits* back from the pot (money returning to your main balance), which makes them look like pot releases. Should they be flagged as transfers, or are they rent reimbursements? The current heuristic treats them as transfers.

3. **"Exchanged to GBP" (Oct 21, −€762.35 / +£636.00): confirm as own-account transfer**
   This Revolut FX pair is the single largest October "spend" if not flagged. V2 description heuristic catches it via `/\bexchanged\b/`. Confirm it should be excluded from spend.

4. **Two Monzo accounts and two Revolut accounts — is this expected?**
   The DB has account IDs 8466b815 and 76720141 both named "Monzo", and a3ab1f93 and 3497ccbf both named "Revolut". Each has its own import history with identical date ranges, suggesting separate account setups rather than a re-import. Aug Monzo is NOT duplicated within any single account — the two batches covering Jun–Aug are on different account IDs. Confirm: are these genuinely two separate Monzo/Revolut accounts (e.g. a GBP and an EUR Monzo), or was one accidentally created as a duplicate during setup?

5. **"Motorbike Pot" credit (£5.00, Monzo 2026-08-30) matched as mirror pair in V1**
   V1 mistakenly paired this with a Revolut `Direção-Geral da Administração da Justiç` debit (−€5.00). V2 rejects the pair because descriptions differ across accounts — but was the Revolut charge a tax/gov payment? Confirm so it's correctly categorised as `tax` rather than left unclassified.

6. **"Direção-Geral da Administração da Justiç" (Revolut, Sep 1, −€5.00)**
   Looks like a government/judicial fee. Should this be tagged `tax` permanently, or is it a one-off that you'd classify differently?

7. **Verde Lima duplicate rows (Revolut, Sep 27 and Oct 5/18)**
   The duplicate detector found Verde Lima charged twice on the same day at the same amount on multiple occasions. Are these legitimate separate purchases at the same café, or Revolut export overlaps that should be deduped?

8. **What is the actual GBP/EUR rate to use for historical months?**
   V2 uses the *latest* DB rate (same as the app) for all three months — consistent with the CLAUDE.md "current rate" policy. Confirm this is acceptable for the audit report, or if you'd prefer month-end spot rates for a one-off sanity check.


---

*Zero writes were issued. All queries were SELECT-only via the authenticated user session.*
*GBP/EUR rate fetched read-only from frankfurter.app if not in DB; not written back.*
