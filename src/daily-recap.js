import { sendDiscord } from "./discord.js";
import { recentParsedMatches, selectSession, clubRecapPayload, playerRecapPayload } from "./recap.js";

const webhook=process.env.DISCORD_WEBHOOK_URL;
if(!webhook) throw new Error("Missing DISCORD_WEBHOOK_URL.");

const recent=await recentParsedMatches();
const {key,matches}=selectSession(recent);

if(!matches.length){
  console.log(`No EA match found for session ${key}; recap skipped.`);
  process.exit(0);
}

await sendDiscord(webhook,clubRecapPayload(matches,key));
await sendDiscord(webhook,playerRecapPayload(matches,key));
console.log(`Club + player recap sent for ${key}: ${matches.length} match(es).`);
