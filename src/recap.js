import { CLUB_ID, CLUB_NAME } from "./config.js";
import { getRecentMatches, matchId, matchTimestamp } from "./ea.js";
import { parseMatch } from "./match.js";
import { sessionKey } from "./session.js";

export async function recentParsedMatches() {
  const raw = await getRecentMatches(CLUB_ID);
  const unique = new Map();
  for (const m of raw) unique.set(matchId(m), m);
  return [...unique.values()].sort((a,b)=>matchTimestamp(a)-matchTimestamp(b)).map(m => ({
    id: matchId(m), timestamp: matchTimestamp(m),
    session: sessionKey(new Date(matchTimestamp(m))), ...parseMatch(m, CLUB_ID)
  }));
}
export function selectSession(matches,{latest=false}={}) {
  if(!matches.length)return {key:sessionKey(),matches:[]};
  const wanted=latest?[...new Set(matches.map(m=>m.session))].sort().at(-1):sessionKey();
  return {key:wanted,matches:matches.filter(m=>m.session===wanted)};
}
function playerTotals(matches){
  const stats=new Map();
  for(const m of matches)for(const p of m.players??[]){
    const s=stats.get(p.name)??{name:p.name,matches:0,ratingSum:0,ratedMatches:0,goals:0,assists:0,keyPasses:0,passAttempts:0,passesMade:0,positions:{forward:0,midfielder:0,defender:0,goalkeeper:0},tackleAttempts:0,tacklesMade:0,saves:0,goalsConceded:0,cleanSheets:0,goalkeeperMatches:0};
    s.matches++; s.goals+=p.goals??0; s.assists+=p.assists??0; s.keyPasses+=p.keyPasses??0;
    s.passAttempts+=p.passAttempts??0; s.passesMade+=p.passesMade??0; s.tackleAttempts+=p.tackleAttempts??0; s.tacklesMade+=p.tacklesMade??0;
    s.saves+=p.saves??0; s.goalsConceded+=p.goalsConceded??0; s.cleanSheets+=p.cleanSheetGk??0;
    if(p.position==="goalkeeper")s.goalkeeperMatches++;
    if(s.positions[p.position]!==undefined)s.positions[p.position]++;
    if((p.rating??0)>0){s.ratingSum+=p.rating;s.ratedMatches++}
    stats.set(p.name,s);
  }
  return [...stats.values()].map(s=>{
    const position=Object.entries(s.positions).sort((a,b)=>b[1]-a[1])[0]?.[0]??"midfielder";
    return {...s,position,avgRating:s.ratedMatches?s.ratingSum/s.ratedMatches:0,
      passPct:s.passAttempts?Math.round(s.passesMade/s.passAttempts*100):null,
      isGoalkeeper:s.goalkeeperMatches>s.matches/2,
      savesPerMatch:s.goalkeeperMatches?s.saves/s.goalkeeperMatches:0};
  }).sort((a,b)=>b.avgRating-a.avgRating||b.goals-a.goals||b.assists-a.assists);
}
const clamp=(n,min=0,max=10)=>Math.max(min,Math.min(max,n));
function statisticalImpactScore(p){
  const games=Math.max(1,p.matches),passPct=(p.passPct??0)/100;
  const passing=10*(.60*Math.min((p.passAttempts/games)/25,1)+.40*passPct);
  if(p.isGoalkeeper){
    const saves=10*Math.min((p.savesPerMatch||0)/5,1),clean=10*Math.min((p.cleanSheets/games)/.5,1);
    return clamp(.50*saves+.25*clean+.25*passing);
  }
  const creation=10*(.35*Math.min((p.goals/games)/1,1)+.30*Math.min((p.assists/games)/.8,1)+.35*Math.min((p.keyPasses/games)/6,1));
  const target=p.position==="defender"?3:p.position==="midfielder"?2:1.5;
  const defense=10*Math.min((p.tacklesMade/games)/target,1);
  const w=p.position==="defender"?[.20,.35,.45]:p.position==="forward"?[.55,.30,.15]:[.40,.40,.20];
  return clamp(w[0]*creation+w[1]*passing+w[2]*defense);
}
// V18: EA is the anchor. Statistical contribution only adjusts it.
function impactRating(p){
  const ea=clamp(p.avgRating||0),stats=statisticalImpactScore(p);
  const adjustment=clamp(.30*(stats-ea),-1.5,1.5);
  return clamp(ea+adjustment);
}
const medal=i=>["🥇","🥈","🥉"][i]??`${i+1}.`;

