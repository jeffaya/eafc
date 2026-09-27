# EA FC Clubs Discord Bot

GitHub Actions bot for **Golden Boys** (`clubId: 16999`, `common-gen5`).

## Automatic behavior

- Checks the latest **20 League matches** during the evening.
- Posts new match results to the club Discord webhook.
- Sends the end-of-session club/player recap.
- Keeps anti-duplicate state in `data/state.json`.
- Playoffs are currently ignored.

## Manual execution modes

Only three manual modes are exposed in GitHub Actions:

- `debug-connect` — verifies both Discord webhooks.
- `debug-full` — runs a complete non-destructive Discord/stat test.
- `replay-history` — replays historical matches from oldest to newest, grouped by evening session, then reconstructs **both the club recap and the player recap** for every session.

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

There is no YES/NO confirmation: selecting `replay-history` runs directly.

For every historical session, replay sends the match history + club recap to `DISCORD_CLUB_WEBHOOK_URL`, and the reconstructed player recap to `DISCORD_PLAYER_WEBHOOK_URL`.

## Secrets

- `DISCORD_CLUB_WEBHOOK_URL`
- `DISCORD_PLAYER_WEBHOOK_URL`

## Club configuration

Edit `club.config.json` to reuse the bot for another club.

## Notes

The EA Clubs endpoint is unofficial. V14 reuses the same EA request implementation for normal polling and history fallback, rather than maintaining a second history-specific HTTP implementation.
