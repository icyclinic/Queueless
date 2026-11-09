// QueueLess alert server (reference implementation). Node 18+, no dependencies.
//   MODE=mock node notifier-server.js     -> logs messages, sends nothing (default)
//   MODE=live TERMII_API_KEY=... TERMII_SENDER=QueueLess \
//             WA_TOKEN=... WA_PHONE_ID=... node notifier-server.js
// The demo app POSTs { to, channel, text, bizId, ticket, kind } to /notify.
// NOTE: the live adapters follow Termii's and Meta's public API shapes but have NOT been
// run against real accounts. WhatsApp business-initiated messages must use an approved template.
const http = require('http');
const MODE = process.env.MODE || 'mock';
const PORT = process.env.PORT || 8787;
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || '*';   // lock this to your app's origin in production

async function sendSms(to, text){
  if(MODE !== 'live'){ console.log(`[mock sms] ${to}: ${text}`); return { ok:true, mock:true }; }
  const r = await fetch('https://api.ng.termii.com/api/sms/send', { method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ to:to.replace('+',''), from:process.env.TERMII_SENDER, sms:text, type:'plain', channel:'dnd', api_key:process.env.TERMII_API_KEY }) });
  return { ok:r.ok, status:r.status };
}
async function sendWhatsApp(to, text){
  if(MODE !== 'live'){ console.log(`[mock whatsapp] ${to}: ${text}`); return { ok:true, mock:true }; }
  const r = await fetch(`https://graph.facebook.com/v20.0/${process.env.WA_PHONE_ID}/messages`, { method:'POST',
    headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${process.env.WA_TOKEN}` },
    body:JSON.stringify({ messaging_product:'whatsapp', to:to.replace('+',''), type:'text', text:{ body:text } }) });
  return { ok:r.ok, status:r.status };
}
async function deliver({ to, channel, text }){
  if(!/^\+\d{10,15}$/.test(to||'') || !text || text.length > 600) return { ok:false, error:'bad request' };
  if(channel === 'whatsapp'){ const r = await sendWhatsApp(to, text); if(r.ok) return { ...r, channel }; const s = await sendSms(to, text); return { ...s, channel:'sms', fellBack:true }; }
  const s = await sendSms(to, text); return { ...s, channel:'sms' };
}
http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', ALLOW_ORIGIN); res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  if(req.method === 'OPTIONS'){ res.writeHead(204); return res.end(); }
  if(req.method !== 'POST' || req.url !== '/notify'){ res.writeHead(404); return res.end(); }
  let body = ''; req.on('data', c => { body += c; if(body.length > 5000) req.destroy(); });
  req.on('end', async () => {
    try{ const out = await deliver(JSON.parse(body)); res.writeHead(out.ok ? 200 : 400, {'Content-Type':'application/json'}); res.end(JSON.stringify(out)); }
    catch(e){ res.writeHead(500); res.end('{"ok":false}'); }
  });
}).listen(PORT, () => console.log(`QueueLess notifier (${MODE}) on :${PORT}`));