export function clubRecapPayload(matches,key,prefix=""){
  const wins=matches.filter(m=>m.result==="W").length,draws=matches.filter(m=>m.result==="D").length,losses=matches.filter(m=>m.result==="L").length;
  const gf=matches.reduce((n,m)=>n+m.ourScore,0),ga=matches.reduce((n,m)=>n+m.opponentScore,0),players=playerTotals(matches);
  const scorer=[...players].sort((a,b)=>b.goals-a.goals)[0],assister=[...players].sort((a,b)=>b.assists-a.assists)[0],rated=players[0];
  const pct=matches.length?Math.round(wins/matches.length*100):0;
  const fields=[{name:"Résultats",value:`🎮 ${matches.length} matchs\n🟢 ${wins} victoires · 🟡 ${draws} nuls · 🔴 ${losses} défaites\n📈 ${pct}% de victoires`,inline:false},{name:"Buts",value:`⚽ ${gf} marqués · 🥅 ${ga} encaissés`,inline:false}];
  if(scorer?.goals)fields.push({name:"⚽ Meilleur buteur",value:`${scorer.name} — ${scorer.goals}`,inline:true});
  if(assister?.assists)fields.push({name:"🎯 Meilleur passeur",value:`${assister.name} — ${assister.assists}`,inline:true});
  if(rated?.avgRating)fields.push({name:"⭐ MVP de la soirée",value:`${rated.name} — ${rated.avgRating.toFixed(1)} moy.`,inline:true});
  return {username:`${CLUB_NAME} Bot`,embeds:[{title:`${prefix}📊 DAILY RECAP — ${CLUB_NAME}`,description:`Session du **${key}**`,fields,timestamp:new Date().toISOString()}]};
}
export function playerRecapPayload(matches,key,prefix=""){
  const base=playerTotals(matches),teamPassAttempts=base.reduce((n,p)=>n+p.passAttempts,0);
  const players=base.map(p=>({...p,impact:impactRating(p)})).sort((a,b)=>b.impact-a.impact||b.avgRating-a.avgRating||b.goals-a.goals||b.assists-a.assists);
  const lines=players.map((p,index)=>{
    const head=`**${medal(index)} ${p.name} · 🔥 Impact ${p.impact.toFixed(1)} · ⭐ EA ${p.avgRating.toFixed(1)}**`,passingPct=p.passPct??0;
    if(p.isGoalkeeper)return head+`\n🎮 **${p.matches} matchs**\n🧤 **${p.saves} arrêts** · ${p.savesPerMatch.toFixed(1)}/match · 🧱 **${p.cleanSheets} clean sheets**\n🥅 ${p.goalsConceded} buts encaissés · 🦶 **${passingPct}% de passes réussies**`;
    const ppm=p.matches?Math.round(p.passAttempts/p.matches):0,share=teamPassAttempts?Math.round(p.passAttempts/teamPassAttempts*100):0;
    return head+`\n🎮 **${p.matches} matchs**\n⚽ **${p.goals} but${p.goals>1?"s":""}** · 🎯 **${p.assists} passe${p.assists>1?"s":""} D** · 🔑 **${p.keyPasses} passe${p.keyPasses>1?"s":""} clé${p.keyPasses>1?"s":""}**\n🦶 **${ppm} passes/match** · **${passingPct}% réussies**\n🧠 **${share}% du volume de jeu**\n🛡️ **${p.tacklesMade} tacle${p.tacklesMade>1?"s":""} réussi${p.tacklesMade>1?"s":""}**`;
  });
  const embeds=[];let block="",part=1;
  for(const line of lines){const next=block?`${block}\n\n${line}`:line;if(next.length>3900){embeds.push({title:`${prefix}👥 PLAYER RECAP — ${CLUB_NAME}${part>1?` (${part})`:""}`,description:block,footer:{text:`Session ${key} • ${matches.length} matchs du club • Classement par Impact`}});block=line;part++;}else block=next;}
  if(block)embeds.push({title:`${prefix}👥 PLAYER RECAP — ${CLUB_NAME}${part>1?` (${part})`:""}`,description:block,footer:{text:`Session ${key} • ${matches.length} matchs du club • Classement par Impact`},timestamp:new Date().toISOString()});
  return {username:`${CLUB_NAME} Bot`,embeds};
}
