export async function loadMock(){
  const res = await fetch('./mock/homelab.json');
  if(!res.ok) throw new Error('Failed to load mock JSON');
  const json = await res.json();
  // return a deep clone to avoid accidental mutations
  return JSON.parse(JSON.stringify(json));
}
export async function reloadMock(){
  return loadMock();
}
export async function triggerAction(serviceId, actionKey){
  await new Promise(r=>setTimeout(r, 220));
  return Math.random()>0.1 ? {ok:true,message:'Action completed (mock)'} : {ok:false,message:'Mock failure'};
}
