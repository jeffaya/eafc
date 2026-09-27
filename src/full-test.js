import { CLUB_ID, CLUB_NAME } from "./config.js";
import { sendDiscord } from "./discord.js";
import { matchEmbed } from "./match.js";
import { recentParsedMatches, selectSession, clubRecapPayload, playerRecapPayload } from "./recap.js";

const webhook=process.env.DISCORD_WEBHOOK_URL;
if(!webhook) throw new Error("Missing DISCORD_WEBHOOK_URL.");

const recent=await recentParsedMatches();
if(!recent.length) throw new Error("No recent EA match available for full test.");

const {key,matches}=selectSession(recent,{latest:true});
const latest=[...matches].sort((a,b)=>b.timestamp-a.timestamp)[0];

await sendDiscord(webhook,{
  username:`${CLUB_NAME} Bot`,
  content:`🧪 **FULL TEST — ${CLUB_NAME} Bot connecté**`
});
await sendDiscord(webhook,matchEmbed(latest,CLUB_NAME,"🧪 TEST — "));
await sendDiscord(webhook,clubRecapPayload(matches,key,"🧪 TEST — "));
await sendDiscord(webhook,playerRecapPayload(matches,key,"🧪 TEST — "));

console.log(`Full test complete: webhook + match + club recap + player recap for ${key}.`);
console.log("data/state.json was not modified.");
