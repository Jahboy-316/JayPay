"use strict";

const express = require("express");
const router = express.Router();

const adminLogin = require("../controllers/admin/adminLoginController");
const adminAuthenticate = require("../middleware/adminAuthMiddleware");
const {
  getAllUsers,
  getUserByAccount,
  restrictAccount,
  reactivateAccount,
  getAllTransactions,
  getAuditLogs,
} = require("../controllers/admin/getAllUsersController");
const { adminDeposit, adminWithdrawal } = require("../controllers/admin/adminDepositController");
const { validate, adminLoginSchema, adminAdjustSchema, restrictAccountSchema } = require("../utils/validation");

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin-only operations (requires admin JWT)
 */

/**
 * @swagger
 * /api/admin/login:
 *   post:
 *     summary: Admin login with username and PIN
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, pin]
 *             properties:
 *               username:
 *                 type: string
 *                 example: jason_admin
 *               pin:
 *                 type: string
 *                 example: "2468"
 *     responses:
 *       200:
 *         description: Admin JWT token
 */
router.post("/login", validate(adminLoginSchema), adminLogin);

// All routes below require admin authentication
/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: List all users (paginated, searchable)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, restricted, deactivated]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 */
router.get("/users", adminAuthenticate, getAllUsers);

/**
 * @swagger
 * /api/admin/users/{accountNumber}:
 *   get:
 *     summary: Get user by account number
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get("/users/:accountNumber", adminAuthenticate, getUserByAccount);

/**
 * @swagger
 * /api/admin/users/{accountNumber}/restrict:
 *   put:
 *     summary: Restrict a user account (requires reason)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.put("/users/:accountNumber/restrict", adminAuthenticate, validate(restrictAccountSchema), restrictAccount);

/**
 * @swagger
 * /api/admin/users/{accountNumber}/reactivate:
 *   put:
 *     summary: Reactivate a restricted/deactivated account
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.put("/users/:accountNumber/reactivate", adminAuthenticate, validate(restrictAccountSchema), reactivateAccount);

/**
 * @swagger
 * /api/admin/deposit:
 *   post:
 *     summary: "[SIMULATED] Admin credit to user account (requires reason, ledger-based)"
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [accountNumber, amount, reason]
 *             properties:
 *               accountNumber:
 *                 type: string
 *               amount:
 *                 type: number
 *               reason:
 *                 type: string
 *                 minLength: 5
 */
router.post("/deposit", adminAuthenticate, validate(adminAdjustSchema), adminDeposit);

/**
 * @swagger
 * /api/admin/withdraw:
 *   post:
 *     summary: "[SIMULATED] Admin debit from user account (requires reason, ledger-based)"
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.post("/withdraw", adminAuthenticate, validate(adminAdjustSchema), adminWithdrawal);

/**
 * @swagger
 * /api/admin/transactions:
 *   get:
 *     summary: Admin transaction oversight (all users, paginated)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get("/transactions", adminAuthenticate, getAllTransactions);

/**
 * @swagger
 * /api/admin/audit-logs:
 *   get:
 *     summary: View admin audit log history
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get("/audit-logs", adminAuthenticate, getAuditLogs);

module.exports = router;