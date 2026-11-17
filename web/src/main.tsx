import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { UserProvider } from "./context/UserContext";
import { CartProvider } from "./context/CartContext";
import { cleanStaleServiceWorkers } from "./utils/deviceNotification";
import "leaflet/dist/leaflet.css";
import "./index.css";

// Purge any foreign/old service workers running on localhost:3000 from previous projects
cleanStaleServiceWorkers();

// Hosted API Base URL
export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "https://primecuts.rjflowers.com/api"
).replace(/\/+$/, "");

// Global API, Admin & Upload Fetch Interceptor
// Routes relative /api requests to the hosted API (https://primecuts.rjflowers.com/api)
// and attaches Bearer tokens & credentials so sessions persist across origins/proxies
const nativeFetch = window.fetch;
window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
  let urlStr = typeof input === "string" ? input : input instanceof Request ? input.url : input.toString();

  // Rewrite relative /api paths (and fallback /push/vapid) to hosted API_BASE_URL
  let finalInput: RequestInfo | URL = input;
  if (urlStr === "/api" || urlStr.startsWith("/api/") || urlStr.startsWith("/api?")) {
    urlStr = `${API_BASE_URL}${urlStr.slice(4)}`;
    finalInput = urlStr;
  } else if (urlStr === "/push/vapid") {
    urlStr = `${API_BASE_URL}/push/vapid`;
    finalInput = urlStr;
  }

  const isApiRequest =
    urlStr.startsWith(API_BASE_URL) ||
    urlStr.includes("/api/");

  if (isApiRequest) {
    const isAdminOrUpload = urlStr.includes("/api/admin") || urlStr.includes("/api/upload");
    const token = isAdminOrUpload
      ? localStorage.getItem("admin_token")
      : localStorage.getItem("user_token");

    const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));

    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
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
