"use strict";

const Notification = require("../models/Notification");

/**
 * Creates an in-app notification for a user.
 * This is the only notification method that is guaranteed.
 * External SMS/email is only used if configured via env vars
 * and is never claimed if not configured.
 *
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.type - Notification type
 * @param {string} params.title
 * @param {string} params.message
 * @param {string} [params.relatedTransactionId]
 * @param {object} [params.metadata]
 * @param {object} [params.transaction] - Sequelize transaction for atomicity
 */
const createNotification = async ({
  userId,
  type,
  title,
  message,
  relatedTransactionId = null,
  metadata = null,
  transaction = null,
}) => {
  try {
    await Notification.create({
      userId,
      type,
      title,
      message,
      relatedTransactionId,
      metadata,
    }, { transaction });
  } catch (err) {
    // Notification failure should not fail the main operation
    console.error("Notification creation failed (non-fatal):", err.message);
  }
};

/**
 * Get unread notification count for a user.
 */
const getUnreadCount = async (userId) => {
  return Notification.count({ where: { userId, isRead: false } });
};

module.exports = { createNotification, getUnreadCount };
