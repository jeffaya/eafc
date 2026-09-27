import { CLUB_ID, CLUB_NAME, TIMEZONE } from "./config.js";
import { getAvailableHistory, normalizedTimestamp } from "./history.js";

const max=Number(process.env.HISTORY_MAX_RESULTS || 1000);
const matches=await getAvailableHistory(CLUB_ID,max);

console.log(`Club: ${CLUB_NAME} (${CLUB_ID})`);
console.log(`Timezone: ${TIMEZONE}`);
console.log(`Unique League + Playoff matches returned by EA: ${matches.length}`);
if(matches.length) {
  console.log(`Oldest returned: ${new Date(normalizedTimestamp(matches[0])).toISOString()}`);
  console.log(`Newest returned: ${new Date(normalizedTimestamp(matches.at(-1))).toISOString()}`);
}
console.log("This command does not modify data/state.json and does not post to Discord.");
console.log("Because EA's Clubs API is undocumented and no verified pagination parameter is available, this is the complete history returned by the endpoint for the requested maxResultCount, not a guarantee of every match ever played.");
