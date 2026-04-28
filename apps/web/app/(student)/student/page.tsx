import Link from "next/link";
import { GradientBadge, PageShell, SectionCard, StatCard } from "@repo/ui";

const subjectStatus = [
  { subject: "Physics", tone: "indigo", status: "On fire", detail: "Numericals improving · derivation confidence still uneven.", value: 78 },
  { subject: "Chemistry", tone: "rose", status: "Needs attention", detail: "Named reactions and balancing accuracy need a refresh block.", value: 54 },
  { subject: "Mathematics", tone: "violet", status: "Stable", detail: "Strong momentum, ready for tougher timed sets.", value: 82 },
  { subject: "Biology", tone: "emerald", status: "Drifting", detail: "Diagram recall slipping because revision spacing widened.", value: 64 }
] as const;

const subjectStyles: Record<(typeof subjectStatus)[number]["tone"], { ring: string; bar: string; chip: string }> = {
  indigo: { ring: "border-primary/25", bar: "bg-primary", chip: "bg-primary-soft text-primary-strong" },
  rose: { ring: "border-warn/25", bar: "bg-warn", chip: "bg-warn-soft text-warn" },
  violet: { ring: "border-math/25", bar: "bg-math", chip: "bg-math-soft text-math" },
  emerald: { ring: "border-progress/25", bar: "bg-progress", chip: "bg-progress-soft text-progress" }
};

const mistakes = [
  { type: "Units mismatch", subject: "Physics", source: "Coulomb's law numerical", tone: "indigo" },
  { type: "Reaction memory slip", subject: "Chemistry", source: "Haloalkanes revision", tone: "emerald" },
  { type: "Sign error", subject: "Mathematics", source: "Definite integral simplification", tone: "violet" }
] as const;

const mistakeStyles: Record<(typeof mistakes)[number]["tone"], string> = {
  indigo: "bg-primary-soft text-primary-strong",
  emerald: "bg-progress-soft text-progress",
  violet: "bg-math-soft text-math"
};

export default function StudentDashboardPage() {
  return (
    <PageShell
      eyebrow="Student dashboard"
      title="Pick up where you left off — your next move is already lined up."
      description="A focused command center for momentum, weak-area visibility, and faster jumps into tutor, quizzes, and paper uploads."
    >
      {/* Hero stat row with streak */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <GradientBadge label="Daily mission" tone="indigo" />
        <GradientBadge label="Weak topic focus" tone="rose" />
        <GradientBadge label="Revision loop" tone="emerald" />
        <span className="animate-pulse-soft ml-auto inline-flex items-center gap-1.5 rounded-full bg-energy-soft px-3 py-1 text-xs font-semibold text-energy">
          🔥 12 day streak
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard tone="indigo" label="Readiness" value="78%" hint="Physics and Maths look stable. Chemistry needs a sharper recall cycle." />
        <StatCard tone="amber" label="Practice streak" value="12 days" hint="Consistency is strong enough to support more timed work now." />
        <StatCard tone="emerald" label="Next win" value="Electrostatics" hint="One focused tutor session plus a short drill clears the current block." />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          {/* Today's mission */}
          <SectionCard
            accent="indigo"
            title="Today's mission"
            description="A short sequence so you don't waste the first ten minutes deciding what to do."
          >
            <div className="space-y-3">
              <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-primary-soft p-4">
                <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-primary/20 blur-xl" />
                <div className="relative flex items-center justify-between">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Step 1 · Tutor</div>
                  <span className="text-xs font-medium text-primary">~12 min</span>
                </div>
                <div className="font-display relative mt-2 text-xl text-ink">
                  Resolve the electrostatics doubt chain
                </div>
                <div className="relative mt-1 text-sm leading-6 text-ink-soft">
                  Open tutor with chapter context and clear the two concepts behind repeated numerical mistakes.
                </div>
              </div>
              <div className="relative overflow-hidden rounded-xl border border-progress/20 bg-progress-soft p-4">
                <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-progress/20 blur-xl" />
                <div className="relative flex items-center justify-between">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-progress">Step 2 · Quiz</div>
                  <span className="text-xs font-medium text-progress">~8 min</span>
                </div>
                <div className="font-display relative mt-2 text-xl text-ink">
                  10-question targeted drill
                </div>
                <div className="relative mt-1 text-sm leading-6 text-ink-soft">
                  Follow immediately while the explanation is fresh — before switching subjects.
                </div>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/student/tutor" className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary">
                Open tutor →
              </Link>
              <Link href="/student/quizzes" className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:bg-surface-2">
                Start quiz
              </Link>
            </div>
          </SectionCard>

          {/* Subject orbit */}
          <SectionCard
            accent="violet"
            title="Subject orbit"
            description="Where your attention should go — not just where you spent time."
          >
            <div className="space-y-3">
              {subjectStatus.map((s) => {
                const style = subjectStyles[s.tone];
                return (
                  <div key={s.subject} className={`rounded-xl border ${style.ring} bg-surface p-4`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${style.chip}`}>
                          {s.status}
                        </span>
                        <div className="font-display text-lg text-ink">{s.subject}</div>
                      </div>
                      <div className="font-display text-base text-ink-soft">{s.value}%</div>
                    </div>
                    <div className="mt-2 text-sm leading-6 text-ink-soft">{s.detail}</div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-3">
                      <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${s.value}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-4">
          {/* Recent mistakes */}
          <SectionCard
            accent="rose"
            title="Recent mistakes"
            description="Error patterns turned into next actions, not just a list."
          >
            <div className="space-y-3">
              {mistakes.map((m) => (
                <div key={m.type + m.source} className="rounded-xl border border-line bg-surface p-4 transition hover:border-line-strong">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-display text-base text-ink">{m.type}</div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${mistakeStyles[m.tone]}`}>
                      {m.subject}
                    </span>
                  </div>
                  <div className="mt-1 text-sm leading-6 text-ink-soft">{m.source}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Fast lanes */}
          <SectionCard
            accent="amber"
            title="Fast lanes"
            description="Your most common moves, one tap away."
          >
            <div className="grid gap-2">
              {[
                { href: "/student/papers/upload", label: "Upload a paper", hint: "Question-wise solutions in minutes", tone: "indigo" },
                { href: "/student/revision-plan", label: "Revision plan", hint: "Chapter sequencing for the week", tone: "violet" },
                { href: "/student/subjects", label: "Subject map", hint: "Chapter-by-chapter progress", tone: "emerald" }
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="group flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3 transition hover:border-line-strong hover:bg-surface-2"
                >
                  <div>
                    <div className="text-sm font-medium text-ink">{l.label}</div>
                    <div className="text-xs text-muted">{l.hint}</div>
                  </div>
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
