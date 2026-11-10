# Spend Totals Audit — Aug–Oct 2026

**Generated:** 2026-11-08
**Branch:** feat/mobile-fixes
**Data range:** 2026-08-01 to 2026-10-31
**Total rows fetched:** 737
**Flagged is_transfer = true:** 0

---

> **Key finding:** 183 non-flagged rows match transfer heuristics,
> representing approximately **€847** of mis-booked debit-side spend
> across the three months.  21 likely-duplicate excess rows also identified.

---

## A. Totals As Currently Computed

### 2026-08

**By account:**

| Account | Spent (sum of negatives) | Income (sum of positives) | Transfer rows | Transfer sum |
|---------|--------------------------|---------------------------|---------------|--------------|
| Monzo | -11150.92 | 10709.88 | 0 | 0.00 |
| Revolut | -1024.58 | 2204.00 | 0 | 0.00 |
| **ALL** | **-12175.50** | **12913.88** | **0** | **0.00** |

### 2026-09

**By account:**

| Account | Spent (sum of negatives) | Income (sum of positives) | Transfer rows | Transfer sum |
|---------|--------------------------|---------------------------|---------------|--------------|
| Monzo | -7110.43 | 4854.72 | 0 | 0.00 |
| Revolut | -4955.25 | 11897.47 | 0 | 0.00 |
| **ALL** | **-12065.68** | **16752.19** | **0** | **0.00** |

### 2026-10

**By account:**

| Account | Spent (sum of negatives) | Income (sum of positives) | Transfer rows | Transfer sum |
|---------|--------------------------|---------------------------|---------------|--------------|
| Monzo | -3236.43 | 1277.36 | 0 | 0.00 |
| Revolut | -4551.62 | 6139.12 | 0 | 0.00 |
| **ALL** | **-7788.05** | **7416.48** | **0** | **0.00** |


---

## B. Likely-Transfer Rows (Not Flagged is_transfer = true)

### B.1 — Description Heuristics (top-up / vault / pot / exchange)

