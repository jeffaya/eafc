import {sendDiscord} from "./discord.js";
const url=process.env.DISCORD_WEBHOOK_URL;if(!url)throw new Error("Missing DISCORD_WEBHOOK_URL.");
await sendDiscord(url,{username:"Golden Boys Bot",content:"👑 **Golden Boys Bot connecté** — webhook opérationnel."});
console.log("Discord test sent.");
