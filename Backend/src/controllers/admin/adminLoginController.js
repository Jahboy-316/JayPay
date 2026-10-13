"use strict";

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const AdminUser = require("../../models/AdminUser");
const AuditLog = require("../../models/AuditLog");
const { randomUUID } = require("crypto");
const { successResponse, errorResponse } = require("../../utils/helpers");

const MAX_PIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 30; // Longer lockout for admin

/**
 * POST /api/admin/login
 * Admin login with username + PIN.
 * Admins are bootstrapped via seeder — public registration cannot create admins.
 */
const adminLogin = async (req, res) => {
  try {
    const { username, pin } = req.body;

    const admin = await AdminUser.findOne({ where: { username } });

    // Generic message — do not reveal if username exists
    if (!admin) {
      return errorResponse(res, "Invalid username or PIN", 401);
    }

    if (!admin.isActive) {
      return errorResponse(res, "Admin account is inactive. Contact super admin.", 403);
    }

    // Check lockout
    if (admin.pinLockedUntil && new Date() < new Date(admin.pinLockedUntil)) {
      const minutes = Math.ceil((new Date(admin.pinLockedUntil) - new Date()) / 60000);
      return errorResponse(res, `Account locked. Try again in ${minutes} minute(s).`, 429);
    }

    const pinMatch = await bcrypt.compare(pin, admin.pin);

    if (!pinMatch) {
      const attempts = (admin.pinAttempts || 0) + 1;
      const updates = { pinAttempts: attempts };

      if (attempts >= MAX_PIN_ATTEMPTS) {
        updates.pinLockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
        updates.pinAttempts = 0;
        await admin.update(updates);
        return errorResponse(res, `Too many failed attempts. Account locked for ${LOCKOUT_MINUTES} minutes.`, 429);
      }

      await admin.update(updates);
      return errorResponse(res, "Invalid username or PIN", 401);
    }

    await admin.update({ pinAttempts: 0, pinLockedUntil: null });

    const token = jwt.sign(
      {
        id: admin.id,
        username: admin.username,
        role: admin.role,
        isAdmin: true,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Audit log the login
    await AuditLog.create({
      id: randomUUID(),
      adminId: admin.id,
      action: "admin_login",
      targetType: "admin",
      targetId: admin.id,
      details: { username: admin.username, role: admin.role },
      ipAddress: req.ip,
    });

    return successResponse(res, "Admin login successful", {
      token,
      admin: {
        username: admin.username,
        firstName: admin.firstName,
        role: admin.role,
      },
    });

  } catch (error) {
    console.error("Admin login error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

module.exports = adminLogin;
