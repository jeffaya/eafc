import { CLUB_ID, CLUB_NAME } from "./config.js";
import { getRecentMatches, matchId, matchTimestamp } from "./ea.js";
import { parseMatch } from "./match.js";
import { sessionKey } from "./session.js";

export async function recentParsedMatches() {
  const raw = await getRecentMatches(CLUB_ID);
  const unique = new Map();
  for (const m of raw) unique.set(matchId(m), m);
  return [...unique.values()]
    .sort((a,b)=>matchTimestamp(a)-matchTimestamp(b))
    .map(m => ({
      id: matchId(m),
      timestamp: matchTimestamp(m),
      session: sessionKey(new Date(matchTimestamp(m))),
      ...parseMatch(m, CLUB_ID)
    }));
}

export function selectSession(matches, { latest = false } = {}) {
  if (!matches.length) return { key: sessionKey(), matches: [] };
  const wanted = latest
    ? [...new Set(matches.map(m=>m.session))].sort().at(-1)
    : sessionKey();
  return { key: wanted, matches: matches.filter(m=>m.session===wanted) };
}

function playerTotals(matches) {
  const stats = new Map();
  for (const m of matches) {
    for (const p of m.players ?? []) {
      const key = p.name;
      const s = stats.get(key) ?? {
        name:p.name, matches:0, ratingSum:0, ratedMatches:0,
        goals:0, assists:0, secondAssists:0, passAttempts:0, passesMade:0,
        tackleAttempts:0, tacklesMade:0, saves:0, goalsConceded:0,
        cleanSheets:0, goalkeeperMatches:0,
        ballsWon:0, ballsLost:0, ballsWonSamples:0, ballsLostSamples:0
      };
      s.matches++;
      s.goals += p.goals ?? 0;
      s.assists += p.assists ?? 0;
      s.secondAssists += p.secondAssists ?? 0;
      s.passAttempts += p.passAttempts ?? 0;
      s.passesMade += p.passesMade ?? 0;
      s.tackleAttempts += p.tackleAttempts ?? 0;
      s.tacklesMade += p.tacklesMade ?? 0;
      s.saves += p.saves ?? 0;
      s.goalsConceded += p.goalsConceded ?? 0;
      s.cleanSheets += p.cleanSheetGk ?? 0;
      if (p.ballsWon !== null && p.ballsWon !== undefined) {
        s.ballsWon += p.ballsWon;
        s.ballsWonSamples++;
      }
      if (p.ballsLost !== null && p.ballsLost !== undefined) {
        s.ballsLost += p.ballsLost;
        s.ballsLostSamples++;
      }
      if (p.position === "goalkeeper") s.goalkeeperMatches++;
      if ((p.rating ?? 0) > 0) {
        s.ratingSum += p.rating;
        s.ratedMatches++;
      }
      stats.set(key,s);
    }
  }
  return [...stats.values()].map(s=>({
    ...s,
    avgRating:s.ratedMatches ? s.ratingSum/s.ratedMatches : 0,
    passPct:s.passAttempts ? Math.round(s.passesMade/s.passAttempts*100) : null,
    tacklePct:s.tackleAttempts ? Math.round(s.tacklesMade/s.tackleAttempts*100) : null,
    isGoalkeeper:s.goalkeeperMatches > s.matches/2,
    savesPerMatch:s.goalkeeperMatches ? s.saves/s.goalkeeperMatches : 0,
    ballsWonPerMatch:s.ballsWonSamples ? s.ballsWon/s.ballsWonSamples : null,
    ballsLostPerMatch:s.ballsLostSamples ? s.ballsLost/s.ballsLostSamples : null
  })).sort((a,b)=>b.avgRating-a.avgRating || b.goals-a.goals || b.assists-a.assists);
}

