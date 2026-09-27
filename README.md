# V12 — Possession / ball-recovery support

V12 keeps **everything from V11**: two Discord destinations, whole-session aggregation, assists + second assists, pass-volume influence, tackles, and goalkeeper-specific stats.

For every **outfield player**, V12 also supports:

- ♻️ balls/possessions won (total + per match)
- ❌ balls/possessions lost (total + per match)

Important: EA does not document these fields and the community confirms that possession won/lost data exists in the hidden match-event aggregates, but no sufficiently reliable public numeric event mapping was available when V12 was built. V12 therefore **never invents a value**. It reads known named aliases if EA exposes them and otherwise omits the line. Goalkeepers never receive this line.

The parser also preserves each player's raw `match_event_aggregate_0..3` values internally so a confirmed mapping can be plugged in later without redesigning the recap.

A `debug-possession` script lists possession/recovery-related named fields currently exposed by EA.

---

# V11 — Separate Club Stats and Player Stats destinations

V11 keeps all V10 statistics and splits Discord output across two webhook secrets:

- `DISCORD_CLUB_WEBHOOK_URL` — live match results, replayed match, and Daily Club Recap.
- `DISCORD_PLAYER_WEBHOOK_URL` — Player Recap (ratings, goals, assists, second assists, pass volume/share/rank, tackles, and goalkeeper-specific stats).

`daily-recap` sends the club recap to the club destination and the individual recap to the player destination.
`full-test` tests both destinations in one run.
`test-webhook` sends one connectivity message to each destination.
`player-recap` sends only to the Player Stats destination.

## Upgrade from V10

Create **two Discord webhooks** pointing to the two desired channels/threads, then create/update these GitHub Actions repository secrets:

1. `DISCORD_CLUB_WEBHOOK_URL`
2. `DISCORD_PLAYER_WEBHOOK_URL`

The old `DISCORD_WEBHOOK_URL` is no longer used by V11. Once V11 is working, it can be deleted from GitHub Secrets.

If the destinations are Discord threads, create/copy a webhook URL that actually targets the intended thread (or a thread-specific webhook URL supported by your Discord setup); the bot simply posts to the URL stored in each secret.

All V10 player-stat logic is preserved, including community-derived EA event `115` for second assists and the goalkeeper-specific display.

---

# V10 — Creative influence + goalkeeper recap

V10 adds second assists (EA aggregate event 115, unofficial/community-derived), pass volume, passes per match, share/rank of team pass volume, and a goalkeeper-specific recap with saves, saves/match, clean sheets, goals conceded and passing accuracy.

`player-recap` and `full-test` automatically use the new presentation.

---

# V9 — Player session recap + full test

V9 adds player-session statistics based on fields confirmed from a real EA Clubs payload:

- matches played
- average rating
- goals
- assists
- pass accuracy (`passesmade / passattempts`)
- tackle success (`tacklesmade / tackleattempts`)

The automatic **Daily Recap** now sends two Discord messages: the club recap, then the player recap.

Manual Actions modes:
- `player-recap` — sends only the player recap for the latest EA session available.
- `full-test` — sends, in one run: webhook test, latest real match, club recap, and player recap. It does **not** modify `data/state.json`.
- `debug-last-match` remains available for inspecting EA's raw JSON.

Player recap data is fetched live from EA for the session, so upgrading from V8 does not require old `state.json` entries to already contain the new player fields.

> Balls won/lost are intentionally not shown because the real payload does not expose reliable named fields for them.

---

# 👑 EA SPORTS FC Clubs → Discord Bot

A small, free, serverless bot that watches an EA SPORTS FC Club and automatically posts match results to Discord.

It runs entirely with **GitHub Actions**. You do **not** need a server, database, VPS, Railway account, or paid hosting.

Once installed, GitHub wakes the bot up on a schedule, the bot checks EA FC Clubs for new matches, posts them to your Discord channel, remembers which matches were already posted, and stops again.

> This project uses an unofficial/undocumented EA Clubs API. EA can change that API at any time.

---

## What the bot does

