Server (Auth API)

Quick start
- Copy `.env.example` to `.env` and fill values
  - `MONGO_URI` should include the database name (e.g., `/expensetracker?appName=Awox`)
  - Set a strong `JWT_SECRET`
- Install deps: `npm i`
- Dev: `npm run dev`
- Prod: `npm start`

Endpoints
- `POST /auth/signup` { email, password } → { ok, token, user }
- `POST /auth/login` { email, password } → { ok, token, user }
- `GET /health` → { ok: true }

Notes
- CORS is enabled for development convenience.
- Passwords are hashed with bcrypt.
- Tokens are JWTs expiring in 7 days; store on the client.

