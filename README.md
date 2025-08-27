# FitMate (MERN) — Starter

This is a production-ready starter for the **FitMate** web application built on the **MERN** stack (MongoDB, Express, React, Node). It includes:

- React + Vite + Tailwind UI with a clean dashboard (cards, chart, donut) and pages: Workout Plan, Meal Plan, Progress.
- Auth-ready structure (JWT hooks, guards) with mocked flows you can replace with your real auth (Firebase/Passport.js, etc.).
- Express API with routes for users, workouts, meals, and progress and a MongoDB data model scaffold.
- Example `.env.example` files and scripts.

## Quick Start

### 1) API (server)
```bash
cd server
cp .env.example .env   # fill MONGO_URI and JWT_SECRET
npm install
npm run dev            # http://localhost:4000
```
Default dev port: **4000**

### 2) Web (client)
```bash
cd client
npm install
npm run dev            # http://localhost:5173
```
The client expects the API at `http://localhost:4000`. Change it in `src/lib/api.ts` if needed.

---

## Tech
- **Frontend**: React 18, Vite, React Router, TailwindCSS, Recharts, Axios.
- **Backend**: Node 20+, Express, Mongoose, Zod for validation, JSON Web Tokens, CORS, Helmet, morgan.
- **Lint/Format**: ESLint + Prettier.

## Notes
- Replace mocked data and auth with your real logic.
- Components are modular and ready to extend.
