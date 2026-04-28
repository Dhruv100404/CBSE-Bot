"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Role } from "@repo/types";

type SessionUser = {
  id: string;
  name: string;
  role: Role;
};

type AuthContextValue = {
  user: SessionUser | null;
  hydrated: boolean;
  loginAsDemo: (role: Role, name?: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const SESSION_KEY = "cbse-ai-demo-session";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (raw) {
      setUser(JSON.parse(raw) as SessionUser);
    }
    setHydrated(true);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      hydrated,
      loginAsDemo(role, name) {
        const fallbackName =
          role === "platform_admin" ? "Admin Demo" : role === "teacher" ? "Teacher Demo" : "Student Demo";
        const nextUser: SessionUser = {
          id: `demo-${role}`,
          name: name?.trim() || fallbackName,
          role
        };
        setUser(nextUser);
        window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
      },
      logout() {
        setUser(null);
        window.localStorage.removeItem(SESSION_KEY);
      }
    }),
    [hydrated, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
