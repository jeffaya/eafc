import {CLUB_NAME} from "./config.js";
import {loadState} from "./state.js";
import {sessionKey} from "./session.js";
import {sendDiscord} from "./discord.js";

const webhook=process.env.DISCORD_WEBHOOK_URL;
if(!webhook)throw new Error("Missing DISCORD_WEBHOOK_URL.");
const state=await loadState();
const key=sessionKey();
const matches=(state.sessionMatches??[]).filter(m=>m.session===key);

if(!matches.length){
  console.log(`No recorded match for session ${key}; recap skipped.`);
  process.exit(0);
}

const wins=matches.filter(m=>m.result==="W").length;
const draws=matches.filter(m=>m.result==="D").length;
const losses=matches.filter(m=>m.result==="L").length;
const gf=matches.reduce((n,m)=>n+m.ourScore,0);
const ga=matches.reduce((n,m)=>n+m.opponentScore,0);
const stats=new Map();

for(const m of matches)for(const p of m.players??[]){
  const s=stats.get(p.name)??{name:p.name,goals:0,assists:0,ratings:[]};
  s.goals+=p.goals??0;s.assists+=p.assists??0;
  if(p.rating)s.ratings.push(p.rating);
  stats.set(p.name,s);
}
const all=[...stats.values()];
const top=(field)=>[...all].sort((a,b)=>b[field]-a[field])[0];
const scorer=top("goals"), assister=top("assists");
const rated=all.filter(x=>x.ratings.length).map(x=>({...x,avg:x.ratings.reduce((a,b)=>a+b,0)/x.ratings.length})).sort((a,b)=>b.avg-a.avg)[0];
const pct=Math.round(wins/matches.length*100);

const fields=[
 {name:"Résultats",value:`🎮 ${matches.length} matchs\n🟢 ${wins} victoires · 🟡 ${draws} nuls · 🔴 ${losses} défaites\n📈 ${pct}% de victoires`,inline:false},
 {name:"Buts",value:`⚽ ${gf} marqués · 🥅 ${ga} encaissés`,inline:false}
];
if(scorer?.goals)fields.push({name:"⚽ Meilleur buteur",value:`${scorer.name} — ${scorer.goals}`,inline:true});
if(assister?.assists)fields.push({name:"🎯 Meilleur passeur",value:`${assister.name} — ${assister.assists}`,inline:true});
if(rated)fields.push({name:"⭐ MVP de la soirée",value:`${rated.name} — ${rated.avg.toFixed(1)} moy.`,inline:true});

await sendDiscord(webhook,{
 username:"Golden Boys Bot",
 embeds:[{title:`📊 DAILY RECAP — ${CLUB_NAME}`,description:`Session du **${key}**`,fields,timestamp:new Date().toISOString()}]
});
console.log(`Recap sent for ${key}: ${matches.length} match(es).`);
