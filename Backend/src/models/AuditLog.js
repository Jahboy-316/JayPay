"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../db");

/**
 * AuditLog model — immutable record of admin actions.
 * Every admin action (restrict, reactivate, adjustment, login) is logged here.
 * Logs are never deleted.
 */
const AuditLog = sequelize.define("AuditLog", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  // Admin who performed the action (null for system actions)
  adminId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: "admin_users", key: "id" },
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  // Target entity type: user, account, transaction, admin
  targetType: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  targetId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  // Reason provided by admin
  reason: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  // JSON snapshot of changes
  details: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
}, {
  tableName: "audit_logs",
  timestamps: true,
  updatedAt: false, // Audit logs are append-only
});

module.exports = AuditLog;
