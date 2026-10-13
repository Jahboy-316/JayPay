"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../db");

/**
 * AdminUser model — separate from regular users.
 * Admins cannot be created via public registration.
 * First admin is bootstrapped via seeder or npm run seed:admin.
 * Admin roles: "super_admin" | "admin" | "support"
 *
 * Admin PIN hashed with bcrypt. Admin uses username + PIN to log in.
 * The original admin (jason_admin, PIN 2468) is preserved via seeder.
 */
const AdminUser = sequelize.define("AdminUser", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  firstName: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  surname: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  // Bcrypt-hashed PIN
  pin: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM("super_admin", "admin", "support"),
    defaultValue: "admin",
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  // PIN attempt tracking
  pinAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  pinLockedUntil: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
}, {
  tableName: "admin_users",
  timestamps: true,
});

module.exports = AdminUser;
