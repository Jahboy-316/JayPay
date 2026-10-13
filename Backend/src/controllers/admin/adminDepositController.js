"use strict";

const { randomUUID } = require("crypto");
const User = require("../../models/User");
const Account = require("../../models/Account");
const Transaction = require("../../models/Transaction");
const AuditLog = require("../../models/AuditLog");
const { createNotification } = require("../../services/notificationService");
const {
  generateReference,
  nairaToKobo,
  formatAmount,
  successResponse,
  errorResponse,
} = require("../../utils/helpers");
const { sequelize } = require("../../db");

/**
 * POST /api/admin/deposit
 * [SIMULATED] Admin manual credit to a user account.
 * Goes through the ledger with type "admin_credit". Requires reason.
 * Audit-logged.
 */
const adminDeposit = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { accountNumber, amount, reason, reference: clientRef } = req.body;
    const amountKobo = nairaToKobo(amount);

    const user = await User.findOne({ where: { accountNumber }, transaction: t });
    if (!user) {
      await t.rollback();
      return errorResponse(res, "Account not found", 404);
    }

    const account = await Account.findOne({
      where: { userId: user.id },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!account) {
      await t.rollback();
      return errorResponse(res, "Account not found", 404);
    }

    const reference = clientRef || generateReference();
    const newBalance = BigInt(account.balanceKobo) + BigInt(amountKobo);

    await account.update({ balanceKobo: newBalance.toString() }, { transaction: t });

    const ledgerEntry = await Transaction.create({
      id: randomUUID(),
      accountId: account.id,
      amountKobo,
      type: "admin_credit",
      category: "admin_adjustment",
      status: "completed",
      balanceAfterKobo: newBalance.toString(),
      reference,
      description: `Admin credit: ${reason}`,
      reason,
      isSimulated: true,
    }, { transaction: t });

    await AuditLog.create({
      id: randomUUID(),
      adminId: req.admin.id,
      action: "admin_deposit",
      targetType: "account",
      targetId: account.id,
      reason,
      details: {
        accountNumber,
        amountKobo,
        reference,
        adminUsername: req.admin.username,
      },
      ipAddress: req.ip,
    }, { transaction: t });

    await createNotification({
      userId: user.id,
      type: "admin_adjustment",
      title: "Account Credited",
      message: `₦${formatAmount(amountKobo).naira} has been credited to your account by admin.`,
      relatedTransactionId: ledgerEntry.id,
      transaction: t,
    });

    await t.commit();

    return successResponse(res, "[SIMULATED] Admin deposit successful", {
      accountNumber,
      amount: formatAmount(amountKobo),
      balance: formatAmount(newBalance.toString()),
      reference,
      isSimulated: true,
    });

  } catch (error) {
    await t.rollback();
    console.error("Admin deposit error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

/**
 * POST /api/admin/withdraw
 * [SIMULATED] Admin manual debit from a user account.
 * Goes through the ledger with type "admin_debit". Requires reason.
 * Audit-logged.
 */
const adminWithdrawal = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { accountNumber, amount, reason, reference: clientRef } = req.body;
    const amountKobo = nairaToKobo(amount);

    const user = await User.findOne({ where: { accountNumber }, transaction: t });
    if (!user) {
      await t.rollback();
      return errorResponse(res, "Account not found", 404);
    }

    const account = await Account.findOne({
      where: { userId: user.id },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!account) {
      await t.rollback();
      return errorResponse(res, "Account not found", 404);
    }

    if (BigInt(account.balanceKobo) < BigInt(amountKobo)) {
      await t.rollback();
      return errorResponse(res, "Insufficient balance for this adjustment", 400);
    }

    const reference = clientRef || generateReference();
    const newBalance = BigInt(account.balanceKobo) - BigInt(amountKobo);

    await account.update({ balanceKobo: newBalance.toString() }, { transaction: t });

    const ledgerEntry = await Transaction.create({
      id: randomUUID(),
      accountId: account.id,
      amountKobo,
      type: "admin_debit",
      category: "admin_adjustment",
      status: "completed",
      balanceAfterKobo: newBalance.toString(),
      reference,
      description: `Admin debit: ${reason}`,
      reason,
      isSimulated: true,
    }, { transaction: t });

    await AuditLog.create({
      id: randomUUID(),
      adminId: req.admin.id,
      action: "admin_withdrawal",
      targetType: "account",
      targetId: account.id,
      reason,
      details: {
        accountNumber,
        amountKobo,
        reference,
        adminUsername: req.admin.username,
      },
      ipAddress: req.ip,
    }, { transaction: t });

    await createNotification({
      userId: user.id,
      type: "admin_adjustment",
      title: "Account Debited",
      message: `₦${formatAmount(amountKobo).naira} has been debited from your account by admin.`,
      relatedTransactionId: ledgerEntry.id,
      transaction: t,
    });

    await t.commit();

    return successResponse(res, "[SIMULATED] Admin withdrawal successful", {
      accountNumber,
      amount: formatAmount(amountKobo),
      balance: formatAmount(newBalance.toString()),
      reference,
      isSimulated: true,
    });

  } catch (error) {
    await t.rollback();
    console.error("Admin withdrawal error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

module.exports = { adminDeposit, adminWithdrawal };
