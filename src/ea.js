const BASE="https://proclubs.ea.com/api/fc";
const headers={"Accept":"application/json, text/plain, */*","User-Agent":"Mozilla/5.0 Chrome/140 Safari/537.36","Referer":"https://www.ea.com/","Origin":"https://www.ea.com"};
async function get(path,params){const u=new URL(BASE+path);Object.entries(params).forEach(([k,v])=>u.searchParams.set(k,String(v)));const r=await fetch(u,{headers});if(!r.ok)throw new Error(`EA API ${r.status}: ${(await r.text()).slice(0,500)}`);return r.json();}
export async function getRecentMatches(clubId){
 const common={platform:"common-gen5",clubIds:clubId,maxResultCount:10};
 const modes=["leagueMatch","playoffMatch"];
 const results=await Promise.allSettled(modes.map(matchType=>get("/clubs/matches",{...common,matchType})));
 const out=[];
 results.forEach((r,i)=>{if(r.status==="rejected"){console.warn(`[EA] ${modes[i]}: ${r.reason?.message??r.reason}`);return;}const rows=Array.isArray(r.value)?r.value:(r.value?.matches??[]);rows.forEach(m=>out.push({...m,_matchType:modes[i]}));});
 if(!out.length&&results.every(r=>r.status==="rejected"))throw new Error("All EA match endpoints failed.");
 return out;
}
