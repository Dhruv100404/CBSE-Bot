"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

const links = [
  { href: "/", label: "Home" },
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/try", label: "Try" },
  { href: "/teacher-tools", label: "Teachers" },
  { href: "/schools", label: "Schools" }
];

export function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="relative min-h-screen overflow-hidden bg-bg">
      <div className="bg-mesh pointer-events-none absolute inset-x-0 top-0 h-[36rem] opacity-70" />
      <div className="bg-dots pointer-events-none absolute inset-x-0 top-0 h-[36rem] opacity-40" />

      <header className="sticky top-0 z-30 px-4 pt-4 lg:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-2xl border border-line bg-surface/85 px-4 py-3 shadow-card backdrop-blur-md xl:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary to-math text-white shadow-ring">
              <span className="font-display text-base">L</span>
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-energy ring-2 ring-surface" />
            </span>
            <span className="leading-tight">
              <span className="font-display block text-base text-ink">Learn AI</span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">CBSE PCMB</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 rounded-full border border-line bg-surface-2 p-1 md:flex">
            {links.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                    active
                      ? "bg-surface text-ink shadow-card"
                      : "text-ink-soft hover:bg-surface hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <AuthActions />
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-4 pb-20 pt-6 lg:px-6">{children}</main>

      <footer className="relative border-t border-line bg-surface px-4 py-10 lg:px-6">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-math text-white">
                <span className="font-display text-sm">L</span>
              </span>
              <span className="font-display text-lg text-ink">Learn AI</span>
            </div>
            <div className="mt-4 max-w-xl text-sm leading-6 text-ink-soft">
              Built for students who want to actually understand, and teachers who want to ship serious papers without burning a weekend.
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/student"
              className="group rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink transition hover:border-primary/40 hover:bg-primary-soft"
            >
              <div className="font-medium">Student workspace</div>
              <div className="mt-0.5 text-xs text-muted group-hover:text-primary-strong">Tutor · quizzes · revision</div>
            </Link>
            <Link
              href="/teacher"
              className="group rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink transition hover:border-progress/40 hover:bg-progress-soft"
            >
              <div className="font-medium">Teacher workspace</div>
              <div className="mt-0.5 text-xs text-muted group-hover:text-progress">Blueprint · question bank · export</div>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function AuthActions() {
  const { user, logout } = useAuth();

  if (user) {
    return (
      <button
        type="button"
        onClick={logout}
        className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:bg-surface-2"
      >
        Sign out
      </button>
    );
  }

  return (
    <div className="flex gap-2">
      <Link
        href="/login"
        className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:bg-surface-2"
      >
        Login
      </Link>
      <Link
        href="/signup"
        className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary"
      >
        Start free
      </Link>
    </div>
  );
}
