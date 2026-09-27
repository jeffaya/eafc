import { CLUB_ID } from "./config.js";
import { getRecentMatches } from "./ea.js";

const matches=await getRecentMatches(CLUB_ID);
const keys=new Set();
for(const m of matches){
  const source=m?.players?.[String(CLUB_ID)] ?? {};
  for(const p of Object.values(source)){
    for(const k of Object.keys(p)){
      if(/ball|possess|intercept|recover|won|lost/i.test(k)) keys.add(k);
    }
  }
}
console.log("EA player fields potentially related to recoveries/possession:");
console.log([...keys].sort().join("\n") || "(none exposed as named fields)");
console.log("Hidden match_event_aggregate_* data is preserved by V12 parser but is not assigned to Balls Won/Lost until a reliable event mapping is known.");
