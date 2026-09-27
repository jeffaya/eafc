import { CLUB_NAME } from "./config.js";
import { sendDiscord } from "./discord.js";
import { matchEmbed } from "./match.js";
import { recentParsedMatches, selectSession, clubRecapPayload, playerRecapPayload } from "./recap.js";

const clubWebhook=process.env.DISCORD_CLUB_WEBHOOK_URL;
const playerWebhook=process.env.DISCORD_PLAYER_WEBHOOK_URL;
if(!clubWebhook) throw new Error("Missing DISCORD_CLUB_WEBHOOK_URL.");
if(!playerWebhook) throw new Error("Missing DISCORD_PLAYER_WEBHOOK_URL.");

const recent=await recentParsedMatches();
if(!recent.length) throw new Error("No recent EA match available for full test.");

const {key,matches}=selectSession(recent,{latest:true});
const latest=[...matches].sort((a,b)=>b.timestamp-a.timestamp)[0];

await sendDiscord(clubWebhook,{
  username:`${CLUB_NAME} Bot`,
  content:`🧪 **FULL TEST CLUB — ${CLUB_NAME} Bot connecté**`
});
await sendDiscord(clubWebhook,matchEmbed(latest,CLUB_NAME,"🧪 TEST — "));
await sendDiscord(clubWebhook,clubRecapPayload(matches,key,"🧪 TEST — "));

await sendDiscord(playerWebhook,{
  username:`${CLUB_NAME} Bot`,
  content:`🧪 **FULL TEST PLAYERS — ${CLUB_NAME} Bot connecté**`
});
await sendDiscord(playerWebhook,playerRecapPayload(matches,key,"🧪 TEST — "));

console.log(`Full test complete: club output -> club channel; player recap -> player channel for ${key}.`);
console.log("data/state.json was not modified.");
