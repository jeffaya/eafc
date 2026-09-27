# 👑 EA SPORTS FC Clubs → Discord Bot

A small bot that watches an EA SPORTS FC Club and automatically sends match results and session statistics to Discord.

It runs entirely with **GitHub Actions**. There is no permanent server, database, VPS or paid hosting to maintain.

For the history of changes between versions, see [RELEASE_NOTES.md](./RELEASE_NOTES.md).

> This project uses an unofficial/undocumented EA Clubs API. EA can change it at any time.

---

## What this project does

During a Clubs session, GitHub Actions periodically starts the bot. The bot asks EA for the club's latest League and Playoff matches, detects matches that have not already been published, sends them to Discord, saves their IDs in `data/state.json`, then exits.

At the end of the evening it builds a recap for the **whole session**, including matches played after midnight.

The default schedule is:

- match check every **10 minutes**, from **20:00 to 02:50**
- session recap at **02:55**
- default timezone: `Europe/Paris`

A session that starts in the evening and ends after midnight is treated as one session.

---

## Discord output

The bot uses two Discord destinations.

### 🏆 `#stats-club`

This channel receives match results and the club recap:

- matches played
- wins / draws / losses
- win rate
- goals scored / conceded
- top scorer
- top assister
- session MVP / average rating

GitHub secret:

`DISCORD_CLUB_WEBHOOK_URL`

### 👥 `#stats-player`

This channel receives the individual session recap.

For each outfield player the bot can show:

- ⭐ average rating
- ⚽ goals
- 🎯 assists
- 🪄 second assists
- 🦶 passes attempted / completed / completion %
- 🔄 passes per match
- 🧠 share of the team's human-player passing volume
- 📊 passing-volume rank in the team
- 🛡️ tackles and tackle success
- ♻️ balls/possessions won when EA exposes a reliable value
- ❌ balls/possessions lost when EA exposes a reliable value

Goalkeepers have a dedicated presentation with saves, saves per match, clean sheets, goals conceded and passing accuracy.

Example player name used in this documentation: **BryanGlory666**.

GitHub secret:

`DISCORD_PLAYER_WEBHOOK_URL`

### About balls won / lost

EA does not currently expose a stable, documented field for these statistics in every payload. Some information is hidden in `match_event_aggregate_0..3`.

The bot deliberately **does not invent a value**. If a reliable named value is available it can be displayed; otherwise the line is omitted. Raw aggregate data is preserved by the parser so a confirmed community mapping can be added later.

---

## How the code works

```text
GitHub Actions
      │
      ▼
src/index.js
      │
      ├── src/ea.js ───────────► EA Clubs API
      │
      ├── src/match.js ────────► normalize match/player data
      │
      ├── src/state.js ────────► prevent duplicate posts
      │
      └── src/discord.js ──────► Discord #stats-club

02:55
      │
      ▼
src/daily-recap.js
      │
      ├── src/session.js ──────► determine the evening session
      ├── src/recap.js ────────► aggregate club/player statistics
      ├────────────────────────► Discord #stats-club
      └────────────────────────► Discord #stats-player
```

### Main files

| File | Purpose |
| --- | --- |
| `.github/workflows/pipeline.yml` | GitHub Actions schedule and manual execution modes |
| `club.config.json` | Club ID, club name, EA platform and timezone |
| `src/index.js` | Automatic new-match watcher |
| `src/ea.js` | Calls the EA Clubs API |
| `src/match.js` | Converts the EA payload into normalized match/player data |
| `src/session.js` | Groups evening + after-midnight matches into one session |
| `src/recap.js` | Calculates club and player session statistics |
| `src/daily-recap.js` | Sends the automatic end-of-session recaps |
| `src/discord.js` | Sends Discord webhook messages |
| `src/state.js` | Reads/writes processed match IDs |
| `src/replay-last-match.js` | Replays a real match for testing |
| `src/player-recap.js` | Manually sends a player recap |
| `src/full-test.js` | Tests both Discord destinations with real data |
| `src/debug-last-match.js` | Prints the raw EA match payload in Actions logs |
| `src/debug-possession.js` | Looks for possession/recovery-related EA fields |
| `data/state.json` | Anti-duplicate state and session state |

