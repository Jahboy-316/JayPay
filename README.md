# JayPay Banking System

The **JayPay Banking System** monorepo contains the Next.js frontend and the Express/PostgreSQL backend in `Backend/`.

Designed according to the strict **OKX / Phantom** minimal financial design system:
- **3-colour palette only**: Ink (`#0B0F0E`), Mist (`#F4F6F5`), Steel (`#8A918E`).
- **Typography**: Roboto weights 400 and 500 only. No bold. Tabular numbers for all monetary values.
- **PIN entry**: 4 dots (not boxes) with scale pop, 3x4 on-screen squircle keypad, and shake on error.
- **Squircles**: 16px for buttons/inputs, 20px for cards, 24px for dialogs.

---

## Environment Variables

Create `.env.local` in `frontend/`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
NEXT_PUBLIC_API_HEALTH_URL=http://localhost:5000/health
```

---

## Quick Start

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Run the development server

```bash
npm run dev
```

App runs at `http://localhost:3000`.

### 3. Build for production

```bash
npm run build
npm start
```

---

## Running Both Apps Together

From the repository root:

**Terminal 1 (Backend):**
```bash
cd Backend
npm install
npm start
# Express runs on http://localhost:5000
```

**Terminal 2 (Frontend):**
```bash
npm run dev
# Next.js runs on http://localhost:3000
```

## Deploying the Backend to Render

The root `render.yaml` defines a free web service with `Backend/` as its root directory. In Render, create a **Blueprint** for this repository and set the required environment variables when prompted:

* `DATABASE_URL` — hosted PostgreSQL connection string
* `JWT_SECRET` — long, unique secret (at least 32 characters)
* `JWT_REFRESH_SECRET` — separate long, unique secret
* `FRONTEND_ORIGIN` — deployed frontend origin, for example `https://your-app.vercel.app`

Render installs backend dependencies, runs database migrations before deployment, starts the API with `npm start`, and checks `/health`. Do not put production credentials in the repository.

---

## Features & Route Structure

### Public & Marketing
* `/` — Landing page with calm mock balance card, features, security explanation, and theme toggle

### Authentication (`(auth)`)
* `/login` — Sign in with phone number (11 digits) and 4-digit transaction PIN via dot keypad
* `/register` — 2-step registration: profile info then 4-digit PIN setup

### Customer App Shell (`(app)`)
* `/dashboard` — Live available balance (with eye privacy toggle), quick action buttons, recent transactions, and activity alerts
* `/transfer` — Peer-to-peer atomic transfer with recipient name validation, review step, idempotency key generation, dot PIN authorization modal, and verified receipt
* `/withdraw` — `[SIMULATED]` Withdraw funds with PIN authorization
* `/transactions` — Searchable ledger history with filters (type, category, date) and pagination
* `/transactions/[id]` — Verified transaction receipt detail
* `/beneficiaries` — Saved recipient management with account validation and fast send
* `/statements` — Authenticated CSV statement download (max 90 days range)
* `/notifications` — In-app alerts, unread filter, and mark all read
* `/settings` — Profile update, 4-digit PIN change, account details, and self-deactivation

### Administrative Operations (`(admin)`)
* `/admin/login` — Staff authentication with username and PIN
* `/admin` — Customer account directory, search, inspect, restrict/reactivate with mandatory audit reasons
* `/admin/users/[accountNumber]` — Detailed user profile inspector
* `/admin/adjustments` — Find an account holder by account number, then make a reason-coded `[SIMULATED]` ledger adjustment (credit/debit)
* `/admin/transactions` — System-wide transaction audit log
* `/admin/audit-logs` — Immutable audit trail of all administrative actions
