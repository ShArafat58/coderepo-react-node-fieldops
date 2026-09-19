# FieldOps

**A modern field-service dispatch and operations platform** — built to help pest-control, HVAC, and home-service businesses manage customers, coordinate technicians, and keep every job on track from first request to final invoice.

FieldOps replaces scattered spreadsheets and phone calls with a single, real-time operations hub: dispatchers create and assign jobs with automatic conflict detection, technicians see exactly what's on their plate for the day, and admins get a live dashboard showing revenue, utilization, and job health at a glance.

---

## ✨ What FieldOps Does

| For Admins & Dispatchers | For Technicians |
|---|---|
| Manage customers, properties, and the service catalog | View only their assigned jobs |
| Assign technicians with automatic scheduling-conflict and working-hours checks | Update job status as work progresses |
| Track every job through a full lifecycle — requested → scheduled → en route → in progress → completed → invoiced | Log completion notes when finishing a job |
| Filter and save custom job views | See their own workload without noise |
| Monitor a live operations dashboard — revenue by service, technician utilization, job status breakdown | |
| Review a full audit trail for every job | |

---

## 🛠 Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 (Vite) |
| Backend | Node.js + Express 5 |
| Database | MongoDB (Mongoose ODM) |
| Package manager | Bun (single workspace, `bun.lock`) |
| Validation | Zod (schema validation on every write endpoint) |
| Authentication | JWT (JSON Web Tokens), bcrypt password hashing |
| Styling | Hand-rolled CSS with design tokens (no component library) |

---

## 📁 Project Structure

.
├── backend/
│ └── src/
│ ├── features/ # One folder per domain capability
│ │ ├── auth/ # Login, session, JWT issuance
│ │ ├── customers/ # Customers + nested properties
│ │ ├── technicians/ # Technician profiles & working hours
│ │ ├── service-catalog/ # Service types, pricing, duration
│ │ ├── jobs/ # Job lifecycle, assignment, saved views, history
│ │ └── dashboard/ # Aggregated operations metrics
│ ├── shared/
│ │ ├── config/ # Environment loading, MongoDB connection
│ │ ├── errors/ # Centralized AppError class
│ │ └── middleware/ # Auth guard, role guard, rate limiting, error handler
│ ├── scripts/seed.js # Deterministic database seeding
│ ├── app.js # Express app + route registration
│ └── index.js # Server entry point
├── frontend/
│ └── src/
│ ├── features/ # Mirrors backend feature folders
│ │ ├── auth/
│ │ ├── customers/
│ │ ├── technicians/
│ │ ├── service-catalog/
│ │ ├── jobs/
│ │ └── dashboard/
│ ├── shared/
│ │ ├── api/client.js # Fetch wrapper, token storage
│ │ └── components/
│ ├── App.jsx
│ └── styles.css
├── .vscode/launch.json # Debugger configuration
├── hackerrank.yml # Install/run commands, protected paths
├── setup.sh # Environment + MongoDB + seed bootstrap
└── README.md


Each backend feature follows the same request flow: **route → controller → service → repository → MongoDB**, keeping HTTP handling, business rules, and persistence cleanly separated.

---

## ✅ Prerequisites

- **Bun** ≥ 1.4 ([install guide](https://bun.sh))
- **MongoDB** running locally on `127.0.0.1:27017` (Community Server or equivalent)
- **Git Bash** (Windows) or any POSIX-compatible shell — `setup.sh` relies on Bash's `/dev/tcp` for MongoDB connectivity checks

---

## 🗄 MongoDB Behavior

- On every `install` and `start`, `setup.sh` verifies MongoDB is reachable on port `27017` (starting a local instance if one isn't already running).
- Seeding **clears all application collections** and repopulates them with a consistent, realistic baseline — running the seed script twice in a row produces identical data.
- Restarting the full application (`bun start`) re-runs the seed step, so the database always returns to its documented baseline state.
- The health endpoint (`GET /api/v1/health`) reports `"connected"` or `"degraded"` based on live MongoDB connection state, distinguishing a running API from a working database.

---

## 🚀 Run Instructions

### Clean install (from a fresh checkout)

```bash
bun install && bash setup.sh --seed
```

This installs all workspace dependencies, creates `.env` files from `.env.example` if missing, verifies MongoDB, and seeds the database.

### Start the full application

```bash
bun start
```

This launches the backend on **port 8000** and the frontend on **port 3000** concurrently, re-running the setup/seed step first.

> **Note:** On Windows, run both commands from **Git Bash**, not PowerShell — the setup script uses a Bash-native MongoDB connectivity check that doesn't behave correctly under PowerShell's process spawning.

Once running, open **http://localhost:3000** in your browser.

---

## 📜 Command Reference

| Command | Purpose |
|---|---|
| `bun install` | Install all workspace dependencies (backend + frontend) |
| `bash setup.sh --seed` | Create env files, verify MongoDB, seed the database |
| `bun start` | Run the full application (backend + frontend, with setup/seed) |
| `bun run dev:backend` | Run only the backend, with file-watch auto-reload |
| `bun run dev:frontend` | Run only the frontend (Vite dev server) |
| `bun run seed` | Re-seed the database to its baseline state (run from `backend/`) |

---

## 🔑 Seeded Access

All seeded accounts share the password **`password123`**.

| Role | Email | What they can do |
|---|---|---|
| Admin | `admin@fieldops.com` | Full access — manage customers, technicians, services, jobs, and view the operations dashboard |
| Technician | `jordan.smith@fieldops.com` | View and update only their own assigned jobs |
| Technician | `taylor.johnson@fieldops.com` | Same as above |
| Technician | `riley.parker@fieldops.com` | Same as above |

Sign in at `http://localhost:3000` with any of the credentials above. The interface adapts automatically based on role — admins see the full operations suite; technicians see a focused, read-only view of customers and services alongside their own job list.

---

*Built for the HackerRank "Build Your Own Full-Stack Application" assignment, mirroring the structure and conventions of the reference `coderepo-react-node-calendar` repository.*