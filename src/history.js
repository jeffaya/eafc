import { PLATFORM } from "./config.js";

const BASE="https://proclubs.ea.com/api/fc/clubs/matches";
export const HISTORY_LIMIT=20;

export function normalizedTimestamp(match) {
  const raw=match?.timestamp ?? match?.matchTimestamp ?? match?.date ?? 0;
  const n=Number(raw);
  if(!Number.isFinite(n) || n<=0) return 0;
  return n < 1e12 ? n*1000 : n;
}

export function historyMatchId(match) {
  return String(match?.matchId ?? match?.matchid ?? match?.id ?? "");
}

export async function getAvailableHistory(clubId) {
  const url=new URL(BASE);
  url.searchParams.set("platform", PLATFORM);
  url.searchParams.set("clubIds", clubId);
  url.searchParams.set("matchType", "leagueMatch");
  url.searchParams.set("maxResultCount", String(HISTORY_LIMIT));

  console.log(`EA history request: leagueMatch, maxResultCount=${HISTORY_LIMIT}`);

  const r=await fetch(url, {
    headers:{
      "accept":"application/json, text/plain, */*",
      "accept-language":"en-US,en;q=0.9",
      "user-agent":"Mozilla/5.0"
    }
  });

  if(!r.ok) {
    throw new Error(`EA leagueMatch history request failed: HTTP ${r.status}`);
  }

  const data=await r.json();
  const rows=Array.isArray(data) ? data : [];

  const byId=new Map();
  for(const m of rows) {
    const id=historyMatchId(m);
    if(id) byId.set(id,m);
  }

  return [...byId.values()].sort(
    (a,b)=>normalizedTimestamp(a)-normalizedTimestamp(b)
  );
}
