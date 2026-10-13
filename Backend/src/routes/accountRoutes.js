"use strict";

const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/authMiddleware");
const { validate, withdrawalSchema, transferSchema, validateRecipientSchema, addBeneficiarySchema } = require("../utils/validation");

const { getAccount, getBalance, updateProfile, deactivateAccount } = require("../controllers/account/accountController");
const { withdraw } = require("../controllers/account/depositController");
const { validateRecipient, transfer } = require("../controllers/account/transferController");
const { getTransactions, getTransactionById, getStatement } = require("../controllers/account/transactionController");
const { listBeneficiaries, addBeneficiary, removeBeneficiary } = require("../controllers/account/beneficiaryController");
const { getNotifications, getUnreadCount, markAsRead, markAllAsRead } = require("../controllers/account/notificationController");

// ─── Profile & Account ────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/account/profile:
 *   get:
 *     summary: Get authenticated user profile and account details
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile data
 */
router.get("/profile", authenticate, getAccount);

/**
 * @swagger
 * /api/account/profile:
 *   put:
 *     summary: Update first name or surname
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 */
router.put("/profile", authenticate, updateProfile);

/**
 * @swagger
 * /api/account/balance:
 *   get:
 *     summary: Get account balance
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 */
router.get("/balance", authenticate, getBalance);

/**
 * @swagger
 * /api/account/deactivate:
 *   delete:
 *     summary: Self-deactivate account (requires PIN)
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 */
router.delete("/deactivate", authenticate, deactivateAccount);

// ─── Withdrawals ──────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/account/withdraw:
 *   post:
 *     summary: "[SIMULATED] Withdraw from own account (requires PIN)"
 *     tags: [Withdrawals]
 *     security:
 *       - bearerAuth: []
 */
router.post("/withdraw", authenticate, validate(withdrawalSchema), withdraw);

// ─── Transfers ────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/account/validate-recipient:
 *   get:
 *     summary: Validate recipient account and get name for confirmation
 *     tags: [Transfers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: accountNumber
 *         required: true
 *         schema:
 *           type: string
 */
router.get("/validate-recipient", authenticate, validateRecipient);

/**
 * @swagger
 * /api/account/transfer:
 *   post:
 *     summary: Transfer money to another account (atomic, PIN required)
 *     tags: [Transfers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [accountNumber, amount, pin]
 *             properties:
 *               accountNumber:
 *                 type: string
 *                 example: "9098765432"
 *               amount:
 *                 type: number
 *                 example: 3200
 *               pin:
 *                 type: string
 *                 example: "4827"
 *               narration:
 *                 type: string
 *               idempotencyKey:
 *                 type: string
 */
router.post("/transfer", authenticate, validate(transferSchema), transfer);

// ─── Transactions & Receipts ──────────────────────────────────────────────────
/**
 * @swagger
 * /api/account/transactions:
 *   get:
 *     summary: Get paginated transaction history
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [credit, debit, admin_credit, admin_debit]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: reference
 *         schema:
 *           type: string
 */
router.get("/transactions", authenticate, getTransactions);

/**
 * @swagger
 * /api/account/transactions/{id}:
 *   get:
 *     summary: Get a single transaction receipt
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 */
router.get("/transactions/:id", authenticate, getTransactionById);

/**
 * @swagger
 * /api/account/statement:
 *   get:
 *     summary: Download CSV statement (max 90 days)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 */
router.get("/statement", authenticate, getStatement);

// ─── Beneficiaries ────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/account/beneficiaries:
 *   get:
 *     summary: List saved beneficiaries
 *     tags: [Beneficiaries]
 *     security:
 *       - bearerAuth: []
 */
router.get("/beneficiaries", authenticate, listBeneficiaries);

/**
 * @swagger
 * /api/account/beneficiaries:
 *   post:
 *     summary: Add a beneficiary
 *     tags: [Beneficiaries]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [accountNumber]
 *             properties:
 *               accountNumber:
 *                 type: string
 *               nickname:
 *                 type: string
 */
router.post("/beneficiaries", authenticate, validate(addBeneficiarySchema), addBeneficiary);

/**
 * @swagger
 * /api/account/beneficiaries/{id}:
 *   delete:
 *     summary: Remove a beneficiary
 *     tags: [Beneficiaries]
 *     security:
 *       - bearerAuth: []
 */
router.delete("/beneficiaries/:id", authenticate, removeBeneficiary);

// ─── Notifications ────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/account/notifications:
 *   get:
 *     summary: Get notifications (paginated)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 */
router.get("/notifications", authenticate, getNotifications);

/**
 * @swagger
 * /api/account/notifications/unread-count:
 *   get:
 *     summary: Get unread notification count
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 */
router.get("/notifications/unread-count", authenticate, getUnreadCount);

/**
 * @swagger
 * /api/account/notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 */
router.put("/notifications/read-all", authenticate, markAllAsRead);

/**
 * @swagger
 * /api/account/notifications/{id}/read:
 *   put:
 *     summary: Mark a single notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 */
router.put("/notifications/:id/read", authenticate, markAsRead);

module.exports = router;