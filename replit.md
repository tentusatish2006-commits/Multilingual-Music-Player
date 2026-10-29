# Aurora Music / Multilingual Music Player

Music discovery player for Jamendo independent catalog (Telugu, Hindi, English).

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — API server
- `pnpm --filter @workspace/aurora-music run dev` — web app
- `pnpm run typecheck` — full typecheck
- Required secret: `JAMENDO_CLIENT_ID`
- Optional: `DATABASE_URL` for Postgres

## Stack

- pnpm workspaces, Node.js, TypeScript
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Frontend: React + Vite + Tailwind

## 30-second preview fix

See `FIX-30-SECOND-PREVIEW.md` and `artifacts/api-server/src/routes/music.ts`.
Stream URL prefers `audiodownload` when allowed.
