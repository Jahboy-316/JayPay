"use strict";

require("dotenv").config();

const { connectDB } = require("./db");
const app = require("./app");

const PORT = process.env.PORT || 5000;

/**
 * Startup sequence:
 * 1. Connect to DB (exits if DATABASE_URL missing or DB unreachable)
 * 2. Start HTTP server
 */
const start = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`JayPay API running on http://localhost:${PORT}`);
    console.log(`Swagger docs: http://localhost:${PORT}/api/docs`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });
};

start();