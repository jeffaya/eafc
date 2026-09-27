# EA FC Clubs Discord Bot

GitHub Actions bot for **Golden Boys** (`clubId: 16999`, `common-gen5`).

## Automatic behavior

- Checks the latest **20 League matches** during the evening.
- Posts each newly completed match to the **session** Discord webhook (quasi-live post-match).
- Sends the end-of-session club/player recap.
- Keeps anti-duplicate state in `data/state.json`.
- Playoffs are currently ignored.

## Player Impact ranking

Player recaps are ranked by a custom **Impact /10** score, independent from the EA rating. The recap highlights goals, assists, key passes, passes per match, pass accuracy, passing-volume share and successful tackles. The top three receive 🥇 🥈 🥉.

## Manual execution modes

Only three manual modes are exposed in GitHub Actions:

- `debug-connect` — verifies both Discord webhooks.
- `debug-full` — runs a complete non-destructive Discord/stat test.
- `replay-history` — reconstructs historical evening sessions and sends **only the club recap and player recap** for each session. It never posts historical matches to the live/session webhook.

## Historical replay source

`replay-history` uses this priority:

1. If `data/history.json` exists and contains matches, **use that file**.
2. Otherwise, call EA for the latest **20 `leagueMatch`** matches.

Accepted `history.json` shapes:

```json
[ { "matchId": "..." } ]
```

or an object containing an array under `matches`, `history`, or `items`.

The V14 package intentionally does **not** include an empty `data/history.json`, so deploying it does not overwrite a history file already present in your repository.

There is no YES/NO confirmation: selecting `replay-history` runs directly. Replay uses only `DISCORD_CLUB_WEBHOOK_URL` and `DISCORD_PLAYER_WEBHOOK_URL`; `DISCORD_SESSION_WEBHOOK_URL` is reserved for scheduled live match results.

For every historical session, replay sends the match history + club recap to `DISCORD_CLUB_WEBHOOK_URL`, and the reconstructed player recap to `DISCORD_PLAYER_WEBHOOK_URL`.

## Secrets

- `DISCORD_CLUB_WEBHOOK_URL` — end-of-session club recap (`#stats-club`)
- `DISCORD_PLAYER_WEBHOOK_URL` — end-of-session player recap (`#stats-player`)
- `DISCORD_SESSION_WEBHOOK_URL` — newly completed matches during the playing session (`#session`)

## Club configuration

Edit `club.config.json` to reuse the bot for another club.

## Notes

The EA Clubs endpoint is unofficial. V14 reuses the same EA request implementation for normal polling and history fallback, rather than maintaining a second history-specific HTTP implementation.

## History safety

`data/history.json` is historical source data. Normal runs only commit `data/state.json`; they never overwrite or truncate `data/history.json`. When upgrading an existing repository, keep the repository’s existing `data/history.json`.
