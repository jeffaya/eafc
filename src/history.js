import fs from "node:fs/promises";
import {CLUB_ID} from "./config.js";
import {getRecentMatches,matchId,matchTimestamp} from "./ea.js";
export const HISTORY_FILE=new URL("../data/history.json",import.meta.url);
function extract(j){if(Array.isArray(j))return j;for(const k of ["matches","history","items"])if(Array.isArray(j?.[k]))return j[k];return []}
export async function readLocalHistory(){try{return extract(JSON.parse(await fs.readFile(HISTORY_FILE,"utf8")))}catch(e){if(e?.code==="ENOENT")return [];throw e}}
export const normalizedTimestamp=m=>matchTimestamp(m);export const historyMatchId=m=>matchId(m);
function normalize(ms){const x=new Map();for(const m of ms){const id=historyMatchId(m);if(id)x.set(id,m)}return [...x.values()].sort((a,b)=>normalizedTimestamp(a)-normalizedTimestamp(b))}
export async function mergeHistory(ms){const cur=await readLocalHistory(),merged=normalize([...cur,...ms]);if(merged.length!==cur.length){await fs.mkdir(new URL("../data/",import.meta.url),{recursive:true});await fs.writeFile(HISTORY_FILE,JSON.stringify(merged,null,2)+"\n")}return merged}
export async function getAvailableHistory(clubId=CLUB_ID){const local=await readLocalHistory();return local.length?normalize(local):normalize(await getRecentMatches(clubId))}
