require("dotenv").config();

const url = process.env.DATABASE_URL || process.env.TEST_DATABASE_URL;

if (!url) {
  throw new Error("DATABASE_URL (or TEST_DATABASE_URL) is required for migrations");
}

module.exports = {
  development: {
    url,
    dialect: "postgres",
    dialectOptions: {
      ssl: url.includes("sslmode=require")
        ? { require: true, rejectUnauthorized: false }
        : false,
    },
  },
  test: {
    url: process.env.TEST_DATABASE_URL || url,
    dialect: "postgres",
    dialectOptions: {
      ssl: (process.env.TEST_DATABASE_URL || url).includes("sslmode=require")
        ? { require: true, rejectUnauthorized: false }
        : false,
    },
  },
  production: {
    url,
    dialect: "postgres",
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false },
    },
  },
};
