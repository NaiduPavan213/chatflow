# ChatFlow

Real-time chat rooms: a Spring Boot backend (REST, WebSocket/STOMP, JWT, PostgreSQL) and a React frontend.

**Live demo:** https://chatflow-frontend-gilt.vercel.app

```
chatflow/
├── backend/    Spring Boot 3 · Java 17 · deployed on Render (Docker)
└── frontend/   React 19 · Vite · Tailwind · deployed on Vercel
```

## Run locally

**Backend** (needs PostgreSQL with a `chatflow` database)

```bash
cd backend
cp .env.example .env        # then fill in DB_PASSWORD and JWT_SECRET
./mvnw spring-boot:run      # http://localhost:8080
```

**Frontend**

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

The frontend reads the API address from `VITE_API_URL` (`frontend/.env.development` / `.env.production`).

## Tests

```bash
cd backend && ./mvnw test            # in-memory H2, no setup needed
cd frontend && npm run lint && npm run build
```

## Deployment

| Service | Platform | Root Directory | Notes |
|---|---|---|---|
| Backend | Render (Docker) | `backend` | Set `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`. See [backend/README.md](backend/README.md). |
| Frontend | Vercel (Vite) | `frontend` | `VITE_API_URL` comes from `frontend/.env.production`. |

To stop one side redeploying when only the other changed, set Render's *Build Filters* to `backend/**`
and Vercel's *Ignored Build Step* to `git diff --quiet HEAD^ HEAD -- .`
