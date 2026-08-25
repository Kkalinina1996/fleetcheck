import { getNotifications as getStoredNotifications, markAllNotificationsRead as markAllStoredNotificationsRead, markNotificationRead as markStoredNotificationRead, saveNotification } from '../lib/storage'

export const getNotifications = () => getStoredNotifications()
export const createNotification = (notification) => saveNotification(notification)
export const markNotificationRead = (id) => markStoredNotificationRead(id)
export const markAllNotificationsRead = () => markAllStoredNotificationsRead()
