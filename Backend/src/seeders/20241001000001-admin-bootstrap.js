"use strict";

const bcrypt = require("bcrypt");

/**
 * Admin seeder — bootstraps the first admin account.
 * Preserves the existing admin: jason_admin (PIN: 2468)
 *
 * To run: npm run seed:admin
 * This seeder is idempotent — safe to run multiple times.
 */
module.exports = {
  async up(queryInterface) {
    // Hash the admin PIN (2468) with bcrypt cost factor 12
    const hashedPin = await bcrypt.hash("2468", 12);

    const adminId = "00000000-0000-0000-0000-000000000001";

    // Check if admin already exists before inserting
    const existing = await queryInterface.rawSelect(
      "admin_users",
      { where: { username: "jason_admin" } },
      ["id"]
    );

    if (existing) {
      console.log("Admin jason_admin already exists. Skipping.");
      return;
    }

    await queryInterface.bulkInsert("admin_users", [
      {
        id: adminId,
        username: "jason_admin",
        firstName: "Jason",
        surname: "Hassan",
        pin: hashedPin,
        role: "super_admin",
        isActive: true,
        pinAttempts: 0,
        pinLockedUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], {
      ignoreDuplicates: true,
    });

    console.log("Admin seeder: jason_admin created successfully.");
    console.log("IMPORTANT: Change the admin PIN after first login in production.");
  },

  async down(queryInterface) {
    // Do not delete admins in production
    if (process.env.NODE_ENV === "production") {
      console.log("Skipping admin deletion in production.");
      return;
    }
    await queryInterface.bulkDelete("admin_users", { username: "jason_admin" });
  },
};