| Account | Date | Description | Amount | Currency | Row ID | Heuristic Matched |
|---------|------|-------------|--------|----------|--------|-------------------|
| Monzo | 2026-08-01 | Round up | -0.72 | GBP | 56621db4-9c1d-4f4d-b3ce-318184e2fcad | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-01 | Round up | -0.79 | GBP | 19b4bd5c-873b-4a35-82bc-99128552d88a | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-01 | Round up | -0.29 | GBP | 3ce71f70-f7dc-4f6f-822c-430106050c22 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-01 | Round up | -0.72 | GBP | a79fd9cd-559b-4560-b037-976df1073a1d | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-01 | Round up | -0.79 | GBP | 846863e5-af12-4332-88c9-b152da570f49 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-01 | Round up | -0.72 | GBP | bf0279cf-6b35-474d-9927-e46639c791cc | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-01 | Round up | -0.72 | GBP | 5742295b-dd9c-4c32-a7b3-91101a49eb1d | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-01 | Round up | -0.65 | GBP | 888c3e6e-ae3f-4195-b6c2-18863615ab3f | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-01 | Round up | -0.45 | GBP | ce5c9280-9923-4696-814f-4b9bd2ae9363 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-01 | Round up | -0.65 | GBP | 8262c654-bb7c-4fb2-ab42-f60a9e2d8cbc | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-01 | Round up | -0.45 | GBP | 4044612b-bc1d-4ddf-9b54-0d8defa67a1f | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-01 | Round up | -0.29 | GBP | 44bf843b-37ec-45dc-bc6e-333ea3d9c0f4 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-03 | Round up | -0.14 | GBP | 241851c6-f111-4e50-a8ca-512a8cb5c1c5 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-03 | Round up | -0.14 | GBP | 4eb68d3a-3493-4dd0-9821-409a81f2201e | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-03 | Round up | -0.88 | GBP | 93319c5a-2068-4e30-b7bc-4a921f146c40 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-03 | Round up | -0.79 | GBP | f1555fe2-978c-4b0e-9e64-bf5d9d483fcb | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-03 | Round up | -0.79 | GBP | 22e4c4a1-6baf-4f41-8e8d-698d0c12d67b | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-03 | Round up | -0.43 | GBP | 69413b42-cec9-4937-87f9-486874464b18 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-03 | Round up | -0.57 | GBP | b50511c3-d7bc-4c1c-be3a-944e985eacc9 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-03 | Round up | -0.57 | GBP | 208090a6-b374-4bc0-aec4-30d5f61572c6 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-03 | Round up | -0.14 | GBP | 5f1af422-487c-4786-87b7-3d5ba3abf919 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-03 | Round up | -0.14 | GBP | ead77f9e-e636-4af7-b077-60798a672aab | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-03 | Round up | -0.88 | GBP | 09c2cc9e-c80a-4ee5-bf1b-50ef463a068c | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-03 | Round up | -0.43 | GBP | 1c1b22bc-19dc-4746-a262-e7efdf88b508 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-03 | Round up | -0.57 | GBP | 925027ba-4269-4fdd-84db-dd53f7e65369 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-03 | Round up | -0.57 | GBP | a4f9c1a2-84b9-4b05-8ad4-379d57c5b83a | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-04 | Round up | -0.70 | GBP | 9c2a47b6-8da2-4a44-9e3e-81839c50cad6 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-04 | Round up | -0.88 | GBP | e8074b74-1990-4a45-8aa4-cf88f1ae340c | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-04 | Round up | -0.08 | GBP | 12f21f81-8de7-4d9a-a5bf-8b3366aa2cca | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-04 | Round up | -0.94 | GBP | 8c4aad33-61d5-41ed-a1bc-2cb4c7f0f8d8 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-04 | Round up | -0.37 | GBP | a737e1ec-8168-4676-9f52-4a801e242217 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-04 | Round up | -0.36 | GBP | 7aaca878-8c38-4e18-839f-493878682a0a | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-04 | Round up | -0.36 | GBP | 0a13cec3-a367-4f2f-9e99-a9c599537721 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-04 | Round up | -0.37 | GBP | 074108b8-8565-47d5-b6ce-e73b6c43243b | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-04 | Round up | -0.94 | GBP | 56f587c4-16b6-479b-9e08-f063d825d283 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-04 | Round up | -0.08 | GBP | b9025685-f044-419c-9c52-542159b3e42c | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-04 | Round up | -0.88 | GBP | 63b4235c-f158-4044-b339-964ebce56c1a | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-04 | Round up | -0.70 | GBP | 3a1fe84b-06c8-42eb-9b94-b71ff98797d3 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-05 | Round up | -0.55 | GBP | 82028d1a-a5a7-467a-9e44-c938ac3ec7ae | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-05 | Round up | -0.55 | GBP | aa263cac-d51f-4169-85ba-0672a0f98c3b | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-06 | Lease Hold Pot | 200.00 | GBP | 2dcab23f-df95-4e86-a9fd-56283f4ff2db | Monzo internal: \blease hold pot\b |
| Monzo | 2026-08-06 | Round up | -0.85 | GBP | 0d7b072d-f63e-4d1c-8175-bff788565553 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-06 | Lease Hold Pot | 200.00 | GBP | daf0e464-0ece-47dc-a7fe-5b19d766e4c9 | Monzo internal: \blease hold pot\b |
| Monzo | 2026-08-06 | Round up | -0.85 | GBP | c32a1ae3-43a4-45bb-8830-7ecf7eb63d7b | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-07 | Round up | -0.50 | GBP | b8d0b3d9-c6a7-4121-a75a-a6957d44e015 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-07 | Round up | -0.50 | GBP | f6cdc861-3441-45ac-8573-c747dcb39384 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-08 | Round up | -0.84 | GBP | 7301a301-60ad-4dee-b66c-685bab6d34fc | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-08 | Round up | -0.84 | GBP | a2b1748d-3722-4f83-bb51-d73ea617ca74 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-08 | Round up | -0.40 | GBP | c187c8f8-bf30-4f0f-ae52-6a9ce733e3b6 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-08 | Round up | -0.40 | GBP | 12bd2fd8-e017-4459-b739-b2ca541cfff2 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-09 | Round up | -0.64 | GBP | 733746c5-1b4e-4b9b-bfbf-d31a52289e11 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-09 | Round up | -0.23 | GBP | 56bd1b72-c04c-423f-b524-dc1f72142284 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-09 | Round up | -0.33 | GBP | 2514e542-fe56-4dbb-8dc3-0bd3b4e57406 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-09 | Round up | -0.94 | GBP | 60e242f6-d879-417c-a6de-18f01ad7f929 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-09 | Round up | -0.92 | GBP | 769f911d-d149-473f-a347-bc403bc00454 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-09 | Round up | -0.22 | GBP | 1184f55d-effe-4afb-b0e1-70b3e89d8050 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-09 | Round up | -0.94 | GBP | 2d00ce15-ef30-47b1-8d2d-fd887d64c3eb | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-09 | Round up | -0.03 | GBP | f7e379ff-44af-4080-9c61-a72d16c47d9d | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-09 | Round up | -0.03 | GBP | ab7ebcb9-d9f8-4f2d-b22a-09202d7ab89a | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-09 | Round up | -0.22 | GBP | f9ffd4d0-b196-4eaf-be64-55399c27fd0b | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-09 | Round up | -0.92 | GBP | 831fffb9-a668-4b20-a197-5dbd83020d2f | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-09 | Round up | -0.23 | GBP | 3e5c1cf7-1803-4899-9bb5-2cff860dde22 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-09 | Round up | -0.33 | GBP | 1ce71469-a92a-4578-a69a-7bca18b36ab8 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-09 | Round up | -0.64 | GBP | b7d149d9-4125-436f-9b72-73d380bbc492 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-10 | Round up | -0.75 | GBP | b733ae1d-ad54-4050-8878-8464bc5179a4 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-10 | Round up | -0.75 | GBP | 9c6d6541-1b65-4a6e-b0ac-d4990f24c80d | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-10 | Round up | -0.01 | GBP | 92d1a13c-9718-404a-a07c-67e3a1ee42d8 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-10 | Round up | -0.11 | GBP | 16c02560-29eb-4fba-a49b-7b5af69e01f4 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-10 | Round up | -0.63 | GBP | 9fd606be-fa7c-4b23-8765-091501eb4494 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-10 | Round up | -0.15 | GBP | b8cc3d8b-628f-46e2-8999-23767772c404 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-10 | Round up | -0.15 | GBP | 75834797-9055-41bb-a56c-e0297279241b | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-10 | Round up | -0.63 | GBP | 612b7b91-4e87-441e-9e01-ebc6983e768f | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-10 | Round up | -0.11 | GBP | 6e36d018-f60e-475a-a0b2-98a790257c5c | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-10 | Round up | -0.01 | GBP | 7770ec10-87e7-4629-9ace-f4a4d83eb352 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-11 | Round up | -0.99 | GBP | 8c2fe76c-852a-4b6e-bee9-2e28521cfed5 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-11 | Round up | -0.01 | GBP | 19948c1a-a44f-4adc-8f1c-63fc61459c4c | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-11 | Round up | -0.01 | GBP | bbc48cc3-f912-4789-83d4-eeeb0a175fde | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-11 | Round up | -0.15 | GBP | 11ac10f0-b594-4e8a-988c-0bd2f240bac1 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-11 | Round up | -0.20 | GBP | c621143f-eccc-4774-b106-7a2d613e0a38 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-11 | Round up | -0.99 | GBP | 8db13691-59ae-4d30-9b41-44cf00f6623a | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-11 | Round up | -0.15 | GBP | 6ea9410b-c7c4-43b1-91e2-1b9604095a00 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-11 | Round up | -0.20 | GBP | e341202f-be14-4c3b-8d28-11c8232ce69e | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-12 | Round up | -0.01 | GBP | 36f1f17a-78fb-40c0-aefa-42cb8da7ffa5 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-12 | Round up | -0.05 | GBP | d97d6597-e321-4c6b-a440-0efde4f0a1dc | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-12 | Round up | -0.10 | GBP | 6cb4ba1c-6503-41f6-82fb-bd03f62bc738 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-12 | Round up | -0.05 | GBP | e01c842e-8e57-4f9b-96ea-26709c717f3a | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-12 | Round up | -0.01 | GBP | 5e2dca0f-a346-42a5-b6f6-cbbec6d8a3fc | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-12 | Round up | -0.10 | GBP | f53af662-085f-4de2-8669-43749b880279 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-13 | Round up | -0.60 | GBP | 59b71ee5-2958-40dc-82be-9bb1fed763a2 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-13 | Round up | -0.60 | GBP | b1c70e08-e7a4-43a1-b04e-a94e18e3cb08 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-14 | Round up | -0.25 | GBP | 496eb349-a48e-4f62-af38-4ed706b54aab | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-14 | Round up | -0.85 | GBP | f0e2551c-c086-4931-ba87-d0ef6406f1ac | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-14 | Round up | -0.25 | GBP | d09d8806-15f4-4111-85ae-e15665c7d533 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-14 | Round up | -0.25 | GBP | bfbf96ef-1b3c-44de-a22b-db0ddef60572 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-14 | Round up | -0.51 | GBP | 09e97a3d-1090-41f8-8514-50d8fa834889 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-14 | Round up | -0.44 | GBP | 5828efc7-40e0-4b04-8112-1338c555a057 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-14 | Round up | -0.76 | GBP | f1bb9992-7533-4bea-b787-5807a1da4342 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-14 | Round up | -0.45 | GBP | 5183f8b3-1352-4ed3-a245-c7479deb3941 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-14 | Round up | -0.85 | GBP | 52ae0fde-7d3a-4f84-9490-362177913044 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-14 | Round up | -0.25 | GBP | 8f405165-1ae2-43bc-a3bc-a084df6b2797 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-14 | Round up | -0.51 | GBP | 94128d90-11db-4bed-962a-35302b9ce7b1 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-14 | Round up | -0.44 | GBP | 46c1e5e8-f59d-4bc4-9e9a-3e354051ea77 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-14 | Round up | -0.76 | GBP | 4c9f81d0-39aa-4657-9857-9d2693fca771 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-14 | Round up | -0.45 | GBP | 225323ed-f7ad-490d-ab10-68c2d64a8e71 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-15 | Round up | -0.19 | GBP | c131e774-b65f-4346-bf89-41aa81eb77c0 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-15 | Round up | -0.19 | GBP | 4f6079f2-ebcc-4ad1-8c43-5f096929f38b | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-15 | Round up | -0.30 | GBP | c93d247b-07aa-46e3-b0bb-e3f2e47ca437 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-15 | Round up | -0.30 | GBP | f491e148-9bed-4508-af7e-8d73acd18b14 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-17 | Round up | -0.08 | GBP | c15de0ba-1908-4c24-a8dc-1898a1aa6bdf | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-17 | Round up | -0.19 | GBP | 18d451b7-f1e7-4523-b400-2cfef379669a | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-17 | Round up | -0.08 | GBP | bbb4d0a0-463f-49cb-bbf0-282170a3fede | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-17 | Round up | -0.19 | GBP | 81aaad2e-326d-4018-a8b2-0a073e6d50af | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-18 | Round up | -0.03 | GBP | b31ce11c-e973-4e18-8fb7-98ea70d68568 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-18 | Round up | -0.03 | GBP | 95f7c0a2-c04e-4125-8d76-d13f3eae75c5 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-19 | Round up | -0.45 | GBP | 4f05c5c7-fb93-43b3-b4ab-40364e59d728 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-19 | Round up | -0.21 | GBP | 05759fa6-a607-480b-89f0-138c3de8f5b9 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-19 | Round up | -0.28 | GBP | d50b78c8-450f-496c-8160-e9fcfa65b35d | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-19 | Round up | -0.57 | GBP | 2b473f9c-0e7d-47fd-baae-bdb8124b0215 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-19 | Round up | -0.28 | GBP | 73d8ec28-146a-454a-af88-4d165208df36 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-19 | Round up | -0.57 | GBP | c9a4902d-a23b-4fb2-9904-4483660fee4f | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-19 | Round up | -0.21 | GBP | ae04dfec-c3ca-4dbb-9244-8d5f93b07957 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-19 | Round up | -0.45 | GBP | 1b12656a-0e91-4866-b53f-4ce6b518dd57 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-20 | Round up | -0.28 | GBP | db84a76b-3394-460c-88bb-6ab5923a4ebf | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-20 | Round up | -0.87 | GBP | aa74951a-9ba4-4b9b-8b04-52de4bcd596c | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-20 | Round up | -0.28 | GBP | 6f0f5135-a0b3-430d-864f-40c78b38ac02 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-20 | Round up | -0.87 | GBP | af5938da-a9b3-412a-9ffe-47cccfaa1bc1 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-21 | Round up | -0.32 | GBP | a2adef9e-661e-4e6f-905c-01d92cb91b6e | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-21 | Round up | -0.26 | GBP | dbe39892-b7d4-465c-947d-980efb78c283 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-21 | Round up | -0.32 | GBP | 36eb88fa-163f-4176-8cc7-1d56cb9dcc20 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-21 | Round up | -0.03 | GBP | 2092bcf7-f21d-450e-a51f-1594fbedec92 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-21 | Round up | -0.39 | GBP | 7e343e23-260a-46b1-81e5-9ba708277175 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-21 | Round up | -0.39 | GBP | 06d26236-0c50-4980-99f2-b2877f9e2b74 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-21 | Round up | -0.03 | GBP | bd7056d4-f460-4042-a19b-1a297b82d249 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-21 | Round up | -0.26 | GBP | faa95cb2-0abd-48a6-8afc-54e929437c40 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-22 | Round up | -0.10 | GBP | bad23359-8f98-4dc1-b433-fce496f2cc90 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-22 | Round up | -0.10 | GBP | 47e4afba-dd18-4152-afb9-e6731d936731 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-22 | Round up | -0.12 | GBP | 5e695b8b-3b99-43d7-b0d5-a1c9afe52628 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-22 | Round up | -0.12 | GBP | 4c22942a-53d0-44d3-b741-bc540ab17d7f | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-23 | Round up | -0.68 | GBP | 064141c7-1778-46c3-b46d-b04f8d438ff1 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-23 | Round up | -0.13 | GBP | 1014a288-1c2e-42e1-b6be-f532759f572a | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-23 | Round up | -0.13 | GBP | bd594b24-822a-43e7-98c3-ee2e0e270444 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-23 | Round up | -0.68 | GBP | 8b719fb2-a91a-42f8-aa6b-88e500cfd322 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-24 | Round up | -0.43 | GBP | 38e28dab-b691-4f25-b5f3-5fc350e71437 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-24 | Round up | -0.36 | GBP | ab628961-becb-4869-8d8f-dac671144414 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-24 | Round up | -0.43 | GBP | ec5e7025-1af1-477d-8f87-34e18d0d269c | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-24 | Round up | -0.43 | GBP | ea70f545-6e5b-491e-aa09-6ebabee0f298 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-24 | Round up | -0.43 | GBP | e0ab8737-b2fc-4f25-b618-f1c5fada536a | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-24 | Round up | -0.36 | GBP | 262b8e45-24da-4fe2-a9a8-bbe2d4069274 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-25 | Round up | -0.44 | GBP | 4c445726-310c-4de0-b2e5-35e76b3d0a0c | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-25 | Round up | -0.71 | GBP | 67bf4cf4-e670-45f2-8e3a-2a2f6a850552 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-25 | Round up | -0.71 | GBP | c1df8012-885d-4705-9b2f-3b464ccd26fa | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-25 | Round up | -0.44 | GBP | 116be9a3-b9b3-47b8-820c-a57ea8da71e8 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-26 | Round up | -0.58 | GBP | 781adece-a394-487a-aeaf-03f9f45c46e2 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-26 | Round up | -0.71 | GBP | 6e747577-6e54-459d-98bf-107b3d4dbc48 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-26 | Round up | -0.58 | GBP | ad3b23e6-3be0-40ee-ba04-72ba4ecefabe | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-26 | Round up | -0.71 | GBP | 17aae9c5-ea89-4989-9614-1c8392796663 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-27 | Round up | -0.85 | GBP | 41e8edca-ad47-4389-84a7-13f740bc8969 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-27 | Round up | -0.10 | GBP | 31c0e3a6-01a6-4bd8-abdd-0b051ab60a3d | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-27 | Round up | -0.85 | GBP | 2a8cb637-10bc-4b2d-9561-f5c5c83d6572 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-27 | Round up | -0.10 | GBP | a5756e1b-4d1c-401e-8cd6-a272b3a9f554 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-30 | Round up | -0.05 | GBP | 1d06f51d-a043-48be-ada0-f6889cfccac6 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-08-30 | Lease Hold Pot | 59.83 | GBP | 3696d096-45e2-4fff-832b-48fa6243b53e | Monzo internal: \blease hold pot\b |
| Monzo | 2026-08-30 | Lease Hold Pot | 59.83 | GBP | f09e2af2-23c9-4a4e-8c3d-423f5e1628f2 | Monzo internal: \blease hold pot\b |
| Monzo | 2026-08-30 | Round up | -0.05 | GBP | 56c07bb3-3455-4ba0-9dd1-fe62d7517e32 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-09-02 | Round up | -0.68 | GBP | cc79701b-6e37-41d4-a1e6-ad4495553358 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-09-02 | Round up | -0.68 | GBP | 8bee9107-69df-4830-8a40-f848ba977581 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-09-06 | Round up | -0.83 | GBP | 43a8cb18-a034-49ef-a029-8c0baf7d6ebb | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-09-06 | Round up | -0.83 | GBP | 73ae02a0-2b31-4aa1-b1a9-ab18a866c16a | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-09-12 | Round up | -0.01 | GBP | e5b1ddf8-4390-4878-96f9-6ee7a6ebbd81 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-09-12 | Round up | -0.01 | GBP | 4124ac6f-47a9-4d51-80c4-53cc9aad0c7b | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-09-17 | Round up | -0.12 | GBP | 8fcb332d-fa39-4864-9c12-418ea86d07f8 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-09-17 | Round up | -0.12 | GBP | 23fbaef6-721d-47c3-9e3f-b0af9a034cc0 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-10-01 | Round up | -0.71 | GBP | c72b2a7b-b783-42f9-adac-4da935a16b6d | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-10-06 | Round up | -0.95 | GBP | 98dbd33c-554e-4ba8-9e0c-8e3e92939ef5 | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-10-12 | Round up | -0.55 | GBP | 1230bbfb-2b4f-49b0-b803-55115c50094c | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-10-12 | Round up | -0.01 | GBP | 861ead9a-7a07-4099-9063-959881b5b2df | Monzo internal: \bround[\s-]?up\b |
| Monzo | 2026-10-17 | Round up | -0.40 | GBP | 56db7b20-9dd6-4e62-90e8-4eb22add0a03 | Monzo internal: \bround[\s-]?up\b |
| Revolut | 2026-10-21 | Exchanged to GBP | -762.35 | EUR | 17836d56-d4e5-49ba-99fa-ca230c19a0df | Revolut internal: \bexchanged\b |
| Revolut | 2026-10-21 | Exchanged to GBP | 636.00 | GBP | 601217f5-86ac-4c1f-81bc-bb1e01ab779e | Revolut internal: \bexchanged\b |