- Checks your EA FC Club for recent League and Playoff matches.
- Posts new match results to Discord.
- Shows the score, opponent and player performances when available.
- Uses ⚽ for goals, 🎯 for assists and ⭐ for ratings/MVP.
- Remembers already-posted matches so the same match is not posted twice.
- Can replay the latest EA match manually for testing.
- Creates an automatic Daily Recap after the evening session.
- Requires no permanent server and no database.

The default schedule included in this repository is designed for evening sessions:

- Match watcher: every 10 minutes from 20:00 until 02:50.
- Daily Recap: 02:55.
- Time zone: configurable (default: `Europe/Paris`).

---

# 🚀 Installation guide — no technical knowledge required

You only need:

1. A GitHub account.
2. A Discord server/channel where you are allowed to create a webhook.
3. The EA FC Club ID of the club you want to follow.
4. This project copied into your own GitHub repository.

The setup is done once. After that, everything is automatic.

---

## Step 1 — Put the project on GitHub

Create a new GitHub repository.

You can name it anything, for example:

`my-fc-club-bot`

Upload **all files and folders from this project** to the repository.

Do not upload only the `src` folder. The `.github`, `data`, `src`, `club.config.json` and `package.json` files are all needed.

Your repository should look roughly like this:

```text
my-fc-club-bot/
├── .github/
│   └── workflows/
│       └── pipeline.yml
├── data/
│   └── state.json
├── src/
│   ├── config.js
│   ├── daily-recap.js
│   ├── discord.js
│   ├── ea.js
│   ├── index.js
│   ├── match.js
│   ├── replay-last-match.js
│   ├── session.js
│   ├── state.js
│   └── test-webhook.js
├── club.config.json
├── package.json
└── README.md
```

Commit/push the files to your repository.

---

## Step 2 — Configure your EA FC Club

You normally only need to edit **one file**:

`club.config.json`

Example:

```json
{
  "clubId": "16999",
  "clubName": "Golden Boys",
  "platform": "common-gen5",
  "timezone": "Europe/Paris"
}
```

Change the values for your club.

### `clubId`

This is the EA Clubs numeric ID.

Example:

```json
"clubId": "16999"
```

Replace `16999` with your own club ID.

### `clubName`

This is the name displayed by the bot.

Example:

```json
"clubName": "Golden Boys"
```

Replace it with your club name.

### `platform`

For current-generation FC Clubs, the project uses:

```json
"platform": "common-gen5"
```

If your club uses another EA platform identifier, change this value accordingly.

### `timezone`

This controls session/date handling.

For France:

```json
"timezone": "Europe/Paris"
```

Examples for other locations include `Europe/London` or `America/New_York`.

Use an IANA time-zone name, not `GMT+2`.

Commit/push the modified `club.config.json` to GitHub.

---


## Why is the workflow called `EA FC Clubs Bot`?

The workflow file is deliberately generic:

`.github/workflows/pipeline.yml`

Your club name still comes from `club.config.json` and is used by the bot in Discord messages.

GitHub determines the workflow name before the repository files are checked out, so a workflow cannot directly read `club.config.json` to dynamically rename itself in the Actions sidebar. Keeping the GitHub workflow name generic means you never have to edit the pipeline when reusing this project for another club.


# 💬 Step 3 — Create a Discord webhook

The webhook is what allows GitHub Actions to send messages into your Discord channel.

In Discord:

1. Open your Discord server.
2. Open the channel where match results should appear.
3. Open **Edit Channel**.
4. Go to **Integrations**.
5. Open **Webhooks**.
6. Choose **New Webhook**.
7. Give it a name, for example `FC Clubs Bot`.
8. Select the correct Discord channel.
9. Choose **Copy Webhook URL**.

The copied URL is private.

**Never put the webhook URL inside `club.config.json`, JavaScript files, README, commits, screenshots, or public messages.**

Anyone who gets that URL may be able to post messages through your webhook.

---

# 🔐 Step 4 — Add the webhook to GitHub Secrets

This is the most important GitHub configuration step.

Open your GitHub repository and go to:

**Settings → Secrets and variables → Actions**

Then:

1. Click **New repository secret**.
2. In **Name**, enter exactly:

```text
DISCORD_WEBHOOK_URL
```

