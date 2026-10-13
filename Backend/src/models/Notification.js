"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../db");
const User = require("./User");

/**
 * Notification model — in-app notifications stored per user.
 * External SMS/email is optional and only used if env vars are configured.
 * External delivery is never claimed if not configured.
 */
const Notification = sequelize.define("Notification", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: "users", key: "id" },
    onDelete: "CASCADE",
  },
  type: {
    type: DataTypes.ENUM(
      "transfer_sent",
      "transfer_received",
      "deposit",
      "withdrawal",
      "admin_adjustment",
      "account_status",
      "security",
      "general"
    ),
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  // Optional link to related transaction
  relatedTransactionId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
}, {
  tableName: "notifications",
  timestamps: true,
});

Notification.belongsTo(User, { foreignKey: "userId" });
User.hasMany(Notification, { foreignKey: "userId" });

module.exports = Notification;
