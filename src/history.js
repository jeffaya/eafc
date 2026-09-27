import fs from "node:fs/promises";
import { CLUB_ID } from "./config.js";
import { getRecentMatches, matchId, matchTimestamp } from "./ea.js";

export const HISTORY_FILE = new URL("../data/history.json", import.meta.url);

function extractMatches(json) {
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.matches)) return json.matches;
  if (Array.isArray(json?.history)) return json.history;
  if (Array.isArray(json?.items)) return json.items;
  return [];
}

async function readLocalHistory() {
  try {
    const raw = await fs.readFile(HISTORY_FILE, "utf8");
    if (!raw.trim()) return [];
    const json = JSON.parse(raw);
    const matches = extractMatches(json);
    if (!matches.length) {
      console.log("data/history.json exists but contains no matches; falling back to EA.");
      return [];
    }
    console.log(`History source: data/history.json (${matches.length} raw match(es)).`);
    return matches;
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    if (error instanceof SyntaxError) {
      throw new Error(`data/history.json is not valid JSON: ${error.message}`);
    }
    throw error;
  }
}

export function normalizedTimestamp(match) {
  return matchTimestamp(match);
}

export function historyMatchId(match) {
  return matchId(match);
}

function normalize(matches) {
  const byId = new Map();
  for (const m of matches) {
    const id = historyMatchId(m);
    if (id) byId.set(id, m);
  }
  return [...byId.values()].sort(
    (a,b) => normalizedTimestamp(a) - normalizedTimestamp(b)
  );
}

export async function getAvailableHistory(clubId = CLUB_ID) {
  const local = await readLocalHistory();
  if (local.length) return normalize(local);

  console.log("History source: EA API fallback (20 leagueMatch).");
  return normalize(await getRecentMatches(clubId));
}
