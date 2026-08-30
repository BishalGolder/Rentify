import * as WalletModel from "../models/walletModel.js";
import { createNotification } from "../models/notificationModel.js";
 
export const requestRecharge = async (req, res) => {
    try {
        const { amount } = req.body;
        const numericAmount = Number(amount);
 
        if (!numericAmount || numericAmount <= 0) {
            return res.status(400).json({ message: "Enter a valid amount greater than 0." });
        }
 
        const { data, error } = await WalletModel.createRechargeRequest(
            req.user.id, numericAmount, req.supabase
        );
 
        if (error) return res.status(400).json({ message: error.message });
 
        res.status(201).json({ message: "Recharge request submitted.", request: data });
    } catch (error) {
        console.error("Request Recharge Error:", error);
        res.status(500).json({ message: "Failed to submit recharge request." });
    }
};
 
export const getMyRechargeRequests = async (req, res) => {
    const { data, error } = await WalletModel.getMyRechargeRequests(req.user.id, req.supabase);
    if (error) return res.status(400).json({ message: error.message });
    res.json(data || []);
};
 
export const getMyTransactions = async (req, res) => {
    const { data, error } = await WalletModel.getMyTransactions(req.user.id, req.supabase);
    if (error) return res.status(400).json({ message: error.message });
    res.json(data || []);
};
 
export const getAllPendingRequests = async (req, res) => {
    const { data, error } = await WalletModel.getAllPendingRequests();

    if (error) return res.status(400).json({ message: error.message });
    res.json(data || []);
};
 
export const approveRecharge = async (req, res) => {
    try {
        const { id } = req.params;
        const { admin_note } = req.body || {};
 
        const { data, error } = await req.supabase.rpc("admin_approve_recharge", {
            p_request_id: id,
            p_admin_note: admin_note || null
        });
 
        if (error) return res.status(400).json({ message: error.message });
 
        const result = Array.isArray(data) ? data[0] : data;
 
        await createNotification({
            user_id: result.user_id,
            type: "wallet_recharge_approved",
            title: "Wallet Recharged",
            message: `Your recharge request for ${result.amount} was approved and added to your wallet.`,
            related_entity_type: "wallet_recharge_request",
            related_entity_id: result.id
        }, req.supabase);
 
        res.json({ message: "Recharge approved.", request: result });
    } catch (error) {
        console.error("Approve Recharge Error:", error);
        res.status(500).json({ message: "Failed to approve recharge." });
    }
};
 
export const rejectRecharge = async (req, res) => {
    try {
        const { id } = req.params;
        const { admin_note } = req.body || {};
 
        const { data, error } = await req.supabase.rpc("admin_reject_recharge", {
            p_request_id: id,
            p_admin_note: admin_note || null
        });
 
        if (error) return res.status(400).json({ message: error.message });
 
        const result = Array.isArray(data) ? data[0] : data;
 
        await createNotification({
            user_id: result.user_id,
            type: "wallet_recharge_rejected",
            title: "Recharge Request Rejected",
            message: `Your recharge request for ${result.amount} was rejected.${admin_note ? ` Reason: ${admin_note}` : ""}`,
            related_entity_type: "wallet_recharge_request",
            related_entity_id: result.id
        }, req.supabase);
 
        res.json({ message: "Recharge rejected.", request: result });
    } catch (error) {
        console.error("Reject Recharge Error:", error);
        res.status(500).json({ message: "Failed to reject recharge." });
    }
};