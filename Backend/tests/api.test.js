"use strict";

/**
 * JayPay Test Suite
 *
 * Uses Jest + Supertest against the Express app.
 * Tests use an in-memory mock or test DATABASE_URL to avoid touching production data.
 * 
 * NOTE: For these tests to run with a real database, set TEST_DATABASE_URL in your env.
 * Tests that require DB will be skipped if no TEST_DATABASE_URL is provided.
 *
 * Run: npm test
 */

const request = require("supertest");

// Mock the DB connection so tests don't require a real DB by default.
// IMPORTANT: jest.mock() factories are hoisted before any code in this file runs,
// so the factory must be self-contained — no references to outer-scope variables.
// We must provide a `define()` stub because Sequelize model files call sequelize.define()
// at module load time, before jest.mock("../src/models/...") can intercept them.
jest.mock("../src/db", () => {
  const makeMockModel = () => ({
    findOne: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    destroy: jest.fn(),
    belongsTo: jest.fn(),
    hasOne: jest.fn(),
    hasMany: jest.fn(),
  });
  return {
    sequelize: {
      authenticate: jest.fn().mockResolvedValue(true),
      transaction: jest.fn().mockImplementation(() => {
        const t = {
          LOCK: { UPDATE: "UPDATE" },
          commit: jest.fn().mockResolvedValue(true),
          rollback: jest.fn().mockResolvedValue(true),
        };
        return Promise.resolve(t);
      }),
      // define() must exist because Sequelize model files call it at require time
      define: jest.fn().mockImplementation(() => makeMockModel()),
    },
    connectDB: jest.fn().mockResolvedValue(true),
  };
});

// Mock all models
jest.mock("../src/models/User");
jest.mock("../src/models/Account");
jest.mock("../src/models/Transaction");
jest.mock("../src/models/Transfer");
jest.mock("../src/models/Beneficiary");
jest.mock("../src/models/Notification");
jest.mock("../src/models/AdminUser");
jest.mock("../src/models/AuditLog");
jest.mock("../src/services/notificationService", () => ({
  createNotification: jest.fn().mockResolvedValue(true),
  getUnreadCount: jest.fn().mockResolvedValue(0),
}));

const app = require("../src/app");

// ─── Test Data ────────────────────────────────────────────────────────────────
const User = require("../src/models/User");
const Account = require("../src/models/Account");
const Transaction = require("../src/models/Transaction");
const Transfer = require("../src/models/Transfer");
const Beneficiary = require("../src/models/Beneficiary");
const Notification = require("../src/models/Notification");
const AdminUser = require("../src/models/AdminUser");
const AuditLog = require("../src/models/AuditLog");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const TEST_JWT_SECRET = "test-secret-key-minimum-32-chars!!";
process.env.JWT_SECRET = TEST_JWT_SECRET;
process.env.JWT_REFRESH_SECRET = TEST_JWT_SECRET;

// Helper to generate test JWT
const makeUserToken = (overrides = {}) => jwt.sign(
  {
    id: "user-uuid-1",
    phoneNumber: "08123456789",
    accountNumber: "8123456789",
    role: "user",
    ...overrides,
  },
  TEST_JWT_SECRET,
  { expiresIn: "1h" }
);

const makeAdminToken = (overrides = {}) => jwt.sign(
  {
    id: "admin-uuid-1",
    username: "jason_admin",
    role: "super_admin",
    isAdmin: true,
    ...overrides,
  },
  TEST_JWT_SECRET,
  { expiresIn: "1h" }
);

// ─── 1. Health Check ──────────────────────────────────────────────────────────
describe("Health Check", () => {
  test("GET /health returns 200 when DB connected", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.database).toBe("connected");
  });
});

