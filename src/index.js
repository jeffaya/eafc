import fs from "node:fs/promises";
import {getRecentMatches} from "./ea.js";
import {buildMatchPayload,sendDiscord} from "./discord.js";
const CLUB_ID="16999",CLUB_NAME="Golden Boys",STATE=new URL("../data/state.json",import.meta.url),MAX=50;
const webhook=process.env.DISCORD_WEBHOOK_URL;if(!webhook)throw new Error("Missing DISCORD_WEBHOOK_URL.");
const id=m=>String(m?.matchId??m?.matchid??m?.id??`${m?._matchType}:${m?.timestamp??JSON.stringify(m).slice(0,150)}`);
const time=m=>{const x=Number(m?.timestamp??m?.matchTimestamp);return Number.isFinite(x)?x:0;};
let state;try{state=JSON.parse(await fs.readFile(STATE,"utf8"));}catch{state={processedMatchIds:[]};}
const done=new Set((state.processedMatchIds??[]).map(String));
console.log(`[Golden Boys] Checking club ${CLUB_ID}`);
const raw=await getRecentMatches(CLUB_ID), map=new Map();raw.forEach(m=>map.set(id(m),m));
const matches=[...map.entries()].sort(([,a],[,b])=>time(a)-time(b));
async function save(ids){await fs.writeFile(STATE,JSON.stringify({processedMatchIds:[...new Set(ids)].slice(-MAX)},null,2)+"\n");}
if(!done.size){await save(matches.map(([x])=>x));console.log(`First run: baseline ${matches.length} match(es), nothing posted.`);process.exit(0);}
const fresh=matches.filter(([x])=>!done.has(x));
if(!fresh.length){console.log("No new match.");process.exit(0);}
for(const [x,m] of fresh){await sendDiscord(webhook,buildMatchPayload(m,CLUB_ID,CLUB_NAME));done.add(x);console.log(`Posted ${x}`);}
await save([...done]);
