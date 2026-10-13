"use strict";

const Notification = require("../../models/Notification");
const { successResponse, errorResponse, getPaginationParams, paginationMeta } = require("../../utils/helpers");

/**
 * GET /api/account/notifications
 * Get paginated notifications for the authenticated user.
 */
const getNotifications = async (req, res) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const { unreadOnly } = req.query;

    const where = { userId: req.user.id };
    if (unreadOnly === "true") where.isRead = false;

    const { count, rows } = await Notification.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    return successResponse(res, "Notifications retrieved", {
      notifications: rows.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        isRead: n.isRead,
        relatedTransactionId: n.relatedTransactionId,
        createdAt: n.createdAt,
      })),
      pagination: paginationMeta(count, page, limit),
    });
  } catch (error) {
    console.error("Get notifications error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

/**
 * GET /api/account/notifications/unread-count
 * Get count of unread notifications.
 */
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.count({
      where: { userId: req.user.id, isRead: false },
    });

    return successResponse(res, "Unread count retrieved", { unreadCount: count });
  } catch (error) {
    console.error("Unread count error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

/**
 * PUT /api/account/notifications/:id/read
 * Mark a single notification as read.
 */
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!notification) return errorResponse(res, "Notification not found", 404);

    await notification.update({ isRead: true });

    return successResponse(res, "Notification marked as read");
  } catch (error) {
    console.error("Mark as read error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

/**
 * PUT /api/account/notifications/read-all
 * Mark all unread notifications as read.
 */
const markAllAsRead = async (req, res) => {
  try {
    const [updated] = await Notification.update(
      { isRead: true },
      { where: { userId: req.user.id, isRead: false } }
    );

    return successResponse(res, `${updated} notification(s) marked as read`, { updated });
  } catch (error) {
    console.error("Mark all as read error:", error.message);
    return errorResponse(res, "Server error", 500);
  }
};

module.exports = { getNotifications, getUnreadCount, markAsRead, markAllAsRead };
