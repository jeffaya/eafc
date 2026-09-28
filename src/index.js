import {CLUB_ID,CLUB_NAME,MAX_PROCESSED_IDS} from "./config.js";
import {getRecentMatches,matchId,matchTimestamp} from "./ea.js";
import {parseMatch,matchEmbed} from "./match.js";
import {sendDiscord} from "./discord.js";
import {loadState,saveState} from "./state.js";
import {sessionKey,isSessionRecapDue} from "./session.js";
import {mergeHistory} from "./history.js";
import {clubRecapPayload,playerRecapPayload} from "./recap.js";
const live=process.env.DISCORD_SESSION_WEBHOOK_URL,club=process.env.DISCORD_CLUB_WEBHOOK_URL,player=process.env.DISCORD_PLAYER_WEBHOOK_URL;
if(!live||!club||!player)throw new Error("Missing Discord webhook secret(s).");
const state=await loadState(),done=new Set(state.processedMatchIds.map(String)),recapped=new Set(state.recappedSessionKeys),remembered=new Map(state.sessionMatches.map(m=>[String(m.id),m]));
const raw=await getRecentMatches(CLUB_ID),unique=new Map();raw.forEach(m=>unique.set(matchId(m),m));const ordered=[...unique.entries()].sort(([,a],[,b])=>matchTimestamp(a)-matchTimestamp(b));
await mergeHistory(ordered.map(([,m])=>m));
for(const [id,m] of ordered){const key=sessionKey(new Date(matchTimestamp(m))),parsed={id,session:key,timestamp:matchTimestamp(m),observedAt:new Date().toISOString(),...parseMatch(m,CLUB_ID)};if(!recapped.has(key)&&!remembered.has(id))remembered.set(id,parsed);if(done.size&&!done.has(id)){await sendDiscord(live,matchEmbed(parsed,CLUB_NAME));done.add(id)}}
if(!done.size)ordered.forEach(([id])=>done.add(id));
state.processedMatchIds=[...done].slice(-MAX_PROCESSED_IDS);state.sessionMatches=[...remembered.values()];await saveState(state);
const groups=new Map();for(const m of state.sessionMatches){if(recapped.has(m.session))continue;if(!groups.has(m.session))groups.set(m.session,[]);groups.get(m.session).push(m)}
for(const key of [...groups.keys()].sort()){if(!isSessionRecapDue(key))continue;const ms=groups.get(key).sort((a,b)=>(a.timestamp??0)-(b.timestamp??0));await sendDiscord(club,clubRecapPayload(ms,key));await sendDiscord(player,playerRecapPayload(ms,key));recapped.add(key);state.recappedSessionKeys=[...recapped].sort().slice(-60);state.sessionMatches=state.sessionMatches.filter(m=>m.session!==key);await saveState(state)}
