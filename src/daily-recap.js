import { sendDiscord } from "./discord.js";
import { recentParsedMatches, selectSession, clubRecapPayload, playerRecapPayload } from "./recap.js";

const clubWebhook=process.env.DISCORD_CLUB_WEBHOOK_URL;
const playerWebhook=process.env.DISCORD_PLAYER_WEBHOOK_URL;
if(!clubWebhook) throw new Error("Missing DISCORD_CLUB_WEBHOOK_URL.");
if(!playerWebhook) throw new Error("Missing DISCORD_PLAYER_WEBHOOK_URL.");

const recent=await recentParsedMatches();
const {key,matches}=selectSession(recent);

if(!matches.length){
  console.log(`No EA match found for session ${key}; recap skipped.`);
  process.exit(0);
}

await sendDiscord(clubWebhook,clubRecapPayload(matches,key));
await sendDiscord(playerWebhook,playerRecapPayload(matches,key));
console.log(`Club recap -> club channel; player recap -> player channel for ${key}: ${matches.length} match(es).`);
