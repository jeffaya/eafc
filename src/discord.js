const first=(o,...ks)=>ks.map(k=>o?.[k]).find(v=>v!==undefined&&v!==null);
function ours(m,id){return m?.clubs?.[String(id)]??m?.clubs?.[id]??null;}
function opponent(m,id){return Object.entries(m?.clubs??{}).find(([x])=>String(x)!==String(id))??[null,null];}
function players(m,id){const p=m?.players?.[String(id)]??m?.players?.[id]??{};return (Array.isArray(p)?p:Object.values(p)).map(x=>({name:first(x,"playername","playerName","name")??"Joueur",goals:+(x.goals??0),assists:+(x.assists??0),rating:+(x.rating??0)})).filter(x=>x.goals||x.assists).map(x=>`**${x.name}** — ${x.goals?`⚽ ${x.goals}`:""}${x.goals&&x.assists?" · ":""}${x.assists?`🅰️ ${x.assists}`:""}${x.rating?` · ⭐ ${x.rating.toFixed(1)}`:""}`);}
export function buildMatchPayload(m,id,name){
 const a=ours(m,id),[oid,b]=opponent(m,id),sa=+(first(a,"goals","score")??0),sb=+(first(b,"goals","score")??0);
 const opp=first(b,"name","clubName")??b?.details?.name??(oid?`Club ${oid}`:"Adversaire");
 const result=sa>sb?"🏆 VICTOIRE":sa<sb?"❌ DÉFAITE":"🤝 MATCH NUL", lines=players(m,id);
 return {username:"Golden Boys Bot",embeds:[{title:`${result} — ${name}`,description:`**${name} ${sa} — ${sb} ${opp}**`,fields:lines.length?[{name:"Buteurs / passeurs",value:lines.join("\n").slice(0,1024)}]:[],footer:{text:`EA SPORTS FC Clubs • ${m._matchType??"match"}`},timestamp:new Date().toISOString()}]};
}
export async function sendDiscord(url,payload){const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});if(!r.ok)throw new Error(`Discord ${r.status}: ${(await r.text()).slice(0,500)}`);}
