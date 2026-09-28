# Release Notes

## V17.1
- Fixes replay fallback when `data/history.json` exists but does not contain the requested session.
- Replay now searches local history first, then automatically queries the latest 20 League matches from EA when the requested `replay_date` is absent.
- Local and EA results are merged in memory and deduplicated before selecting the requested session.
- Replay fallback does not overwrite `data/history.json`.
- Club + Player only; the live session webhook remains untouched.
- README updated to document the corrected fallback behavior.
- Upgrade package still excludes mutable `state.json`, `history.json`, and real club configuration.

## V17.0
- Catch-up architecture: every run processes all still-missing matches in the latest 20 League results.
- Self-heals `sessionMatches` even when a match ID was already processed.
- Session is derived from the match timestamp, not runner time.
- Recap becomes due at 01:30 local and is sent by the first later normal run.
- Recap is cleared only after Club + Player sends both succeed.
- Adds `recappedSessionKeys` idempotency.
- Schedule changed to 21:07 → 01:57 every 10 minutes with `Europe/Paris` timezone.
- Adds `replay_date` (`YYYY-MM-DD`); empty means latest available session.
- Replay remains recap-only and never posts to the live session webhook.
- Normal runs append newly observed raw matches to long-term `data/history.json`.
- Upgrade package excludes `state.json`, `history.json` and the real club config.
- README/package documentation is club-neutral and no longer exposes a specific club affiliation.
