"use strict";

const User = require("../../models/User");
const Account = require("../../models/Account");
const { successResponse, errorResponse, formatAmount } = require("../../utils/helpers");

/**
 * GET /api/account/profile
 * Get authenticated user's profile and account details.
 */
const getAccount = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Account, attributes: ["balanceKobo", "currency"] }],
    });

    if (!user) {
      return errorResponse(res, "Account not found", 404);
    }

    const balance = user.Account ? formatAmount(user.Account.balanceKobo) : formatAmount(0);

    return successResponse(res, "Profile retrieved", {
      id: user.id,
      firstName: user.firstName,
      surname: user.surname,
      phoneNumber: user.phoneNumber,
      accountNumber: user.accountNumber,
      age: user.age,
      status: user.status,
      balance,
      memberSince: user.createdAt,
    });

  } catch (error) {
    console.error("Get account error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

/**
 * GET /api/account/balance
 * Get balance only (lighter endpoint).
 */
const getBalance = async (req, res) => {
  try {
    const account = await Account.findOne({ where: { userId: req.user.id } });

    if (!account) {
      return errorResponse(res, "Account not found", 404);
    }

    return successResponse(res, "Balance retrieved", {
      balance: formatAmount(account.balanceKobo),
      accountNumber: req.user.accountNumber,
    });

  } catch (error) {
    console.error("Get balance error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

/**
 * PUT /api/account/profile
 * Update first name and/or surname.
 */
const updateProfile = async (req, res) => {
  try {
    const { firstName, surname } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return errorResponse(res, "Account not found", 404);
    }

    const updates = {};
    if (firstName) updates.firstName = firstName.trim();
    if (surname) updates.surname = surname.trim();

    if (Object.keys(updates).length === 0) {
      return errorResponse(res, "No valid fields to update", 400);
    }

    await user.update(updates);

    return successResponse(res, "Profile updated", {
      firstName: user.firstName,
      surname: user.surname,
    });

  } catch (error) {
    console.error("Update profile error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

/**
 * DELETE /api/account/deactivate
 * Self-deactivation. User must confirm with PIN.
 */
const deactivateAccount = async (req, res) => {
  const bcrypt = require("bcrypt");
  try {
    const { pin } = req.body;
    if (!pin) return errorResponse(res, "PIN is required to deactivate", 400);

    const user = await User.findByPk(req.user.id);
    if (!user) return errorResponse(res, "Account not found", 404);

    const pinMatch = await bcrypt.compare(pin, user.pin);
    if (!pinMatch) return errorResponse(res, "Incorrect PIN", 401);

    await user.update({ status: "deactivated", isActive: false });

    return successResponse(res, "Account deactivated. Contact support to reactivate.");

  } catch (error) {
    console.error("Deactivate error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

module.exports = { getAccount, getBalance, updateProfile, deactivateAccount };