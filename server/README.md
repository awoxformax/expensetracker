Server (Auth API)

Quick start
- Copy `.env.example` to `.env` and fill values
  - `MONGO_URI` should include the database name (e.g., `/expensetracker?appName=Awox`)
  - Set a strong `JWT_SECRET`
  - Provide SMTP credentials (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`) so signup codes can be emailed
- Install deps: `npm i`
- Dev: `npm run dev`
- Prod: `npm start`

Endpoints
- `POST /auth/request-verification` { email } -> sends a 6-digit code if the email is not registered yet
- `POST /auth/signup` { email, password, verificationCode } -> { ok, token, user }
- `POST /auth/login` { email, password } -> { ok, token, user }
- `POST /auth/refresh` { refreshToken } -> rotates tokens
- `GET /health` -> { ok: true }

Notes
- CORS is enabled for development convenience.
- Passwords are hashed with bcrypt.
- Tokens are JWTs expiring in 7 days; store on the client.
- Email verification uses nodemailer. Without SMTP config the server will log verification codes to the console (development only).
