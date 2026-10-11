import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {athleteSetupModel,matchingAthlete} from '../public/modules/cloud.mjs';
const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const source=readFileSync(new URL('../public/modules/cloud.mjs',import.meta.url),'utf8').replace(/^import .*\n/,'').replace(/export /g,'');
const settle=()=>new Promise(r=>setTimeout(r,25));
async function page(athletes=[],options={}){
 const dom=new JSDOM(html,{url:'https://example.test',runScripts:'outside-only'}),w=dom.window;
 w.fixtureId=options.selected||null;w.fixtureName='';w.fixtureStart=options.running?1:null;w.posts=[];w.flushQueue=async q=>q;
 if(options.remembered)w.localStorage.setItem('racesplit-athlete:u',options.remembered);
 w.fetch=async(path,request={})=>{let body={},status=200;
  if(path==='/api/auth/config')body={google:true,email:true};
  if(path==='/api/me'){status=options.signedOut?401:200;body=options.signedOut?{error:'Sign in'}:{id:'u',email:'test@example.test'};}
  if(path==='/api/athletes'){if(request.method==='POST'){w.posts.push(JSON.parse(request.body));status=options.failAdd?503:200;body=status===503?{error:'Try again'}:{};}else body={athletes};}
  if(path.startsWith('/api/races'))body={races:[]};
  return {ok:status===200,status,json:async()=>body};
 };
 w.eval(source+`\nstartCloud({getAthleteId:()=>fixtureId,getTimingContext:()=>({start:fixtureStart,finished:false,athlete:fixtureName}),getHistory:()=>[],setHistory:()=>{},onSave:()=>{},onDelete:()=>{},save:()=>{},selectAthlete:(id,name)=>{fixtureId=id;fixtureName=name;window.dispatchEvent(new Event('racesplit-view'));}})`);
 await settle();return dom;
}
test('athlete setup models zero, one, multiple and running states',()=>{
 const a=[{id:'a',name:'Emma'}];assert.equal(athleteSetupModel([],null).mode,'add');assert.equal(athleteSetupModel(a,'a').mode,'single');assert.equal(athleteSetupModel(a,'a',{choosing:true}).mode,'select');assert.equal(athleteSetupModel([...a,{id:'b',name:'Az'}],'a').mode,'select');assert.equal(athleteSetupModel(a,null,{running:true}).mode,'locked');assert.equal(athleteSetupModel(a,null,{signedIn:false}).mode,'device');assert.equal(matchingAthlete(a,'  EMMA ').id,'a');
});
test('first athlete explicitly saves and selects, with repeat clicks guarded',async()=>{
 const d=await page(),w=d.window,doc=w.document,input=doc.getElementById('setupAthleteName'),button=doc.querySelector('.setup-athlete-actions button');
 assert.equal(doc.getElementById('profileSelect').hidden,true);assert.equal(button.disabled,true);
 input.value='Emma';input.dispatchEvent(new w.Event('input'));button.click();button.click();await settle();
 assert.equal(w.posts.length,1);assert.equal(w.fixtureId,w.posts[0].id);assert.equal(w.fixtureName,'Emma');assert.equal(doc.querySelector('.selected-athlete').hidden,false);assert.equal(doc.querySelector('.selected-athlete strong').textContent,'Emma');assert.equal(doc.querySelector('.setup-athlete-editor').hidden,true);w.close();
});
test('one athlete shows Change; adding can cancel without changing selection',async()=>{
 const d=await page([{id:'a',name:'Emma'}]),w=d.window,doc=w.document;assert.equal(w.fixtureId,'a');doc.querySelector('.selected-athlete button').click();const select=doc.getElementById('profileSelect');assert.equal(select.hidden,false);select.value='__add__';select.dispatchEvent(new w.Event('change'));assert.equal(doc.querySelector('.setup-athlete-editor').hidden,false);doc.querySelectorAll('.setup-athlete-actions button')[1].click();assert.equal(w.fixtureId,'a');assert.equal(doc.querySelector('.selected-athlete').hidden,false);w.close();
});
test('multiple athletes remember selection and reuse duplicate names',async()=>{
 const d=await page([{id:'a',name:'Emma'},{id:'b',name:'Az'}],{remembered:'b'}),w=d.window,doc=w.document,select=doc.getElementById('profileSelect');assert.equal(w.fixtureId,'b');assert.equal(select.hidden,false);select.value='__add__';select.dispatchEvent(new w.Event('change'));const input=doc.getElementById('setupAthleteName');input.value=' emma ';input.dispatchEvent(new w.Event('input'));doc.querySelector('.setup-athlete-actions button').click();await settle();assert.equal(w.posts.length,0);assert.equal(w.fixtureId,'a');assert.equal(w.localStorage.getItem('racesplit-athlete:u'),'a');w.close();
});
test('add failure retains entered name and allows retry',async()=>{
 const d=await page([],{failAdd:true}),w=d.window,doc=w.document,input=doc.getElementById('setupAthleteName');input.value='Emma';input.dispatchEvent(new w.Event('input'));doc.querySelector('.setup-athlete-actions button').click();await settle();assert.equal(w.fixtureId,null);assert.equal(input.value,'Emma');assert.equal(doc.querySelector('.setup-athlete-editor').hidden,false);assert.equal(doc.querySelector('.setup-athlete-actions button').disabled,false);assert.match(doc.querySelector('.setup-athlete-editor+p').textContent,/Try again/);w.close();
});
test('running timer does not automatically assign a different athlete',async()=>{
 const d=await page([{id:'a',name:'Emma'}],{running:true}),w=d.window;assert.equal(w.fixtureId,null);assert.equal(w.document.querySelector('.selected-athlete button').disabled,true);w.close();
});
test('signed-out timing retains the device name input',async()=>{
 const d=await page([],{signedOut:true});assert.equal(d.window.document.getElementById('athlete').hidden,false);assert.equal(d.window.document.querySelector('.setup-athlete-editor').hidden,true);d.window.close();
});