3. In **Secret**, paste the Discord webhook URL copied in the previous step.
4. Click **Add secret**.

The name must be exactly `DISCORD_WEBHOOK_URL`.

You do **not** need to create a Discord bot token, Discord application, OAuth configuration, EA password, database password, or server credential.

The Discord webhook is the only secret required by this project.

---

# ⚙️ Step 5 — Enable GitHub Actions

Open the **Actions** tab of your repository.

If GitHub asks you to enable workflows, enable them.

The workflow is located at:

`.github/workflows/pipeline.yml`

You normally do not need to edit it.

GitHub Actions is the scheduler and temporary computer that runs the bot.

There is no program that needs to stay running on your PC.

---

# 🧪 Step 6 — Test Discord first

Before testing EA data, make sure Discord works.

Go to:

**GitHub repository → Actions → EA FC Clubs Bot → Run workflow**

For the `mode` option choose:

`test-webhook`

Run the workflow.

After a few seconds, your Discord channel should receive a message similar to:

> 👑 **EA FC Clubs Bot connected** — webhook operational.

If this appears, GitHub and Discord are correctly connected.

If it does not appear, open the failed workflow run in GitHub Actions and inspect the error. The first thing to verify is that the GitHub secret is named exactly `DISCORD_WEBHOOK_URL`.

---

# ⚽ Step 7 — Test a real EA match

Now run the workflow again, but select:

`replay-last-match`

This asks EA for the latest match from the **previous calendar day** in the club's configured timezone and sends it to Discord. This makes the test useful when it is run after midnight (for example around 03:00), when the session you want to test belongs to the previous day.

This is a test: it does **not** mark the match as processed and does not change the normal bot history.

A message can look like:

```text
🧪 TEST — 🏆 WIN — My FC Club

My FC Club 4 — 2 Opponent FC

⚽ Goals
PlayerOne ×2 · PlayerTwo · PlayerThree

🎯 Assists
PlayerTwo ×2 · PlayerOne

⭐ MVP — PlayerOne 9.3
```

The exact data depends on what EA returns.

If this step cannot find your club or the result looks incorrect, first check `clubId`, `clubName` and `platform` in `club.config.json`.

Because the EA endpoint is unofficial, its response format can change and the parser may need updating in the future.

---


# 🔎 Debugging the raw EA match data

A manual GitHub Actions mode called:

`debug-last-match`

is included for inspecting exactly what EA returns for a real match.

Use it when you want to add new player statistics or when EA changes its API.

Go to:

**GitHub repository → Actions → EA FC Clubs Bot → Run workflow**

Choose:

`debug-last-match`

The bot will:

1. Fetch recent EA matches for the club configured in `club.config.json`.
2. Select the latest match from the **previous calendar day** using the configured timezone.
3. Print the complete raw match JSON in the **GitHub Actions log**.
4. Send **nothing to Discord**.
5. Make **no change to `data/state.json`**.

Open the workflow run, expand the **Debug last match raw EA payload** step, and copy the JSON from the log.

That JSON can be used to identify the exact fields EA provides for player statistics such as ratings, goals, assists, passing, tackles, interceptions, possession losses, or other metrics.

> Note: EA Clubs endpoints are unofficial/undocumented. Available fields can change, so this debug mode is intentionally kept as a permanent diagnostic tool.


# ▶️ Step 8 — Start normal operation

Run the workflow manually once with:

`normal`

On a completely fresh installation, the bot intentionally creates a **baseline** of recent match IDs without posting all old matches.

This prevents a new installation from flooding Discord with historical matches.

After that, leave the repository alone.

New matches detected by scheduled runs will be posted automatically.

---

# 📊 Daily Recap

At the end of the session, the bot can post a summary similar to:

```text
📊 DAILY RECAP — My FC Club

🎮 8 matches
🟢 5 wins · 🟡 1 draw · 🔴 2 losses
📈 63% win rate

⚽ 21 goals scored · 13 conceded

⚽ Top scorer
PlayerOne — 7

🎯 Top assister
PlayerTwo — 5

⭐ Session MVP
PlayerOne — 8.7 average rating
```

The Daily Recap is scheduled automatically.

You can also test it manually from GitHub Actions by choosing:

