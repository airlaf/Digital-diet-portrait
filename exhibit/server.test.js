import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from './server.js';
import {extractTitles} from './history.js';
test('Safari parsing strips URLs and rejects other export types',()=>{
 assert.deepEqual(extractTitles({metadata:{data_type:'history'},history:[{title:'Art and gardens',url:'https://private.test',time_usec:123},{}]}),['Art and gardens']);
 assert.throws(()=>extractTitles({metadata:{data_type:'payment_cards'},history:[{title:'No'}]}));
 assert.throws(()=>extractTitles({history:[{url:'https://test'}]}));
});
test('pairing, authorization, one visitor, acknowledgment and reset',async()=>{
 const {app,close}=createApp({stationKey:'secret',publicUrl:'https://exhibit.test'});const server=app.listen(0);await new Promise(r=>server.once('listening',r));
 const base=`http://localhost:${server.address().port}`;
 const request=(path='',method='GET',data,auth=true)=>fetch(base+'/api/sessions'+path,{method,headers:{...(auth?{'x-station-key':'secret'}:{}),'Content-Type':'application/json'},...(data?{body:JSON.stringify(data)}:{})});
 try{
 assert.equal((await request('','POST',null,false)).status,403);
 const r=await request('','POST');assert.equal(r.status,200);const s=await r.json();assert.match(s.qr,/^data:image\/png/);assert.equal(s.url,`https://exhibit.test/exhibit/upload.html#${s.id}`);
 const path='/'+s.id;
 assert.equal((await request(path+'/portrait','GET',null,false)).status,403);
 assert.equal((await request(path+'/upload','POST',{titles:[null]},false)).status,400);
 assert.equal((await request(path+'/upload','POST',{titles:['Art and gardens']},false)).status,200);
 assert.equal((await request(path+'/upload','POST',{titles:['Other']},false)).status,409);
 assert.deepEqual((await (await request(path+'/portrait')).json()).titles,['Art and gardens']);
 assert.equal((await (await request(path,'GET',null,false)).json()).titles,undefined);
 await request(path+'/ack','POST');assert.equal((await (await request(path+'/portrait')).json()).titles,null);
 await request(path,'DELETE');assert.equal((await request(path)).status,410);
 assert.equal((await fetch(base+'/.git/config')).status,404);
 }finally{server.close();close();}
});
test('expired sessions cannot receive data',async()=>{
 const {app,close}=createApp({stationKey:'secret',publicUrl:'https://exhibit.test',ttl:-1});const server=app.listen(0);await new Promise(r=>server.once('listening',r));
 try{const base=`http://localhost:${server.address().port}/api/sessions`;const s=await(await fetch(base,{method:'POST',headers:{'x-station-key':'secret'}})).json();assert.equal((await fetch(base+'/'+s.id)).status,410);}finally{server.close();close();}
});