### B.2 — Cross-Account Mirror Pairs (amount match ±€0.50 within ±2 days)

| Debit Account | Debit Date | Debit Desc | Debit Amount | Credit Account | Credit Date | Credit Desc | Credit Amount | Debit ID | Credit ID |
|---------------|------------|------------|--------------|----------------|-------------|-------------|---------------|----------|-----------|
| Revolut | 2026-09-01 | Direção-Geral da Administração da Justiç | -5.00 | Monzo | 2026-08-30 | Motorbike Pot | 5.00 | 40004507-06e6-4fd2-9c89-aacd23378c6f | f09b3951-6d6b-4359-b257-21109bcf0352 |
| Revolut | 2026-09-01 | Direção-Geral da Administração da Justiç | -5.00 | Monzo | 2026-08-30 | Motorbike Pot | 5.00 | bacafd1c-d04f-4bfd-8fb4-de5dbbae29c5 | 6af1ae06-e26e-40a1-b78d-12a1e796385f |

### B.3 — Likely-Transfer Totals by Month

| Month | Heuristic B.1 count | B.1 debit sum | B.1 credit sum | Mirror pairs | Mirror debit sum |
|-------|---------------------|---------------|----------------|--------------|-----------------|
| 2026-08 | 164 | -68.66 | 519.66 | 0 | 0.00 |
| 2026-09 | 8 | -3.28 | 0.00 | 2 | -10.00 |
| 2026-10 | 7 | -764.97 | 636.00 | 0 | 0.00 |


