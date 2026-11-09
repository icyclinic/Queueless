QueueLess web app - how to host
1. Upload everything in this folder to any static host (Netlify, Cloudflare Pages, Vercel, GitHub Pages). Must be HTTPS.
2. Open the site on a phone: the browser offers "Install" / "Add to Home Screen". It also works offline once opened.
3. For real SMS/WhatsApp, run notifier-server.js (see top of that file) and set NOTIFY_ENDPOINT in the app.
Not included yet: backend/database, real payments, terms/privacy/consent (by request).
