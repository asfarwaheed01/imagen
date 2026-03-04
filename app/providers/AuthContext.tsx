"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import api, { setAccessToken, clearAccessToken } from "@/app/lib/apiClient";

interface AuthUser {
  id: number;
  fullName: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (fullName: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .post("/api/auth/refresh")
      .then(({ data }) => {
        setAccessToken(data.accessToken);
        setUser(data.user);
      })
      .catch(() => {
        clearAccessToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data } = await api.post("/api/auth/signin", { email, password });
    setAccessToken(data.accessToken); // ← syncs into apiClient
    setUser(data.user);
  };

  const signUp = async (fullName: string, email: string, password: string) => {
    const { data } = await api.post("/api/auth/signup", {
      fullName,
      email,
      password,
    });
    setAccessToken(data.accessToken); // ← syncs into apiClient
    setUser(data.user);
  };

  const signOut = async () => {
    await api.post("/api/auth/signout");
    clearAccessToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};
