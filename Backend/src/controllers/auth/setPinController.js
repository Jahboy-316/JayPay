"use strict";

const bcrypt = require("bcrypt");
const User = require("../../models/User");
const { successResponse, errorResponse } = require("../../utils/helpers");

/**
 * POST /api/auth/set-pin
 * Set PIN using account number (no auth required — called once after register).
 * PIN must be exactly 4 digits. Uses bcrypt cost factor 12.
 */
const setPin = async (req, res) => {
  try {
    const { accountNumber, pin, confirmPin } = req.body;

    // Find user by account number
    const user = await User.findOne({ where: { accountNumber } });

    if (!user) {
      return errorResponse(res, "Account not found", 404);
    }

    // Prevent re-setting PIN (user must use change-pin route)
    if (user.pin !== null) {
      return errorResponse(res, "PIN has already been set. Use change-pin to update.", 409);
    }

    // Confirm PINs match (already validated by Joi middleware, but belt-and-suspenders)
    if (pin !== confirmPin) {
      return errorResponse(res, "PINs do not match", 400);
    }

    // Hash PIN with bcrypt (cost 12)
    // NOTE: 4-digit PINs have only 10,000 combinations. Not sufficient for real production
    // banking — a real bank would enforce stronger authentication factors (OTP, biometrics).
    const hashedPin = await bcrypt.hash(pin, 12);

    await user.update({ pin: hashedPin, pinAttempts: 0, pinLockedUntil: null });

    return successResponse(res, "PIN set successfully. You can now log in.");

  } catch (error) {
    console.error("Set PIN error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

module.exports = setPin;
