import {sendDiscord} from "./discord.js";
import {CLUB_NAME} from "./config.js";
const url=process.env.DISCORD_WEBHOOK_URL;
if(!url)throw new Error("Missing DISCORD_WEBHOOK_URL.");
await sendDiscord(url,{username:`${CLUB_NAME} Bot`,content:`👑 **${CLUB_NAME} Bot connecté** — webhook opérationnel.`});
console.log("Webhook OK.");
