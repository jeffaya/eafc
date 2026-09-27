import { CLUB_ID, CLUB_NAME, TIME_ZONE } from "./config.js";
import { getRecentMatches, matchTimestamp } from "./ea.js";
import { parseMatch, matchEmbed } from "./match.js";
import { postDiscord } from "./discord.js";

function localDateKey(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function previousLocalDateKey(timeZone) {
  // Noon avoids DST edge cases when moving back one calendar day.
  const now = new Date();
  const todayParts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(now);

  const values = Object.fromEntries(todayParts.map(({ type, value }) => [type, value]));
  const utcNoon = new Date(Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    12
  ));
  utcNoon.setUTCDate(utcNoon.getUTCDate() - 1);

  return utcNoon.toISOString().slice(0, 10);
}

const matches = await getRecentMatches(CLUB_ID);
const targetDate = previousLocalDateKey(TIME_ZONE);

const previousDayMatches = matches
  .filter(match => {
    const timestamp = matchTimestamp(match);
    if (!timestamp) return false;
    return localDateKey(new Date(timestamp), TIME_ZONE) === targetDate;
  })
  .sort((a, b) => matchTimestamp(b) - matchTimestamp(a));

if (!previousDayMatches.length) {
  console.log(`No match found for ${CLUB_NAME} on previous day (${targetDate}).`);
  process.exit(0);
}

const latest = previousDayMatches[0];
const parsed = parseMatch(latest, CLUB_ID);

await postDiscord({
  embeds: [
    matchEmbed(parsed, {
      titlePrefix: "🧪 TEST — "
    })
  ]
});

console.log(`Replayed latest match from previous day (${targetDate}): ${parsed.opponent}`);
