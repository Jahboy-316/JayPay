"use strict";

const bcrypt = require("bcrypt");
const User = require("../../models/User");
const { successResponse, errorResponse } = require("../../utils/helpers");

/**
 * PUT /api/auth/change-pin
 * Authenticated route. Change PIN by verifying current PIN first.
 */
const changePin = async (req, res) => {
  try {
    const { currentPin, newPin, confirmPin } = req.body;

    // Get authenticated user from DB
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return errorResponse(res, "Account not found", 404);
    }

    if (!user.pin) {
      return errorResponse(res, "PIN has not been set", 400);
    }

    // Verify current PIN
    const pinMatch = await bcrypt.compare(currentPin, user.pin);
    if (!pinMatch) {
      return errorResponse(res, "Current PIN is incorrect", 401);
    }

    // Prevent same PIN reuse
    const samePin = await bcrypt.compare(newPin, user.pin);
    if (samePin) {
      return errorResponse(res, "New PIN must be different from current PIN", 400);
    }

    // Confirm new PINs match
    if (newPin !== confirmPin) {
      return errorResponse(res, "New PINs do not match", 400);
    }

    const hashedPin = await bcrypt.hash(newPin, 12);
    await user.update({ pin: hashedPin, pinAttempts: 0, pinLockedUntil: null });

    return successResponse(res, "PIN changed successfully");

  } catch (error) {
    console.error("Change PIN error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

module.exports = changePin;