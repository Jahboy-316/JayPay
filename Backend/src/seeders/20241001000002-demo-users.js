"use strict";

const bcrypt = require("bcrypt");

/**
 * Demo users seeder — for development and testing only.
 * NEVER run in production. Clearly labelled as simulated data.
 *
 * To run: npm run seed:demo
 * Demo user 1: phoneNumber 08123456789, PIN 4827
 * Demo user 2: phoneNumber 09098765432, PIN 5678
 */
module.exports = {
  async up(queryInterface) {
    if (process.env.NODE_ENV === "production") {
      console.log("Skipping demo seeder in production.");
      return;
    }

    const { randomUUID } = require("crypto");

    const user1Id = randomUUID();
    const user2Id = randomUUID();
    const account1Id = randomUUID();
    const account2Id = randomUUID();

    const pin1Hash = await bcrypt.hash("4827", 12);
    const pin2Hash = await bcrypt.hash("5678", 12);

    await queryInterface.bulkInsert("users", [
      {
        id: user1Id,
        firstName: "David",
        surname: "Okafor",
        phoneNumber: "08123456789",
        accountNumber: "8123456789",
        age: 24,
        pin: pin1Hash,
        status: "active",
        isActive: true,
        pinAttempts: 0,
        pinLockedUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: user2Id,
        firstName: "Michael",
        surname: "Adeyemi",
        phoneNumber: "09098765432",
        accountNumber: "9098765432",
        age: 27,
        pin: pin2Hash,
        status: "active",
        isActive: true,
        pinAttempts: 0,
        pinLockedUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], { ignoreDuplicates: true });

    await queryInterface.bulkInsert("accounts", [
      {
        id: account1Id,
        userId: user1Id,
        balanceKobo: 0,
        currency: "NGN",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: account2Id,
        userId: user2Id,
        balanceKobo: 0,
        currency: "NGN",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], { ignoreDuplicates: true });

    console.log("Demo seeder: David Okafor (8123456789, PIN 4827) and Michael Adeyemi (9098765432, PIN 5678) created.");
    console.log("[SIMULATED] Demo user balances start at ₦0.00. Use admin deposit to fund demo accounts.");
  },

  async down(queryInterface) {
    if (process.env.NODE_ENV === "production") {
      return;
    }
    await queryInterface.bulkDelete("users", {
      phoneNumber: ["08123456789", "09098765432"],
    });
  },
};

