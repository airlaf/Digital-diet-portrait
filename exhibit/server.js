import express from 'express';
import QRCode from 'qrcode';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { networkInterfaces } from 'node:os';
import { fileURLToPath } from 'node:url';

export function createApp({ stationKey = randomBytes(24).toString('hex'), publicUrl, ttl = 15 * 60_000 } = {}) {
  const app = express(), sessions = new Map();
  const root = fileURLToPath(new URL('../', import.meta.url));
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.set({'Cache-Control':'no-store', 'Referrer-Policy':'no-referrer', 'X-Content-Type-Options':'nosniff'});
    if (req.method !== 'GET' && req.headers.origin && req.headers.origin !== `${req.protocol}://${req.headers.host}` && req.headers.origin !== publicUrl) return res.status(403).json({error:'Request origin rejected.'});
    next();
  });
  app.use(express.json({limit:'1mb'}));
  function station(req, res, next) {
    const value = Buffer.from(req.headers['x-station-key'] || '');
    const key = Buffer.from(stationKey);
    if (value.length !== key.length || !timingSafeEqual(value, key)) return res.status(403).json({error:'Open the station URL printed by the server.'});
    next();
  }
  function session(req, res, next) {
    const s = sessions.get(req.params.id);
    if (!s || s.expires <= Date.now()) { sessions.delete(req.params.id); return res.status(410).json({error:'This session has ended. Scan the new QR code on the screen.'}); }
    req.session = s; next();
  }
  app.post('/api/sessions', station, async (req,res) => {
    for (const [id,s] of sessions) if(s.expires <= Date.now()) sessions.delete(id);
    if (sessions.size >= 20) return res.status(429).json({error:'Too many active sessions.'});
    const id = randomBytes(24).toString('hex');
    const s = {expires:Date.now()+ttl, status:'waiting', titles:null}; sessions.set(id,s);
    const url = `${publicUrl}/exhibit/upload.html#${id}`;
    res.json({id, expires:s.expires, url, qr:await QRCode.toDataURL(url,{width:320,margin:4,errorCorrectionLevel:'M'})});
  });
  app.get('/api/sessions/:id', session, (req,res) => res.json({status:req.session.status,expires:req.session.expires}));
  app.post('/api/sessions/:id/upload', session, (req,res) => {
    const s=req.session, titles=req.body.titles;
    if(s.status !== 'waiting') return res.status(409).json({error:'This screen already has a visitor. Please scan the next QR code.'});
    if(!Array.isArray(titles) || !titles.length || titles.length>10000 || titles.some(t=>typeof t!=='string'||!t.trim()||t.length>500)) return res.status(400).json({error:'Choose a history file with readable page titles (up to 10,000).'});
    s.titles=titles; s.status='received'; res.json({status:s.status});
  });
  app.get('/api/sessions/:id/portrait', station, session, (req,res)=>res.json({status:req.session.status,titles:req.session.titles}));
  app.post('/api/sessions/:id/ack', station, session, (req,res)=>{req.session.titles=null; req.session.status='ready';res.json({ok:true});});
  app.delete('/api/sessions/:id',station,(req,res)=>{sessions.delete(req.params.id);res.json({ok:true});});
  for(const file of ['index.html','sketch.js','favicon.png']) app.get('/'+file,(req,res)=>res.sendFile(root+file));
  app.get('/',(req,res)=>res.sendFile(root+'index.html'));
  app.use('/fonts',express.static(root+'fonts'));
  for(const file of ['kiosk.js','upload.js','history.js','upload.html','exhibit.css']) app.get('/exhibit/'+file,(req,res)=>res.sendFile(root+'exhibit/'+file));
  app.use((err,req,res,next)=>res.status(err.status||500).json({error:err.type==='entity.too.large'?'Upload is too large. Try a shorter history export.':'The request could not be processed.'}));
  const cleanup=setInterval(()=>{for(const [id,s] of sessions) if(s.expires<=Date.now()) sessions.delete(id);},30000); cleanup.unref();
  return {app,stationKey,close:()=>clearInterval(cleanup)};
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
  const port=Number(process.env.PORT||3000);
  const ip=Object.values(networkInterfaces()).flat().find(n=>n.family==='IPv4'&&!n.internal)?.address||'localhost';
  const publicUrl=(process.env.PUBLIC_URL||`http://${ip}:${port}`).replace(/\/$/,'');
  const {app,stationKey}=createApp({publicUrl,stationKey:process.env.STATION_KEY});
  app.listen(port,'0.0.0.0',()=>{
    console.log(`Exhibition station: http://localhost:${port}/#station=${stationKey}`);
    console.log(`Phone connection: ${publicUrl} ${process.env.PUBLIC_URL?'':'(same Wi-Fi required)'}`);
  });
}
