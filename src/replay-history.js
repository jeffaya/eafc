import { CLUB_ID, CLUB_NAME, TIME_ZONE } from "./config.js";
import { getAvailableHistory, normalizedTimestamp } from "./history.js";
import { parseMatch, matchEmbed } from "./match.js";
import { sendDiscord } from "./discord.js";

const webhook=process.env.DISCORD_CLUB_WEBHOOK_URL;
if(!webhook) throw new Error("Missing DISCORD_CLUB_WEBHOOK_URL");

const max=Number(process.env.HISTORY_MAX_RESULTS || 1000);
const confirm=String(process.env.CONFIRM_HISTORY_REPLAY || "").toUpperCase();
if(confirm!=="YES") throw new Error("Safety stop: set confirm_history_replay to YES.");

function parts(ms) {
  const values={};
  for(const p of new Intl.DateTimeFormat("en-CA",{
    timeZone:TIME_ZONE, year:"numeric",month:"2-digit",day:"2-digit",
    hour:"2-digit",minute:"2-digit",hourCycle:"h23"
  }).formatToParts(new Date(ms))) {
    if(p.type!=="literal") values[p.type]=p.value;
  }
  return values;
}

function sessionKey(ms) {
  const p=parts(ms);
  // Use a noon anchor to safely subtract one local calendar day for after-midnight games.
  let y=Number(p.year), m=Number(p.month), d=Number(p.day);
  if(Number(p.hour)<6) {
    const prev=new Date(Date.UTC(y,m-1,d-1,12));
    y=prev.getUTCFullYear(); m=prev.getUTCMonth()+1; d=prev.getUTCDate();
  }
  return `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}

function localTime(ms) {
  return new Intl.DateTimeFormat("fr-FR",{
    timeZone:TIME_ZONE,hour:"2-digit",minute:"2-digit",hourCycle:"h23"
  }).format(new Date(ms));
}

function sessionDateLabel(key) {
  const [y,m,d]=key.split("-").map(Number);
  // Noon UTC avoids a timezone boundary when formatting Europe/Paris.
  return new Intl.DateTimeFormat("fr-FR",{
    timeZone:TIME_ZONE,weekday:"long",day:"numeric",month:"long",year:"numeric"
  }).format(new Date(Date.UTC(y,m-1,d,12)));
}

async function sendSessionHeader(key, group) {
  const first=normalizedTimestamp(group[0]);
  const last=normalizedTimestamp(group.at(-1));
  const title=`📅 SESSION — ${sessionDateLabel(key)}`;
  const description=`🕘 ${localTime(first)} → ${localTime(last)} · 🎮 ${group.length} match${group.length>1?"s":""}`;
  await sendDiscord(webhook,{embeds:[{title,description}]});
}

const matches=await getAvailableHistory(CLUB_ID,max);
const sessions=new Map();
for(const match of matches) {
  const ms=normalizedTimestamp(match);
  if(!ms) continue;
  const key=sessionKey(ms);
  if(!sessions.has(key)) sessions.set(key,[]);
  sessions.get(key).push(match);
}

console.log(`Replaying ${matches.length} unique historical matches across ${sessions.size} sessions.`);

let sent=0;
for(const [key,group] of sessions) {
  group.sort((a,b)=>normalizedTimestamp(a)-normalizedTimestamp(b));
  await sendSessionHeader(key,group);
  await new Promise(r=>setTimeout(r,1250));

  for(const match of group) {
    const parsed=parseMatch(match,CLUB_ID);
    await sendDiscord(webhook,matchEmbed(parsed,CLUB_NAME,"📚 HISTORY — "));
    sent++;
    await new Promise(r=>setTimeout(r,1250));
  }
}

console.log(`History replay complete: ${sent} matches across ${sessions.size} sessions.`);
console.log("data/state.json was not modified.");
