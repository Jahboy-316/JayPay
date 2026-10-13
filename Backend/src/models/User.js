"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../db");

/**
 * User model — stores identity and authentication data.
 * Account number is phone-derived (phoneNumber.slice(1)) and immutable.
 * Money (balance) is tracked in Accounts, not here — but the ledger is the source of truth.
 *
 * PIN NOTE: A 4-digit PIN has only 10,000 combinations. This is not sufficient
 * for real production banking. We apply bcrypt hashing + attempt lockout to mitigate,
 * but a real bank would use stronger authentication factors.
 */
const User = sequelize.define("User", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  firstName: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  surname: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  phoneNumber: {
    type: DataTypes.STRING(11),
    allowNull: false,
    unique: true,
  },
  // Immutable account number derived from phone: phoneNumber.slice(1)
  // Collision limit: If two users have numbers whose last 10 digits collide (e.g. 08012345678
  // and 00012345678) their account numbers would match. The 0X prefix ensures practical
  // uniqueness in the Nigerian 080/090/070/081/091... space, but this is NOT a
  // real bank-issued account number scheme.
  accountNumber: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // Hashed with bcrypt (cost factor 12)
  pin: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  },
  // PIN attempt tracking for lockout
  pinAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  pinLockedUntil: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
  // Account status
  status: {
    type: DataTypes.ENUM("active", "restricted", "deactivated"),
    defaultValue: "active",
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: "users",
  timestamps: true,
});

module.exports = User;
