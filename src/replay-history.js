import {CLUB_ID} from "./config.js";
import {readLocalHistory,getEaHistory,normalizeHistory,normalizedTimestamp,historyMatchId} from "./history.js";
import {parseMatch} from "./match.js";
import {clubRecapPayload,playerRecapPayload} from "./recap.js";
import {sendDiscord} from "./discord.js";
import {sessionKey,sessionDateLabel} from "./session.js";

const club=process.env.DISCORD_CLUB_WEBHOOK_URL,player=process.env.DISCORD_PLAYER_WEBHOOK_URL;
if(!club||!player)throw new Error("Missing club/player webhook.");

const requested=(process.env.REPLAY_DATE??"").trim();
if(requested&&!/^\d{4}-\d{2}-\d{2}$/.test(requested))throw new Error("REPLAY_DATE must use YYYY-MM-DD.");

function groupBySession(matches){
  const sessions=new Map();
  for(const m of matches){
    const ts=normalizedTimestamp(m);
    if(!ts)continue;
    const key=sessionKey(new Date(ts));
    if(!sessions.has(key))sessions.set(key,[]);
    sessions.get(key).push(m);
  }
  return sessions;
}

const local=normalizeHistory(await readLocalHistory());
let all=local;
let sessions=groupBySession(all);
let available=[...sessions.keys()].sort();
let target=requested||available.at(-1);

// Important V17.1 behavior:
// if the requested date is not present locally, query EA even when history.json is non-empty.
if(requested&&!sessions.has(requested)){
  console.log(`Session ${requested} not found in data/history.json; trying EA API fallback.`);
  const ea=await getEaHistory(CLUB_ID);
  all=normalizeHistory([...local,...ea]);
  sessions=groupBySession(all);
  available=[...sessions.keys()].sort();
  target=requested;
}

// If there is no local history at all and no explicit date, EA supplies the latest session.
if(!requested&&!target){
  console.log("No local history available; trying EA API fallback.");
  const ea=await getEaHistory(CLUB_ID);
  all=normalizeHistory(ea);
  sessions=groupBySession(all);
  available=[...sessions.keys()].sort();
  target=available.at(-1);
}

if(!target||!sessions.has(target)){
  throw new Error(`No historical session found for ${target||"latest"} after local history + EA fallback. Available: ${available.join(", ")||"none"}`);
}

const ms=sessions.get(target)
  .sort((a,b)=>normalizedTimestamp(a)-normalizedTimestamp(b))
  .map(m=>({id:historyMatchId(m),timestamp:normalizedTimestamp(m),session:target,...parseMatch(m,CLUB_ID)}));

const prefix=`📅 ${sessionDateLabel(target)} — `;
await sendDiscord(club,clubRecapPayload(ms,target,prefix));
await sendDiscord(player,playerRecapPayload(ms,target,prefix));
console.log(`Replay ${target}: ${ms.length} match(es). Session webhook not used.`);
console.log(local.length && requested ? "Replay source: local history + EA fallback when needed." : "Replay complete.");
