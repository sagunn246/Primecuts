import webpush from "web-push";
import { query } from "./db";
import { RowDataPacket } from "mysql2";

export const vapidPublicKey =
  process.env.VAPID_PUBLIC_KEY ||
  "BPfuXjpENCG-zXqCJe8cBaUTWD97UZRqEJBU8RsGwq5RSbEgoJPRSLwVO18kRNC8ZZ-2ctRs4bhSZd5B3Hbgu94";
const vapidPrivateKey =
  process.env.VAPID_PRIVATE_KEY ||
  "E7tMiHcCneoXBdK4MjDfsWt72MNsTRo8KC9hoydc9eY";
const vapidEmail =
  process.env.VAPID_EMAIL || "mailto:primecutsbutherhouse@gmail.com";

try {
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
} catch (e) {
  console.warn("[WebPush] VAPID details initialization error:", e);
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  tag?: string;
}

export interface PushDispatchResult {
  total: number;
  sent: number;
  failed: number;
}

export async function sendPushNotification(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: PushPayload
): Promise<{ ok: boolean; statusCode?: number; error?: string }> {
  try {
    const stringifiedPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || "/",
      icon: payload.icon || "/icon-192x192.png",
      badge: payload.badge || "/favicon-circle.png",
      tag: payload.tag || `prime-cuts-order-${Date.now()}`,
      timestamp: Date.now(),
    });

    await webpush.sendNotification(subscription, stringifiedPayload, {
      TTL: 86400, // 24 hours so message delivers as soon as mobile device wakes up
      urgency: "high", // High priority to bypass battery saver and show in mobile notification tray immediately
    });

    return { ok: true };
  } catch (error: any) {
    const statusCode = error?.statusCode;
    const message = error?.body || error?.message || "Push delivery failed";
    console.error(`[WebPush] Delivery failed (${statusCode || "ERR"}):`, message);

    // Remove expired, invalid, or mismatched-VAPID subscriptions
    if (
      statusCode === 410 ||
      statusCode === 404 ||
      statusCode === 403 ||
      statusCode === 401 ||
      statusCode === 400
    ) {
      try {
        await query("DELETE FROM push_subscriptions WHERE endpoint = ?", [
          subscription.endpoint,
        ]);
      } catch {}
    }

    return { ok: false, statusCode, error: String(message) };
  }
}

export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<PushDispatchResult> {
  try {
    const subscriptions = await query<RowDataPacket[]>(
      "SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ? AND type = 'customer'",
      [userId]
    );

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        sendPushNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        )
      )
    );

    let sent = 0;
    let failed = 0;
    for (const r of results) {
      if (r.status === "fulfilled" && r.value.ok) sent++;
      else failed++;
    }

    return { total: subscriptions.length, sent, failed };
  } catch (error) {
    console.error("[WebPush] Error sending push to user:", error);
    return { total: 0, sent: 0, failed: 0 };
  }
}

export async function sendPushToAdmin(
  payload: PushPayload
): Promise<PushDispatchResult> {
  try {
    const subscriptions = await query<RowDataPacket[]>(
      "SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE type = 'admin'"
    );

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        sendPushNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        )
      )
    );

    let sent = 0;
    let failed = 0;
    for (const r of results) {
      if (r.status === "fulfilled" && r.value.ok) sent++;
      else failed++;
    }

    return { total: subscriptions.length, sent, failed };
  } catch (error) {
    console.error("[WebPush] Error sending push to admin:", error);
    return { total: 0, sent: 0, failed: 0 };
  }
}
