# PocketGlow — Smart Spending, Better Tomorrow

A prototype personal-finance app for students, driven by a Gemini AI agent that can log
spending, manage savings goals, and answer questions in natural language — with full JWT
auth, per-user data, and a live dashboard.

## Stack
- **Frontend:** Vite + React + TypeScript + Tailwind + Zustand + Recharts
- **Backend:** Express + MongoDB (`mongodb` driver) + Gemini (`@google/generative-ai`)
- **Auth:** JWT (`jsonwebtoken`) + password hashing (`bcryptjs`)

## Run it (two terminals)

**1. Backend** (`server/`)
```bash
cd server
npm install
npm run dev        # or: npm start   → http://localhost:5000
```
On first boot it seeds 10 demo accounts automatically.

**2. Frontend** (repo root)
```bash
npm install
npm run dev        # → http://localhost:5173  (proxies /api to :5000)
```

Open **http://localhost:5173** and either:
- Click **“Explore the demo”** for a one-click bypass into a fully-loaded account, or
- **Sign up** a fresh account (starts empty), or
- **Log in** to any demo account — username `arjun`, `priya`, `rahul`, … · password `finagent`.

## Environment (`server/.env`)
```
MONGODB_URI=<your Atlas SRV uri>
GEMINI_API_KEY=<your key>
GEMINI_MODEL=gemini-2.5-flash     # swappable, e.g. gemini-flash-latest
JWT_SECRET=<random secret>
DEMO_PASSWORD=finagent
PORT=5000
```

## MongoDB Atlas note
If Atlas is unreachable (you'll see a TLS `alert 80` warning on boot), the backend
**automatically falls back to a local file DB (`server/db.json`)** so the app always runs.
To use the real cluster, add your machine's IP in **Atlas → Network Access → Add IP →
Allow Access from Anywhere (0.0.0.0/0)** — the `alert 80` error is Atlas refusing a
non-whitelisted IP at the TLS layer.

## What the AI agent can do
Chat naturally (“I spent ₹250 on lunch and add ₹500 to my Goa Trip”) — it uses tools to
add/read/delete transactions & goals, update your profile, allocate savings, and check the
date. It knows **only your** data (per-user context + rolling memory summary) and refuses
destructive or cross-account requests. Clear the conversation anytime from the Agent tab.

## Security highlights
- All data routes live under `/api/me/*` and derive the user **from the JWT**, never from a
  client-supplied id (no IDOR).
- Passwords are bcrypt-hashed; hashes are never returned to the client.
- The agent has no raw-query capability and is scoped to the signed-in user.
