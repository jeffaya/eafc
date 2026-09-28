import {TIME_ZONE} from "./config.js";
export function localParts(date=new Date()){
  const p=new Intl.DateTimeFormat("en-CA",{timeZone:TIME_ZONE,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(date);
  return Object.fromEntries(p.filter(x=>x.type!=="literal").map(x=>[x.type,x.value]));
}
function shiftDate(key,days){const [y,m,d]=key.split("-").map(Number);return new Date(Date.UTC(y,m-1,d+days,12)).toISOString().slice(0,10)}
export function sessionKey(date=new Date()){
  const p=localParts(date),today=`${p.year}-${p.month}-${p.day}`;
  return Number(p.hour)<6?shiftDate(today,-1):today;
}
export function isSessionRecapDue(key,date=new Date()){
  const p=localParts(date),today=`${p.year}-${p.month}-${p.day}`,end=shiftDate(key,1);
  if(today>end)return true;if(today<end)return false;
  return Number(p.hour)>1||(Number(p.hour)===1&&Number(p.minute)>=30);
}
export function sessionDateLabel(key){const [y,m,d]=key.split("-").map(Number);return new Intl.DateTimeFormat("fr-FR",{timeZone:TIME_ZONE,weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(new Date(Date.UTC(y,m-1,d,12)))}
