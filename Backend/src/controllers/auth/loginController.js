"use strict";

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const User = require("../../models/User");
const { successResponse, errorResponse } = require("../../utils/helpers");

// PIN attempt constants
const MAX_PIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

/**
 * POST /api/auth/login
 * Login with phone number + PIN.
 * Enforces PIN attempt limits with lockout.
 */
const login = async (req, res) => {
  try {
    const { phoneNumber, pin } = req.body;

    // Find user by phone number
    const user = await User.findOne({ where: { phoneNumber } });

    // Generic message — do not reveal which field is wrong
    if (!user) {
      return errorResponse(res, "Invalid phone number or PIN", 401);
    }

    // Check account status
    if (user.status === "deactivated" || !user.isActive) {
      return errorResponse(res, "Account has been deactivated. Contact support.", 403);
    }

    if (user.status === "restricted") {
      return errorResponse(res, "Account has been restricted. Contact support.", 403);
    }

    // Check if PIN has been set
    if (!user.pin) {
      return errorResponse(res, "PIN has not been set. Please set your PIN first.", 401);
    }

    // Check PIN lockout
    if (user.pinLockedUntil && new Date() < new Date(user.pinLockedUntil)) {
      const minutes = Math.ceil((new Date(user.pinLockedUntil) - new Date()) / 60000);
      return errorResponse(res, `Account locked. Try again in ${minutes} minute(s).`, 429);
    }

    // Verify PIN
    const pinMatch = await bcrypt.compare(pin, user.pin);

    if (!pinMatch) {
      // Increment attempt counter
      const attempts = (user.pinAttempts || 0) + 1;
      const updates = { pinAttempts: attempts };

      if (attempts >= MAX_PIN_ATTEMPTS) {
        updates.pinLockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
        updates.pinAttempts = 0;
        await user.update(updates);
        return errorResponse(res, `Too many failed attempts. Account locked for ${LOCKOUT_MINUTES} minutes.`, 429);
      }

      await user.update(updates);
      return errorResponse(res, "Invalid phone number or PIN", 401);
    }

    // Reset attempt counter on success
    if (user.pinAttempts > 0 || user.pinLockedUntil) {
      await user.update({ pinAttempts: 0, pinLockedUntil: null });
    }

    // Sign JWT — short-lived access token (15 min)
    const token = jwt.sign(
      {
        id: user.id,
        phoneNumber: user.phoneNumber,
        accountNumber: user.accountNumber,
        role: "user",
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    // Refresh token — longer lived (7 days)
    const refreshToken = jwt.sign(
      { id: user.id, type: "refresh" },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return successResponse(res, "Login successful", {
      token,
      refreshToken,
      expiresIn: 900, // seconds
      user: {
        firstName: user.firstName,
        surname: user.surname,
        accountNumber: user.accountNumber,
      },
    });

  } catch (error) {
    console.error("Login error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

module.exports = login;