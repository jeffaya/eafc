# Golden Boys Bot

GitHub Actions -> Node 22 -> EA SPORTS FC Clubs -> Discord webhook.

- Club: Golden Boys
- clubId: 16999
- Schedule: every 10 minutes, 20:00 through 02:50, Europe/Paris
- No npm dependencies, server or database.

## Setup
1. Push this folder to GitHub.
2. Settings -> Secrets and variables -> Actions.
3. Add `DISCORD_WEBHOOK_URL` with a NEW Discord webhook URL.
4. Actions -> Golden Boys Bot -> Run workflow -> `test_webhook=true` to test Discord.
5. Run again with `test_webhook=false` to initialize the EA baseline.

The first EA run does not publish old matches. It records them in `data/state.json`.
Later runs publish only unseen matches and commit the updated state.

The EA Clubs endpoint is unofficial/undocumented and may change. The project currently checks both `leagueMatch` and `playoffMatch` on `common-gen5`.
