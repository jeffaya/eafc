# V16.5

- Manual `Run workflow` now defaults to `normal`.
- Added `normal` to the manual mode choices.
- Replaced the timezone schedule syntax with explicit UTC cron entries for compatibility.
- Session/live polling remains every 10 minutes during the evening window.
- Existing `data/state.json` and `data/history.json` are not shipped or overwritten.

# V16.4

- Scheduled watcher now uses GitHub Actions timezone-aware scheduling with `Europe/Paris`.
- Watcher runs at 20:03, 20:13, … through 02:53 local time; avoiding minute `00` reduces peak-hour scheduling delays.
- Daily recap runs at 02:55 Europe/Paris.
- Upgrade ZIP no longer contains `data/state.json` or `data/history.json`, so existing repository data is not overwritten.
- State writer creates the `data/` directory automatically when needed.
- Session/live remains schedule-only; replay-history still targets Club and Player only.

# Release Notes

## V16.3

### Replay recaps only

- `replay-history` no longer posts historical session headers or individual match results.
- Historical replay sends only the reconstructed club recap to `DISCORD_CLUB_WEBHOOK_URL`.
- Historical replay sends only the reconstructed player/Impact recap to `DISCORD_PLAYER_WEBHOOK_URL`.
- `DISCORD_SESSION_WEBHOOK_URL` is used only by the scheduled/normal match watcher, never by replay.
- Replay titles keep the real historical session date.
- `data/history.json` is read-only and is not shipped as an empty file, so an existing repository history is not overwritten by this upgrade package.

---

## V16.2

- Adds `DISCORD_SESSION_WEBHOOK_URL`.
- Newly completed match cards now go to the session webhook instead of the club recap webhook.
- Club recap remains on `DISCORD_CLUB_WEBHOOK_URL`; player recap remains on `DISCORD_PLAYER_WEBHOOK_URL`.
- `debug-connect` validates all three webhooks.
- `data/history.json` is never changed by normal bot execution; upgrades must preserve the repository copy.

---

## V16.1

- Historical replay titles now show the real session date instead of `HISTORY`.
- The date is derived from the EA match timestamp in the club timezone.
- Matches after midnight and before 06:00 remain attached to the previous evening session.

---


## V16

### Impact ranking + cleaner player recap

- Adds a custom **Impact /10** score independent from the EA rating.
- Impact is position-aware and uses creation, passing influence and successful tackles; goalkeepers use saves, clean sheets and passing.
- Adds key passes from EA aggregate event `219` to the player recap.
- Player recap is ranked by Impact with 🥇 🥈 🥉 for the top three.
- Header order is now: player → Impact → EA rating.
- Removes the redundant passing-volume team rank.
- Displays rounded passes per match, pass accuracy, team passing share and successful tackles.
- Second assists remain parsed internally for compatibility but are no longer shown in the player recap.

---

## V15

### Full club + player historical replay

- `replay-history` still uses `data/history.json` first, with EA 20-League-match fallback.
- For every historical evening session, matches are replayed oldest to newest.
- Club channel receives the session header, individual match embeds, and reconstructed club recap.
- Player channel receives the reconstructed full-session player recap.
- Player recap uses the same aggregation/stat code as the normal daily recap.
- Both Discord webhook secrets are required for `replay-history`.
- Historical replay still does not modify `data/state.json`.

---

## V14

### Cleaner execution modes + local history priority

- Manual modes reduced to `debug-connect`, `debug-full`, and `replay-history`.
- `test-webhook` renamed to `debug-connect`.
- `full-test` renamed to `debug-full`.
- Removed the replay-history YES/NO confirmation.
- `replay-history` first reads `data/history.json` when present and non-empty.
- If no usable local history file exists, it falls back to the EA call for 20 `leagueMatch` matches.
- Normal EA polling is now League-only as well.
- History fallback reuses the same EA request helper/headers as normal polling.
- The package does not ship an empty `data/history.json`, protecting an existing repository copy.

---

This file contains the version history of the EA SPORTS FC Clubs → Discord Bot.

The main [README.md](./README.md) is intentionally kept simple and describes installation, architecture and behavior rather than historical changes.

---

## V13.3

### 20-match League history

- Historical debug/replay now requests exactly the latest 20 `leagueMatch` matches.
- Playoff history is intentionally ignored for Golden Boys for now.
- Removes the previous `maxResultCount=1000` request.
- `debug-history` reports requested count, returned count, oldest match and newest match.
- `replay-history` keeps chronological order and evening-session grouping.
- `data/state.json` remains untouched by history modes.

