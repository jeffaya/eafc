import { CLUB_ID, CLUB_NAME, TIME_ZONE } from "./config.js";
import { getRecentMatches, matchTimestamp } from "./ea.js";

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
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const noon = new Date(Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    12
  ));

  noon.setUTCDate(noon.getUTCDate() - 1);
  return noon.toISOString().slice(0, 10);
}

const matches = await getRecentMatches(CLUB_ID);
const targetDate = previousLocalDateKey(TIME_ZONE);

const candidates = matches
  .filter(match => {
    const timestamp = matchTimestamp(match);
    return timestamp &&
      localDateKey(new Date(timestamp), TIME_ZONE) === targetDate;
  })
  .sort((a, b) => matchTimestamp(b) - matchTimestamp(a));

if (!candidates.length) {
  console.log(`No match found for ${CLUB_NAME} on previous day (${targetDate}).`);
  process.exit(0);
}

console.log("============================================================");
console.log(`RAW EA MATCH DEBUG — ${CLUB_NAME}`);
console.log(`Previous day: ${targetDate}`);
console.log("This output is written to GitHub Actions logs only.");
console.log("============================================================");
console.log(JSON.stringify(candidates[0], null, 2));
console.log("============================================================");
