import React from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Phone,
  Mail,
  Lock,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { useCart } from "../context/CartContext";

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fillRule="evenodd"
      d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
      clipRule="evenodd"
    />
  </svg>
);

const TiktokIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.34 2.88 2.88 0 012.31-4.53 2.66 2.66 0 011.04.2v-3.24a5.85 5.85 0 00-1.04-.1 5.92 5.92 0 00-6 5.94 5.91 5.91 0 005.92 5.92 5.9 5.9 0 005.88-5.08V8.6a8.21 8.21 0 004.31 1.22z" />
  </svg>
);

export default function Footer() {
  const { totalItems } = useCart();
  const hasCartBar = totalItems > 0;

  return (
    <footer className="bg-[#141416] md:bg-zinc-900 text-white relative z-20 md:border-t md:border-zinc-800">
      {/* Mobile View */}
      <div
        className={`md:hidden px-4 pt-3 text-center space-y-2.5 transition-all ${
          hasCartBar ? "pb-32" : "pb-20"
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          <img
            src="/images/logo.png"
            alt="Prime Cuts"
            className="w-5 h-5 object-contain"
          />
          <span className="font-bold text-sm tracking-tight text-white">
            Prime <span className="text-primary">Cuts</span> Butcher House
          </span>
        </div>

        <div className="flex items-center justify-center gap-3.5 text-xs text-zinc-300 font-medium">
          <Link to="/privacy-policy" className="hover:text-white transition-colors">
            Privacy
          </Link>
          <span className="text-zinc-600">•</span>
          <Link to="/terms" className="hover:text-white transition-colors">
            Terms
          </Link>
          <span className="text-zinc-600">•</span>
          <Link
            to="/admin/login"
            className="hover:text-white transition-colors text-zinc-400 inline-flex items-center gap-1"
          >
            <Lock className="w-3 h-3" /> Admin
          </Link>
        </div>

        <div className="pt-1 flex flex-col items-center gap-2">
          <p className="text-[11px] text-zinc-500">
            &copy; {new Date().getFullYear()} Prime Cuts Pokhara. All rights reserved.
          </p>
          <a
            href="https://www.devsparkco.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] text-zinc-300 hover:text-white font-semibold transition-colors"
          >
            <img
              src="/images/devspark-logo.jpg"
              alt="Devspark"
              className="w-4.5 h-4.5 rounded-full object-cover border border-white/10"
            />
            <span>
              Developed by{" "}
              <span className="text-white font-bold underline-offset-2 hover:underline">
                Devspark
              </span>
            </span>
          </a>
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 relative flex items-center justify-center shrink-0">
                <img
                  src="/images/logo.png"
                  alt="Prime Cuts Butcher House"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight text-white leading-none">
                  Prime <span className="text-primary">Cuts</span>
                </span>
                <span className="text-[10px] tracking-[0.16em] font-semibold text-zinc-400 uppercase mt-1">
                  Butcher House
                </span>
              </div>
            </div>
            <p className="text-zinc-400 max-w-sm mb-5 leading-relaxed text-sm">
              Daily fresh, hygienic cuts of goat (khasi), Giriraj & broiler chicken, buff, pork, sausages, and farm eggs. Prepared on calibrated digital scales and delivered across Pokhara.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700/80 text-zinc-200 text-xs font-medium mb-6">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span>100% Hygienic Preparation • Digital Scale Accuracy</span>
            </div>
            <div className="flex space-x-4">
              <a
                href="https://www.instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <span className="sr-only">Instagram</span>
                <InstagramIcon className="w-5 h-5" />
              </a>
              <a
                href="https://www.tiktok.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <span className="sr-only">TikTok</span>
                <TiktokIcon className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Storefront Navigation */}
          <div>
            <h3 className="font-semibold text-white mb-4 uppercase tracking-wider text-xs">
              Storefront
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="/#shop-cuts"
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  All Fresh Cuts
                </a>
              </li>
              <li>
                <a
                  href="/#butcher-store"
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  Physical Butcher Shop
                </a>
              </li>
              <li>
                <Link
                  to="/orders"
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  My Orders & Tracking
                </Link>
              </li>
              <li>
                <Link
                  to="/account"
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  Customer Account
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy-policy"
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Outlet & Contact */}
          <div>
            <h3 className="font-semibold text-white mb-4 uppercase tracking-wider text-xs">
              Outlet & Contact
            </h3>
            <ul className="space-y-3.5 text-zinc-400 text-sm">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <a
                  href="https://maps.app.goo.gl/cEEEaU5Gj6EjC4Uo9"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group hover:text-white transition-colors"
                >
                  <span className="text-white font-semibold block">
                    Prime Cuts Butcher House
                  </span>
                  <span className="text-zinc-400 group-hover:text-zinc-200 transition-colors leading-relaxed text-xs">
                    Khudi Chowk, Pokhara-30, Lekhnath
                  </span>
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5 tabular-nums">
                  <a
                    href="tel:9714324919"
                    className="text-white hover:text-zinc-200 transition-colors font-semibold text-xs"
                  >
                    +977 9714324919
                  </a>
                  <a
                    href="tel:9747470470"
                    className="text-zinc-400 hover:text-white transition-colors text-xs"
                  >
                    +977 9747470470
                  </a>
                </div>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <a
                  href="mailto:primecutsbutherhouse@gmail.com"
                  className="text-zinc-400 hover:text-white transition-colors text-xs break-all"
                >
                  primecutsbutherhouse@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-2.5 border-t border-zinc-800 pt-3 mt-3 text-zinc-400 text-xs">
                <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>
                  Daily 7:00 AM – 8:00 PM
                  <br />
                  <span className="text-zinc-300 font-medium">
                    Open 7 Days a Week
                  </span>
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-800 mt-10 pt-6 flex flex-wrap justify-between items-center gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-4">
            <p>
              &copy; {new Date().getFullYear()} Prime Cuts Butcher House. All rights reserved.
            </p>
            <span className="text-zinc-700">•</span>
            <Link to="/privacy-policy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-white transition-colors">
              Terms & Conditions
            </Link>
            <Link
              to="/admin/login"
              className="hover:text-white transition-colors text-zinc-500 inline-flex items-center gap-1"
              title="Staff Login"
            >
              <Lock className="w-3.5 h-3.5" />
            </Link>
          </div>

          <a
            href="https://www.devsparkco.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-zinc-300 hover:text-white font-semibold transition-colors"
          >
            <img
              src="/images/devspark-logo.jpg"
              alt="Devspark"
              className="w-5 h-5 rounded-full object-cover border border-white/10"
            />
            <span>
              Developed by{" "}
              <span className="text-white font-bold underline-offset-2 hover:underline">
                Devspark
              </span>
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}
