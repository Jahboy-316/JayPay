"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("transactions", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
        primaryKey: true,
        allowNull: false,
      },
      accountId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "accounts",
          key: "id",
        },
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },
      amountKobo: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM("credit", "debit", "admin_credit", "admin_debit"),
        allowNull: false,
      },
      category: {
        type: Sequelize.ENUM("deposit", "withdrawal", "transfer_in", "transfer_out", "admin_adjustment"),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("pending", "completed", "failed", "reversed"),
        defaultValue: "completed",
        allowNull: false,
      },
      balanceAfterKobo: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      reference: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      idempotencyKey: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      relatedTransactionId: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      reason: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      isSimulated: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
      },
    });

    // Index for fast account history queries
    await queryInterface.addIndex("transactions", ["accountId"]);
    await queryInterface.addIndex("transactions", ["reference"]);
    await queryInterface.addIndex("transactions", ["createdAt"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("transactions");
  },
};