---

## C. Likely Duplicates

| Group description | Account | Date | Amount | Count | Row IDs |
|-------------------|---------|------|--------|-------|---------|
| Round up | Monzo | 2026-08-01 | -0.72 | 2 | 56621db4-9c1d-4f4d-b3ce-318184e2fcad, 5742295b-dd9c-4c32-a7b3-91101a49eb1d |
| Round up | Monzo | 2026-08-01 | -0.72 | 2 | a79fd9cd-559b-4560-b037-976df1073a1d, bf0279cf-6b35-474d-9927-e46639c791cc |
| Round up | Monzo | 2026-08-03 | -0.14 | 2 | 241851c6-f111-4e50-a8ca-512a8cb5c1c5, 4eb68d3a-3493-4dd0-9821-409a81f2201e |
| QUIOSQUE VERDE LIMA    LISBOA        PRT | Monzo | 2026-08-03 | -6.86 | 2 | 882e6ec9-5cef-45c3-9a75-313281fc49b6, df541acb-9633-48f1-93de-f8bf4dc86c2d |
| QUIOSQUE VERDE LIMA    LISBOA        PRT | Monzo | 2026-08-03 | -3.43 | 2 | 1b7ebbf5-2aea-4cfa-a1c0-677a55ad9c77, 67383d7a-a261-4118-95d9-d1c914a24efd |
| Round up | Monzo | 2026-08-03 | -0.57 | 2 | b50511c3-d7bc-4c1c-be3a-944e985eacc9, 208090a6-b374-4bc0-aec4-30d5f61572c6 |
| QUIOSQUE VERDE LIMA    LISBOA        PRT | Monzo | 2026-08-03 | -6.86 | 2 | 95cb020c-856e-4bc9-aef1-3321a25ce49a, 0100d014-ccbf-465b-9e92-80aca7a48fc0 |
| Round up | Monzo | 2026-08-03 | -0.14 | 2 | 5f1af422-487c-4786-87b7-3d5ba3abf919, ead77f9e-e636-4af7-b077-60798a672aab |
| QUIOSQUE VERDE LIMA    LISBOA        PRT | Monzo | 2026-08-03 | -3.43 | 2 | 42619db7-9642-4ef0-a4be-047aac6997e3, 5bc5383a-c819-4d38-b7f3-9eb326a7e434 |
| Round up | Monzo | 2026-08-03 | -0.57 | 2 | 925027ba-4269-4fdd-84db-dd53f7e65369, a4f9c1a2-84b9-4b05-8ad4-379d57c5b83a |
| Round up | Monzo | 2026-08-14 | -0.25 | 2 | 496eb349-a48e-4f62-af38-4ed706b54aab, 8f405165-1ae2-43bc-a3bc-a084df6b2797 |
| Round up | Monzo | 2026-08-14 | -0.25 | 2 | d09d8806-15f4-4111-85ae-e15665c7d533, bfbf96ef-1b3c-44de-a22b-db0ddef60572 |
| Round up | Monzo | 2026-08-24 | -0.43 | 2 | 38e28dab-b691-4f25-b5f3-5fc350e71437, e0ab8737-b2fc-4f25-b618-f1c5fada536a |
| Round up | Monzo | 2026-08-24 | -0.43 | 2 | ec5e7025-1af1-477d-8f87-34e18d0d269c, ea70f545-6e5b-491e-aa09-6ebabee0f298 |
| CASA DA IGREJA         CACELA VELHA  PRT | Monzo | 2026-08-24 | -2.57 | 2 | 842b7c63-4b92-4dfa-8c74-e9ba8b31b57f, 2ecf7713-641a-48a0-9077-4a166c26206f |
| CASA DA IGREJA         CACELA VELHA  PRT | Monzo | 2026-08-24 | -2.57 | 2 | 2242d2d7-a08c-49e4-8ac8-b034b817a189, 69bc910a-0ea8-4c82-9903-bb0dde9b5888 |
| Verde Lima | Revolut | 2026-09-27 | -8.00 | 2 | d75d5f9d-ec9d-4866-9c37-477231cd1bbd, d48ae659-4471-458f-a580-447e2fcbf0bc |
| Verde Lima | Revolut | 2026-09-27 | -4.20 | 2 | b3f3a043-ac3e-4bdf-b22f-c31180431da2, 45f69d48-e7b5-42ea-8e58-28fd6f19a921 |
| Verde Lima | Revolut | 2026-10-05 | -5.00 | 2 | fd4466b0-d49c-4e7e-bdf9-2160f2d39c28, 6c9c19d3-a545-4775-be87-abc1c4b791ea |
| Verde Lima | Revolut | 2026-10-18 | -4.00 | 2 | d90e281f-2ab6-46d5-b6a6-e3f191d3e8af, d604f0d6-7adc-44f7-8ca0-deee0cd626a3 |
| Corner Quiosque | Revolut | 2026-10-31 | -10.00 | 2 | 8f43e4f5-3011-49df-803d-1733aae7bddf, 386e1c95-5ed9-46c9-9354-e6a16b24b375 |