`daily-recap`

Important: the recap uses matches recorded by this bot during the current session. Immediately after a fresh installation there may be nothing to recap yet.

---

# 🕒 Changing the schedule

The schedule is configured in:

`.github/workflows/pipeline.yml`

The default project watches matches every 10 minutes during the evening and runs the Daily Recap after the session.

If the default hours suit you, **do not change this file**.

If you change the schedule, remember that GitHub workflow schedules use cron syntax. Only edit it if you understand the desired schedule or have someone help you generate the correct cron expression.

The club's time zone is stored in `club.config.json`.

---

# 🧠 What is `data/state.json`?

This file is the bot's memory.

It contains IDs of matches that have already been seen and the session data used for the Daily Recap.

GitHub Actions automatically commits changes to this file after normal watcher runs.

**Do not manually reset or delete this file during normal use.**

If you replace it with an empty state, the bot may lose its history.

When updating the application to a newer version, keep your existing `data/state.json` unless the release specifically says otherwise.

---

# 🔄 Reusing this project for another club

For most users, cloning/reusing the bot requires only these changes:

1. Copy/fork the repository.
2. Edit `club.config.json`.
3. Create a Discord webhook for the destination channel.
4. Add that webhook to GitHub as the `DISCORD_WEBHOOK_URL` repository secret.
5. Enable GitHub Actions.
6. Run `test-webhook`.
7. Run `replay-last-match`.
8. Run `normal` once.
9. Leave it running automatically.

You do not need to edit the JavaScript source code.

---

# 🔒 Security

Never commit your Discord webhook URL.

Good:

```text
GitHub Secret:
DISCORD_WEBHOOK_URL = [your private webhook]
```

Bad:

```js
const webhook = "https://discord.com/api/webhooks/...";
```

If a webhook URL is accidentally published, delete/regenerate that webhook in Discord and update the GitHub secret.

---

# 💰 Cost

For normal personal/community usage this architecture requires:

- No VPS.
- No Railway service.
- No database.
- No always-on Node.js server.
- No Discord bot hosting.

The script runs for a short time inside GitHub Actions and then exits.

GitHub's own Actions usage limits/terms still apply to your account/repository.

---

# 🛠 Troubleshooting

### Discord receives nothing

Check:

- `DISCORD_WEBHOOK_URL` exists in GitHub repository secrets.
- The Discord webhook still exists.
- The webhook points to the correct channel.
- GitHub Actions is enabled.

Run `test-webhook` again.

### Discord works, but no EA match appears

Check:

- `clubId` in `club.config.json`.
- `platform` in `club.config.json`.
- Your club has at least one recent match.

Run `replay-last-match` and inspect the GitHub Actions log.

### Normal mode runs but does not post old matches

This is expected on the first run.

The bot creates a baseline specifically to avoid posting historical matches.

Play a new match and wait for the next scheduled check.

### Daily Recap says there are no matches

The recap only knows about matches recorded by the bot during that session.

If you installed the bot after the matches were already played, those matches may not be present in the session state.

### A match is posted twice

Do not manually remove processed IDs from `data/state.json`.

Also make sure you do not have an older duplicate workflow still enabled in `.github/workflows/`.

---

# 📁 Files you normally edit

For a normal installation:

### You edit

`club.config.json`

### You configure on GitHub

`DISCORD_WEBHOOK_URL`

### You normally do NOT edit

- `src/*.js`
- `data/state.json`
- `package.json`
- `.github/workflows/pipeline.yml`

That is all that is required for a standard installation.

---

# Technical overview

```text
GitHub Actions
      │
      ▼
Node.js script
      │
      ├── EA FC Clubs API
      │
      ▼
Compare recent match IDs
      │
      ├── already seen → ignore
      │
      └── new match → Discord webhook
                          │
                          ▼
                     Discord channel

data/state.json ← updated and committed by GitHub Actions
```

No permanent process is running between checks.

---

## License / disclaimer

This is an independent community project and is not affiliated with or endorsed by Electronic Arts, EA SPORTS, Discord, or GitHub.

EA Clubs endpoints used by the project are unofficial/undocumented and may stop working or change without notice.
