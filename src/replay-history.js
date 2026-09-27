import { CLUB_ID, CLUB_NAME } from "./config.js";
import { getAvailableHistory } from "./history.js";
import { parseMatch, matchEmbed } from "./match.js";
import { sendDiscord } from "./discord.js";

const webhook=process.env.DISCORD_CLUB_WEBHOOK_URL;
if(!webhook) throw new Error("Missing DISCORD_CLUB_WEBHOOK_URL");

const max=Number(process.env.HISTORY_MAX_RESULTS || 1000);
const confirm=String(process.env.CONFIRM_HISTORY_REPLAY || "").toUpperCase();
if(confirm!=="YES") {
  throw new Error("Safety stop: set CONFIRM_HISTORY_REPLAY=YES for replay-history.");
}

const matches=await getAvailableHistory(CLUB_ID,max);
console.log(`Replaying ${matches.length} unique historical matches, oldest first.`);

let sent=0;
for(const match of matches) {
  const parsed=parseMatch(match, CLUB_ID);
  await sendDiscord(webhook, matchEmbed(parsed, CLUB_NAME, "📚 HISTORY — "));
  sent++;
  // Conservative pacing for Discord webhooks.
  await new Promise(r=>setTimeout(r, 1250));
}
console.log(`History replay complete: ${sent} matches sent.`);
console.log("data/state.json was not modified.");
