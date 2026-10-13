# JayPay Banking API

**JayPay** — simulated banking backend built with Node.js + Express + PostgreSQL (Sequelize).

> **DISCLAIMER**: All deposits, withdrawals, and admin adjustments are **[SIMULATED]**.  
> This system is **NOT** connected to any real payment provider, bank infrastructure, or regulated financial network.  
> Account numbers are phone-derived and are **NOT** real bank-issued numbers.  
> A 4-digit PIN has only 10,000 combinations and is **NOT** sufficient for real production banking.

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment

```bash
cp .env.example .env
# Edit .env — set DATABASE_URL and JWT_SECRET at minimum
```

### 3. Run migrations

```bash
npm run migrate
```

### 4. Seed the admin account

```bash
npm run seed:admin
```
Creates: `username: jason_admin`, `PIN: 2468` (change this PIN immediately in any non-test environment).

### 5. (Optional) Seed demo users

```bash
npm run seed:demo
```
Creates two demo users (development only — skipped in production):
- David Okafor · phone `08123456789` · account `8123456789` · PIN `4827`
- Michael Adeyemi · phone `09098765432` · account `9098765432` · PIN `5678`

Demo balances start at ₦0. Use admin deposit to fund them.

### 6. Start the server

```bash
npm start          # production
npm run dev        # development (nodemon)
```

### 7. Run tests

```bash
npm test
```

Tests use mocked models and do not require a real database. To run against a real test DB, set `TEST_DATABASE_URL` in `.env`.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string. Only DB config source. |
| `JWT_SECRET` | ✅ Yes | Access token signing secret (≥32 chars) |
| `JWT_REFRESH_SECRET` | No | Refresh token secret (falls back to `JWT_SECRET`) |
| `FRONTEND_ORIGIN` | No | Comma-separated allowed CORS origins. Default: `http://localhost:3000` |
| `PORT` | No | Server port. Default: `5000` |
| `NODE_ENV` | No | `development` / `test` / `production` |
| `TEST_DATABASE_URL` | No | Separate DB for tests (never touches production) |

---

## DATABASE_URL Format

```
postgres://USER:PASSWORD@HOST:PORT/DBNAME?sslmode=require
```

