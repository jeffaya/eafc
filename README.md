# EA FC Clubs Discord Bot

Reusable EA SPORTS FC Clubs → Discord bot. Documentation is intentionally club-neutral and contains no personal club affiliation.

## V17 behavior
- GitHub schedule: every 10 minutes from **21:07 to 01:57**, with `timezone: Europe/Paris`.
- Every normal run is a **catch-up run**: it fetches the latest 20 League matches, posts every missing match to the session webhook, and rebuilds missing session memory.
- From **01:30**, the first normal run available sends the Club + Player recap. No exact 01:30 cron is required.
- A recap is marked complete only after both Discord sends succeed.
- `processedMatchIds` is a rolling anti-duplicate list; `sessionMatches` contains only sessions awaiting recap; `recappedSessionKeys` prevents duplicate recaps.
- Normal runs merge newly observed raw matches into `data/history.json` for long-term replay.

## Replay one evening
Run the workflow manually with `mode = replay-history` and `replay_date = YYYY-MM-DD`, e.g. `2026-09-27`. Empty date = latest historical session. Replay sends only Club + Player recaps and never writes historical matches to the session channel.

## Webhook secrets
`DISCORD_SESSION_WEBHOOK_URL`, `DISCORD_CLUB_WEBHOOK_URL`, `DISCORD_PLAYER_WEBHOOK_URL`.

## Upgrade safety
This V17 upgrade ZIP intentionally contains **neither `data/state.json` nor `data/history.json`**, and does not contain `club.config.json`. Your live state, history and club configuration therefore remain untouched when the files are copied over an existing repository.

The EA Clubs endpoint is unofficial. Key passes currently use aggregate event `219`, whose mapping is not officially documented by EA.
