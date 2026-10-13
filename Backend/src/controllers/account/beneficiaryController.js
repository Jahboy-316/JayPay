"use strict";

const { randomUUID } = require("crypto");
const User = require("../../models/User");
const Beneficiary = require("../../models/Beneficiary");
const { successResponse, errorResponse } = require("../../utils/helpers");

/**
 * GET /api/account/beneficiaries
 * List all beneficiaries for the authenticated user.
 */
const listBeneficiaries = async (req, res) => {
  try {
    const beneficiaries = await Beneficiary.findAll({
      where: { userId: req.user.id },
      order: [["createdAt", "DESC"]],
    });

    return successResponse(res, "Beneficiaries retrieved", {
      beneficiaries: beneficiaries.map((b) => ({
        id: b.id,
        accountNumber: b.accountNumber,
        recipientName: b.recipientName,
        nickname: b.nickname,
        addedAt: b.createdAt,
      })),
    });
  } catch (error) {
    console.error("List beneficiaries error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

/**
 * POST /api/account/beneficiaries
 * Add a new beneficiary. Validates account exists, resolves name.
 * Scope: strictly the authenticated user (userId FK enforced at DB level).
 */
const addBeneficiary = async (req, res) => {
  try {
    const { accountNumber, nickname } = req.body;

    // Cannot add yourself
    if (accountNumber === req.user.accountNumber) {
      return errorResponse(res, "You cannot add yourself as a beneficiary", 400);
    }

    // Verify the account exists and resolve name
    const recipientUser = await User.findOne({
      where: { accountNumber },
      attributes: ["firstName", "surname", "accountNumber", "status"],
    });

    if (!recipientUser) {
      return errorResponse(res, "Account not found", 404);
    }

    if (recipientUser.status !== "active") {
      return errorResponse(res, "Recipient account is not active", 400);
    }

    const recipientName = `${recipientUser.firstName} ${recipientUser.surname}`;

    // Check for duplicate (DB constraint will also catch this, but give nicer error)
    const existing = await Beneficiary.findOne({
      where: { userId: req.user.id, accountNumber },
    });

    if (existing) {
      return errorResponse(res, "This account is already in your beneficiaries", 409);
    }

    const beneficiary = await Beneficiary.create({
      id: randomUUID(),
      userId: req.user.id,
      accountNumber,
      recipientName,
      nickname: nickname ? nickname.trim() : null,
    });

    return successResponse(res, "Beneficiary added", {
      id: beneficiary.id,
      accountNumber: beneficiary.accountNumber,
      recipientName: beneficiary.recipientName,
      nickname: beneficiary.nickname,
    }, 201);

  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return errorResponse(res, "This account is already in your beneficiaries", 409);
    }
    console.error("Add beneficiary error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

/**
 * DELETE /api/account/beneficiaries/:id
 * Remove a beneficiary. Enforces ownership — user can only delete their own.
 */
const removeBeneficiary = async (req, res) => {
  try {
    const beneficiary = await Beneficiary.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!beneficiary) {
      return errorResponse(res, "Beneficiary not found", 404);
    }

    await beneficiary.destroy();

    return successResponse(res, "Beneficiary removed");

  } catch (error) {
    console.error("Remove beneficiary error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

module.exports = { listBeneficiaries, addBeneficiary, removeBeneficiary };
