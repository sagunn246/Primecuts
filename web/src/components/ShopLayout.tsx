import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import MobileAppHeader from "./MobileAppHeader";
import Footer from "./Footer";
import CartDrawer from "./CartDrawer";
import PushNotificationSetup from "./PushNotificationSetup";
import FloatingCartBar from "./FloatingCartBar";
import FloatingSupportWidget from "./FloatingSupportWidget";
import PWAInstallPrompt from "./PWAInstallPrompt";
import { StoreStatusProvider } from "../context/StoreStatusContext";
import { PWAProvider } from "../context/PWAContext";

export default function ShopLayout() {
  const location = useLocation();
  const isHomePage = location.pathname === "/" || location.pathname === "/shop";
  const isMenuPage = location.pathname === "/menu";
  const isLoginPage =
    location.pathname.startsWith("/login") ||
    location.pathname.startsWith("/register");
  const isCheckoutPage = location.pathname.startsWith("/checkout");

  return (
    <PWAProvider>
      <StoreStatusProvider>
        <div className="flex flex-col min-h-screen bg-[#f8f8f9] text-zinc-900">
          <PWAInstallPrompt />
          {isHomePage && <MobileAppHeader />}
          {!isMenuPage && <Navbar />}
          <CartDrawer />
          <main
            className={`flex-grow flex flex-col ${
              isHomePage || isMenuPage || isLoginPage ? "pb-0" : "pb-16 md:pb-0"
            }`}
          >
            <Outlet />
          </main>
          {!isMenuPage && !isCheckoutPage && !isLoginPage && <Footer />}
          <FloatingCartBar />
          <FloatingSupportWidget />
          <PushNotificationSetup />
        </div>
      </StoreStatusProvider>
    </PWAProvider>
  );
}
