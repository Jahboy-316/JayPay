"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("beneficiaries", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      accountNumber: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      recipientName: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      nickname: {
        type: Sequelize.STRING(100),
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

    // User cannot add same account number twice
    await queryInterface.addIndex("beneficiaries", ["userId", "accountNumber"], {
      unique: true,
      name: "beneficiaries_user_account_unique",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("beneficiaries");
  },
};
