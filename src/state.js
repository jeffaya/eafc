import fs from "node:fs/promises";
const FILE=new URL("../data/state.json",import.meta.url);
export async function loadState(){try{const s=JSON.parse(await fs.readFile(FILE,"utf8"));return {processedMatchIds:Array.isArray(s.processedMatchIds)?s.processedMatchIds:[],sessionMatches:Array.isArray(s.sessionMatches)?s.sessionMatches:[],recappedSessionKeys:Array.isArray(s.recappedSessionKeys)?s.recappedSessionKeys:[]}}catch{return {processedMatchIds:[],sessionMatches:[],recappedSessionKeys:[]}}}
export async function saveState(s){await fs.mkdir(new URL("../data/",import.meta.url),{recursive:true});await fs.writeFile(FILE,JSON.stringify(s,null,2)+"\n")}
