export async function sendDiscord(url,payload) {
  const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
  if(!r.ok) throw new Error(`Discord ${r.status}: ${(await r.text()).slice(0,500)}`);
}
