"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import SignInForm from "./SignInForm";
import SignUpForm from "./SignUpForm";

type Tab = "signin" | "signup";

const Auth = () => {
  const [activeTab, setActiveTab] = useState<Tab>("signin");
  const router = useRouter();

  const handleSuccess = () => router.push("/");

  return (
    <div className="min-h-screen bg-[#f7f8fa] flex items-center justify-center px-4">
      <div className="w-full max-w-105">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-900 transition-colors duration-200 mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to home
        </Link>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Tab switcher */}
          <div className="flex p-1.5 mx-6 mt-6 bg-[#f4f5f7] rounded-2xl">
            {(["signin", "signup"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`cursor-pointer flex-1 h-10 rounded-xl text-[14px] font-medium transition-all duration-300 ${
                  activeTab === tab
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab === "signin" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* Forms — slide transition */}
          <div className="relative overflow-hidden">
            <div
              className="flex transition-transform duration-300 ease-in-out"
              style={{
                transform:
                  activeTab === "signin"
                    ? "translateX(0%)"
                    : "translateX(-50%)",
                width: "200%",
              }}
            >
              {/* Sign In panel */}
              <div className="w-1/2 px-6 pt-6 pb-8">
                <div className="mb-5">
                  <h1 className="text-[20px] font-bold text-gray-900">
                    Welcome back
                  </h1>
                  <p className="text-[13px] text-gray-500 mt-0.5">
                    Sign in to your account
                  </p>
                </div>
                <SignInForm onSuccess={handleSuccess} />
              </div>

              {/* Sign Up panel */}
              <div className="w-1/2 px-6 pt-6 pb-8">
                <div className="mb-5">
                  <h1 className="text-[20px] font-bold text-gray-900">
                    Create account
                  </h1>
                  <p className="text-[13px] text-gray-500 mt-0.5">
                    Get started for free
                  </p>
                </div>
                <SignUpForm onSuccess={handleSuccess} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-[12px] text-gray-400 mt-5">
          By continuing, you agree to our{" "}
          <span className="underline cursor-pointer hover:text-gray-600 transition">
            Terms
          </span>
          {" & "}
          <span className="underline cursor-pointer hover:text-gray-600 transition">
            Privacy Policy
          </span>
        </p>
      </div>
    </div>
  );
};

export default Auth;
