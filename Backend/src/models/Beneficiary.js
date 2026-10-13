"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../db");
const User = require("./User");

/**
 * Beneficiary model — saved recipients, strictly scoped to the owning user.
 * Prevents cross-user access at DB constraint level via userId FK.
 */
const Beneficiary = sequelize.define("Beneficiary", {
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
  // Account number of the beneficiary
  accountNumber: {
    type: DataTypes.STRING(10),
    allowNull: false,
  },
  // Resolved name at time of adding
  recipientName: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  nickname: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
}, {
  tableName: "beneficiaries",
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ["userId", "accountNumber"],
    },
  ],
});

Beneficiary.belongsTo(User, { foreignKey: "userId" });
User.hasMany(Beneficiary, { foreignKey: "userId" });

module.exports = Beneficiary;
