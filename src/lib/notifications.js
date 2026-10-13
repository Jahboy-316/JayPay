import { apiRequest } from "./apiClient";

export async function getNotifications(params = {}) {
  return await apiRequest("/account/notifications", {
    params,
  });
}

export async function getUnreadCount() {
  return await apiRequest("/account/notifications/unread-count");
}

export async function markAllNotificationsAsRead() {
  return await apiRequest("/account/notifications/read-all", {
    method: "PUT",
  });
}

export async function markNotificationAsRead(id) {
  return await apiRequest(`/account/notifications/${id}/read`, {
    method: "PUT",
  });
}
