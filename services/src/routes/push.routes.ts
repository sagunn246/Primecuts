import { Router, Request, Response } from "express";
import { query } from "../db";
import { getAuthUser } from "../auth";
import {
  vapidPublicKey,
  sendPushNotification,
  sendPushToAdmin,
  sendPushToUser,
} from "../webpush";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import crypto from "crypto";

const router = Router();

// Return VAPID Public Key (never cache so key updates propagate immediately)
router.get("/vapid", (_req: Request, res: Response) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.json({ publicKey: vapidPublicKey });
});

// Subscribe
router.post("/subscribe", async (req: Request, res: Response): Promise<void> => {
  try {
    const { subscription, type, userId } = req.body;

    if (
      !subscription ||
      !subscription.endpoint ||
      !subscription.keys?.p256dh ||
      !subscription.keys?.auth
    ) {
      res.status(400).json({
        success: false,
        error: "Invalid push subscription payload.",
      });
      return;
    }

    const auth = await getAuthUser(req);
    const effectiveType = type === "admin" ? "admin" : "customer";
    const effectiveUserId =
      effectiveType === "customer" ? userId || auth?.userId || null : null;

    const { endpoint, keys } = subscription;
    const { p256dh, auth: authKey } = keys;

    const existing = await query<RowDataPacket[]>(
      "SELECT id FROM push_subscriptions WHERE endpoint = ?",
      [endpoint]
    );

    if (existing.length > 0) {
      await query(
        "UPDATE push_subscriptions SET user_id = ?, type = ?, p256dh = ?, auth = ? WHERE endpoint = ?",
        [effectiveUserId, effectiveType, p256dh, authKey, endpoint]
      );
    } else {
      const subId = "sub_" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
      await query<ResultSetHeader>(
        "INSERT INTO push_subscriptions (id, user_id, type, endpoint, p256dh, auth) VALUES (?, ?, ?, ?, ?, ?)",
        [subId, effectiveUserId, effectiveType, endpoint, p256dh, authKey]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error("[Push Subscribe Error]", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to save push subscription." });
  }
});

// Unsubscribe
router.delete("/subscribe", async (req: Request, res: Response): Promise<void> => {
  try {
    const { endpoint } = req.body || {};
    if (endpoint) {
      await query("DELETE FROM push_subscriptions WHERE endpoint = ?", [
        endpoint,
      ]);
    }
    res.json({ success: true });
  } catch {
    res
      .status(500)
      .json({ success: false, error: "Failed to remove subscription." });
  }
});

// Test Notification Endpoint (for User & Admin testing)
router.post("/test", async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, userId, title, body, url, endpoint } = req.body || {};
    const auth = await getAuthUser(req);
    const effectiveUserId = userId || auth?.userId;

    const notifTitle =
      title ||
      (type === "admin"
        ? "Prime Cuts — Admin Alert"
        : "Prime Cuts — Order Update");
    const notifBody =
      body ||
      (type === "admin"
        ? "Test push notification: Real-time alerts are fully active!"
        : "Test notification: You will receive live updates on your meat delivery.");
    const notifUrl = url || (type === "admin" ? "/admin/orders" : "/orders");

    let stats = { total: 0, sent: 0, failed: 0 };

    if (endpoint) {
      const rows = await query<RowDataPacket[]>(
        "SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE endpoint = ?",
        [endpoint]
      );
      stats.total = rows.length;
      for (const sub of rows) {
        const result = await sendPushNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          { title: notifTitle, body: notifBody, url: notifUrl }
        );
        if (result.ok) stats.sent++;
        else stats.failed++;
      }
    } else if (type === "admin") {
      stats = await sendPushToAdmin({
        title: notifTitle,
        body: notifBody,
        url: notifUrl,
      });
    } else if (effectiveUserId) {
      stats = await sendPushToUser(effectiveUserId, {
        title: notifTitle,
        body: notifBody,
        url: notifUrl,
      });
    } else {
      const subscriptions = await query<RowDataPacket[]>(
        "SELECT endpoint, p256dh, auth FROM push_subscriptions"
      );
      stats.total = subscriptions.length;
      for (const sub of subscriptions) {
        const result = await sendPushNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          { title: notifTitle, body: notifBody, url: notifUrl }
        );
        if (result.ok) stats.sent++;
        else stats.failed++;
      }
    }

    res.json({
      success: stats.sent > 0 || stats.total === 0,
      ...stats,
      message:
        stats.sent > 0
          ? `Push notification dispatched to ${stats.sent} device(s).`
          : stats.total === 0
          ? "No registered device subscriptions found."
          : "Push delivery failed. Please re-enable notifications on your device.",
    });
  } catch (error: any) {
    console.error("[Push Test Error]", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to send test push.",
    });
  }
});

export default router;
