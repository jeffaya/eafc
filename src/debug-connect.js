import {sendDiscord} from "./discord.js";
import {CLUB_NAME} from "./config.js";

const clubUrl=process.env.DISCORD_CLUB_WEBHOOK_URL;
const playerUrl=process.env.DISCORD_PLAYER_WEBHOOK_URL;
const sessionUrl=process.env.DISCORD_SESSION_WEBHOOK_URL;
if(!clubUrl) throw new Error("Missing DISCORD_CLUB_WEBHOOK_URL.");
if(!playerUrl) throw new Error("Missing DISCORD_PLAYER_WEBHOOK_URL.");
if(!sessionUrl) throw new Error("Missing DISCORD_SESSION_WEBHOOK_URL.");

await sendDiscord(clubUrl,{username:`${CLUB_NAME} Bot`,content:`👑 **${CLUB_NAME} Bot — CLUB STATS** — webhook opérationnel.`});
await sendDiscord(playerUrl,{username:`${CLUB_NAME} Bot`,content:`👥 **${CLUB_NAME} Bot — PLAYER STATS** — webhook opérationnel.`});
await sendDiscord(sessionUrl,{username:`${CLUB_NAME} Bot`,content:`🎮 **${CLUB_NAME} Bot — SESSION** — webhook opérationnel.`});
console.log("Club + player + session webhooks OK.");
