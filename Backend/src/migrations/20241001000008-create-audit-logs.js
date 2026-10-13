"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("audit_logs", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
        primaryKey: true,
        allowNull: false,
      },
      adminId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "admin_users", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      action: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      targetType: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      targetId: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      reason: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      details: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      ipAddress: {
        type: Sequelize.STRING(45),
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
      },
      // No updatedAt — audit logs are immutable
    });

    await queryInterface.addIndex("audit_logs", ["adminId"]);
    await queryInterface.addIndex("audit_logs", ["targetId"]);
    await queryInterface.addIndex("audit_logs", ["createdAt"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("audit_logs");
  },
};
