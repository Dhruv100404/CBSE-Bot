"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Role } from "@repo/types";
import { PageShell, SectionCard } from "@repo/ui";
import { useAuth } from "@/components/auth-provider";

const demoRoles: Array<{ role: Role; label: string; href: string; note: string; tone: "indigo" | "emerald" | "amber" }> = [
  { role: "student", label: "Student", href: "/student", tone: "indigo", note: "See the study loop, tutor shell, and dashboard rhythm." },
  { role: "teacher", label: "Teacher", href: "/teacher", tone: "emerald", note: "Inspect the teacher desk and paper studio direction." },
  { role: "platform_admin", label: "Admin", href: "/admin", tone: "amber", note: "Open the review and operations side of the product." }
];

const toneStyles: Record<(typeof demoRoles)[number]["tone"], { ring: string; chip: string; bar: string }> = {
  indigo: { ring: "hover:border-primary/40 hover:bg-primary-soft", chip: "bg-primary-soft text-primary-strong", bar: "bg-primary" },
  emerald: { ring: "hover:border-progress/40 hover:bg-progress-soft", chip: "bg-progress-soft text-progress", bar: "bg-progress" },
  amber: { ring: "hover:border-energy/40 hover:bg-energy-soft", chip: "bg-energy-soft text-energy", bar: "bg-energy" }
};

export default function LoginPage() {
  const router = useRouter();
  const { loginAsDemo } = useAuth();

  function handleDemoLogin(role: Role, href: string) {
    loginAsDemo(role);
    router.push(href);
  }

  return (
    <PageShell
      eyebrow="Sign in"
      title="Pick a workspace and dive in."
      description="Demo logins skip the form so you can feel the product right away. Real auth lands next."
    >
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <SectionCard accent="indigo" title="Choose a demo role" description="Each role unlocks a different surface of the product.">
          <div className="space-y-3">
            {demoRoles.map((item) => {
              const t = toneStyles[item.tone];
              return (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => handleDemoLogin(item.role, item.href)}
                  className={`group relative w-full overflow-hidden rounded-xl border border-line bg-surface px-5 py-4 text-left transition ${t.ring}`}
                >
                  <span className={`absolute left-0 top-0 h-full w-1 ${t.bar}`} />
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${t.chip}`}>
                          Demo
                        </span>
                        <span className="font-display text-lg text-ink">{item.label}</span>
                      </div>
                      <div className="mt-1 text-sm leading-6 text-ink-soft">{item.note}</div>
                    </div>
                    <span className="mt-1 text-ink-soft transition group-hover:translate-x-0.5 group-hover:text-ink">→</span>
                  </div>
                </button>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard accent="emerald" title="Production auth path" description="The visual shell is ready for full API-backed login without another redesign.">
          <div className="rounded-xl border border-line bg-surface-2 p-4 text-sm leading-6 text-ink-soft">
            Next step: connect this page to <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs text-ink">POST /v1/auth/login</code> and persist access plus refresh tokens with the same surface treatment.
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/signup" className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary">
              Create account
            </Link>
            <Link href="/" className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:bg-surface-2">
              Back to home
            </Link>
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}
