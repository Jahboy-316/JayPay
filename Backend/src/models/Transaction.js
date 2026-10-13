"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../db");
const Account = require("./Account");

/**
 * Transaction (ledger) model — immutable record of every balance movement.
 * Every deposit, withdrawal, and transfer creates entries here.
 * The ledger is the single source of truth. Balances are derived from it
 * and cached in Account.balanceKobo for read performance.
 *
 * amountKobo: always positive. Direction determined by `type`.
 * Types:
 *   credit  - money coming in (deposit, transfer receipt)
 *   debit   - money going out (withdrawal, transfer sent)
 *   admin_credit - admin manual credit through ledger
 *   admin_debit  - admin manual debit through ledger
 */
const Transaction = sequelize.define("Transaction", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  accountId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: "accounts",
      key: "id",
    },
  },
  // Positive amount in kobo
  amountKobo: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM("credit", "debit", "admin_credit", "admin_debit"),
    allowNull: false,
  },
  category: {
    type: DataTypes.ENUM("deposit", "withdrawal", "transfer_in", "transfer_out", "admin_adjustment"),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("pending", "completed", "failed", "reversed"),
    defaultValue: "completed",
  },
  // Balance after this transaction (for auditing)
  balanceAfterKobo: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  // Unique reference for idempotency
  reference: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  // Idempotency key supplied by client (optional)
  idempotencyKey: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  // Links transfer_in / transfer_out to its counterpart
  relatedTransactionId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  // For admin adjustments: why
  reason: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  // SIMULATED flag — clearly labels non-real-bank movements
  isSimulated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
}, {
  tableName: "transactions",
  timestamps: true,
});

Transaction.belongsTo(Account, { foreignKey: "accountId" });
Account.hasMany(Transaction, { foreignKey: "accountId" });

module.exports = Transaction;