Supports [Neon](https://neon.tech), [Render](https://render.com), [Supabase](https://supabase.com), and local PostgreSQL.  
SSL is automatically enabled for `sslmode=require` URLs and in production mode.

---

## Commands Reference

| Command | Description |
|---|---|
| `npm start` | Start production server |
| `npm run dev` | Start dev server with hot-reload |
| `npm test` | Run test suite (mocked, no DB needed) |
| `npm run migrate` | Run all pending migrations |
| `npm run migrate:undo` | Revert last migration |
| `npm run seed:admin` | Seed first admin user (idempotent) |
| `npm run seed:demo` | Seed demo users (dev/test only) |
| `npm run seed` | Run all seeders |

---

## API Base URL

```
http://localhost:5000
```

Interactive docs: `http://localhost:5000/api/docs` (Swagger UI)  
Health check: `http://localhost:5000/health`

---

## Authentication Flow

1. **Register** → `POST /api/auth/register` — phone number identity, account number derived from phone
2. **Set PIN** → `POST /api/auth/set-pin` — one-time, using account number
3. **Login** → `POST /api/auth/login` → returns `{ token, refreshToken }`
4. **Authenticated requests** → `Authorization: Bearer <token>` header
5. **Refresh** → `POST /api/auth/refresh` with `{ refreshToken }` → new access token

Access tokens expire in **15 minutes**. Refresh tokens expire in **7 days**.

---

## Account Numbers

Derived from phone number: `phoneNumber.slice(1)` (strips leading `0`).

| Phone | Account Number |
|---|---|
| `08123456789` | `8123456789` |
| `09098765432` | `9098765432` |

**Collision limit**: Two phone numbers whose last 10 digits collide would generate duplicate account numbers (e.g., `08012345678` and `00012345678` → both `8012345678`). The Nigerian 080/090/070 prefix space makes practical collisions extremely rare, but this is **not** a real bank-issued account number scheme.

---

## Full Endpoint List

### Auth (`/api/auth`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | None | Register new user |
| POST | `/api/auth/set-pin` | None | Set PIN (one-time, post-registration) |
| POST | `/api/auth/login` | None | Login → access + refresh tokens |
| POST | `/api/auth/refresh` | None | Refresh access token |
| PUT | `/api/auth/change-pin` | Bearer | Change PIN (current PIN required) |

### Account (`/api/account`) — all require Bearer token

| Method | Path | Description |
|---|---|---|
| GET | `/api/account/profile` | Get profile + account details |
| PUT | `/api/account/profile` | Update first name / surname |
| GET | `/api/account/balance` | Get current balance |
| DELETE | `/api/account/deactivate` | Self-deactivate (PIN required) |

### Deposits & Withdrawals — all require Bearer token

| Method | Path | Description |
|---|---|---|
| POST | `/api/account/withdraw` | [SIMULATED] Withdraw (PIN required) |

Deposits are only available to authenticated admins through `POST /api/admin/deposit`.
For a development demo admin, run `npm run seed:admin`; the seeded login is `jason_admin` with PIN `2468`.

### Transfers — all require Bearer token

| Method | Path | Description |
|---|---|---|
| GET | `/api/account/validate-recipient` | Validate recipient, return name |
| POST | `/api/account/transfer` | Transfer (atomic, PIN required, idempotency key supported) |

### Transactions — all require Bearer token

| Method | Path | Description |
|---|---|---|
| GET | `/api/account/transactions` | Paginated history (filters: type, category, status, date, reference) |
| GET | `/api/account/transactions/:id` | Single transaction receipt |
| GET | `/api/account/statement` | CSV download (max 90 days, requires startDate & endDate) |

### Beneficiaries — all require Bearer token

| Method | Path | Description |
|---|---|---|
| GET | `/api/account/beneficiaries` | List saved beneficiaries |
| POST | `/api/account/beneficiaries` | Add beneficiary |
| DELETE | `/api/account/beneficiaries/:id` | Remove beneficiary |

### Notifications — all require Bearer token

| Method | Path | Description |
|---|---|---|
| GET | `/api/account/notifications` | Paginated notifications (filter: unreadOnly=true) |
| GET | `/api/account/notifications/unread-count` | Unread count |
| PUT | `/api/account/notifications/read-all` | Mark all as read |
| PUT | `/api/account/notifications/:id/read` | Mark single as read |

### Admin (`/api/admin`) — all except login require admin Bearer token

| Method | Path | Description |
|---|---|---|
| POST | `/api/admin/login` | Admin login (username + PIN) |
| GET | `/api/admin/users` | List all users (paginated, searchable) |
| GET | `/api/admin/users/:accountNumber` | Get user by account number |
| PUT | `/api/admin/users/:accountNumber/restrict` | Restrict account (reason required) |
| PUT | `/api/admin/users/:accountNumber/reactivate` | Reactivate account (reason required) |
| POST | `/api/admin/deposit` | [SIMULATED] Admin credit (reason required, ledger-based) |
| POST | `/api/admin/withdraw` | [SIMULATED] Admin debit (reason required, ledger-based) |
| GET | `/api/admin/transactions` | All transactions (paginated, filterable) |
| GET | `/api/admin/audit-logs` | Admin audit log |

### System

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | None | Health check + DB status |
| GET | `/api/docs` | None | Swagger UI |
| GET | `/api/docs.json` | None | OpenAPI JSON spec |

---

## Response Shape

All responses follow this shape:

```json
{ "success": true, "message": "Description", "data": {} }
```

Errors:
```json
{ "success": false, "message": "Error description" }
```

## Money Format

All API amounts are in **NGN (Nigerian Naira)**.  
Input: amounts in naira (e.g., `5000` = ₦5,000).  
Internally stored as **kobo** (integer × 100, never floats).  
Response includes both forms:

```json
{ "kobo": 500000, "naira": "5000.00", "currency": "NGN" }
```

## Pagination

Query params: `?page=1&limit=20`  
Response includes:
```json
{
  "pagination": {
    "total": 42, "page": 1, "limit": 20,
    "totalPages": 3, "hasNextPage": true, "hasPrevPage": false
  }
}
```

---

## Status Definitions

### User status
| Status | Meaning |
|---|---|
| `active` | Normal — can log in, transfer, etc. |
| `restricted` | Blocked by admin — cannot log in or transfer |
| `deactivated` | Self-deactivated or admin-deactivated — cannot log in |

### Transaction status
| Status | Meaning |
|---|---|
| `completed` | Successfully processed |
| `pending` | In progress |
| `failed` | Failed |
| `reversed` | Reversed (future use) |

---

## Admin Bootstrap (First Admin)

1. Set up `DATABASE_URL` in `.env`
2. Run migrations: `npm run migrate`
3. Run admin seeder: `npm run seed:admin`
4. Login at `POST /api/admin/login` with `{ "username": "jason_admin", "pin": "2468" }`
5. **Change the PIN immediately** — the default PIN `2468` is public knowledge

Public user registration (`POST /api/auth/register`) **cannot** create admin accounts.

---

## Frontend Integration

1. Set `FRONTEND_ORIGIN` in `.env` to your frontend URL (e.g., `https://yourapp.vercel.app`)
2. Include `Authorization: Bearer <token>` on all authenticated requests
3. Handle 401 responses by calling `POST /api/auth/refresh` with the stored refresh token
4. All amounts in NGN (naira). Backend returns `{ kobo, naira, currency }` format.
5. CORS is pre-configured — credentials are allowed

---

## Remaining Limitations

- **No real payment provider**: All deposits and withdrawals are `[SIMULATED]`. No Paystack, Flutterwave, or bank API integration.
- **4-digit PIN only**: 10,000 combinations. Insufficient for real production banking. A real system would need OTP, biometrics, or stronger 2FA.
- **No refresh token revocation database**: Refresh tokens are stateless JWTs. Logging out does not invalidate existing refresh tokens on the server side.
- **No KYC**: No identity verification, no BVN validation.
- **No regulatory compliance**: CBN regulations, AML/CFT, data residency, etc. are not implemented.
- **No real SMS/email notifications**: In-app notifications only. External delivery requires additional integration.
- **Simulated idempotency**: Transfer idempotency uses a client-provided key stored in the DB — not a proper distributed idempotency layer.
- **Account numbers not real bank numbers**: Phone-derived scheme only. Not NIBSS-compliant.
- **No refresh token rotation**: Refresh tokens are not rotated on use. A stolen refresh token remains valid until expiry.
- **In-memory data files**: `src/data/users.js` and `src/data/admin.js` are legacy artefacts from the original in-memory system. They are not used by any live code path and contain no recoverable balance history.
