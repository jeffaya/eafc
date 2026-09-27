# Release Notes

This file contains the version history of the EA SPORTS FC Clubs → Discord Bot.

The main [README.md](./README.md) is intentionally kept simple and describes installation, architecture and behavior rather than historical changes.

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
