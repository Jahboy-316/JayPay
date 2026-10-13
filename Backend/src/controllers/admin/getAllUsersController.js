"use strict";

const { Op } = require("sequelize");
const User = require("../../models/User");
const Account = require("../../models/Account");
const Transaction = require("../../models/Transaction");
const AuditLog = require("../../models/AuditLog");
const { createNotification } = require("../../services/notificationService");
const { randomUUID } = require("crypto");
const {
  successResponse,
  errorResponse,
  getPaginationParams,
  paginationMeta,
  formatAmount,
} = require("../../utils/helpers");

/**
 * GET /api/admin/users
 * List all users with pagination.
 */
const getAllUsers = async (req, res) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const { search, status } = req.query;

    const where = {};
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { surname: { [Op.iLike]: `%${search}%` } },
        { phoneNumber: { [Op.iLike]: `%${search}%` } },
        { accountNumber: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      include: [{ model: Account, attributes: ["balanceKobo", "currency"] }],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    return successResponse(res, "Users retrieved", {
      users: rows.map((u) => ({
        id: u.id,
        firstName: u.firstName,
        surname: u.surname,
        phoneNumber: u.phoneNumber,
        accountNumber: u.accountNumber,
        status: u.status,
        age: u.age,
        balance: u.Account ? formatAmount(u.Account.balanceKobo) : formatAmount(0),
        memberSince: u.createdAt,
      })),
      pagination: paginationMeta(count, page, limit),
    });
  } catch (error) {
    console.error("Admin get users error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

/**
 * GET /api/admin/users/:accountNumber
 * Look up a specific user by account number.
 */
const getUserByAccount = async (req, res) => {
  try {
    const user = await User.findOne({
      where: { accountNumber: req.params.accountNumber },
      include: [{ model: Account }],
    });

    if (!user) return errorResponse(res, "User not found", 404);

    return successResponse(res, "User retrieved", {
      id: user.id,
      firstName: user.firstName,
      surname: user.surname,
      phoneNumber: user.phoneNumber,
      accountNumber: user.accountNumber,
      status: user.status,
      age: user.age,
      balance: user.Account ? formatAmount(user.Account.balanceKobo) : formatAmount(0),
      memberSince: user.createdAt,
    });
  } catch (error) {
    console.error("Admin get user error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

/**
 * PUT /api/admin/users/:accountNumber/restrict
 * Restrict a user account. Audit-logged.
 */
const restrictAccount = async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findOne({ where: { accountNumber: req.params.accountNumber } });

    if (!user) return errorResponse(res, "User not found", 404);
    if (user.status === "deactivated") return errorResponse(res, "Account is already deactivated", 400);

    const previousStatus = user.status;
    await user.update({ status: "restricted" });

    await AuditLog.create({
      id: randomUUID(),
      adminId: req.admin.id,
      action: "restrict_account",
      targetType: "user",
      targetId: user.id,
      reason,
      details: { previousStatus, newStatus: "restricted", accountNumber: user.accountNumber },
      ipAddress: req.ip,
    });

    await createNotification({
      userId: user.id,
      type: "account_status",
      title: "Account Restricted",
      message: "Your account has been restricted. Please contact support for assistance.",
    });

    return successResponse(res, "Account restricted");
  } catch (error) {
    console.error("Restrict account error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

/**
 * PUT /api/admin/users/:accountNumber/reactivate
 * Reactivate a restricted or deactivated account. Audit-logged.
 */
const reactivateAccount = async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findOne({ where: { accountNumber: req.params.accountNumber } });

    if (!user) return errorResponse(res, "User not found", 404);
    if (user.status === "active") return errorResponse(res, "Account is already active", 400);

    const previousStatus = user.status;
    await user.update({ status: "active", isActive: true, pinAttempts: 0, pinLockedUntil: null });

    await AuditLog.create({
      id: randomUUID(),
      adminId: req.admin.id,
      action: "reactivate_account",
      targetType: "user",
      targetId: user.id,
      reason,
      details: { previousStatus, newStatus: "active", accountNumber: user.accountNumber },
      ipAddress: req.ip,
    });

    await createNotification({
      userId: user.id,
      type: "account_status",
      title: "Account Reactivated",
      message: "Your account has been reactivated. Welcome back!",
    });

    return successResponse(res, "Account reactivated");
  } catch (error) {
    console.error("Reactivate account error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

/**
 * GET /api/admin/transactions
 * Paginated transaction oversight for all users.
 */
const getAllTransactions = async (req, res) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const { type, category, status, startDate, endDate } = req.query;

    const where = {};
    if (type) where.type = type;
    if (category) where.category = category;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    const { count, rows } = await Transaction.findAndCountAll({
      where,
      include: [{
        model: Account,
        include: [{ model: User, attributes: ["firstName", "surname", "accountNumber"] }],
      }],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    return successResponse(res, "Transactions retrieved", {
      transactions: rows.map((tx) => ({
        id: tx.id,
        reference: tx.reference,
        type: tx.type,
        category: tx.category,
        status: tx.status,
        amount: formatAmount(tx.amountKobo),
        description: tx.description,
        isSimulated: tx.isSimulated,
        user: tx.Account?.User ? {
          name: `${tx.Account.User.firstName} ${tx.Account.User.surname}`,
          accountNumber: tx.Account.User.accountNumber,
        } : null,
        date: tx.createdAt,
      })),
      pagination: paginationMeta(count, page, limit),
    });
  } catch (error) {
    console.error("Admin get transactions error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

/**
 * GET /api/admin/audit-logs
 * Admin audit log history.
 */
const getAuditLogs = async (req, res) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);

    const { count, rows } = await AuditLog.findAndCountAll({
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    return successResponse(res, "Audit logs retrieved", {
      logs: rows,
      pagination: paginationMeta(count, page, limit),
    });
  } catch (error) {
    console.error("Audit logs error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

module.exports = {
  getAllUsers,
  getUserByAccount,
  restrictAccount,
  reactivateAccount,
  getAllTransactions,
  getAuditLogs,
};
