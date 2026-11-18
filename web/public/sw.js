// Service Worker for Prime Cuts Butcher House Push Notifications (v2.1)

const API_BASE_URL = "https://api.primecutsbutcher.com/api";
const DEFAULT_VAPID_PUBLIC_KEY =
  "BPfuXjpENCG-zXqCJe8cBaUTWD97UZRqEJBU8RsGwq5RSbEgoJPRSLwVO18kRNC8ZZ-2ctRs4bhSZd5B3Hbgu94";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: "Prime Cuts Butcher House", body: event.data.text() };
    }
  } else {
    data = {
      title: "Prime Cuts Butcher House",
      body: "You have a new order update!",
    };
  }

  const origin = self.location.origin;
  const title = data.title || "Prime Cuts Butcher House";
  const body = data.body || "You have a new update.";

  // Resolve absolute URLs for mobile Android/iOS OS notification center
  const icon = data.icon
    ? data.icon.startsWith("http")
      ? data.icon
      : `${origin}${data.icon.startsWith("/") ? "" : "/"}${data.icon}`
    : `${origin}/icon-192x192.png`;

  const badge = data.badge
    ? data.badge.startsWith("http")
      ? data.badge
      : `${origin}${data.badge.startsWith("/") ? "" : "/"}${data.badge}`
    : `${origin}/favicon-circle.png`;

  let targetUrl = `${origin}/`;
  try {
    targetUrl = new URL(data.url || "/", origin).href;
  } catch {
    targetUrl = `${origin}/`;
  }

  const tag = data.tag || `prime-cuts-${Date.now()}`;

  const fullOptions = {
    body,
    icon,
    badge,
    data: { url: targetUrl },
    vibrate: [200, 100, 200, 100, 200],
    tag,
    renotify: true,
    requireInteraction: false, // Must be false on mobile so it stays in OS Notification Center
    silent: false,
    timestamp: data.timestamp || Date.now(),
    actions: [{ action: "open_app", title: "View Update" }],
  };

  const minimalOptions = {
    body,
    icon,
    badge,
    data: { url: targetUrl },
    tag,
    renotify: true,
  };

  const showPromise = self.registration
    .showNotification(title, fullOptions)
    .catch(() => self.registration.showNotification(title, minimalOptions));

  const notifyClientsPromise = self.clients
    .matchAll({ type: "window", includeUncontrolled: true })
    .then((clientList) => {
      for (const client of clientList) {
        try {
          client.postMessage({
            type: "PRIME_CUTS_PUSH",
            title,
            body,
            url: targetUrl,
            tag,
          });
        } catch {}
      }
    })
    .catch(() => {});

  event.waitUntil(Promise.all([showPromise, notifyClientsPromise]));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const origin = self.location.origin;
  const rawUrl = event.notification.data?.url || "/";

  let urlToOpen = `${origin}/`;
  try {
    urlToOpen = new URL(rawUrl, origin).href;
  } catch {
    urlToOpen = `${origin}/`;
  }

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url && client.url.startsWith(origin) && "focus" in client) {
            return client.focus().then((focusedClient) => {
              if (focusedClient && "navigate" in focusedClient) {
                return focusedClient.navigate(urlToOpen);
              }
              return focusedClient;
            });
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      try {
        let publicKey = DEFAULT_VAPID_PUBLIC_KEY;
        try {
          const vapidRes = await fetch(`${API_BASE_URL}/push/vapid`, { cache: "no-store" });
          if (vapidRes.ok) {
            const data = await vapidRes.json();
            if (data?.publicKey) publicKey = data.publicKey;
          }
        } catch {}

        const newSub = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        await fetch(`${API_BASE_URL}/push/subscribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscription: newSub.toJSON(),
            type: "customer",
          }),
        });
      } catch (err) {
        console.warn("[SW] pushsubscriptionchange re-sync failed:", err);
      }
    })()
  );
});
