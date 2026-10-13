"use strict";

const { Sequelize } = require("sequelize");

const isProduction = process.env.NODE_ENV === "production";
const isTest = process.env.NODE_ENV === "test";

// In test mode we allow an override DB URL so we never touch production data
const connectionUrl = isTest
  ? process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
  : process.env.DATABASE_URL;

// DATABASE_URL is the only connection source.
// Supports Neon/Render PostgreSQL with SSL.
if (!connectionUrl) {
  console.error("FATAL: DATABASE_URL environment variable is not set.");
  process.exit(1);
}

const sequelize = new Sequelize(connectionUrl, {
  dialect: "postgres",
  logging: false,
  dialectOptions: {
    ssl: connectionUrl.includes("sslmode=require") || isProduction
      ? { require: true, rejectUnauthorized: false }
      : false,
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

/**
 * Test the database connection. Called at server startup.
 * Exits the process if the database is unreachable.
 */
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully.");
  } catch (error) {
    console.error("FATAL: Unable to connect to the database:", error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
