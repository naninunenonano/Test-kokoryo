# TEST Ver.0.3.240 — N14 / N18 selection fixes

Baseline: TEST239 `db6cc2af85942d3ce5d0ebe64fc4f8baf70b5ff0`.

N14 builds its special-hire choices from registered, currently available employee definitions, including synthesis-only CN/CR/CSR/CSSR. It offers all 31 eligible existing characters, excludes CUR/CLR, and uses a native select with IDs as values. Blank/invalid choices cannot confirm; hire limits are rechecked with reasons and failed hires remain selectable. Existing common selected-hire/finalize/hire-time abilities and staffing notifications execute once. Ordinary hire rates, costs and allowance are unchanged.

N18 alone uses an independent row list with illustration, name, current VP, selection mark and pressed state. Up to five distinct instances can be toggled; confirmation requires five. The existing confirmed S/N filter, atomic five-plus-source discard, and special legend acquisition remain intact. Other card selectors are unchanged.

Both dialogs use turn-clock leases, cancellation, deferred-installation continuation and Bot paths. CSS wraps labels and bounds vertical scroll at narrow widths. 20 dedicated automated DOM tests cover candidates, exact identity, hire effects/capacity/failure/retry, duplicate-name cards, deselection, atomic sacrifices, stale choices, timeout and nested installation. Scope checks preserve all other game functions, card/character/legend definitions and pack files.

Visual smartphone and real iPhone operation: unconfirmed. Local browser executable unavailable; no repeated browser attempts. No production repository changes or production Supabase connection.

Validation: game regression suite 386 tests (including 20 dedicated); Python builder/isolation 23; generated clock 34; offline/Bot startup 2; 13 generated JavaScript scripts parsed. Total 445 tests. All passed. ZIP extraction/startup is verified separately before distribution.
