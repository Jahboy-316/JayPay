"use strict";

const { randomUUID } = require("crypto");
const bcrypt = require("bcrypt");
const User = require("../../models/User");
const Account = require("../../models/Account");
const { successResponse, errorResponse } = require("../../utils/helpers");

/**
 * POST /api/auth/register
 * Register a new user. Account number derived from phone: phoneNumber.slice(1).
 * Creates user + account in one DB transaction.
 */
const register = async (req, res) => {
  const { sequelize } = require("../../db");
  const t = await sequelize.transaction();
  try {
    const { firstName, surname, phoneNumber, age } = req.body;

    // Check for duplicate phone number
    const existing = await User.findOne({ where: { phoneNumber }, transaction: t });
    if (existing) {
      await t.rollback();
      return errorResponse(res, "Phone number is already registered", 409);
    }

    // Derive account number from phone (immutable, phone-derived)
    const accountNumber = phoneNumber.slice(1);

    // Check account number collision (extremely rare with Nigerian phone prefixes)
    const collision = await User.findOne({ where: { accountNumber }, transaction: t });
    if (collision) {
      await t.rollback();
      return errorResponse(res, "Account number conflict. Please contact support.", 409);
    }

    // Create user
    const user = await User.create({
      id: randomUUID(),
      firstName: firstName.trim(),
      surname: surname.trim(),
      phoneNumber,
      accountNumber,
      age: Number(age),
      pin: null,
      status: "active",
    }, { transaction: t });

    // Create linked account (starts at zero balance)
    await Account.create({
      id: randomUUID(),
      userId: user.id,
      balanceKobo: 0,
      currency: "NGN",
    }, { transaction: t });

    await t.commit();

    return successResponse(res, "You have been registered successfully", {
      firstName: user.firstName,
      lastName: user.surname,
      accountNumber: user.accountNumber,
    }, 201);

  } catch (error) {
    await t.rollback();
    console.error("Register error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

module.exports = register;
