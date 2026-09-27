import {CLUB_ID,CLUB_NAME} from "./config.js";
import {getRecentMatches,matchTimestamp} from "./ea.js";
import {parseMatch,matchEmbed} from "./match.js";
import {sendDiscord} from "./discord.js";

const webhook=process.env.DISCORD_WEBHOOK_URL;
if(!webhook)throw new Error("Missing DISCORD_WEBHOOK_URL.");
const matches=await getRecentMatches(CLUB_ID);
if(!matches.length)throw new Error("No EA match found.");
const latest=[...matches].sort((a,b)=>matchTimestamp(b)-matchTimestamp(a))[0];
await sendDiscord(webhook,matchEmbed(parseMatch(latest,CLUB_ID),CLUB_NAME,"🧪 TEST — "));
console.log("Latest real EA match replayed. State untouched.");
