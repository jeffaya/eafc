import { PLATFORM } from "./config.js";

const BASE="https://proclubs.ea.com/api/fc/clubs/matches";

async function fetchType(clubId, matchType, maxResultCount) {
  const url=new URL(BASE);
  url.searchParams.set("platform", PLATFORM);
  url.searchParams.set("clubIds", clubId);
  url.searchParams.set("matchType", matchType);
  url.searchParams.set("maxResultCount", String(maxResultCount));

  const r=await fetch(url, {
    headers:{
      "accept":"application/json, text/plain, */*",
      "accept-language":"en-US,en;q=0.9",
      "user-agent":"Mozilla/5.0"
    }
  });
  if(!r.ok) throw new Error(`EA ${matchType}: HTTP ${r.status}`);
  const data=await r.json();
  return Array.isArray(data) ? data : [];
}

export function normalizedTimestamp(match) {
  const raw=match?.timestamp ?? match?.matchTimestamp ?? match?.date ?? 0;
  const n=Number(raw);
  if(!Number.isFinite(n) || n<=0) return 0;
  return n < 1e12 ? n*1000 : n;
}

export function historyMatchId(match) {
  return String(match?.matchId ?? match?.matchid ?? match?.id ?? "");
}

export async function getAvailableHistory(clubId, maxResultCount=1000) {
  const settled=await Promise.allSettled([
    fetchType(clubId, "leagueMatch", maxResultCount),
    fetchType(clubId, "playoffMatch", maxResultCount)
  ]);

  const all=[];
  for(const result of settled) {
    if(result.status==="fulfilled") all.push(...result.value);
    else console.warn(result.reason?.message ?? result.reason);
  }

  const byId=new Map();
  for(const m of all) {
    const id=historyMatchId(m);
    if(id) byId.set(id,m);
  }
  return [...byId.values()].sort((a,b)=>normalizedTimestamp(a)-normalizedTimestamp(b));
}