### C.1 — Duplicate Totals by Month

| Month | Dup groups | Excess rows | Excess debit sum | Excess credit sum |
|-------|-----------|-------------|------------------|-------------------|
| 2026-08 | 16 | 16 | -29.94 | 0.00 |
| 2026-09 | 2 | 2 | -12.20 | 0.00 |
| 2026-10 | 3 | 3 | -19.00 | 0.00 |


---

## D. Adjusted Totals

### 2026-08

| Scenario | Spent | Income |
|----------|-------|--------|
| Current (as-is) | -12175.50 | 12913.88 |
| B excluded (transfers) | -12106.84 | 12384.22 |
| C excluded (dedup) | -12145.56 | 12913.88 |
| B + C excluded | -12081.12 | 12384.22 |

### 2026-09

| Scenario | Spent | Income |
|----------|-------|--------|
| Current (as-is) | -12065.68 | 16752.19 |
| B excluded (transfers) | -12052.40 | 16752.19 |
| C excluded (dedup) | -12053.48 | 16752.19 |
| B + C excluded | -12040.20 | 16752.19 |

### 2026-10

| Scenario | Spent | Income |
|----------|-------|--------|
| Current (as-is) | -7788.05 | 7416.48 |
| B excluded (transfers) | -7023.08 | 6780.48 |
| C excluded (dedup) | -7769.05 | 7416.48 |
| B + C excluded | -7004.08 | 6780.48 |