// ─── 2. Registration ─────────────────────────────────────────────────────────
describe("POST /api/auth/register", () => {
  const validPayload = {
    firstName: "David",
    surname: "Okafor",
    phoneNumber: "08123456789",
    age: 24,
  };

  beforeEach(() => {
    User.findOne = jest.fn().mockResolvedValue(null);
    User.create = jest.fn().mockResolvedValue({
      id: "user-uuid-1",
      firstName: "David",
      surname: "Okafor",
      accountNumber: "8123456789",
      phoneNumber: "08123456789",
    });
    Account.create = jest.fn().mockResolvedValue({ id: "account-uuid-1" });
  });

  test("registers successfully with valid data", async () => {
    const res = await request(app).post("/api/auth/register").send(validPayload);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accountNumber).toBe("8123456789");
  });

  test("rejects age under 18", async () => {
    const res = await request(app).post("/api/auth/register").send({ ...validPayload, age: 16 });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test("rejects invalid phone number (not 11 digits)", async () => {
    const res = await request(app).post("/api/auth/register").send({ ...validPayload, phoneNumber: "0801234" });
    expect(res.status).toBe(400);
  });

  test("rejects duplicate phone number", async () => {
    User.findOne = jest.fn().mockResolvedValue({ id: "existing-user" });
    const res = await request(app).post("/api/auth/register").send(validPayload);
    expect(res.status).toBe(409);
  });

  test("account number is phoneNumber.slice(1)", async () => {
    const res = await request(app).post("/api/auth/register").send(validPayload);
    expect(res.body.data.accountNumber).toBe("8123456789");
    expect(res.body.data.accountNumber).toBe(validPayload.phoneNumber.slice(1));
  });

  test("rejects missing fields", async () => {
    const res = await request(app).post("/api/auth/register").send({ firstName: "Only" });
    expect(res.status).toBe(400);
  });
});

// ─── 3. Set PIN ───────────────────────────────────────────────────────────────
describe("POST /api/auth/set-pin", () => {
  test("sets PIN successfully", async () => {
    User.findOne = jest.fn().mockResolvedValue({
      accountNumber: "8123456789",
      pin: null,
      update: jest.fn().mockResolvedValue(true),
    });

    const res = await request(app).post("/api/auth/set-pin").send({
      accountNumber: "8123456789",
      pin: "4827",
      confirmPin: "4827",
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test("rejects non-matching PINs", async () => {
    const res = await request(app).post("/api/auth/set-pin").send({
      accountNumber: "8123456789",
      pin: "4827",
      confirmPin: "1234",
    });
    expect(res.status).toBe(400);
  });

  test("rejects PIN already set", async () => {
    User.findOne = jest.fn().mockResolvedValue({
      accountNumber: "8123456789",
      pin: "$2b$12$hashed_pin_value",
    });

    const res = await request(app).post("/api/auth/set-pin").send({
      accountNumber: "8123456789",
      pin: "4827",
      confirmPin: "4827",
    });
    expect(res.status).toBe(409);
  });

  test("rejects non-4-digit PIN", async () => {
    const res = await request(app).post("/api/auth/set-pin").send({
      accountNumber: "8123456789",
      pin: "12",
      confirmPin: "12",
    });
    expect(res.status).toBe(400);
  });
});

// ─── 4. Login ─────────────────────────────────────────────────────────────────
describe("POST /api/auth/login", () => {
  let hashedPin;

  beforeAll(async () => {
    hashedPin = await bcrypt.hash("4827", 12);
  });

  test("login succeeds with correct credentials", async () => {
    User.findOne = jest.fn().mockResolvedValue({
      id: "user-uuid-1",
      phoneNumber: "08123456789",
      accountNumber: "8123456789",
      firstName: "David",
      surname: "Okafor",
      pin: hashedPin,
      status: "active",
      isActive: true,
      pinAttempts: 0,
      pinLockedUntil: null,
      update: jest.fn().mockResolvedValue(true),
    });

    const res = await request(app).post("/api/auth/login").send({
      phoneNumber: "08123456789",
      pin: "4827",
    });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.refreshToken).toBeTruthy();
  });

  test("returns generic error for wrong PIN", async () => {
    User.findOne = jest.fn().mockResolvedValue({
      id: "user-uuid-1",
      pin: hashedPin,
      status: "active",
      isActive: true,
      pinAttempts: 0,
      pinLockedUntil: null,
      update: jest.fn().mockResolvedValue(true),
    });

    const res = await request(app).post("/api/auth/login").send({
      phoneNumber: "08123456789",
      pin: "9999",
    });
    expect(res.status).toBe(401);
    // Must not reveal which field is wrong
    expect(res.body.message).toMatch(/Invalid phone number or PIN/i);
  });

  test("returns generic error for unknown phone number", async () => {
    User.findOne = jest.fn().mockResolvedValue(null);
    const res = await request(app).post("/api/auth/login").send({
      phoneNumber: "00000000000",
      pin: "4827",
    });
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/Invalid phone number or PIN/i);
  });

  test("rejects login with no PIN set", async () => {
    User.findOne = jest.fn().mockResolvedValue({
      pin: null,
      status: "active",
      isActive: true,
      pinAttempts: 0,
      pinLockedUntil: null,
    });

    const res = await request(app).post("/api/auth/login").send({
      phoneNumber: "08123456789",
      pin: "4827",
    });
    expect(res.status).toBe(401);
  });

  test("rejects login for deactivated account", async () => {
    User.findOne = jest.fn().mockResolvedValue({
      pin: hashedPin,
      status: "deactivated",
      isActive: false,
    });

    const res = await request(app).post("/api/auth/login").send({
      phoneNumber: "08123456789",
      pin: "4827",
    });
    expect(res.status).toBe(403);
  });
});

// ─── 5. Auth Token Tests ──────────────────────────────────────────────────────
describe("JWT Authorization", () => {
  test("rejects requests with no token", async () => {
    const res = await request(app).get("/api/account/profile");
    expect(res.status).toBe(401);
  });

  test("rejects invalid token", async () => {
    const res = await request(app)
      .get("/api/account/profile")
      .set("Authorization", "Bearer invalid.token.here");
    expect(res.status).toBe(401);
  });

  test("rejects expired token", async () => {
    const expiredToken = jwt.sign(
      { id: "user-uuid-1", accountNumber: "8123456789" },
      TEST_JWT_SECRET,
      { expiresIn: "0s" }
    );

    const res = await request(app)
      .get("/api/account/profile")
      .set("Authorization", `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
  });

  test("rejects user token on admin route", async () => {
    const userToken = makeUserToken();
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  test("admin token works on admin route", async () => {
    const adminToken = makeAdminToken();
    User.findAndCountAll = jest.fn().mockResolvedValue({ count: 0, rows: [] });

    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});

// ─── 6. Account Profile ───────────────────────────────────────────────────────
describe("GET /api/account/profile", () => {
  test("returns profile for authenticated user", async () => {
    User.findByPk = jest.fn().mockResolvedValue({
      id: "user-uuid-1",
      firstName: "David",
      surname: "Okafor",
      phoneNumber: "08123456789",
      accountNumber: "8123456789",
      age: 24,
      status: "active",
      createdAt: new Date(),
      Account: { balanceKobo: "500000", currency: "NGN" },
    });

    const token = makeUserToken();
    const res = await request(app)
      .get("/api/account/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.accountNumber).toBe("8123456789");
    expect(res.body.data.balance.naira).toBe("5000.00");
  });
});

// ─── 7. Customer Deposit Access ───────────────────────────────────────────────
describe("POST /api/account/deposit", () => {
  const token = makeUserToken();

  test("does not expose a deposit endpoint to customer accounts", async () => {
    const res = await request(app)
      .post("/api/account/deposit")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 100 });

    expect(res.status).toBe(404);
  });
});

// ─── 8. Transfer ──────────────────────────────────────────────────────────────
describe("POST /api/account/transfer", () => {
  let hashedPin;
  const token = makeUserToken();

  beforeAll(async () => {
    hashedPin = await bcrypt.hash("4827", 12);
  });

  const setupTransferMocks = () => {
    User.findByPk = jest.fn().mockResolvedValue({
      id: "user-uuid-1",
      accountNumber: "8123456789",
      firstName: "David",
      surname: "Okafor",
      status: "active",
      pin: hashedPin,
    });
    User.findOne = jest.fn().mockResolvedValue({
      id: "user-uuid-2",
      accountNumber: "9098765432",
      firstName: "Michael",
      surname: "Adeyemi",
      status: "active",
    });
    Account.findOne = jest.fn()
      .mockResolvedValueOnce({
        id: "account-uuid-1",
        userId: "user-uuid-1",
        balanceKobo: "1000000",
        update: jest.fn().mockResolvedValue(true),
      })
      .mockResolvedValueOnce({
        id: "account-uuid-2",
        userId: "user-uuid-2",
        balanceKobo: "0",
        update: jest.fn().mockResolvedValue(true),
      });
    Transfer.findOne = jest.fn().mockResolvedValue(null);
    Transaction.create = jest.fn().mockImplementation((data) => Promise.resolve({
      ...data,
      id: `tx-${Math.random()}`,
      update: jest.fn().mockResolvedValue(true),
    }));
    Transfer.create = jest.fn().mockResolvedValue({ id: "transfer-1", reference: "JPY-TEST", status: "completed" });
  };

  test("transfers successfully with correct PIN", async () => {
    setupTransferMocks();

    const res = await request(app)
      .post("/api/account/transfer")
      .set("Authorization", `Bearer ${token}`)
      .send({
        accountNumber: "9098765432",
        amount: 3200,
        pin: "4827",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.recipient.accountNumber).toBe("9098765432");
  });

  test("rejects self-transfer", async () => {
    const res = await request(app)
      .post("/api/account/transfer")
      .set("Authorization", `Bearer ${token}`)
      .send({
        accountNumber: "8123456789", // same as token's accountNumber
        amount: 1000,
        pin: "4827",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/yourself/i);
  });

  test("rejects incorrect PIN", async () => {
    User.findByPk = jest.fn().mockResolvedValue({
      id: "user-uuid-1",
      accountNumber: "8123456789",
      status: "active",
      pin: hashedPin,
    });
    User.findOne = jest.fn().mockResolvedValue({
      id: "user-uuid-2",
      accountNumber: "9098765432",
      status: "active",
    });
    Transfer.findOne = jest.fn().mockResolvedValue(null);

    const res = await request(app)
      .post("/api/account/transfer")
      .set("Authorization", `Bearer ${token}`)
      .send({
        accountNumber: "9098765432",
        amount: 1000,
        pin: "9999",
      });

    expect(res.status).toBe(401);
  });

  test("rejects insufficient balance", async () => {
    User.findByPk = jest.fn().mockResolvedValue({
      id: "user-uuid-1",
      accountNumber: "8123456789",
      status: "active",
      pin: hashedPin,
    });
    User.findOne = jest.fn().mockResolvedValue({
      id: "user-uuid-2",
      accountNumber: "9098765432",
      status: "active",
    });
    Transfer.findOne = jest.fn().mockResolvedValue(null);
    Account.findOne = jest.fn()
      .mockResolvedValueOnce({ id: "acc-1", userId: "user-uuid-1", balanceKobo: "5000" })
      .mockResolvedValueOnce({ id: "acc-2", userId: "user-uuid-2", balanceKobo: "0" });

    const res = await request(app)
      .post("/api/account/transfer")
      .set("Authorization", `Bearer ${token}`)
      .send({
        accountNumber: "9098765432",
        amount: 100000,
        pin: "4827",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/insufficient/i);
  });

  test("rejects invalid amount (below minimum)", async () => {
    const res = await request(app)
      .post("/api/account/transfer")
      .set("Authorization", `Bearer ${token}`)
      .send({ accountNumber: "9098765432", amount: 50, pin: "4827" });
    expect(res.status).toBe(400);
  });

  test("returns existing transfer for duplicate idempotency key", async () => {
    Transfer.findOne = jest.fn().mockResolvedValue({
      reference: "JPY-EXISTING",
      status: "completed",
    });

    const res = await request(app)
      .post("/api/account/transfer")
      .set("Authorization", `Bearer ${token}`)
      .send({
        accountNumber: "9098765432",
        amount: 1000,
        pin: "4827",
        idempotencyKey: "existing-key",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.idempotent).toBe(true);
  });
});

// ─── 9. Beneficiaries ─────────────────────────────────────────────────────────
describe("Beneficiaries", () => {
  const token = makeUserToken();

  test("lists beneficiaries", async () => {
    Beneficiary.findAll = jest.fn().mockResolvedValue([]);
    const res = await request(app)
      .get("/api/account/beneficiaries")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.beneficiaries).toEqual([]);
  });

  test("adds a valid beneficiary", async () => {
    User.findOne = jest.fn().mockResolvedValue({
      firstName: "Michael",
      surname: "Adeyemi",
      accountNumber: "9098765432",
      status: "active",
    });
    Beneficiary.findOne = jest.fn().mockResolvedValue(null);
    Beneficiary.create = jest.fn().mockResolvedValue({
      id: "ben-1",
      accountNumber: "9098765432",
      recipientName: "Michael Adeyemi",
      nickname: null,
    });

    const res = await request(app)
      .post("/api/account/beneficiaries")
      .set("Authorization", `Bearer ${token}`)
      .send({ accountNumber: "9098765432" });

    expect(res.status).toBe(201);
    expect(res.body.data.recipientName).toBe("Michael Adeyemi");
  });

  test("rejects adding self as beneficiary", async () => {
    const res = await request(app)
      .post("/api/account/beneficiaries")
      .set("Authorization", `Bearer ${token}`)
      .send({ accountNumber: "8123456789" }); // own account
    expect(res.status).toBe(400);
  });

  test("rejects duplicate beneficiary", async () => {
    User.findOne = jest.fn().mockResolvedValue({
      firstName: "Michael",
      surname: "Adeyemi",
      accountNumber: "9098765432",
      status: "active",
    });
    Beneficiary.findOne = jest.fn().mockResolvedValue({ id: "existing-ben" });

    const res = await request(app)
      .post("/api/account/beneficiaries")
      .set("Authorization", `Bearer ${token}`)
      .send({ accountNumber: "9098765432" });

    expect(res.status).toBe(409);
  });

  test("removes beneficiary owned by user", async () => {
    Beneficiary.findOne = jest.fn().mockResolvedValue({
      id: "ben-1",
      userId: "user-uuid-1",
      destroy: jest.fn().mockResolvedValue(true),
    });

    const res = await request(app)
      .delete("/api/account/beneficiaries/ben-1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  test("rejects removing beneficiary not owned by user", async () => {
    Beneficiary.findOne = jest.fn().mockResolvedValue(null); // not found for this user

    const res = await request(app)
      .delete("/api/account/beneficiaries/other-user-ben")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

// ─── 10. Notifications ────────────────────────────────────────────────────────
describe("Notifications", () => {
  const token = makeUserToken();

  test("returns notifications list", async () => {
    Notification.findAndCountAll = jest.fn().mockResolvedValue({ count: 0, rows: [] });

    const res = await request(app)
      .get("/api/account/notifications")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.notifications).toEqual([]);
  });

  test("returns unread count", async () => {
    Notification.count = jest.fn().mockResolvedValue(3);

    const res = await request(app)
      .get("/api/account/notifications/unread-count")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.unreadCount).toBe(3);
  });

  test("marks all notifications as read", async () => {
    Notification.update = jest.fn().mockResolvedValue([5]);

    const res = await request(app)
      .put("/api/account/notifications/read-all")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.updated).toBe(5);
  });
});

// ─── 11. Admin Tests ──────────────────────────────────────────────────────────
describe("Admin", () => {
  let adminHashedPin;

  beforeAll(async () => {
    adminHashedPin = await bcrypt.hash("2468", 12);
  });

  test("admin logs in with correct credentials", async () => {
    AdminUser.findOne = jest.fn().mockResolvedValue({
      id: "admin-uuid-1",
      username: "jason_admin",
      firstName: "Jason",
      role: "super_admin",
      isActive: true,
      pin: adminHashedPin,
      pinAttempts: 0,
      pinLockedUntil: null,
      update: jest.fn().mockResolvedValue(true),
    });
    AuditLog.create = jest.fn().mockResolvedValue({ id: "log-1" });

    const res = await request(app).post("/api/admin/login").send({
      username: "jason_admin",
      pin: "2468",
    });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeTruthy();
  });

  test("admin login fails with wrong PIN", async () => {
    AdminUser.findOne = jest.fn().mockResolvedValue({
      id: "admin-uuid-1",
      username: "jason_admin",
      isActive: true,
      pin: adminHashedPin,
      pinAttempts: 0,
      pinLockedUntil: null,
      update: jest.fn().mockResolvedValue(true),
    });

    const res = await request(app).post("/api/admin/login").send({
      username: "jason_admin",
      pin: "9999",
    });

    expect(res.status).toBe(401);
  });

  test("non-admin JWT cannot access admin routes", async () => {
    const userToken = makeUserToken();
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  test("admin can look up an account holder by account number", async () => {
    User.findOne = jest.fn().mockResolvedValue({
      id: "user-uuid-1",
      firstName: "David",
      surname: "Okafor",
      phoneNumber: "08123456789",
      accountNumber: "8123456789",
      status: "active",
      age: 24,
      createdAt: new Date(),
      Account: { balanceKobo: "0", currency: "NGN" },
    });

    const res = await request(app)
      .get("/api/admin/users/8123456789")
      .set("Authorization", `Bearer ${makeAdminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      firstName: "David",
      surname: "Okafor",
      accountNumber: "8123456789",
    });
  });

  test("customer JWT cannot deposit through the admin route", async () => {
    const res = await request(app)
      .post("/api/admin/deposit")
      .set("Authorization", `Bearer ${makeUserToken()}`)
      .send({
        accountNumber: "8123456789",
        amount: 5000,
        reason: "Test adjustment",
      });

    expect(res.status).toBe(403);
  });

  test("admin deposit creates ledger entry", async () => {
    const adminToken = makeAdminToken();
    User.findOne = jest.fn().mockResolvedValue({
      id: "user-uuid-1",
      accountNumber: "8123456789",
    });
    Account.findOne = jest.fn().mockResolvedValue({
      id: "account-uuid-1",
      balanceKobo: "0",
      update: jest.fn().mockResolvedValue(true),
    });
    Transaction.create = jest.fn().mockResolvedValue({ id: "tx-admin-1", reference: "JPY-ADMIN-001" });
    AuditLog.create = jest.fn().mockResolvedValue({ id: "log-1" });

    const res = await request(app)
      .post("/api/admin/deposit")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        accountNumber: "8123456789",
        amount: 5000,
        reason: "Initial seeding for demo",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.isSimulated).toBe(true);
  });

  test("admin deposit rejects an account number that does not exist", async () => {
    User.findOne = jest.fn().mockResolvedValue(null);

    const res = await request(app)
      .post("/api/admin/deposit")
      .set("Authorization", `Bearer ${makeAdminToken()}`)
      .send({
        accountNumber: "8123456789",
        amount: 5000,
        reason: "Demo account funding",
      });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Account not found");
  });

  test("admin deposit requires reason", async () => {
    const adminToken = makeAdminToken();
    const res = await request(app)
      .post("/api/admin/deposit")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        accountNumber: "8123456789",
        amount: 5000,
        // no reason
      });

    expect(res.status).toBe(400);
  });
});

