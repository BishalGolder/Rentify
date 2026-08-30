import * as NotificationModel from "../models/notificationModel.js";

export const getMyNotifications = async (req, res) => {
    const { data, error } = await NotificationModel.getMyNotifications(req.user.id, req.supabase);
    if (error) return res.status(400).json(error);
    res.json(data);
};

export const markNotificationRead = async (req, res) => {
    const { id } = req.params;
    const { data, error } = await NotificationModel.markAsRead(id, req.user.id, req.supabase);
    if (error) return res.status(400).json(error);
    res.json({ message: "Marked as read.", notification: data });
};

export const markAllNotificationsRead = async (req, res) => {
    const { error } = await NotificationModel.markAllAsRead(req.user.id, req.supabase);
    if (error) return res.status(400).json(error);
    res.json({ message: "All notifications marked as read." });
};
