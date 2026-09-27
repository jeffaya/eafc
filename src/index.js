import {CLUB_ID,CLUB_NAME,MAX_PROCESSED_IDS} from "./config.js";
import {getRecentMatches,matchId,matchTimestamp} from "./ea.js";
import {parseMatch,matchEmbed} from "./match.js";
import {sendDiscord} from "./discord.js";
import {loadState,saveState} from "./state.js";
import {sessionKey} from "./session.js";

const webhook=process.env.DISCORD_SESSION_WEBHOOK_URL;
if(!webhook)throw new Error("Missing DISCORD_SESSION_WEBHOOK_URL.");

const state=await loadState();
state.processedMatchIds??=[];
state.sessionMatches??=[];
const done=new Set(state.processedMatchIds.map(String));

const raw=await getRecentMatches(CLUB_ID);
const unique=new Map();
raw.forEach(m=>unique.set(matchId(m),m));
const ordered=[...unique.entries()].sort(([,a],[,b])=>matchTimestamp(a)-matchTimestamp(b));

if(!done.size){
  state.processedMatchIds=ordered.map(([id])=>id).slice(-MAX_PROCESSED_IDS);
  await saveState(state);
  console.log(`Baseline initialized with ${ordered.length} match(es).`);
  process.exit(0);
}

const fresh=ordered.filter(([id])=>!done.has(id));
if(!fresh.length){console.log("No new match.");process.exit(0);}

for(const [id,m] of fresh){
  const parsed=parseMatch(m,CLUB_ID);
  await sendDiscord(webhook,matchEmbed(parsed,CLUB_NAME));
  state.sessionMatches.push({
    id,
    session:sessionKey(),
    observedAt:new Date().toISOString(),
    ...parsed
  });
  done.add(id);
  console.log(`Posted ${id}`);
}
state.processedMatchIds=[...done].slice(-MAX_PROCESSED_IDS);
// Keep only a small rolling history.
state.sessionMatches=state.sessionMatches.slice(-100);
await saveState(state);
