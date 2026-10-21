# TEST Ver.0.3.242

Baseline: TEST241 main `46096c9a90e75eb8a91562d8fca21145e290c0cb`.
Branch: `fix/selection-ownership-render-242`. TEST repository only; production repository and production Supabase are not used.

## Selection changes

- LL4 Beginning of Legend: existing eligible hire pool remains N/R/SR/SSR/UR, excluding CLR and unavailable unique hires. Native dropdown starts blank, shows display rarity/name and full actual ability, with all-option comparison. Exact selected ID goes through the existing hire command. Acquisition owner is explicitly captured; Bots choose automatically without opening a human modal.
- LL5 Genesis World: named/VP dropdowns replace number prompts. Original owner-first then every-player order is retained, including the owner's second discard. The acquiring player selects all targets, as the existing effect text specifies. Existing installed/temporary normal-card eligibility is retained; legends excluded.
- N8 Trading Post: normal invocation now opens the existing two-stage market/hand dropdown instead of the legacy numeric branch. Explicit internal selections remain supported for Bot/programmatic callers.
- N12 Honey Trap and LU4 Secret Thirteen: named/rarity employee dropdowns with full ability preview. Only the exact chosen employee moves; Secret Thirteen charges its existing cost on valid confirmation.
- Doppelganger at all five existing rarities: same-rarity source dropdown previews unique abilities. Common hire dice, unique-only copy payload, CUR exception, source exclusions and hire timing remain unchanged. Cancellation finalizes without a copied ability.
- Generic level-up/fusion: multiple eligible results use a dropdown with source/destination names and actual destination abilities; selected physical material, costs and success callbacks are preserved. Existing CLR ability checkbox selector remains.
- Inadamashii: eight-card checkbox list with names, VP, effect text, selected count, limit and atomic confirmation replaces comma-separated numbers.
- Special Procurement: each recipient chooses their own resource split using three bounded dropdowns; exact totals remain 15 for owner and 5 for others. Effect quantities and order are unchanged.
- All gameplay candidate calls to text/number prompts are removed. A diagnostic JSON-copy fallback is retained; editable player names, settings quantities, passwords and debug data are not candidate-selection prompts.

## Choice ownership and persistence

Previously LL4 rendered its employee modal unconditionally, including during Bot acquisition, and bound clicks to mutable global turn state. The shared queue now records effect chooser separately from active turn actor and turn lease. Bot choices run locally, and only the chooser sees active controls. Online requests are checked by the host against match, epoch, turn token, selection ID, roster client and allowed option keys. The active coordinator commits the result and broadcasts the state. Duplicate replies do not commit twice; pending replies can be resent. Serial recipes recover LL4/LL5, hire-copy, employee, sacrifice and allocation choices after callback loss or on the timeout host. Unconfirmed generic evolution choices cancel before material/payment commits. No live Supabase connection is required by the tests.

## Artwork and overlap

Park (Naroppaland) previously cleared and regenerated the candidate DOM on every render. Unchanged candidate groups now retain their existing wrapper/image nodes, including when the recipient changes. Handlers read the current recipient instead of a stale closure. This removes that unnecessary image reload opportunity without changing card movement or effects. Actual device flicker improvement is unconfirmed.

The shared card-choice container uses independent compact artwork/name/VP/effect rows with scrolling, replacing stacked full-size artwork. N17 uses this shared renderer. N18 retains its existing five-instance selector and only adopts the shared fixed-size artwork frame; real/missing artwork has equal geometry. N16–20 missing artwork, N13 separate consent, N14 dropdown/rarity labels and Doppel common/unique dice are covered by regressions.

## Validation and limits

Game regression suite, generated-site syntax/clock, Python builder isolation and extracted-ZIP offline/Bot startup are executed before delivery. New tests cover dropdown previews/confirmation, exact instances, limits, Bot ownership, independent four-DOM online transport, forged/stale requests, reload recovery, timeout recovery and stable image DOM. Scope hashes/inverse diffs verify unchanged card/character definitions and unrelated code against TEST241.

Real smartphone pixels/touch, live multi-device Supabase play, browser-visible Pages rendering and actual device flicker: unconfirmed. No local browser executable is installed. Responsive CSS and DOM/state behavior are automatically checked, not represented as visual device confirmation.

ZIP uses one `0.3.242/` root directory, all runtime files/images, existing pack/rule JS, source/tests and change inventory. All entry timestamps are current Asia/Tokyo wall time (ZIP DOS timestamps themselves do not store timezone).

Validation results: game suite **438 passed** (19 new selection/online/scope checks), Python builder/isolation **23 passed**, generated clock **34 passed**, offline/Bot startup **2 passed**; total **497 passed**. Generated JavaScript syntax: **13 scripts parsed**. Actual smartphone rendering and live Supabase online play remain unconfirmed.
