# ChatFlow frontend

React 19 + Vite + Tailwind. Talks to the backend in [`../backend`](../backend) over REST and STOMP/SockJS.

```bash
npm install
npm run dev      # http://localhost:5173
npm run lint
npm run build
```

`VITE_API_URL` sets the backend address (`.env.development` for local, `.env.production` for Vercel).
The WebSocket URL is derived from it (`<api origin>/ws`).