---

## E. Proposed Fix

### E.1 — Import-Time Detection Rules

Extend the CSV parsers to flag transfers more aggressively at parse time:

```ts
// lib/csv/parsers/revolut.ts
const REVOLUT_TRANSFER_TYPES = /^(TRANSFER|EXCHANGE|TOPUP)$/i

const REVOLUT_TRANSFER_DESC = [
  /\btop[\s-]?up\b/i,            // "Top-Up" in description
  /\bto [A-Z]{3} account\b/i,     // "To GBP Account", "To EUR Account"
  /\bexchanged\b/i,               // currency exchange leg
  /\bvault\b/i,                   // savings vault moves
  /\bpocket\b/i,                  // pocket transfers
  /\bsavings vault\b/i,
  /\bbalance migration\b/i,
  /\breferral reward\b/i,         // referral bonus (income-like but internal)
]

// In parseRevolut mapping:
is_transfer:
  REVOLUT_TRANSFER_TYPES.test(r['Type'] || r['Tipo'] || '') ||
  REVOLUT_TRANSFER_DESC.some(re => re.test(r['Description'] || r['Descrição'] || ''))
```

```ts
// lib/csv/parsers/monzo.ts
const MONZO_TRANSFER_TYPES = /^(pot_transfer|transfer)$/i

const MONZO_TRANSFER_DESC = [
  /\bpot transfer\b/i,
  /\bround[\s-]?up\b/i,          // coin jar round-ups
  /\blease hold pot\b/i,
  /\bcoin jar\b/i,
  /\bwithdrawal from pot\b/i,
  /\bpot withdrawal\b/i,
  /\bto savings pot\b/i,
  /\bpot\s/i,                     // "Pot <name>" prefix
]

// In parseMonzo mapping:
is_transfer:
  MONZO_TRANSFER_TYPES.test(r['Type']?.trim() || '') ||
  MONZO_TRANSFER_DESC.some(re => re.test((r['Description'] ?? '') + ' ' + (r['Name'] ?? '')))
```

