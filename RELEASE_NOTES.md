# Release Notes

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
