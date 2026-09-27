import { sendDiscord } from "./discord.js";
import { recentParsedMatches, selectSession, playerRecapPayload } from "./recap.js";

const webhook=process.env.DISCORD_PLAYER_WEBHOOK_URL;
if(!webhook) throw new Error("Missing DISCORD_PLAYER_WEBHOOK_URL.");

const recent=await recentParsedMatches();
const {key,matches}=selectSession(recent,{latest:true});
if(!matches.length){
  console.log("No recent EA match available; player recap skipped.");
  process.exit(0);
}
await sendDiscord(webhook,playerRecapPayload(matches,key,"🧪 TEST — "));
console.log(`Player recap test sent for ${key}: ${matches.length} match(es).`);
