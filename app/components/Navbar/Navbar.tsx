"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, User } from "lucide-react";
import logo from "@/public/assets/Blief.png";
import { useAuth } from "@/app/providers/AuthContext";

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const Navbar = () => {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, loading, signOut } = useAuth();

  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  // Scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
    router.push("/");
  };

  const renderRight = () => {
    if (loading)
      return (
        <div className="w-20 h-4 bg-gray-100 rounded-full animate-pulse" />
      );

    if (!user)
      return (
        <Link
          href="/auth"
          className="text-[14px] font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200"
        >
          Login
        </Link>
      );

    return (
      <div ref={dropdownRef} className="relative">
        {/* Trigger */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 group"
        >
          <span className="w-8 h-8 rounded-full bg-gray-800 text-white text-[12px] font-semibold flex items-center justify-center select-none">
            {getInitials(user.fullName)}
          </span>
          <span className="hidden sm:block text-[14px] font-medium text-gray-700 group-hover:text-gray-900 transition-colors max-w-30 truncate">
            {user.fullName.split(" ")[0]}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute right-0 top-[calc(100%+12px)] w-56 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden z-50">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-[13px] font-semibold text-gray-900 truncate">
                {user.fullName}
              </p>
              <p className="text-[12px] text-gray-400 truncate">{user.email}</p>
            </div>
            <div className="p-1.5 space-y-0.5">
              <Link
                href="/library"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-[13px] text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <User className="w-3.5 h-3.5 text-gray-400" />
                My Library
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-[13px] text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-white transition-shadow duration-300 ${scrolled ? "shadow-sm" : ""}`}
    >
      <nav className="h-16 flex items-center justify-center px-6 relative">
        <Image
          src={logo}
          alt="Blief"
          height={36}
          priority
          className="object-contain select-none"
        />
        <div className="absolute right-6">{renderRight()}</div>
      </nav>
    </header>
  );
};

export default Navbar;
