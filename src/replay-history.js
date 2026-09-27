import { CLUB_ID, CLUB_NAME, TIME_ZONE } from "./config.js";
import { getAvailableHistory, normalizedTimestamp, historyMatchId } from "./history.js";
import { parseMatch, matchEmbed } from "./match.js";
import { clubRecapPayload, playerRecapPayload } from "./recap.js";
import { sendDiscord } from "./discord.js";

const clubWebhook=process.env.DISCORD_CLUB_WEBHOOK_URL;
const playerWebhook=process.env.DISCORD_PLAYER_WEBHOOK_URL;
if(!clubWebhook) throw new Error("Missing DISCORD_CLUB_WEBHOOK_URL");
if(!playerWebhook) throw new Error("Missing DISCORD_PLAYER_WEBHOOK_URL");

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
  return new Intl.DateTimeFormat("fr-FR",{
    timeZone:TIME_ZONE,weekday:"long",day:"numeric",month:"long",year:"numeric"
  }).format(new Date(Date.UTC(y,m-1,d,12)));
}

function parsedForRecap(match,key) {
  return {
    id:historyMatchId(match),
    timestamp:normalizedTimestamp(match),
    session:key,
    ...parseMatch(match,CLUB_ID)
  };
}

async function pause(){ await new Promise(r=>setTimeout(r,1250)); }

async function sendSessionHeader(key, group) {
  const first=normalizedTimestamp(group[0]);
  const last=normalizedTimestamp(group.at(-1));
  await sendDiscord(clubWebhook,{embeds:[{
    title:`📅 SESSION — ${sessionDateLabel(key)}`,
    description:`🕘 ${localTime(first)} → ${localTime(last)} · 🎮 ${group.length} match${group.length>1?"s":""}`
  }]});
}

const matches=await getAvailableHistory(CLUB_ID);
const sessions=new Map();

for(const match of matches) {
  const ms=normalizedTimestamp(match);
  if(!ms) continue;
  const key=sessionKey(ms);
  if(!sessions.has(key)) sessions.set(key,[]);
  sessions.get(key).push(match);
}

console.log(`Replaying ${matches.length} unique historical matches across ${sessions.size} session(s).`);

let sent=0;
for(const [key,group] of sessions) {
  group.sort((a,b)=>normalizedTimestamp(a)-normalizedTimestamp(b));

  // Club channel: session header + every match + reconstructed session recap.
  await sendSessionHeader(key,group);
  await pause();

  for(const match of group) {
    const parsed=parseMatch(match,CLUB_ID);
    await sendDiscord(clubWebhook,matchEmbed(parsed,CLUB_NAME,"📚 HISTORY — "));
    sent++;
    await pause();
  }

  const recapMatches=group.map(match=>parsedForRecap(match,key));
  await sendDiscord(clubWebhook,clubRecapPayload(recapMatches,key,"📚 HISTORY — "));
  await pause();

  // Player channel: same session reconstructed from the historical raw matches.
  await sendDiscord(playerWebhook,playerRecapPayload(recapMatches,key,"📚 HISTORY — "));
  await pause();

  console.log(`Session ${key}: ${group.length} match(es), club recap + player recap sent.`);
}

console.log(`History replay complete: ${sent} match(es) across ${sessions.size} session(s).`);
console.log("Club history -> DISCORD_CLUB_WEBHOOK_URL");
console.log("Player history -> DISCORD_PLAYER_WEBHOOK_URL");
console.log("data/state.json was not modified.");
