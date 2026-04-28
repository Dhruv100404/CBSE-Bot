"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import type { Role } from "@repo/types";
import { useAuth } from "@/components/auth-provider";
import { navigationByRole } from "@/lib/navigation";

type AppShellRole = keyof typeof navigationByRole;

const roleMeta: Record<AppShellRole, { label: string; tone: string; dot: string; gradient: string }> = {
  student: {
    label: "Student",
    tone: "text-primary",
    dot: "bg-primary",
    gradient: "from-primary to-math"
  },
  teacher: {
    label: "Teacher",
    tone: "text-progress",
    dot: "bg-progress",
    gradient: "from-progress to-primary"
  },
  platform_admin: {
    label: "Admin",
    tone: "text-energy",
    dot: "bg-energy",
    gradient: "from-energy to-warn"
  }
};

const roleLabels: Record<Role, string> = {
  visitor: "Visitor",
  student: "Student",
  parent: "Parent",
  teacher: "Teacher",
  org_admin: "Org Admin",
  platform_admin: "Platform Admin",
  reviewer: "Reviewer"
};

export function ProtectedShell({
  role,
  children
}: {
  role: AppShellRole;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { hydrated, user, logout } = useAuth();
  const allowedRoles = role === "platform_admin" ? ["platform_admin"] : [role, "platform_admin"];
  const meta = roleMeta[role];

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    if (!user || !allowedRoles.includes(user.role)) {
      router.replace("/login");
    }
  }, [allowedRoles, hydrated, router, user]);

  if (!hydrated || !user || !allowedRoles.includes(user.role)) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="rounded-2xl border border-line bg-surface px-8 py-6 text-center text-ink-soft shadow-card">
          <div className="mx-auto mb-3 inline-flex h-8 w-8 animate-pulse-soft items-center justify-center rounded-full bg-primary-soft text-primary">
            <span className="h-2 w-2 rounded-full bg-primary" />
          </div>
          Checking your session…
        </div>
      </main>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-bg">
      <div className="bg-mesh-soft pointer-events-none absolute inset-x-0 top-0 h-96 opacity-80" />
      <div className="mx-auto max-w-[1500px] px-4 py-5 lg:px-6">
        {/* Mobile top bar */}
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-line bg-surface/90 px-4 py-3 shadow-card backdrop-blur xl:hidden">
          <div className="flex items-center gap-3">
            <span className={`relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${meta.gradient} text-white`}>
              <span className="font-display text-sm">L</span>
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-energy ring-2 ring-surface" />
            </span>
            <div>
              <div className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${meta.tone}`}>
                {meta.label} workspace
              </div>
              <div className="font-display text-sm text-ink">Learn AI</div>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink-soft transition hover:bg-surface-2"
          >
            Sign out
          </button>
        </div>

        {/* Mobile nav scroll */}
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1 xl:hidden">
          {navigationByRole[role].map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                  active
                    ? "border-primary/30 bg-primary-soft text-primary-strong"
                    : "border-line bg-surface text-ink-soft hover:bg-surface-2"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden w-[280px] shrink-0 xl:block">
            <div className="sticky top-6 space-y-4">
              <div className="relative overflow-hidden rounded-2xl border border-line bg-surface p-5 shadow-card">
                <div className={`absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br ${meta.gradient} opacity-15 blur-2xl`} />
                <div className="relative flex items-center gap-3">
                  <span className={`relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${meta.gradient} text-white shadow-ring`}>
                    <span className="font-display text-base">L</span>
                    <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-energy ring-2 ring-surface" />
                  </span>
                  <div className="leading-tight">
                    <div className="font-display text-base text-ink">Learn AI</div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">CBSE PCMB</div>
                  </div>
                </div>
                <div className="relative mt-5 flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                  <span className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${meta.tone}`}>
                    {meta.label} workspace
                  </span>
                </div>
                <div className="relative mt-2 truncate text-sm font-medium text-ink">{user.name}</div>
                <div className="relative mt-0.5 truncate text-xs text-muted">{roleLabels[user.role]}</div>
              </div>

              <nav className="rounded-2xl border border-line bg-surface p-2 shadow-card">
                <div className="px-3 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">
                  Navigation
                </div>
                <div className="space-y-0.5">
                  {navigationByRole[role].map((item) => {
                    const active = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition ${
                          active
                            ? "bg-primary-soft text-primary-strong"
                            : "text-ink-soft hover:bg-surface-2 hover:text-ink"
                        }`}
                      >
                        <span>{item.label}</span>
                        {active ? <span className="h-1.5 w-1.5 rounded-full bg-primary" /> : null}
                      </Link>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="mt-2 w-full rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm font-medium text-ink-soft transition hover:bg-surface hover:text-ink"
                >
                  Sign out
                </button>
              </nav>
            </div>
          </aside>

          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
