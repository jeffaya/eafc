import { CLUB_ID, CLUB_NAME, TIME_ZONE } from "./config.js";
import { getAvailableHistory, normalizedTimestamp, HISTORY_LIMIT } from "./history.js";

const matches=await getAvailableHistory(CLUB_ID);

console.log(`Club: ${CLUB_NAME} (${CLUB_ID})`);
console.log(`Timezone: ${TIME_ZONE}`);
console.log(`Requested: ${HISTORY_LIMIT} leagueMatch`);
console.log(`Unique league matches returned by EA: ${matches.length}`);

if(matches.length) {
  console.log(`Oldest returned: ${new Date(normalizedTimestamp(matches[0])).toISOString()}`);
  console.log(`Newest returned: ${new Date(normalizedTimestamp(matches.at(-1))).toISOString()}`);
}

console.log("No Discord message was sent.");
console.log("data/state.json was not modified.");
