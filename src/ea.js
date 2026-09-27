import { PLATFORM } from "./config.js";

const BASE = "https://proclubs.ea.com/api/fc";
const headers = {
  "Accept": "application/json, text/plain, */*",
  "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/140 Safari/537.36",
  "Referer": "https://www.ea.com/",
  "Origin": "https://www.ea.com"
};

async function get(path, params) {
  const url = new URL(BASE + path);
  Object.entries(params).forEach(([k,v]) => url.searchParams.set(k, String(v)));
  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error(`EA API ${r.status}: ${(await r.text()).slice(0,500)}`);
  return r.json();
}

export async function getRecentMatches(clubId) {
  const common = { platform: PLATFORM, clubIds:clubId, maxResultCount:20 };
  const modes = ["leagueMatch", "playoffMatch"];
  const settled = await Promise.allSettled(
    modes.map(matchType => get("/clubs/matches", {...common, matchType}))
  );
  const out = [];
  settled.forEach((r,i) => {
    if (r.status === "rejected") {
      console.warn(`[EA] ${modes[i]} unavailable: ${r.reason?.message ?? r.reason}`);
      return;
    }
    const rows = Array.isArray(r.value) ? r.value : (r.value?.matches ?? []);
    rows.forEach(m => out.push({...m, _matchType:modes[i]}));
  });
  if (!out.length && settled.every(r => r.status === "rejected"))
    throw new Error("All EA match endpoints failed.");
  return out;
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
