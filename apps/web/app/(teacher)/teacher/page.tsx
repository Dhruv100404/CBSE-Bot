import Link from "next/link";
import { GradientBadge, PageShell, SectionCard, StatCard } from "@repo/ui";

const classPulse = [
  { name: "XII-A", detail: "Electrochemistry is the weakest current chapter.", tone: "rose" },
  { name: "XII-B", detail: "Math timed accuracy dropped on application-based calculus.", tone: "indigo" },
  { name: "XI-A", detail: "Biology terminology is strong but diagrams are weak.", tone: "emerald" }
] as const;

const pulseStyles: Record<(typeof classPulse)[number]["tone"], string> = {
  rose: "border-warn/25 bg-warn-soft",
  indigo: "border-primary/25 bg-primary-soft",
  emerald: "border-progress/25 bg-progress-soft"
};

export default function TeacherDashboardPage() {
  return (
    <PageShell
      accent="emerald"
      eyebrow="Teacher desk"
      title="Build papers without losing control over quality."
      description="Live drafts, blueprint confidence, question access, and class signals — in one calm frame."
    >
      <div className="flex flex-wrap gap-2">
        <GradientBadge label="Blueprint-led drafting" tone="emerald" />
        <GradientBadge label="Question bank control" tone="indigo" />
        <GradientBadge label="Export-ready" tone="amber" />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <StatCard tone="emerald" label="Active drafts" value="6" hint="Three unit tests, two practice sheets, one mock revision paper." />
        <StatCard tone="indigo" label="Blueprint fit" value="84%" hint="Most blueprint slots can be filled from curated inventory." />
        <StatCard tone="violet" label="Classes watched" value="4" hint="Usage and weak-topic patterns by class slice." />
        <StatCard tone="amber" label="Next action" value="XII mock" hint="A full-paper draft is one click from generation." />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          accent="emerald"
          title="Paper operations"
          description="Creation and review first — not decorative summary cards."
        >
          <div className="grid gap-3 md:grid-cols-2">
            <Link
              href="/teacher/paper-studio/new"
              className="group relative overflow-hidden rounded-xl border border-progress/20 bg-progress-soft p-5 transition hover:-translate-y-0.5 hover:shadow-hover"
            >
              <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-progress/20 blur-xl" />
              <div className="relative text-[11px] font-semibold uppercase tracking-[0.18em] text-progress">Start</div>
              <div className="font-display relative mt-2 text-xl text-ink">New blueprint</div>
              <div className="relative mt-1 text-sm leading-6 text-ink-soft">
                Set marks, duration, chapter coverage and section distribution before generation.
              </div>
            </Link>
            <Link
              href="/teacher/question-bank"
              className="group relative overflow-hidden rounded-xl border border-primary/20 bg-primary-soft p-5 transition hover:-translate-y-0.5 hover:shadow-hover"
            >
              <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-primary/20 blur-xl" />
              <div className="relative text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Search</div>
              <div className="font-display relative mt-2 text-xl text-ink">Question bank</div>
              <div className="relative mt-1 text-sm leading-6 text-ink-soft">
                Search by chapter, type, marks, or replacement intent without losing draft context.
              </div>
            </Link>
          </div>

          <div className="mt-4 rounded-xl border border-line bg-surface p-5">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-energy" />
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-energy">Recent draft focus</div>
            </div>
            <div className="font-display mt-2 text-2xl text-ink">Class XII Physics pre-board</div>
            <div className="mt-2 text-sm leading-6 text-ink-soft">
              Coverage is strong, but section B has too many low-challenge numericals — replace two items before export.
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/teacher/paper-studio" className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-progress">
                Open in studio →
              </Link>
              <button className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:bg-surface-2">
                View blueprint
              </button>
            </div>
          </div>
        </SectionCard>

        <div className="space-y-4">
          <SectionCard
            accent="rose"
            title="Class pulse"
            description="See where performance is thinning before setting the next paper."
          >
            <div className="space-y-3">
              {classPulse.map((c) => (
                <div key={c.name} className={`rounded-xl border ${pulseStyles[c.tone]} p-4`}>
                  <div className="font-display text-lg text-ink">{c.name}</div>
                  <div className="mt-1 text-sm leading-6 text-ink-soft">{c.detail}</div>
                </div>
              ))}
            </div>
          </SectionCard>
          <SectionCard accent="amber" title="Fast actions" description="Dense tools, one step away.">
            <div className="grid gap-2">
              {[
                { href: "/teacher/uploads", label: "Upload worksheet or answer key" },
                { href: "/teacher/analytics", label: "Open class analytics" },
                { href: "/teacher/classes", label: "Manage classes" }
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="group flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3 transition hover:border-line-strong hover:bg-surface-2"
                >
                  <span className="text-sm font-medium text-ink">{l.label}</span>
                  <span className="text-ink-soft transition group-hover:translate-x-0.5 group-hover:text-ink">→</span>
                </Link>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </PageShell>
  );
}
