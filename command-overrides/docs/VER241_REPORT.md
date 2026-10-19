# TEST Ver.0.3.241

Baseline: TEST240 `83fbd5f7a7fae803628cb193cfeff7f0283d4485`.

## Changes

- Shared card artwork frame reserves the same aspect ratio for loaded images, missing images and explicit future illustrations. Hand scrolling is retained. Shared previews expose name, VP and cost; modal/field/market artwork does not collapse or overlap metadata. N16–N20 show NO IMAGE. N18's existing independent five-card selector is retained.
- N13 Trade records a separate employee-instance offer from each participant. The installer chooses an eligible player and their own employee; the counterpart chooses their own employee. Empty choices cannot confirm. Public rosters show names/rarities. Object identity/copy/ability state survives the atomic exchange. Cancellation, stale messages, removed employees and timeout do not exchange substitute employees. Bots choose only for themselves and wait for human consent.
- Online Trade uses a dedicated authenticated participant event verified by the room host. Match, epoch, turn lease, trade revision, client/player identity and employee ownership are checked. The installer cannot submit the counterpart's choice. Ordinary turn snapshots cannot overwrite a pending trade. State is saved in snapshots and resumes through normal deferred-installation processing.
- N14 retains all 31 eligible options, blank initial choice and exact-ID hiring. Labels now use N/R/SR/SSR. Employee list/portraits/abilities remain; internal employee IDs are removed from normal listing. CLR remains the internal rarity, displayed as LR.
- All five Doppelganger variants no longer suppress their own common die. A successful hire grants their own common die through the existing roll/chosen-face paths, regardless of copy targets. Normal ongoing common dice remain at turn start. Non-active-player hires retain a per-instance pending die for that player's next turn rather than giving it to the active player.
- Doppelganger copies the complete unique ability payload, including non-named resource/finance/hire effects, while retaining its own ID, rarity and CUR exception. Source common-die flags and source per-instance used state are excluded. Already-applied named abilities are not applied twice. Extra dice belonging to a unique ability remain copyable. Scout/special/debug hire routes apply this only to Doppelganger; other employees and Mimic remain unchanged.

## Verification

Dedicated offline and four-device simulated-transport tests cover display structure, missing/future artwork, N14 full options, N18 preservation, separate Trade consent/ownership/replay/cancellation/timeout/Bot paths, copy payloads and common-die ownership. Existing regression, builder isolation, generated syntax/clock and offline/Bot startup checks are run before distribution.

Real smartphone rendering/touch and live multi-device online play: unconfirmed. The available local browser executable is missing; browser attempts were not repeated. No production repository mutation or production Supabase connection.

ZIP contains all existing pack/rule JS and images, sources and FILE_CHANGES.tsv. ZIP entry times use current Asia/Tokyo time.

Validation totals: game regression suite 417 (31 dedicated UI/Trade/Doppel/scope checks), Python build/isolation 23, generated clock 34, offline/Bot startup 2; total 476. Generated JavaScript syntax: 13 scripts.
