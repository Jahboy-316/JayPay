"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("transfers", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
        primaryKey: true,
        allowNull: false,
      },
      senderAccountId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "accounts", key: "id" },
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },
      recipientAccountId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "accounts", key: "id" },
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },
      amountKobo: {
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
        unique: true,
      },
      status: {
        type: Sequelize.ENUM("pending", "completed", "failed"),
        defaultValue: "completed",
        allowNull: false,
      },
      narration: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      senderTransactionId: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      recipientTransactionId: {
        type: Sequelize.UUID,
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
  },

  async down(queryInterface) {
    await queryInterface.dropTable("transfers");
  },
};
