"use strict";

const { Op } = require("sequelize");
const Transaction = require("../../models/Transaction");
const Account = require("../../models/Account");
const { successResponse, errorResponse, getPaginationParams, paginationMeta, formatAmount } = require("../../utils/helpers");

/**
 * GET /api/account/transactions
 * Paginated transaction history with filters.
 * Filters: type, category, status, startDate, endDate, reference
 */
const getTransactions = async (req, res) => {
  try {
    const account = await Account.findOne({ where: { userId: req.user.id } });
    if (!account) return errorResponse(res, "Account not found", 404);

    const { page, limit, offset } = getPaginationParams(req.query);
    const { type, category, status, startDate, endDate, reference } = req.query;

    const where = { accountId: account.id };

    if (type) where.type = type;
    if (category) where.category = category;
    if (status) where.status = status;
    if (reference) where.reference = { [Op.iLike]: `%${reference}%` };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    const { count, rows } = await Transaction.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    const transactions = rows.map((tx) => ({
      id: tx.id,
      reference: tx.reference,
      type: tx.type,
      category: tx.category,
      status: tx.status,
      amount: formatAmount(tx.amountKobo),
      balanceAfter: formatAmount(tx.balanceAfterKobo),
      description: tx.description,
      isSimulated: tx.isSimulated,
      date: tx.createdAt,
    }));

    return successResponse(res, "Transactions retrieved", {
      transactions,
      pagination: paginationMeta(count, page, limit),
    });

  } catch (error) {
    console.error("Get transactions error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

/**
 * GET /api/account/transactions/:id
 * Get a single transaction receipt.
 */
const getTransactionById = async (req, res) => {
  try {
    const account = await Account.findOne({ where: { userId: req.user.id } });
    if (!account) return errorResponse(res, "Account not found", 404);

    const tx = await Transaction.findOne({
      where: { id: req.params.id, accountId: account.id },
    });

    if (!tx) return errorResponse(res, "Transaction not found", 404);

    return successResponse(res, "Transaction retrieved", {
      id: tx.id,
      reference: tx.reference,
      type: tx.type,
      category: tx.category,
      status: tx.status,
      amount: formatAmount(tx.amountKobo),
      balanceAfter: formatAmount(tx.balanceAfterKobo),
      description: tx.description,
      reason: tx.reason,
      isSimulated: tx.isSimulated,
      relatedTransactionId: tx.relatedTransactionId,
      date: tx.createdAt,
    });

  } catch (error) {
    console.error("Get transaction by ID error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

/**
 * GET /api/account/statement
 * CSV statement download. Max 90 days range.
 */
const getStatement = async (req, res) => {
  const MAX_DAYS = 90;

  try {
    const account = await Account.findOne({ where: { userId: req.user.id } });
    if (!account) return errorResponse(res, "Account not found", 404);

    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return errorResponse(res, "startDate and endDate are required for statement download", 400);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = (end - start) / (1000 * 60 * 60 * 24);

    if (diffDays > MAX_DAYS) {
      return errorResponse(res, `Statement range cannot exceed ${MAX_DAYS} days`, 400);
    }

    if (start > end) {
      return errorResponse(res, "startDate must be before endDate", 400);
    }

    const transactions = await Transaction.findAll({
      where: {
        accountId: account.id,
        createdAt: { [Op.between]: [start, end] },
      },
      order: [["createdAt", "ASC"]],
    });

    // Build CSV
    const header = "Date,Reference,Type,Category,Description,Amount (NGN),Balance After (NGN),Status\n";
    const rows = transactions.map((tx) => {
      const sign = tx.type === "debit" || tx.type === "admin_debit" ? "-" : "+";
      return [
        new Date(tx.createdAt).toISOString(),
        tx.reference,
        tx.type,
        tx.category,
        `"${(tx.description || "").replace(/"/g, '""')}"`,
        `${sign}${formatAmount(tx.amountKobo).naira}`,
        formatAmount(tx.balanceAfterKobo).naira,
        tx.status,
      ].join(",");
    }).join("\n");

    const csv = header + rows;
    const filename = `statement_${req.user.accountNumber}_${startDate}_${endDate}.csv`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.status(200).send(csv);

  } catch (error) {
    console.error("Statement error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

module.exports = { getTransactions, getTransactionById, getStatement };