---

## Installation

### 1. Create a GitHub repository

Copy the complete project into a repository. Keep the directory structure intact:

```text
ea-fc-clubs-discord-bot/
├── .github/
│   └── workflows/
│       └── pipeline.yml
├── data/
│   └── state.json
├── src/
├── club.config.json
├── package.json
├── README.md
└── RELEASE_NOTES.md
```

If upgrading an existing installation, keep your real `data/state.json` unless you intentionally want to reset the bot's history.

### 2. Configure the club

Edit `club.config.json`:

```json
{
  "clubId": "16999",
  "clubName": "Golden Boys",
  "platform": "common-gen5",
  "timezone": "Europe/Paris"
}
```

`clubId` is the numeric EA Club ID. `clubName` is the displayed club name. `platform` is the EA platform identifier. `timezone` controls session/date handling.

### 3. Create the two Discord webhooks

Create one webhook in `#stats-club` and another in `#stats-player`.

Never put the webhook URLs directly in the repository.

In GitHub, open:

**Repository → Settings → Secrets and variables → Actions**

Create:

```text
DISCORD_CLUB_WEBHOOK_URL
DISCORD_PLAYER_WEBHOOK_URL
```

Paste the corresponding Discord webhook URL into each secret.

### 4. Enable GitHub Actions

Open the repository's **Actions** tab and enable workflows if GitHub asks you to.

The workflow is:

`.github/workflows/pipeline.yml`

The automatic schedule is already included.

---

## Manual tests

Open:

**GitHub → Actions → EA FC Clubs Bot → Run workflow**

The available modes are intended for installation and debugging.

| Mode | What it does |
| --- | --- |
| `test-webhook` | Sends a connectivity test to both Discord destinations |
| `replay-last-match` | Replays a real match to `#stats-club` without changing state |
| `player-recap` | Sends a player recap to `#stats-player` |
| `daily-recap` | Runs the club + player session recap |
| `full-test` | Tests both destinations with real EA data without changing state |
| `debug-last-match` | Prints the complete raw EA match JSON in GitHub logs |
| `debug-possession` | Lists named EA fields related to possession/recoveries when available |

For a first installation, `test-webhook` followed by `full-test` is the simplest verification.

---

## Anti-duplicate state

`data/state.json` remembers matches already processed.

The scheduled workflow commits the updated state back to the repository after a successful run. This is how the project avoids publishing the same match again without requiring a database.

Do not routinely delete this file.

---

## Session statistics

The recap is calculated from the matches belonging to the same evening session.

For example, matches played at:

```text
21:30
22:10
23:45
00:20
01:15
```

belong to the same session.

Player percentages are calculated from totals over the session. For example, pass accuracy is:

```text
total completed passes / total attempted passes
```

rather than the average of each match's percentage.

The same principle is used for tackle success.

---

## Second assists

Second assists are derived from EA's hidden match-event aggregates using event `115`.

This mapping is unofficial/community-derived because EA does not publish official documentation for these event IDs. If EA changes its payload, this statistic may need to be updated.

---

## Security

Discord webhook URLs are secrets.

- Keep them only in GitHub Actions Secrets.
- Never commit them to `club.config.json`, JavaScript files or README.
- If a webhook URL is exposed publicly, regenerate it in Discord and update the GitHub secret.

The project has no npm runtime dependencies and runs on Node.js 24.

---

## Reusing the project for another club

The code is designed to be reusable.

For another club, normally you only need to:

1. change `club.config.json`
2. create the two Discord webhooks
3. configure the two GitHub secrets
4. enable GitHub Actions

The rest of the code can stay unchanged.

---

## Releases

Technical changes between versions are intentionally kept out of this README so this document stays focused on **what the bot does and how it works**.

See **[RELEASE_NOTES.md](./RELEASE_NOTES.md)** for the complete version history.
