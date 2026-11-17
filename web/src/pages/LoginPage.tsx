import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import {
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Clock,
  MapPin,
  PackageCheck,
} from "lucide-react";
import { useUser } from "../context/UserContext";
import SEO from "../components/SEO";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser } = useUser();

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(errorParam.replace(/_/g, " "));
    }
  }, [searchParams]);

  const handleGoogleSuccess = async (credentialResponse: {
    credential?: string;
  }) => {
    setError("");
    setGoogleLoading(true);

    try {
      if (!credentialResponse.credential) {
        setError("Google authentication failed. No credential received.");
        return;
      }

      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          credential: credentialResponse.credential,
        }),
      });

      const contentType = res.headers.get("content-type");
      let data: any = {};
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      }

      if (!res.ok) {
        setError(data.error || "Google login failed. Please try again.");
        return;
      }

      if (data.token) {
        localStorage.setItem("user_token", data.token);
      }

      await refreshUser();

      const from = searchParams.get("from");
      navigate(from || "/");
    } catch (err: any) {
      console.error("Google login error:", err);
      setError(
        err?.message || "An unexpected error occurred during Google login."
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setGoogleLoading(false);
    setError("Google login failed. Please try again.");
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-[#f8f8f9] px-4 py-8 sm:py-12">
      <SEO
        title="Sign In | Prime Cuts Butcher House"
        description="Sign in to Prime Cuts Butcher House Pokhara with Google for fast checkout and live order tracking."
        url="/login"
      />

      <div className="w-full max-w-4xl bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12">
        {/* Left Brand Showcase Panel (Desktop) */}
        <div className="hidden md:flex md:col-span-5 bg-zinc-900 text-white p-8 flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 opacity-25 pointer-events-none">
            <img
              src="/images/hero_bg_desktop.jpg"
              alt="Prime Cuts Butcher House"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-zinc-900/60" />
          </div>

          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-3 mb-8">
              <img
                src="/images/logo.png"
                alt="Prime Cuts"
                className="w-12 h-12 object-contain shrink-0"
              />
              <div>
                <span className="font-bold text-lg tracking-tight text-white block leading-none">
                  Prime <span className="text-primary">Cuts</span>
                </span>
                <span className="text-[10px] tracking-[0.16em] font-semibold text-zinc-400 uppercase mt-1 block">
                  Butcher House
                </span>
              </div>
            </Link>

            <h1 className="text-2xl font-bold text-white tracking-tight leading-snug mb-3">
              Fresh Morning Cuts, Delivered to Your Kitchen.
            </h1>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Sign in to place custom-weight meat orders, save your Pokhara delivery pin, and track live butcher preparation.
            </p>
          </div>

          <div className="relative z-10 space-y-3.5 pt-8 border-t border-white/10 mt-8">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">
                  Live Order Tracking
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Real-time status from butcher block to doorstep
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">
                  Saved Delivery Addresses
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Fast 1-tap checkout across Pokhara & Lekhnath
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                <PackageCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">
                  Digital Receipts & Reordering
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  View past orders and reorder your favourite cuts
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sign-In Column */}
        <div className="md:col-span-7 p-6 sm:p-10 flex flex-col justify-between bg-white">
          <div>
            <div className="flex items-center justify-between mb-6">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-1.5 text-zinc-600 hover:text-zinc-900 font-semibold text-xs py-1.5 px-3 rounded-lg bg-zinc-100 hover:bg-zinc-200/80 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <span className="text-[11px] font-medium text-zinc-400">
                Khudi Chowk, Pokhara-30
              </span>
            </div>

            <div className="text-center max-w-sm mx-auto pt-2 pb-6">
              <div className="w-18 h-18 mx-auto mb-4 flex items-center justify-center">
                <img
                  src="/images/logo.png"
                  alt="Prime Cuts Logo"
                  className="w-full h-full object-contain"
                />
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
                Welcome to Prime <span className="text-primary">Cuts</span>
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 mt-2 leading-relaxed">
                Continue with your Google account for instant checkout, saved delivery addresses, and live order updates.
              </p>

              {/* Error Banner */}
              {error && (
                <div className="mt-5 bg-red-50 text-primary p-3 rounded-xl text-xs sm:text-sm font-semibold text-center border border-red-200">
                  {error}
                </div>
              )}

              {/* Google Sign-In Box */}
              <div className="mt-7 p-5 rounded-xl bg-zinc-50 border border-zinc-200/90 flex flex-col items-center justify-center">
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                  1-Click Customer Sign In
                </span>

                <div className="w-full flex justify-center">
                  {googleLoading ? (
                    <div className="w-full max-w-[300px] border border-zinc-200 rounded-lg py-3 text-center text-zinc-700 font-semibold text-xs flex items-center justify-center gap-2 bg-white">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span>Signing in with Google...</span>
                    </div>
                  ) : (
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      useOneTap={false}
                      theme="outline"
                      size="large"
                      text="continue_with"
                      shape="rectangular"
                      width="280"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Security & Policy Footer */}
          <div className="pt-5 border-t border-zinc-100 text-center space-y-2">
            <div className="inline-flex items-center justify-center gap-1.5 text-xs text-zinc-500 font-medium">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              <span>Secure Google OAuth 2.0 Authentication • No password required</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              By signing in, you agree to our{" "}
              <Link to="/terms" className="text-zinc-600 hover:text-primary underline">
                Terms
              </Link>{" "}
              and{" "}
              <Link
                to="/privacy-policy"
                className="text-zinc-600 hover:text-primary underline"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
