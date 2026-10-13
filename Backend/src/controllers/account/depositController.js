"use strict";

const { randomUUID } = require("crypto");
const Account = require("../../models/Account");
const Transaction = require("../../models/Transaction");
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
 * POST /api/account/withdraw
 * [SIMULATED] Withdraw from own account. Requires PIN verification.
 */
const withdraw = async (req, res) => {
  const bcrypt = require("bcrypt");
  const User = require("../../models/User");
  const t = await sequelize.transaction();

  try {
    const { amount, pin, reference: clientRef } = req.body;
    const amountKobo = nairaToKobo(amount);

    const user = await User.findByPk(req.user.id, { transaction: t });
    if (!user) {
      await t.rollback();
      return errorResponse(res, "Account not found", 404);
    }

    // Verify PIN
    const pinMatch = await bcrypt.compare(pin, user.pin);
    if (!pinMatch) {
      await t.rollback();
      return errorResponse(res, "Incorrect PIN", 401);
    }

    const account = await Account.findOne({
      where: { userId: req.user.id },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!account) {
      await t.rollback();
      return errorResponse(res, "Account not found", 404);
    }

    // Check sufficient balance
    if (BigInt(account.balanceKobo) < BigInt(amountKobo)) {
      await t.rollback();
      return errorResponse(res, "Insufficient balance", 400);
    }

    // Idempotency check
    if (clientRef) {
      const existing = await Transaction.findOne({ where: { reference: clientRef }, transaction: t });
      if (existing) {
        await t.rollback();
        return errorResponse(res, "Duplicate reference — this withdrawal was already processed", 409);
      }
    }

    const reference = clientRef || generateReference();
    const newBalance = BigInt(account.balanceKobo) - BigInt(amountKobo);

    await account.update({ balanceKobo: newBalance.toString() }, { transaction: t });

    const ledgerEntry = await Transaction.create({
      id: randomUUID(),
      accountId: account.id,
      amountKobo,
      type: "debit",
      category: "withdrawal",
      status: "completed",
      balanceAfterKobo: newBalance.toString(),
      reference,
      description: "[SIMULATED] Customer withdrawal",
      isSimulated: true,
    }, { transaction: t });

    await createNotification({
      userId: req.user.id,
      type: "withdrawal",
      title: "Withdrawal Successful",
      message: `₦${formatAmount(amountKobo).naira} has been debited from your account.`,
      relatedTransactionId: ledgerEntry.id,
      transaction: t,
    });

    await t.commit();

    return successResponse(res, "[SIMULATED] Withdrawal successful", {
      reference: ledgerEntry.reference,
      amount: formatAmount(amountKobo),
      balance: formatAmount(newBalance.toString()),
      transactionId: ledgerEntry.id,
      isSimulated: true,
    });

  } catch (error) {
    await t.rollback();
    console.error("Withdrawal error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

module.exports = { withdraw };
