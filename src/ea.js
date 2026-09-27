import { PLATFORM } from "./config.js";

const BASE = "https://proclubs.ea.com/api/fc";
export const EA_HEADERS = {
  "Accept": "application/json, text/plain, */*",
  "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/140 Safari/537.36",
  "Referer": "https://www.ea.com/",
  "Origin": "https://www.ea.com"
};

export async function getEa(path, params) {
  const url = new URL(BASE + path);
  Object.entries(params).forEach(([k,v]) => url.searchParams.set(k, String(v)));
  const r = await fetch(url, { headers: EA_HEADERS });
  if (!r.ok) throw new Error(`EA API ${r.status}: ${(await r.text()).slice(0,500)}`);
  return r.json();
}

export async function getRecentMatches(clubId) {
  const value = await getEa("/clubs/matches", {
    platform: PLATFORM,
    clubIds: clubId,
    matchType: "leagueMatch",
    maxResultCount: 20
  });
  const rows = Array.isArray(value) ? value : (value?.matches ?? []);
  return rows.map(m => ({...m, _matchType:"leagueMatch"}));
}

export function matchId(m) {
  return String(m?.matchId ?? m?.matchid ?? m?.id ??
    `${m?._matchType}:${m?.timestamp ?? JSON.stringify(m).slice(0,160)}`);
}

export function matchTimestamp(m) {
  const raw = m?.timestamp ?? m?.matchTimestamp ?? m?.date;
  const n = Number(raw);
  if (Number.isFinite(n)) return n > 1e12 ? n : n * 1000;
  const p = Date.parse(raw);
  return Number.isFinite(p) ? p : 0;
}
