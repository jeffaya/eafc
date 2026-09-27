import fs from "node:fs/promises";
const FILE=new URL("../data/state.json",import.meta.url);

export async function loadState(){
  try{return JSON.parse(await fs.readFile(FILE,"utf8"));}
  catch{return {processedMatchIds:[],sessionMatches:[]};}
}
export async function saveState(state){
  await fs.writeFile(FILE,JSON.stringify(state,null,2)+"\n");
}
