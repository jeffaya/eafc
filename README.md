# EA FC Clubs Discord Bot — V18

V18 changes Impact Rating so the EA rating is the anchor.

**Impact = EA + controlled statistical adjustment**, mathematically equivalent to 70% EA + 30% of the position-aware statistical score, capped to ±1.5 points from EA.

The statistical component keeps the existing creation, passing, successful-tackle and goalkeeper logic. Ranking remains by Impact.

V17.1 replay fallback remains unchanged: when the requested session is absent from local history, replay queries EA.

## Upgrade safety
This ZIP contains only V18 changed files. It contains no `data/state.json`, no `data/history.json`, and no `club.config.json`.
