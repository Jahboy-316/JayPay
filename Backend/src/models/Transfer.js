"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../db");
const Account = require("./Account");

/**
 * Transfer model — records the intent and both sides of a peer transfer.
 * Each transfer produces two Transaction (ledger) entries: one debit + one credit.
 */
const Transfer = sequelize.define("Transfer", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  senderAccountId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: "accounts", key: "id" },
  },
  recipientAccountId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: "accounts", key: "id" },
  },
  amountKobo: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  reference: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  idempotencyKey: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true,
  },
  status: {
    type: DataTypes.ENUM("pending", "completed", "failed"),
    defaultValue: "completed",
  },
  narration: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  // Link to the debit and credit ledger entries
  senderTransactionId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  recipientTransactionId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
}, {
  tableName: "transfers",
  timestamps: true,
});

module.exports = Transfer;
