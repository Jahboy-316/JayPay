"use strict";

const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const { successResponse, errorResponse } = require("../../utils/helpers");

/**
 * POST /api/auth/refresh
 * Exchange a valid refresh token for a new access token.
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return errorResponse(res, "Refresh token is required", 400);
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    } catch {
      return errorResponse(res, "Invalid or expired refresh token", 401);
    }

    if (decoded.type !== "refresh") {
      return errorResponse(res, "Invalid token type", 401);
    }

    const user = await User.findByPk(decoded.id);
    if (!user || !user.isActive || user.status === "deactivated") {
      return errorResponse(res, "Account not found or deactivated", 401);
    }

    const newToken = jwt.sign(
      {
        id: user.id,
        phoneNumber: user.phoneNumber,
        accountNumber: user.accountNumber,
        role: "user",
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    return successResponse(res, "Token refreshed", { token: newToken, expiresIn: 900 });

  } catch (error) {
    console.error("Refresh token error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

module.exports = refreshToken;
