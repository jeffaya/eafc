const pick=(o,...keys)=>keys.map(k=>o?.[k]).find(v=>v!==undefined&&v!==null);

function optionalNumber(player, ...keys) {
  const raw = pick(player, ...keys);
  if (raw === undefined || raw === null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function rawAggregates(player) {
  return [0,1,2,3]
    .map(i => String(pick(player, `match_event_aggregate_${i}`) ?? ""))
    .filter(Boolean);
}

function aggregateEventCount(player, eventCode) {
  const wanted = String(eventCode);
  let total = 0;
  for (let i = 0; i <= 3; i++) {
    const raw = String(pick(player, `match_event_aggregate_${i}`) ?? "");
    for (const token of raw.split(",")) {
      const [code, count] = token.split(":");
      if (code === wanted) total += Number(count ?? 0) || 0;
    }
  }
  return total;
}

export function parseMatch(match, clubId) {
  const clubs=match?.clubs??{};
  const ours=clubs[String(clubId)]??clubs[clubId]??{};
  const [opponentId,opp]=Object.entries(clubs).find(([id])=>String(id)!==String(clubId))??[null,{}];
  const ourScore=Number(pick(ours,"goals","score")??0);
  const opponentScore=Number(pick(opp,"goals","score")??0);
  const opponentName=pick(opp,"name","clubName")??opp?.details?.name??(opponentId?`Club ${opponentId}`:"Adversaire");

  const source=match?.players?.[String(clubId)]??match?.players?.[clubId]??{};
  const rows=Array.isArray(source)?source:Object.values(source);
  const players=rows.map(p=>({
    name: pick(p,"playername","playerName","name")??"Joueur",
    goals: Number(pick(p,"goals")??0),
    assists: Number(pick(p,"assists")??0),
    secondAssists: aggregateEventCount(p, 115), // unofficial/community-derived EA mapping
    rating: Number(pick(p,"rating")??0),
    passAttempts: Number(pick(p,"passattempts")??0),
    passesMade: Number(pick(p,"passesmade")??0),
    tackleAttempts: Number(pick(p,"tackleattempts")??0),
    tacklesMade: Number(pick(p,"tacklesmade")??0),
    shots: Number(pick(p,"shots")??0),
    saves: Number(pick(p,"saves")??0),
    goalsConceded: Number(pick(p,"goalsconceded")??0),
    cleanSheetGk: Number(pick(p,"cleansheetsgk")??0),
    // Possession/recovery aliases are intentionally nullable: do not turn missing
    // undocumented EA data into fake zeroes.
    ballsWon: optionalNumber(p,
      "ballsWon","ballswon","ballsWonBack","ballswonback",
      "possessionsWon","possessionWon","possessionswon","possessionwon"),
    ballsLost: optionalNumber(p,
      "ballsLost","ballslost","possessionsLost","possessionLost",
      "possessionslost","possessionlost"),
    rawMatchEventAggregates: rawAggregates(p),
    position: String(pick(p,"pos")??"")
  }));

  return {
    opponentName, ourScore, opponentScore,
    result: ourScore>opponentScore?"W":ourScore<opponentScore?"L":"D",
    players,
    matchType: match?._matchType??"match"
  };
}

export function matchEmbed(parsed, clubName, prefix="") {
  const label=parsed.result==="W"?"🏆 VICTOIRE":parsed.result==="L"?"❌ DÉFAITE":"🤝 MATCH NUL";
  const contributors=parsed.players
    .filter(p=>p.goals||p.assists||p.rating)
    .sort((a,b)=>b.rating-a.rating)
    .map(p=>{
      const x=[];
      if(p.goals)x.push(`⚽ ${p.goals}`);
      if(p.assists)x.push(`🎯 ${p.assists}`);
      if(p.rating)x.push(`⭐ ${p.rating.toFixed(1)}`);
      return `**${p.name}** — ${x.join(" · ")}`;
    });

  return {
    username:`${clubName} Bot`,
    embeds:[{
      title:`${prefix}${label} — ${clubName}`,
      description:`**${clubName} ${parsed.ourScore} — ${parsed.opponentScore} ${parsed.opponentName}**`,
      fields:contributors.length?[{name:"Performances",value:contributors.join("\n").slice(0,1024)}]:[],
      footer:{text:`EA SPORTS FC Clubs • ${parsed.matchType}`},
      timestamp:new Date().toISOString()
    }]
  };
}