// ─── 12. Account Restrictions ─────────────────────────────────────────────────
describe("Account Restrictions", () => {
  test("restricted user cannot log in", async () => {
    const hashedPin = await bcrypt.hash("4827", 12);
    User.findOne = jest.fn().mockResolvedValue({
      id: "user-uuid-1",
      pin: hashedPin,
      status: "restricted",
      isActive: true,
    });

    // Restricted accounts are blocked by status check in login
    const res = await request(app).post("/api/auth/login").send({
      phoneNumber: "08123456789",
      pin: "4827",
    });

    // Note: "restricted" is different from "deactivated" — restricted users get 403
    // while deactivated users get 403 too. Both block login.
    expect([401, 403]).toContain(res.status);
  });
});

// ─── 13. Input Validation Edge Cases ─────────────────────────────────────────
describe("Input Validation", () => {
  const token = makeUserToken();

  test("rejects non-numeric amount in transfer", async () => {
    const res = await request(app)
      .post("/api/account/transfer")
      .set("Authorization", `Bearer ${token}`)
      .send({ accountNumber: "9098765432", amount: "abc", pin: "4827" });
    expect(res.status).toBe(400);
  });

  test("rejects 404 for unknown route", async () => {
    const res = await request(app).get("/api/nonexistent");
    expect(res.status).toBe(404);
  });

  test("rejects statement without date params", async () => {
    Account.findOne = jest.fn().mockResolvedValue({ id: "acc-1" });
    const res = await request(app)
      .get("/api/account/statement")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});
