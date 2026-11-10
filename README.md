# ChatFlow backend

Spring Boot 3 + WebSocket (STOMP over SockJS) + JWT + PostgreSQL. Frontend: `chatflow_frontend` (React + Vite).

## Configuration

All secrets come from environment variables. Nothing secret is committed.

| Variable | Required | Example / default |
|---|---|---|
| `DB_URL` | yes (prod) | `jdbc:postgresql://<host>:5432/<database>` (must start with `jdbc:`) |
| `DB_USERNAME` | yes (prod) | default `postgres` |
| `DB_PASSWORD` | yes | |
| `JWT_SECRET` | yes | random string, at least 32 characters |
| `JWT_EXPIRATION` | no | `86400000` (24h, in ms) |
| `CORS_ALLOWED_ORIGINS` | no | `http://localhost:5173,https://chatflow-frontend-gilt.vercel.app` |
| `PORT` | no | `8080` (Render sets this automatically) |
| `SHOW_SQL` | no | `false` |

Generate a JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

## Local development

1. Create a `chatflow` database in your local PostgreSQL.
2. Copy `.env.example` to `.env` (gitignored) and fill in `DB_PASSWORD` and `JWT_SECRET`.
3. Run `./mvnw spring-boot:run`. The API is on http://localhost:8080.

Tests use an in-memory H2 database and need no setup: `./mvnw test`.

## Deploying on Render

1. Create a PostgreSQL instance. From its **Internal Database URL**
   `postgresql://USER:PASSWORD@HOST/DATABASE`, set:
   - `DB_URL=jdbc:postgresql://HOST:5432/DATABASE`
   - `DB_USERNAME=USER`
   - `DB_PASSWORD=PASSWORD`
2. Set `JWT_SECRET` to a new random value.
3. Deploy the web service from this repo using the `Dockerfile`.

Free Render databases expire after 30 days, and free web services sleep after 15 minutes
idle (the first request then takes about a minute).

## WebSocket protocol

- Endpoint: `/ws` (SockJS)
- CONNECT header: `Authorization: Bearer <jwt>` (connections without a valid token are rejected)
- Send: `/app/chat/{roomId}` with body `{"content": "..."}` (max 2000 characters). The sender comes from the token.
- Subscribe: `/topic/room/{roomId}` for messages, `/user/queue/errors` for errors on your own sends
