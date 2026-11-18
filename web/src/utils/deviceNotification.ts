/**
 * Universal Native Device Notification Utility for Prime Cuts
 * Works across Windows, macOS (Safari/Chrome), Android, and iOS (iPhone/iPad PWA)
 */

const DEFAULT_VAPID_PUBLIC_KEY =
  "BPfuXjpENCG-zXqCJe8cBaUTWD97UZRqEJBU8RsGwq5RSbEgoJPRSLwVO18kRNC8ZZ-2ctRs4bhSZd5B3Hbgu94";

const SW_FALLBACK_STORAGE_KEY = "prime_sw_notifications_active";

export function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

function uint8ArraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let sharedAudioCtx: AudioContext | null = null;

export function playAlertChime() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem("pref_sound_enabled") === "false") return;

  try {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtxClass) return;

    if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
      sharedAudioCtx = new AudioCtxClass();
    }

    if (sharedAudioCtx.state === "suspended") {
      sharedAudioCtx.resume().catch(() => {});
    }

    const audioCtx = sharedAudioCtx;
    const now = audioCtx.currentTime;

    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now); // D5
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.3, now + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.4);

    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880.0, now + 0.1); // A5
    gain2.gain.setValueAtTime(0, now + 0.1);
    gain2.gain.linearRampToValueAtTime(0.35, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.6);
  } catch (err) {
    console.warn("[Audio] Alert chime note:", err);
  }
}

/**
 * Detect Apple iOS Device
 */
export function isIOS(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/**
 * Detect if running as an installed standalone PWA on Home Screen
 */
export function isStandalonePWA(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

/**
 * Returns current push notification capability and subscription state
 */
export async function getPushNotificationState(): Promise<{
  supported: boolean;
  requiresIOSInstall: boolean;
  permission: NotificationPermission;
  subscribed: boolean;
}> {
  if (typeof window === "undefined") {
    return {
      supported: false,
      requiresIOSInstall: false,
      permission: "default",
      subscribed: false,
    };
  }

  const requiresIOSInstall = isIOS() && !isStandalonePWA();
  const hasAPI = "Notification" in window && "serviceWorker" in navigator;

  if (!hasAPI) {
    return {
      supported: false,
      requiresIOSInstall,
      permission: "default",
      subscribed: false,
    };
  }

  const permission = Notification.permission;
  let subscribed = false;

  if (permission === "granted") {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.pushManager) {
        const sub = await reg.pushManager.getSubscription();
        subscribed = !!sub;
      }
    } catch {}

    if (!subscribed && localStorage.getItem(SW_FALLBACK_STORAGE_KEY) === "true") {
      subscribed = true;
    }
  }

  return {
    supported: true,
    requiresIOSInstall,
    permission,
    subscribed,
  };
}

/**
 * Requests Notification permission safely across modern browsers and Safari
 * (MUST be called synchronously from user click gesture to satisfy Safari/WebKit security policy)
 */
export async function safeRequestPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return new Promise<NotificationPermission>((resolve) => {
      try {
        Notification.requestPermission((result) => {
          resolve(result);
        });
      } catch {
        resolve("denied");
      }
    });
  }
}

/**
 * Triggers an instant native notification that shows in Windows/macOS/Android/iOS notification tray
 */
export async function triggerDeviceNotification(
  title: string,
  options: {
    body: string;
    url?: string;
    icon?: string;
    badge?: string;
    tag?: string;
  }
) {
  if (typeof window === "undefined") return;
  if (localStorage.getItem("pref_order_alerts") === "false") return;

  // 1. Play audio chime (respects pref_sound_enabled)
  playAlertChime();

  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const origin = window.location.origin;
  const iconUrl = options.icon
    ? options.icon.startsWith("http")
      ? options.icon
      : `${origin}${options.icon}`
    : `${origin}/icon-192x192.png`;
  const badgeUrl = options.badge
    ? options.badge.startsWith("http")
      ? options.badge
      : `${origin}${options.badge}`
    : `${origin}/favicon-circle.png`;

  let targetUrl = `${origin}/`;
  try {
    targetUrl = new URL(options.url || "/", origin).href;
  } catch {}

  const tag = options.tag || `prime-cuts-${Date.now()}`;

  const notificationOptions: any = {
    body: options.body,
    icon: iconUrl,
    badge: badgeUrl,
    data: { url: targetUrl },
    tag,
    renotify: true,
    vibrate: [200, 100, 200],
    requireInteraction: false, // Must be false on mobile so notification stays in mobile notification center
    silent: false,
  };

  // Attempt 1: Service Worker showNotification (Primary on Android Chrome / iOS Safari PWA / macOS / Windows)
  if ("serviceWorker" in navigator) {
    try {
      let reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        reg = await navigator.serviceWorker.register("/sw.js");
      }
      const activeReg = await navigator.serviceWorker.ready;
      if (activeReg && activeReg.showNotification) {
        try {
          await activeReg.showNotification(title, notificationOptions);
        } catch {
          await activeReg.showNotification(title, {
            body: options.body,
            icon: iconUrl,
            badge: badgeUrl,
            data: { url: targetUrl },
            tag,
          });
        }
        return;
      }
    } catch (swErr) {
      console.warn("[Notification] SW showNotification note:", swErr);
    }
  }

  // Attempt 2: Direct browser Notification constructor fallback (Desktop Chrome / Firefox)
  const isMobile =
    typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (!isMobile) {
    try {
      const notif = new Notification(title, notificationOptions);
      notif.onclick = () => {
        window.focus();
        if (options.url) {
          window.location.href = options.url;
        }
        notif.close();
      };
    } catch (directErr) {
      console.warn("[Notification] Direct Notification constructor notice:", directErr);
    }
  }
}

