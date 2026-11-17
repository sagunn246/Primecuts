import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useUser } from "../context/UserContext";

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

  // ================================
  // GOOGLE OAUTH LOGIN
  // ================================
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
      setError(err?.message || "An unexpected error occurred during Google login.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setGoogleLoading(false);
    setError("Google login failed. Please try again.");
  };

  return (
    <div className="min-h-[75vh] bg-stone-50 flex flex-col justify-center pt-[max(calc(env(safe-area-inset-top,0px)+16px),24px)] pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-stone-200/80 relative">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-stone-600 hover:text-stone-900 font-bold text-xs mb-6 py-1.5 px-2.5 rounded-xl bg-stone-100 hover:bg-stone-200/80 active:scale-95 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center">
            <img
              src="/images/logo.png"
              alt="Prime Cuts Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-black">
            Welcome to Prime Cuts
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 font-medium mt-1.5">
            Sign in with your Google account to place orders and track your deliveries.
          </p>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium mb-5 text-center border border-red-100">
            {error}
          </div>
        )}

        {/* GOOGLE LOGIN */}
        <div className="w-full flex justify-center py-2">
          {googleLoading ? (
            <div className="w-full border border-stone-200 rounded-xl py-3.5 text-center text-stone-700 font-bold flex items-center justify-center gap-2 bg-stone-50">
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
              width="320"
            />
          )}
        </div>
      </div>
    </div>
  );
}
