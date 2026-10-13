"use strict";

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const authRoutes = require("./routes/authenticationRoutes");
const accountRoutes = require("./routes/accountRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

// ─── Security Headers (Helmet) ────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Origin controlled by FRONTEND_ORIGIN env var. Never hardcoded.
const allowedOrigins = process.env.FRONTEND_ORIGIN
  ? process.env.FRONTEND_ORIGIN.split(",").map((o) => o.trim().replace(/\/$/, ""))
  : ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"];

const isDev = process.env.NODE_ENV !== "production";
const isLocalhostOrigin = (orig) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(orig);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., mobile apps, Postman, server-to-server)
    if (!origin) return callback(null, true);

    const normalizedOrigin = origin.replace(/\/$/, "");

    if (
      allowedOrigins.includes(normalizedOrigin) ||
      allowedOrigins.includes("*") ||
      (isDev && isLocalhostOrigin(normalizedOrigin))
    ) {
      return callback(null, true);
    }

    if (isDev) {
      console.warn(`[CORS] Rejected request from origin: ${origin}. Add to FRONTEND_ORIGIN if expected.`);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Idempotency-Key",
    "idempotency-key",
    "X-Requested-With",
  ],
  exposedHeaders: ["Content-Disposition"],
}));

// ─── Body Parsing (with size limits) ─────────────────────────────────────────
app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ extended: false, limit: "50kb" }));

// ─── Rate Limiting ────────────────────────────────────────────────────────────

// General API rate limit
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  message: { success: false, message: "Too many requests. Please try again later." },
});

// Strict rate limit for auth endpoints (register, login, PIN)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  message: { success: false, message: "Too many authentication attempts. Please try again later." },
});

// Transfer rate limit
const transferLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  message: { success: false, message: "Too many transfer requests. Please slow down." },
});

app.use(generalLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/set-pin", authLimiter);
app.use("/api/auth/change-pin", authLimiter);
app.use("/api/admin/login", authLimiter);
app.use("/api/account/transfer", transferLimiter);

// ─── Swagger / OpenAPI Docs ───────────────────────────────────────────────────
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "JayPay Banking API",
      version: "2.0.0",
      description: `
**JayPay** — Banking System API

> **DISCLAIMER**: Deposits, withdrawals, and admin adjustments are **[SIMULATED]**.
> This is not connected to any real payment provider or bank infrastructure.
> Account numbers are phone-derived and are NOT real bank-issued account numbers.

## Authentication
Use JWT Bearer tokens. Access tokens expire in 15 minutes.
Use \`POST /api/auth/refresh\` to get a new access token using your refresh token (7 days).

## Money format
All amounts in the API are in **NGN (Nigerian Naira)**.
Internally stored as kobo (integer × 100). The API returns both forms:
\`\`\`json
{ "kobo": 500000, "naira": "5000.00", "currency": "NGN" }
\`\`\`

## Account numbers
Derived from phone number: \`phoneNumber.slice(1)\` (strips leading 0).
Example: 08123456789 → account number 8123456789 (10 digits).
These are NOT real bank-issued account numbers.
      `,
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: "Local development",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Access token from login. Expires in 15 minutes.",
        },
      },
    },
    security: [],
  },
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Serve raw OpenAPI JSON for frontend consumption
app.get("/api/docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.json(swaggerSpec);
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", async (req, res) => {
  const { sequelize } = require("./db");
  try {
    await sequelize.authenticate();
    return res.status(200).json({
      success: true,
      message: "JayPay API is healthy",
      data: {
        status: "ok",
        database: "connected",
        timestamp: new Date().toISOString(),
        version: "2.0.0",
      },
    });
  } catch (error) {
    return res.status(503).json({
      success: false,
      message: "Database connection failed",
      data: { status: "degraded", database: "disconnected" },
    });
  }
});

// ─── Root ─────────────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "JayPay Banking API v2.0.0",
    data: {
      docs: "/api/docs",
      health: "/health",
    },
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/admin", adminRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ─── Centralised Error Handler ────────────────────────────────────────────────
// No stack traces in production
app.use((err, req, res, next) => {
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ success: false, message: "CORS: Origin not allowed" });
  }

  // Do not log auth headers, tokens, or credentials
  const isProduction = process.env.NODE_ENV === "production";
  if (!isProduction) {
    console.error("Unhandled error:", err.message);
  }

  res.status(err.status || 500).json({
    success: false,
    message: isProduction ? "An unexpected error occurred" : err.message,
  });
});

module.exports = app;