export function clubRecapPayload(matches, key, prefix="") {
  const wins=matches.filter(m=>m.result==="W").length;
  const draws=matches.filter(m=>m.result==="D").length;
  const losses=matches.filter(m=>m.result==="L").length;
  const gf=matches.reduce((n,m)=>n+m.ourScore,0);
  const ga=matches.reduce((n,m)=>n+m.opponentScore,0);
  const players=playerTotals(matches);
  const scorer=[...players].sort((a,b)=>b.goals-a.goals)[0];
  const assister=[...players].sort((a,b)=>b.assists-a.assists)[0];
  const rated=players[0];
  const pct=matches.length ? Math.round(wins/matches.length*100) : 0;

  const fields=[
    {name:"Résultats",value:`🎮 ${matches.length} matchs\n🟢 ${wins} victoires · 🟡 ${draws} nuls · 🔴 ${losses} défaites\n📈 ${pct}% de victoires`,inline:false},
    {name:"Buts",value:`⚽ ${gf} marqués · 🥅 ${ga} encaissés`,inline:false}
  ];
  if(scorer?.goals)fields.push({name:"⚽ Meilleur buteur",value:`${scorer.name} — ${scorer.goals}`,inline:true});
  if(assister?.assists)fields.push({name:"🎯 Meilleur passeur",value:`${assister.name} — ${assister.assists}`,inline:true});
  if(rated?.avgRating)fields.push({name:"⭐ MVP de la soirée",value:`${rated.name} — ${rated.avgRating.toFixed(1)} moy.`,inline:true});

  return {username:`${CLUB_NAME} Bot`,embeds:[{
    title:`${prefix}📊 DAILY RECAP — ${CLUB_NAME}`,
    description:`Session du **${key}**`,
    fields,timestamp:new Date().toISOString()
  }]};
}

export function playerRecapPayload(matches, key, prefix="") {
  const players=playerTotals(matches);
  const teamPassAttempts=players.reduce((n,p)=>n+p.passAttempts,0);
  const ranked=[...players].sort((a,b)=>b.passAttempts-a.passAttempts);
  const ranks=new Map(ranked.map((p,i)=>[p.name,i+1]));

  const lines=players.map(p=>{
    const passing=p.passPct===null ? "—" : `${p.passPct}% (${p.passesMade}/${p.passAttempts})`;
    if(p.isGoalkeeper){
      return `**🧤 ${p.name} — ⭐ ${p.avgRating.toFixed(1)}**\n` +
        `🎮 ${p.matches} matchs · 🧤 **${p.saves} arrêts · ${p.savesPerMatch.toFixed(1)}/match**\n` +
        `🧱 **${p.cleanSheets} clean sheets** · 🥅 ${p.goalsConceded} buts encaissés\n` +
        `🦶 Passes ${passing}`;
    }
    const ppm=p.matches ? p.passAttempts/p.matches : 0;
    const share=teamPassAttempts ? Math.round(p.passAttempts/teamPassAttempts*100) : 0;
    const tackling=p.tacklePct===null ? "—" : `${p.tacklePct}% (${p.tacklesMade}/${p.tackleAttempts})`;
    const possessionBits=[];
    if(p.ballsWonSamples) possessionBits.push(`♻️ **${p.ballsWon} récupérés · ${p.ballsWonPerMatch.toFixed(1)}/match**`);
    if(p.ballsLostSamples) possessionBits.push(`❌ **${p.ballsLost} perdus · ${p.ballsLostPerMatch.toFixed(1)}/match**`);
    const possessionLine=possessionBits.length ? `\n${possessionBits.join(" · ")}` : "";
    return `**⭐ ${p.name} — ${p.avgRating.toFixed(1)}**\n` +
      `🎮 ${p.matches} matchs · ⚽ ${p.goals} · 🎯 **${p.assists} passes D** · 🪄 **${p.secondAssists} secondes passes D**\n` +
      `🦶 **${p.passAttempts} passes tentées** · ${p.passesMade} réussies · **${p.passPct ?? 0}%**\n` +
      `🔄 **${ppm.toFixed(1)} passes/match** · 🧠 **${share}% du volume** · **#${ranks.get(p.name)} équipe**` +
      possessionLine + `\n🛡️ Tacles ${tackling}`;
  });

  const embeds=[]; let block=""; let part=1;
  for(const line of lines){
    const next=block ? `${block}\n\n${line}` : line;
    if(next.length>3900){
      embeds.push({title:`${prefix}👥 PLAYER RECAP — ${CLUB_NAME}${part>1?` (${part})`:""}`,description:block,footer:{text:`Session ${key} • ${matches.length} matchs du club`}});
      block=line; part++;
    } else block=next;
  }
  if(block) embeds.push({title:`${prefix}👥 PLAYER RECAP — ${CLUB_NAME}${part>1?` (${part})`:""}`,description:block,footer:{text:`Session ${key} • ${matches.length} matchs du club • 2e passe D = mapping EA communautaire (115)`},timestamp:new Date().toISOString()});
  return {username:`${CLUB_NAME} Bot`,embeds};
}