---

### E.2 — Pair-Matching Post-Process (design proposal)

**Algorithm**

After an import batch is committed, run a background pass:

1. For each newly-imported row where `is_transfer = false` and `amount < 0`:
   - Search other accounts owned by the same user for a row where:
     - `is_transfer = false`
     - `amount > 0`
     - `|amount_debit_in_EUR - amount_credit_in_EUR| ≤ 0.50`
     - `|occurred_on_debit - occurred_on_credit| ≤ 2 days`
     - Not already paired (`transfer_pair_id IS NULL`)
2. Collect candidate pairs and present them for user confirmation.

**UI flow**

- After import completes, show a "Possible transfers found" banner if candidates > 0.
- A modal lists the pairs: Debit side | Credit side | Amount | Date diff.
- User can: **Link as transfer** (sets `is_transfer = true` + `transfer_pair_id` on both), **Dismiss** (marks as reviewed, hides from future passes), or **Review later**.
- Auto-link only if confidence is very high (exact amount, same day, description contains account name on the other side) — otherwise always require confirmation.

---

### E.3 — Dedup Strategy

**Recommendation: import-time hash dedup with a Review UI for edge cases.**

At import time, compute a fingerprint per row:
`account_id + occurred_on + amount + currency + (external_id || merchant || description)`