---

## V13.2

### History timezone import fix

- Fixes `debug-history`: use the existing `TIME_ZONE` config export.
- Applies the same fix to `replay-history`.
- Validates JavaScript syntax, local named imports/exports and the GitHub Actions YAML.

---

## V13.1

### History workflow + session headers fix

- Rebuilds the manual GitHub Actions mode selector so `debug-history` and `replay-history` are visible.
- Historical replay is grouped by evening session.
- Each session starts with its French local date, first match time, last match time and match count.
- Matches after midnight and before 06:00 remain attached to the previous evening's session.
- Historical replay still leaves `data/state.json` untouched.

---

## V13

### Historical replay

- Adds `debug-history` to inspect the League + Playoff history currently returned by EA.
- Adds `replay-history` to post every unique returned historical match to `#stats-club`, oldest first.
- Deduplicates League/Playoff data by match ID.
- Normalizes EA Unix timestamps in seconds or milliseconds.
- Does not modify `data/state.json`.
- Adds an explicit `YES` confirmation guard before bulk Discord replay.
- Paces Discord webhook posts to reduce rate-limit risk.
- Documents the EA API limitation: `maxResultCount` is known, but no verified public pagination parameter is assumed.

---

## V12

### Player possession/recovery preparation

- Keeps all V11 functionality.
- Adds support for balls/possessions won and lost for outfield players when EA exposes a reliable named value.
- Never converts missing possession data into a fake `0`.
- Goalkeepers do not receive the possession won/lost line.
- Preserves raw `match_event_aggregate_0..3` player data for future confirmed mappings.
- Adds `debug-possession` to inspect possession/recovery-related fields exposed by EA.
- Player example in documentation standardized to `BryanGlory666`.

---

## V11

### Separate Club and Player Discord destinations

- Adds `DISCORD_CLUB_WEBHOOK_URL`.
- Adds `DISCORD_PLAYER_WEBHOOK_URL`.
- Match results and club recap go to the Club destination.
- Individual player recap goes to the Player destination.
- `daily-recap` sends both recaps to their respective destinations.
- `full-test` tests both destinations.
- `test-webhook` tests both webhooks.
- Old `DISCORD_WEBHOOK_URL` is no longer used.

---

## V10

### Creative influence and goalkeeper recap

- Adds second assists from community-derived EA aggregate event `115`.
- Adds pass volume.
- Adds passes per match.
- Adds share of team human-player passing volume.
- Adds team passing-volume rank.
- Adds goalkeeper-specific recap:
  - saves
  - saves per match
  - clean sheets
  - goals conceded
  - passing accuracy

---

## V9

### Whole-session player recap

Adds player statistics based on fields confirmed in real EA Clubs match payloads:

- matches played
- average rating
- goals
- assists
- pass attempts / completed passes
- weighted pass accuracy
- tackle attempts / successful tackles
- weighted tackle success

Also adds:

- `player-recap`
- `full-test`
- live EA data for recap generation

---

## V8.1

### Replay fix

- Fixes the Discord function used by `replay-last-match`.
- Fixes opponent-name access.
- Validates the Discord webhook before replay.

---

## V8

### Raw EA debugging

- Adds `debug-last-match`.
- Prints the complete raw EA match JSON to GitHub Actions logs.
- Does not post the raw payload to Discord.
- Does not modify state.

---

## V7

### Previous-day replay behavior

- Changes replay selection logic to target the latest match from the requested previous-day behavior.
- Renames the manual workflow input description to `Execution mode`.

---

## V6

### Generic reusable workflow

- Workflow moved to `.github/workflows/pipeline.yml`.
- Generic GitHub Actions name: `EA FC Clubs Bot`.
- Project made easier to reuse for another club.

---

## V5

### Documentation

- Adds a complete installation guide.
- Documents GitHub Secrets, Discord webhooks, Actions, state preservation and troubleshooting.

---

## V4

### External club configuration

Adds `club.config.json` so the club can be changed without editing application code:

- `clubId`
- `clubName`
- `platform`
- `timezone`

---

## V3

### Discord presentation

- Assist icon changed to 🎯.

---

## V2

### Unified workflow and session recap

- Adds unified GitHub Actions workflow.
- Adds League + Playoff match retrieval.
- Adds anti-duplicate state.
- Adds session handling.
- Adds Daily Recap.
- Adds manual webhook test and replay.
- Moves runtime to Node.js 24.

---

## V1

### Initial version

- Polls EA Clubs matches.
- Detects new matches.
- Posts match results to Discord.
- Runs with GitHub Actions.
