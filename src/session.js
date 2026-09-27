import {TIME_ZONE} from "./config.js";

function parisParts(date=new Date()){
  const parts=new Intl.DateTimeFormat("en-CA",{
    timeZone:TIME_ZONE,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",hourCycle:"h23"
  }).formatToParts(date);
  return Object.fromEntries(parts.filter(x=>x.type!=="literal").map(x=>[x.type,x.value]));
}

export function sessionKey(date=new Date()){
  const p=parisParts(date);
  let d=new Date(`${p.year}-${p.month}-${p.day}T12:00:00Z`);
  // After midnight and before 06:00 belongs to the previous evening's session.
  if(Number(p.hour)<6)d.setUTCDate(d.getUTCDate()-1);
  return d.toISOString().slice(0,10);
}