Before inserting:
1. If `external_id` is present (Monzo), block on exact external_id match — already implemented.
2. For Revolut (no external_id), block on SHA-256 of the fingerprint stored as `import_hash` on the `transactions` table.
3. If a hash collision exists, skip silently and report the count to the user at import summary.

**Why not a UI review step?** Most Revolut duplicates arise from overlapping date ranges selected on export. They are always exact duplicates (same date + amount + description), so silent skip is safe. Reserve the Review UI for near-matches (Levenshtein ≤ 3) only — those are rarer and worth human judgment.

---

### E.4 — Data Cleanup (identification queries only — no writes)

The following `SELECT` queries identify rows that need cleanup.
Run them in the Supabase SQL Editor; share results before any UPDATE/DELETE.

```sql
-- 1. Revolut internal-movement rows that should be is_transfer = true
SELECT id, account_id, occurred_on, amount, currency, description, merchant, is_transfer
FROM transactions
WHERE occurred_on BETWEEN '2026-08-01' AND '2026-10-31'
  AND is_transfer = false
  AND (
    description ILIKE '%top-up%'
    OR description ILIKE '%top up%'
    OR description ILIKE '%vault%'
    OR description ILIKE '%pocket%'
    OR description ILIKE '%to EUR account%'
    OR description ILIKE '%to GBP account%'
    OR description ILIKE '%exchanged%'
    OR description ILIKE '%balance migration%'
    OR description ILIKE '%referral reward%'
  )
ORDER BY occurred_on;

-- 2. Monzo internal-movement rows that should be is_transfer = true
SELECT id, account_id, occurred_on, amount, currency, description, merchant, raw_category, is_transfer
FROM transactions
WHERE occurred_on BETWEEN '2026-08-01' AND '2026-10-31'
  AND is_transfer = false
  AND (
    description ILIKE '%pot transfer%'
    OR description ILIKE '%round up%'
    OR description ILIKE '%roundup%'
    OR description ILIKE '%lease hold pot%'
    OR description ILIKE '%coin jar%'
    OR description ILIKE '%withdrawal from pot%'
    OR description ILIKE '%pot withdrawal%'
    OR description ILIKE '%to savings pot%'
    OR merchant   ILIKE 'pot %'
  )
ORDER BY occurred_on;

-- 3. Cross-account mirror pairs (candidate transfers)
-- Step A: build candidate pairs
WITH debits AS (
  SELECT id, account_id, occurred_on, amount, currency
  FROM transactions
  WHERE occurred_on BETWEEN '2026-08-01' AND '2026-10-31'
    AND is_transfer = false
    AND amount < 0
),
credits AS (
  SELECT id, account_id, occurred_on, amount, currency
  FROM transactions
  WHERE occurred_on BETWEEN '2026-08-01' AND '2026-10-31'
    AND is_transfer = false
    AND amount > 0
)
SELECT
  d.id AS debit_id,  d.account_id AS debit_acct,  d.occurred_on AS debit_date,  d.amount AS debit_amt,
  c.id AS credit_id, c.account_id AS credit_acct, c.occurred_on AS credit_date, c.amount AS credit_amt,
  ABS(d.occurred_on::date - c.occurred_on::date) AS day_diff,
  ABS(ABS(d.amount) - c.amount) AS amt_diff
FROM debits d
JOIN credits c
  ON d.account_id <> c.account_id
 AND ABS(d.occurred_on::date - c.occurred_on::date) <= 2
 AND ABS(ABS(d.amount) - c.amount) <= 0.50
ORDER BY d.occurred_on, ABS(ABS(d.amount) - c.amount);

-- 4. Duplicate rows (same account + date + amount, similar description)
SELECT
  account_id, occurred_on, amount, currency,
  description, merchant,
  COUNT(*) AS cnt,
  ARRAY_AGG(id) AS ids
FROM transactions
WHERE occurred_on BETWEEN '2026-08-01' AND '2026-10-31'
  AND is_transfer = false
GROUP BY account_id, occurred_on, amount, currency, description, merchant
HAVING COUNT(*) > 1
ORDER BY occurred_on, amount;
```



---

*Zero writes were issued. This script used SELECT-only Supabase queries via the authenticated user session.*
