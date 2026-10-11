export const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(b=>b.toString(16).padStart(2,'0')).join('');
const random=()=>crypto.randomUUID()+crypto.randomUUID();
const cookie=(name,value,age)=>`${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${age}`;
export const readCookie=(request,name)=>request.headers.get('Cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(name+'='))?.slice(name.length+1);
export async function owner(request,env){
 const token=readCookie(request,'rs_session');if(!token||token.length>512)return null;
 return env.DB.prepare("SELECT u.id,u.email,u.early_access FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>datetime('now') AND u.email_verified=1").bind(await hash(token)).first();
}
export function sameOrigin(request){return request.headers.get('Origin')===new URL(request.url).origin;}
export async function passwordHash(password,salt=crypto.randomUUID()){
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
 const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:new TextEncoder().encode(salt),iterations:100000},key,256);
 return `pbkdf2:100000:${salt}:${Array.from(new Uint8Array(bits)).map(b=>b.toString(16).padStart(2,'0')).join('')}`;
}
export async function verifyPassword(password,stored){if(!stored?.startsWith('pbkdf2:100000:'))return false;const computed=await passwordHash(password,stored.split(':')[2]);let diff=stored.length^computed.length;for(let i=0;i<computed.length;i++)diff|=computed.charCodeAt(i)^(stored.charCodeAt(i)||0);return diff===0;}
async function limited(request,env){
 const bucket=await hash((request.headers.get('CF-Connecting-IP')||'local')+':'+Math.floor(Date.now()/600000));
 const row=await env.DB.prepare('INSERT INTO auth_limits(bucket,count,expires_at) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=count+1 RETURNING count').bind(bucket,Date.now()+600000).first();
 await env.DB.prepare('DELETE FROM auth_limits WHERE expires_at<?').bind(Date.now()).run();return row.count>30;
}
async function session(env,userId,redirect){
 const token=random();await env.DB.prepare("INSERT INTO sessions(id,user_id,token_hash,expires_at) VALUES(?,?,?,datetime('now','+7 days'))").bind(crypto.randomUUID(),userId,await hash(token)).run();
 return new Response(redirect?null:JSON.stringify({ok:true}),{status:redirect?303:200,headers:{...(redirect?{Location:redirect}:{'Content-Type':'application/json'}),'Cache-Control':'no-store','Set-Cookie':cookie('rs_session',token,604800)}});
}
export async function handleAuth(request,env,url){
 if(!env.DB)return json({error:'Storage unavailable'},503);
 const path=url.pathname,method=request.method;
 if(method!=='GET'&&!sameOrigin(request))return json({error:'Origin rejected'},403);
 if(await limited(request,env))return json({error:'Too many attempts. Try again in ten minutes.'},429);
 if(path==='/api/auth/config'&&method==='GET')return json({email:!!(env.RESEND_API_KEY&&env.RESEND_FROM_EMAIL),google:!!(env.GOOGLE_CLIENT_ID&&env.GOOGLE_CLIENT_SECRET)});
 if(path==='/api/auth/logout'&&method==='POST'){
 const token=readCookie(request,'rs_session');if(token)await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await hash(token)).run();return new Response(JSON.stringify({ok:true}),{headers:{'Content-Type':'application/json','Cache-Control':'no-store','Set-Cookie':cookie('rs_session','',0)}});
 }
 if(path==='/api/auth/google'&&method==='GET'){
 if(!env.GOOGLE_CLIENT_ID||!env.GOOGLE_CLIENT_SECRET)return json({error:'Google sign-in is not configured'},503);
 const state=random(),verifier=random();await env.DB.prepare("INSERT INTO oauth_states(state_hash,verifier_hash,expires_at) VALUES(?,?,datetime('now','+10 minutes'))").bind(await hash(state),await hash(verifier)).run();
 const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier)));const challenge=btoa(String.fromCharCode(...digest)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
 const target=new URL('https://accounts.google.com/o/oauth2/v2/auth');target.search=new URLSearchParams({client_id:env.GOOGLE_CLIENT_ID,redirect_uri:url.origin+'/api/auth/callback/google',response_type:'code',scope:'openid email profile',state,code_challenge:challenge,code_challenge_method:'S256'});
 return new Response(null,{status:302,headers:{Location:target.href,'Set-Cookie':cookie('rs_oauth',verifier,600),'Cache-Control':'no-store'}});
 }
 if(path==='/api/auth/callback/google'&&method==='GET'){
 const verifier=readCookie(request,'rs_oauth'),state=url.searchParams.get('state'),code=url.searchParams.get('code');if(!verifier||!state||!code)return json({error:'Invalid OAuth callback'},400);
 const record=await env.DB.prepare("DELETE FROM oauth_states WHERE state_hash=? AND verifier_hash=? AND expires_at>datetime('now') RETURNING state_hash").bind(await hash(state),await hash(verifier)).first();if(!record)return json({error:'OAuth state expired or invalid'},400);
 const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams({code,client_id:env.GOOGLE_CLIENT_ID,client_secret:env.GOOGLE_CLIENT_SECRET,redirect_uri:url.origin+'/api/auth/callback/google',grant_type:'authorization_code',code_verifier:verifier})});if(!response.ok)return json({error:'Google sign-in failed'},502);
 const tokens=await response.json();const profileResponse=await fetch('https://openidconnect.googleapis.com/v1/userinfo',{headers:{Authorization:`Bearer ${tokens.access_token}`}});if(!profileResponse.ok)return json({error:'Google profile unavailable'},502);const profile=await profileResponse.json();if(profile.email_verified!==true||typeof profile.sub!=='string'||typeof profile.email!=='string')return json({error:'Verified Google email required'},403);
 let user=await env.DB.prepare('SELECT id,google_sub FROM users WHERE google_sub=? OR email=?').bind(profile.sub,profile.email.toLowerCase()).first();
 // Never silently link an existing password account based only on a matching email.
 if(user&&user.google_sub!==profile.sub)return json({error:'This email already has an account. Sign in with your password.'},409);
 if(!user){user={id:crypto.randomUUID()};await env.DB.prepare('INSERT INTO users(id,email,email_verified,google_sub) VALUES(?,?,1,?)').bind(user.id,profile.email.toLowerCase(),profile.sub).run()}
 return session(env,user.id,'/');
 }
 if(path==='/api/auth/verify'&&method==='POST'){
 const b=await request.json().catch(()=>null);if(typeof b?.token!=='string'||b.token.length>512)return json({error:'Invalid verification token'},400);
 const tokenHash=await hash(b.token);const record=await env.DB.prepare("DELETE FROM auth_tokens WHERE token_hash=? AND expires_at>datetime('now') RETURNING user_id").bind(tokenHash).first();if(!record)return json({error:'Verification expired or already used'},400);
 await env.DB.batch([env.DB.prepare('UPDATE users SET email_verified=1 WHERE id=?').bind(record.user_id),env.DB.prepare('DELETE FROM auth_tokens WHERE user_id=?').bind(record.user_id)]);return json({ok:true});
 }
 if((path==='/api/auth/register'||path==='/api/auth/login')&&method==='POST'){
 if(Number(request.headers.get('content-length'))>4096)return json({error:'Request too large'},413);
 const raw=await request.text();if(raw.length>4096)return json({error:'Request too large'},413);let b;try{b=JSON.parse(raw)}catch{return json({error:'Invalid request'},400)}
 const email=typeof b.email==='string'?b.email.trim().toLowerCase():'';if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||typeof b.password!=='string'||b.password.length<12||b.password.length>128)return json({error:'Use a valid email and a password of 12–128 characters'},400);
 const user=await env.DB.prepare('SELECT id,password_hash,email_verified FROM users WHERE email=?').bind(email).first();
 if(path.endsWith('/login')){const valid=await verifyPassword(b.password,user?.password_hash||'pbkdf2:100000:dummy-salt:0000000000000000000000000000000000000000000000000000000000000000');if(!user||!valid)return json({error:'Email or password incorrect'},401);if(!user.email_verified)return json({error:'Verify your email before signing in'},403);return session(env,user.id)}
 if(!env.RESEND_API_KEY||!env.RESEND_FROM_EMAIL)return json({error:'Email registration is not configured'},503);
 const generic=()=>json({ok:true,message:'If eligible, a verification link has been sent. Check your inbox.'});if(user?.email_verified)return generic();
 if(user&&!(await verifyPassword(b.password,user.password_hash)))return generic();
 const userId=user?.id||crypto.randomUUID();if(!user)await env.DB.prepare('INSERT INTO users(id,email,password_hash) VALUES(?,?,?)').bind(userId,email,await passwordHash(b.password)).run();
 const token=random();await env.DB.prepare("INSERT INTO auth_tokens(token_hash,user_id,expires_at) VALUES(?,?,datetime('now','+1 hour'))").bind(await hash(token),userId).run();
 const link=url.origin+'/#verify='+token;const sent=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:env.RESEND_FROM_EMAIL,to:[email],subject:'Verify your RaceSplit account',text:`Verify your email within one hour: ${link}\nIf you did not request this account, ignore this email.`})});if(!sent.ok)return json({error:'Verification email could not be sent. Please retry.'},503);return generic();
 }
 return json({error:'Not found'},404);
}
