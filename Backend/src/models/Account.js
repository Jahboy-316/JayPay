"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../db");
const User = require("./User");

/**
 * Account model — holds the current balance in kobo (integer minor units).
 * 1 NGN = 100 kobo. Never store balances as floats.
 * Format for display: (balanceKobo / 100).toFixed(2)
 *
 * Balance MUST only change via ledger entries (Transactions).
 * Direct writes to balance are not permitted by the API.
 */
const Account = sequelize.define("Account", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: "users",
      key: "id",
    },
    onDelete: "CASCADE",
  },
  // Balance in kobo (integer). Never a float.
  balanceKobo: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    allowNull: false,
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: "NGN",
    allowNull: false,
  },
}, {
  tableName: "accounts",
  timestamps: true,
});

Account.belongsTo(User, { foreignKey: "userId" });
User.hasOne(Account, { foreignKey: "userId" });

module.exports = Account;
