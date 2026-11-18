import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { UserProvider } from "./context/UserContext";
import { CartProvider } from "./context/CartContext";
import { cleanStaleServiceWorkers, playAlertChime } from "./utils/deviceNotification";
import "leaflet/dist/leaflet.css";
import "./index.css";

// Purge any foreign/old service workers from previous projects
cleanStaleServiceWorkers();

// Listen for incoming Service Worker Web Push messages while app is open
if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type === "PRIME_CUTS_PUSH") {
      playAlertChime();
      window.dispatchEvent(new CustomEvent("primecuts:push-received", { detail: event.data }));
    }
  });
}

// Resolve Hosted API Base URL (always normalizes to <origin>/api)
const rawApiUrl = (
  import.meta.env.VITE_API_URL || "https://api.primecutsbutcher.com"
).replace(/\/+$/, "");

export const API_ORIGIN = rawApiUrl.replace(/\/api$/i, "");
export const API_BASE_URL = `${API_ORIGIN}/api`;

// Global API, Admin & Upload Fetch Interceptor
// Routes relative /api requests to https://api.primecutsbutcher.com/api
// and attaches both Authorization Bearer AND x-access-token (survives cPanel Apache header stripping)
const nativeFetch = window.fetch;
window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
  const originalUrlStr =
    typeof input === "string" ? input : input instanceof Request ? input.url : input.toString();
  let urlStr = originalUrlStr;

  let finalInput: RequestInfo | URL = input;
  if (urlStr === "/api" || urlStr.startsWith("/api/") || urlStr.startsWith("/api?")) {
    urlStr = `${API_BASE_URL}${urlStr.slice(4)}`;
    finalInput = urlStr;
  } else if (urlStr === "/push/vapid") {
    urlStr = `${API_BASE_URL}/push/vapid`;
    finalInput = urlStr;
  }

  const isApiRequest =
    urlStr.startsWith(API_ORIGIN) ||
    urlStr.startsWith(API_BASE_URL) ||
    originalUrlStr.startsWith("/api/") ||
    originalUrlStr === "/api";

  if (isApiRequest) {
    const isAdminOrUpload =
      originalUrlStr.includes("/api/admin") ||
      originalUrlStr.includes("/api/upload") ||
      urlStr.includes("/api/admin") ||
      urlStr.includes("/api/upload");

    const token = isAdminOrUpload
      ? localStorage.getItem("admin_token")
      : localStorage.getItem("user_token");

    const headers = new Headers(
      init?.headers || (input instanceof Request ? input.headers : undefined)
    );

    if (token) {
      if (!headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      if (!headers.has("x-access-token")) {
        headers.set("x-access-token", token);
      }
    }

    const modifiedInit: RequestInit = {
      ...init,
      headers,
      credentials: init?.credentials || "include",
    };

    return nativeFetch(finalInput, modifiedInit);
  }

  return nativeFetch(finalInput, init);
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <UserProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </UserProvider>
    </BrowserRouter>
  </React.StrictMode>
);
