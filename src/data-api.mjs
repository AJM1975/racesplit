import { owner, sameOrigin } from './auth.mjs';
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const validId=v=>typeof v==='string'&&/^[a-zA-Z0-9_-]{8,100}$/.test(v);
async function payload(request){const size=Number(request.headers.get('content-length')||0);if(size>100000)return null;try{const raw=await request.text();return raw.length<=100000?JSON.parse(raw):null}catch{return null}}
export async function handleData(request,env,url){
 if(!env.DB)return json({error:'Storage unavailable'},503);
 const user=await owner(request,env);
 if(!user)return json({error:'Authentication required'},401);
 const method=request.method;
 const expectedAccount=request.headers.get('X-RaceSplit-Account');
 if(expectedAccount&&expectedAccount!==user.id)return json({error:'Account changed. Sign in again.'},403);
 if(!['GET','HEAD'].includes(method)&&(!sameOrigin(request)||request.headers.get('X-RaceSplit-Account')!==user.id))return json({error:'Origin rejected'},403);
 if(url.pathname==='/api/me'&&method==='GET')return json({id:user.id,email:user.email,earlyAccess:!!user.early_access});
 if(url.pathname==='/api/athletes'&&method==='GET'){
  const rows=await env.DB.prepare('SELECT id,name,created_at,updated_at FROM athletes WHERE user_id=? AND deleted_at IS NULL ORDER BY created_at').bind(user.id).all();
  return json({athletes:rows.results});
 }
 if(url.pathname==='/api/athletes'&&method==='POST'){
  const b=await payload(request);if(!b||!validId(b.id)||typeof b.name!=='string'||!b.name.trim()||b.name.length>120)return json({error:'Invalid athlete'},400);
  await env.DB.prepare('INSERT OR IGNORE INTO athletes(id,user_id,name) VALUES(?,?,?)').bind(b.id,user.id,b.name.trim()).run();
  const row=await env.DB.prepare('SELECT id,name,created_at,updated_at FROM athletes WHERE id=? AND user_id=? AND deleted_at IS NULL').bind(b.id,user.id).first();
  return row?json({athlete:row},201):json({error:'Athlete ID conflict'},409);
 }
 if(url.pathname==='/api/me'&&method==='PATCH'){const b=await payload(request);if(typeof b?.earlyAccess!=='boolean')return json({error:'Invalid preference'},400);await env.DB.prepare('UPDATE users SET early_access=? WHERE id=?').bind(Number(b.earlyAccess),user.id).run();return json({ok:true})}
 const athleteMatch=url.pathname.match(/^\/api\/athletes\/([^/]+)$/);
 if(athleteMatch&&method==='PATCH'){const b=await payload(request);if(typeof b?.name!=='string'||!b.name.trim()||b.name.length>120)return json({error:'Invalid name'},400);const result=await env.DB.prepare('UPDATE athletes SET name=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=? AND deleted_at IS NULL').bind(b.name.trim(),athleteMatch[1],user.id).run();return result.meta.changes?json({ok:true}):json({error:'Athlete not found'},404)}
 if(athleteMatch&&method==='DELETE'){
  const result=await env.DB.prepare("UPDATE athletes SET deleted_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=? AND deleted_at IS NULL").bind(athleteMatch[1],user.id).run();
  return json({deleted:result.meta.changes>0});
 }
 if(url.pathname==='/api/races'&&method==='GET'){
  const rows=await env.DB.prepare('SELECT id,athlete_id,client_id,revision,event_name,event_snapshot,started_at,finished_at,elapsed_ms,created_at,updated_at,deleted_at FROM races WHERE user_id=? AND (?=1 OR deleted_at IS NULL) ORDER BY updated_at DESC LIMIT 10000').bind(user.id,Number(url.searchParams.get('includeDeleted')==='1')).all();
  return json({races:rows.results.map(r=>({...r,event_snapshot:JSON.parse(r.event_snapshot)}))});
 }
 const raceMatch=url.pathname.match(/^\/api\/races\/([^/]+)$/);
 if(raceMatch&&method==='PUT'){
  const id=raceMatch[1],b=await payload(request);
  if(!validId(id)||!b||!validId(b.clientId)||!validId(b.mutationId)||typeof b.eventName!=='string'||!b.eventName.trim()||b.eventName.length>200||!b.eventSnapshot||typeof b.eventSnapshot!=='object'||Array.isArray(b.eventSnapshot)||JSON.stringify(b.eventSnapshot).length>60000||!Number.isInteger(b.expectedRevision)||b.expectedRevision<0)return json({error:'Invalid race'},400);
  if(b.elapsedMs!=null&&(!Number.isSafeInteger(b.elapsedMs)||b.elapsedMs<0))return json({error:'Invalid elapsed time'},400);
  for(const time of [b.startedAt,b.finishedAt])if(time!=null&&(typeof time!=='string'||!Number.isFinite(Date.parse(time))))return json({error:'Invalid timestamp'},400);
  if(b.athleteId){const athlete=await env.DB.prepare('SELECT id FROM athletes WHERE id=? AND user_id=? AND deleted_at IS NULL').bind(b.athleteId,user.id).first();if(!athlete)return json({error:'Unknown athlete'},400)}
  const existing=await env.DB.prepare('SELECT revision,client_id,mutation_id FROM races WHERE id=? AND user_id=? AND deleted_at IS NULL').bind(id,user.id).first();
  if(existing){
   if(existing.mutation_id===b.mutationId)return json({id,revision:existing.revision});
   if(existing.client_id!==b.clientId||existing.revision!==b.expectedRevision)return json({error:'Revision conflict',revision:existing.revision},409);
   const result=await env.DB.prepare("UPDATE races SET mutation_id=?,athlete_id=?,revision=revision+1,event_name=?,event_snapshot=?,started_at=?,finished_at=?,elapsed_ms=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=? AND revision=? AND deleted_at IS NULL").bind(b.mutationId,b.athleteId||null,b.eventName.trim(),JSON.stringify(b.eventSnapshot),b.startedAt||null,b.finishedAt||null,b.elapsedMs??null,id,user.id,b.expectedRevision).run();
   return result.meta.changes?json({id,revision:b.expectedRevision+1}):json({error:'Revision conflict'},409);
  }
  if(b.expectedRevision!==0)return json({error:'Revision conflict',revision:0},409);
  try{await env.DB.prepare('INSERT INTO races(id,user_id,athlete_id,client_id,mutation_id,event_name,event_snapshot,started_at,finished_at,elapsed_ms) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(id,user.id,b.athleteId||null,b.clientId,b.mutationId,b.eventName.trim(),JSON.stringify(b.eventSnapshot),b.startedAt||null,b.finishedAt||null,b.elapsedMs??null).run();return json({id,revision:1},201)}catch{return json({error:'Race ID conflict'},409)}
 }
 if(raceMatch&&method==='DELETE'){
  const b=await payload(request);if(!b||!Number.isInteger(b.expectedRevision)||b.expectedRevision<0)return json({error:'Expected revision required'},400);
  const row=await env.DB.prepare('SELECT revision,deleted_at FROM races WHERE id=? AND user_id=?').bind(raceMatch[1],user.id).first();
  if(!row||row.deleted_at)return json({deleted:true});
  const result=await env.DB.prepare("UPDATE races SET deleted_at=CURRENT_TIMESTAMP,revision=revision+1,updated_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=? AND revision=? AND deleted_at IS NULL").bind(raceMatch[1],user.id,b.expectedRevision).run();
  return result.meta.changes?json({deleted:true}):json({error:'Revision conflict',revision:row.revision},409);
 }
 return json({error:'Not found'},404);
}