async function fetchVapidPublicKey(): Promise<string> {
  try {
    const vapidRes = await fetch("/api/push/vapid", { cache: "no-store" });
    if (vapidRes.ok) {
      const data = await vapidRes.json();
      if (data?.publicKey && typeof data.publicKey === "string" && data.publicKey.length >= 80) {
        return data.publicKey.trim();
      }
    }
  } catch {}
  return DEFAULT_VAPID_PUBLIC_KEY;
}

let activeSubscribePromise: Promise<PushSubscription | null> | null = null;

/**
 * Subscribes the current device to push notifications and syncs with backend MySQL.
 * Deduplicates concurrent calls and falls back cleanly to Service Worker Notification Center
 * mode if the browser's push service (e.g. Brave or restricted FCM) throws AbortError.
 */
export async function registerDevicePushSubscription(
  type: "customer" | "admin",
  userId?: string
): Promise<PushSubscription | null> {
  if (typeof window === "undefined") {
    throw new Error("Push notifications are not supported in this environment.");
  }

  if (isIOS() && !isStandalonePWA()) {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      throw new Error(
        "On iPhone/iPad: Tap the Share button in Safari, tap 'Add to Home Screen', then open Prime Cuts from your Home Screen to enable mobile push notifications."
      );
    }
  }

  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    throw new Error("Push notifications are not supported on this browser.");
  }

  // Request permission FIRST directly inside the user gesture
  const permission = await safeRequestPermission();
  if (permission !== "granted") {
    throw new Error(
      "Notification permission was denied. Please allow notifications in your browser or phone settings."
    );
  }

  // Deduplicate concurrent subscription attempts (e.g., AdminPushSetup + NotificationBell)
  if (activeSubscribePromise) {
    return activeSubscribePromise;
  }

  activeSubscribePromise = (async (): Promise<PushSubscription | null> => {
    try {
      let reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        reg = await navigator.serviceWorker.register("/sw.js");
      }

      const activeReg = await navigator.serviceWorker.ready;

      // Wait briefly if service worker is still activating
      if (!activeReg.active) {
        await delay(250);
      }

      if (!activeReg.pushManager) {
        localStorage.setItem(SW_FALLBACK_STORAGE_KEY, "true");
        return null;
      }

      const serverKeyStr = await fetchVapidPublicKey();
      const candidateKeys = Array.from(
        new Set([serverKeyStr, DEFAULT_VAPID_PUBLIC_KEY])
      );

      let sub = await activeReg.pushManager.getSubscription();

      // If an existing subscription exists, check if its key matches
      if (sub) {
        const existingKeyBuf = sub.options?.applicationServerKey;
        const existingKeyBytes = existingKeyBuf ? new Uint8Array(existingKeyBuf) : null;
        const targetBytes = urlBase64ToUint8Array(candidateKeys[0]);
        if (existingKeyBytes && !uint8ArraysEqual(existingKeyBytes, targetBytes)) {
          try {
            await sub.unsubscribe();
            await delay(350);
          } catch {}
          sub = null;
        }
      }

      // Subscribe if no active subscription
      if (!sub) {
        for (const keyStr of candidateKeys) {
          try {
            const appKey = urlBase64ToUint8Array(keyStr);
            sub = await activeReg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: appKey,
            });
            if (sub) break;
          } catch {
            try {
              const stale = await activeReg.pushManager.getSubscription();
              if (stale) {
                await stale.unsubscribe();
                await delay(400);
              }
              const appKey = urlBase64ToUint8Array(keyStr);
              sub = await activeReg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: appKey,
              });
              if (sub) break;
            } catch {
              // Try next key or fall through to SW notification center mode
            }
          }
        }
      }

      localStorage.setItem(SW_FALLBACK_STORAGE_KEY, "true");

      if (sub) {
        const subJson = sub.toJSON();
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscription: subJson,
            type,
            userId: userId || undefined,
          }),
        }).catch(() => {});
      }

      return sub;
    } finally {
      activeSubscribePromise = null;
    }
  })();

  return activeSubscribePromise;
}

/**
 * Unsubscribes the current device from push notifications
 */
export async function unsubscribeDevicePushSubscription() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SW_FALLBACK_STORAGE_KEY);

  if (!("serviceWorker" in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = reg?.pushManager ? await reg.pushManager.getSubscription() : null;
    if (sub) {
      const endpoint = sub.endpoint;
      await sub.unsubscribe();
      await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint }),
      }).catch(() => {});
    }
  } catch {}
}

/**
 * Automatically purges any foreign or stale service workers registered from other projects
 */
export async function cleanStaleServiceWorkers() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const reg of registrations) {
      const scriptUrl =
        reg.active?.scriptURL || reg.installing?.scriptURL || reg.waiting?.scriptURL || "";
      if (!scriptUrl.endsWith("/sw.js")) {
        await reg.unregister();
      }
    }
  } catch {}
}
