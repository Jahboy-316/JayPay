"use strict";

const express = require("express");
const router = express.Router();

const register = require("../controllers/auth/registerController");
const setPin = require("../controllers/auth/setPinController");
const changePin = require("../controllers/auth/changePinController");
const login = require("../controllers/auth/loginController");
const refreshToken = require("../controllers/auth/refreshTokenController");
const authenticate = require("../middleware/authMiddleware");
const { validate, registerSchema, setPinSchema, loginSchema, changePinSchema } = require("../utils/validation");

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and session management
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, surname, phoneNumber, age]
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: David
 *               surname:
 *                 type: string
 *                 example: Okafor
 *               phoneNumber:
 *                 type: string
 *                 example: "08123456789"
 *               age:
 *                 type: integer
 *                 minimum: 18
 *                 example: 24
 *     responses:
 *       201:
 *         description: Registration successful
 *       400:
 *         description: Validation error
 *       409:
 *         description: Phone number already registered
 */
router.post("/register", validate(registerSchema), register);

/**
 * @swagger
 * /api/auth/set-pin:
 *   post:
 *     summary: Set PIN using account number (one-time, after registration)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [accountNumber, pin, confirmPin]
 *             properties:
 *               accountNumber:
 *                 type: string
 *                 example: "8123456789"
 *               pin:
 *                 type: string
 *                 example: "4827"
 *               confirmPin:
 *                 type: string
 *                 example: "4827"
 *     responses:
 *       200:
 *         description: PIN set successfully
 *       409:
 *         description: PIN already set
 */
router.post("/set-pin", validate(setPinSchema), setPin);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with phone number and PIN
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phoneNumber, pin]
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: "08123456789"
 *               pin:
 *                 type: string
 *                 example: "4827"
 *     responses:
 *       200:
 *         description: Login successful, returns JWT access and refresh tokens
 *       401:
 *         description: Invalid credentials
 *       429:
 *         description: Account locked due to too many failed attempts
 */
router.post("/login", validate(loginSchema), login);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token using refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New access token
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post("/refresh", refreshToken);

/**
 * @swagger
 * /api/auth/change-pin:
 *   put:
 *     summary: Change PIN (authenticated)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPin, newPin, confirmPin]
 *             properties:
 *               currentPin:
 *                 type: string
 *               newPin:
 *                 type: string
 *               confirmPin:
 *                 type: string
 *     responses:
 *       200:
 *         description: PIN changed
 *       401:
 *         description: Current PIN incorrect
 */
router.put("/change-pin", authenticate, validate(changePinSchema), changePin);

module.exports = router;