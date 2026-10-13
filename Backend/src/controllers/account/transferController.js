"use strict";

const bcrypt = require("bcrypt");
const { randomUUID } = require("crypto");
const { Op } = require("sequelize");
const User = require("../../models/User");
const Account = require("../../models/Account");
const Transaction = require("../../models/Transaction");
const Transfer = require("../../models/Transfer");
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
 * GET /api/account/validate-recipient
 * Validate a recipient account number and return their name for confirmation.
 * Does NOT require PIN at this stage.
 */
const validateRecipient = async (req, res) => {
  try {
    const { accountNumber } = req.query;

    if (!accountNumber || !/^\d{10}$/.test(accountNumber)) {
      return errorResponse(res, "Valid 10-digit account number is required", 400);
    }

    if (accountNumber === req.user.accountNumber) {
      return errorResponse(res, "Cannot transfer to your own account", 400);
    }

    const recipient = await User.findOne({
      where: { accountNumber },
      attributes: ["firstName", "surname", "accountNumber", "status"],
    });

    if (!recipient) {
      return errorResponse(res, "Recipient account not found", 404);
    }

    if (recipient.status !== "active") {
      return errorResponse(res, "Recipient account is not active", 400);
    }

    return successResponse(res, "Recipient found", {
      accountNumber: recipient.accountNumber,
      recipientName: `${recipient.firstName} ${recipient.surname}`,
    });

  } catch (error) {
    console.error("Validate recipient error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

/**
 * POST /api/account/transfer
 * Atomic debit + credit transfer with row locking.
 * Both ledger entries created in one DB transaction — rolls back on any failure.
 * Supports idempotency key to prevent double-spend on retry.
 */
const transfer = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { accountNumber, amount, pin, narration, idempotencyKey } = req.body;
    const amountKobo = nairaToKobo(amount);

    // Self-transfer check
    if (accountNumber === req.user.accountNumber) {
      await t.rollback();
      return errorResponse(res, "You cannot transfer money to yourself", 400);
    }

    // Idempotency check — if key provided, ensure same transfer not retried
    if (idempotencyKey) {
      const existing = await Transfer.findOne({ where: { idempotencyKey }, transaction: t });
      if (existing) {
        await t.rollback();
        return successResponse(res, "Transfer already processed (idempotent)", {
          reference: existing.reference,
          status: existing.status,
          idempotent: true,
        });
      }
    }

    // Get sender user + verify PIN
    const sender = await User.findByPk(req.user.id, { transaction: t });
    if (!sender) {
      await t.rollback();
      return errorResponse(res, "Sender account not found", 404);
    }

    if (sender.status !== "active") {
      await t.rollback();
      return errorResponse(res, "Your account is not active", 403);
    }

    const pinMatch = await bcrypt.compare(pin, sender.pin);
    if (!pinMatch) {
      await t.rollback();
      return errorResponse(res, "Incorrect PIN", 401);
    }

    // Get recipient
    const recipient = await User.findOne({ where: { accountNumber }, transaction: t });
    if (!recipient) {
      await t.rollback();
      return errorResponse(res, "Recipient account not found", 404);
    }

    if (recipient.status !== "active") {
      await t.rollback();
      return errorResponse(res, "Recipient account is not active", 400);
    }

    // Lock both accounts in consistent order (by id) to prevent deadlock
    const [firstId, secondId] = [sender.id, recipient.id].sort();
    const firstAccount = await Account.findOne({
      where: { userId: firstId },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });
    const secondAccount = await Account.findOne({
      where: { userId: secondId },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    const senderAccount = sender.id === firstId ? firstAccount : secondAccount;
    const recipientAccount = recipient.id === firstId ? firstAccount : secondAccount;

    // Check sufficient balance
    if (BigInt(senderAccount.balanceKobo) < BigInt(amountKobo)) {
      await t.rollback();
      return errorResponse(res, "Insufficient balance", 400);
    }

    // Compute new balances
    const senderNewBalance = BigInt(senderAccount.balanceKobo) - BigInt(amountKobo);
    const recipientNewBalance = BigInt(recipientAccount.balanceKobo) + BigInt(amountKobo);

    // Update both balances atomically
    await senderAccount.update({ balanceKobo: senderNewBalance.toString() }, { transaction: t });
    await recipientAccount.update({ balanceKobo: recipientNewBalance.toString() }, { transaction: t });

    const reference = generateReference();

    // Create debit ledger entry for sender
    const senderTx = await Transaction.create({
      id: randomUUID(),
      accountId: senderAccount.id,
      amountKobo,
      type: "debit",
      category: "transfer_out",
      status: "completed",
      balanceAfterKobo: senderNewBalance.toString(),
      reference: `${reference}-OUT`,
      description: narration || `Transfer to ${recipient.firstName} ${recipient.surname}`,
    }, { transaction: t });

    // Create credit ledger entry for recipient
    const recipientTx = await Transaction.create({
      id: randomUUID(),
      accountId: recipientAccount.id,
      amountKobo,
      type: "credit",
      category: "transfer_in",
      status: "completed",
      balanceAfterKobo: recipientNewBalance.toString(),
      reference: `${reference}-IN`,
      relatedTransactionId: senderTx.id,
      description: narration || `Transfer from ${sender.firstName} ${sender.surname}`,
    }, { transaction: t });

    // Link transactions
    await senderTx.update({ relatedTransactionId: recipientTx.id }, { transaction: t });

    // Create Transfer record
    const transferRecord = await Transfer.create({
      id: randomUUID(),
      senderAccountId: senderAccount.id,
      recipientAccountId: recipientAccount.id,
      amountKobo,
      reference,
      idempotencyKey: idempotencyKey || null,
      status: "completed",
      narration: narration || null,
      senderTransactionId: senderTx.id,
      recipientTransactionId: recipientTx.id,
    }, { transaction: t });

    // Notifications for both parties
    await createNotification({
      userId: sender.id,
      type: "transfer_sent",
      title: "Transfer Successful",
      message: `₦${formatAmount(amountKobo).naira} sent to ${recipient.firstName} ${recipient.surname} (${recipient.accountNumber}).`,
      relatedTransactionId: senderTx.id,
      transaction: t,
    });

    await createNotification({
      userId: recipient.id,
      type: "transfer_received",
      title: "Money Received",
      message: `₦${formatAmount(amountKobo).naira} received from ${sender.firstName} ${sender.surname}.`,
      relatedTransactionId: recipientTx.id,
      transaction: t,
    });

    await t.commit();

    return successResponse(res, "Transfer successful", {
      reference,
      amount: formatAmount(amountKobo),
      recipient: {
        name: `${recipient.firstName} ${recipient.surname}`,
        accountNumber: recipient.accountNumber,
      },
      balance: formatAmount(senderNewBalance.toString()),
      transactionId: senderTx.id,
    });

  } catch (error) {
    await t.rollback();
    console.error("Transfer error:", error.message);
    return errorResponse(res, "Transfer failed. Please try again.", 500);
  }
};

module.exports = { validateRecipient, transfer };
