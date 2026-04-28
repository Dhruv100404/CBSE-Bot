import Link from "next/link";
import { GradientBadge, SectionCard, StatCard } from "@repo/ui";

const subjects = [
  { name: "Physics", tone: "physics", emoji: "⚛", detail: "Numericals, derivations, laws, units, field intuition." },
  { name: "Chemistry", tone: "chem", emoji: "⚗", detail: "Reactions, balancing, mechanisms, stoichiometry, trends." },
  { name: "Mathematics", tone: "math", emoji: "∑", detail: "Proofs, calculus, graphs, identities, applied problem sets." },
  { name: "Biology", tone: "bio", emoji: "🧬", detail: "Processes, diagrams, genetics, physiology, terminology." }
] as const;

const subjectStyles: Record<(typeof subjects)[number]["tone"], string> = {
  physics: "border-primary/20 bg-primary-soft text-primary-strong",
  chem: "border-progress/30 bg-progress-soft text-progress",
  math: "border-math/30 bg-math-soft text-math",
  bio: "border-warn/30 bg-warn-soft text-warn"
};

export default function HomePage() {
  return (
    <div className="space-y-10">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl border border-line bg-surface px-6 py-12 shadow-card xl:px-12 xl:py-16">
        <div className="bg-mesh pointer-events-none absolute inset-0 opacity-90" />
        <div className="bg-dots pointer-events-none absolute inset-0 opacity-40" />
        <div className="animate-aurora pointer-events-none absolute -right-20 -top-32 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="animate-aurora pointer-events-none absolute -left-32 top-40 h-72 w-72 rounded-full bg-energy/20 blur-3xl" />
        <div className="animate-float pointer-events-none absolute right-12 top-12 hidden h-16 w-16 rotate-12 rounded-2xl border border-primary/20 bg-primary-soft md:block" />
        <div className="animate-float pointer-events-none absolute right-32 top-40 hidden h-10 w-10 -rotate-6 rounded-xl border border-energy/30 bg-energy-soft md:block" />

        <div className="relative grid gap-10 xl:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary backdrop-blur">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              CBSE Class 11 · 12
            </div>
            <h1 className="font-display mt-5 text-[2.5rem] leading-[1.02] tracking-tight text-ink sm:text-6xl xl:text-[4.25rem]">
              Study smart.{" "}
              <span className="bg-gradient-to-r from-primary via-math to-warn bg-clip-text text-transparent">
                Score loud.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-ink-soft xl:text-lg">
              An AI-first workspace built for serious CBSE prep — tutor, quizzes, paper uploads, blueprint-led paper studio for teachers, all in one calm, focused product.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/student"
                className="group inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-primary hover:shadow-hover"
              >
                Enter student workspace
                <span className="transition group-hover:translate-x-0.5">→</span>
              </Link>
              <Link
                href="/teacher"
                className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-5 py-3 text-sm font-semibold text-ink transition hover:border-progress/40 hover:bg-progress-soft hover:text-progress"
              >
                Open teacher studio
              </Link>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {subjects.map((subject) => (
                <div
                  key={subject.name}
                  className="group relative overflow-hidden rounded-2xl border border-line bg-surface p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-hover"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border text-lg ${subjectStyles[subject.tone]}`}
                    >
                      {subject.emoji}
                    </span>
                    <div className="font-display text-lg text-ink">{subject.name}</div>
                  </div>
                  <div className="mt-3 text-sm leading-6 text-ink-soft">{subject.detail}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right side · floating preview card */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-3xl border border-line bg-surface p-6 shadow-hover">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/15 blur-3xl" />
              <div className="absolute -bottom-20 -left-12 h-44 w-44 rounded-full bg-energy/15 blur-3xl" />

              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                    <span className="h-1.5 w-1.5 rounded-full bg-progress" />
                    Today
                  </div>
                  <div className="animate-pulse-soft inline-flex items-center gap-1.5 rounded-full bg-energy-soft px-2.5 py-1 text-[11px] font-semibold text-energy">
                    🔥 12 day streak
                  </div>
                </div>

                <div className="font-display mt-4 text-2xl leading-tight text-ink">
                  Your next win is one focused tutor session away.
                </div>

                <div className="mt-5 space-y-3">
                  <div className="rounded-xl border border-primary/20 bg-primary-soft p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                        Mission · 1
                      </div>
                      <div className="text-xs font-medium text-primary">Physics</div>
                    </div>
                    <div className="mt-2 font-display text-base text-ink">Resolve electrostatics doubt chain</div>
                    <div className="mt-1 text-xs text-ink-soft">~12 min · clears two recurring numericals</div>
                  </div>
                  <div className="rounded-xl border border-progress/20 bg-progress-soft p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-progress">
                        Mission · 2
                      </div>
                      <div className="text-xs font-medium text-progress">Quiz</div>
                    </div>
                    <div className="mt-2 font-display text-base text-ink">10-question targeted drill</div>
                    <div className="mt-1 text-xs text-ink-soft">Right after the tutor block, before switching subjects</div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between rounded-xl border border-line bg-surface-2 px-4 py-3">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">Readiness</div>
                    <div className="font-display text-xl text-ink">78%</div>
                  </div>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3 ml-4">
                    <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-primary via-math to-warn" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="grid gap-4 lg:grid-cols-4">
        <StatCard tone="indigo" label="Subjects" value="4" hint="Physics, Chemistry, Mathematics, Biology." />
        <StatCard tone="violet" label="Span" value="11–12" hint="Full CBSE syllabus, chapter-aware tooling." />
        <StatCard tone="emerald" label="Engines" value="3" hint="Tutor, Quiz, Paper Studio — all interconnected." />
        <StatCard tone="amber" label="Status" value="Beta" hint="A fresh design system tuned for real exam workflow." />
      </div>

      {/* Workspace CTAs */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          accent="indigo"
          title="Student workspace"
          description="Doubt solving, chapter practice, paper upload, and a revision rhythm that actually feels human."
        >
          <div className="flex flex-wrap gap-2">
            <Link href="/student" className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary">
              Preview dashboard
            </Link>
            <Link href="/student/tutor" className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:bg-surface-2">
              Open tutor
            </Link>
          </div>
        </SectionCard>
        <SectionCard
          accent="emerald"
          title="Teacher workspace"
          description="Blueprint-led generation, question bank curation, draft refinement, export-ready paper operations."
        >
          <div className="flex flex-wrap gap-2">
            <Link href="/teacher" className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-progress">
              Preview teacher home
            </Link>
            <Link href="/teacher/paper-studio" className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:bg-surface-2">
              Open paper studio
            </Link>
          </div>
        </SectionCard>
      </div>

      {/* Tagline grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
          <GradientBadge label="Built for students" tone="indigo" />
          <div className="font-display mt-4 text-lg leading-tight text-ink">A study app that doesn't talk down to you.</div>
          <div className="mt-2 text-sm leading-6 text-ink-soft">Mission-led dashboards, weak-topic radar, and revision loops that respect your time.</div>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
          <GradientBadge label="Built for teachers" tone="emerald" />
          <div className="font-display mt-4 text-lg leading-tight text-ink">A paper studio, not a chatbot wrapper.</div>
          <div className="mt-2 text-sm leading-6 text-ink-soft">Blueprint-first drafting, replaceable items, answer keys and marking schemes that ship together.</div>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
          <GradientBadge label="Built for the system" tone="amber" />
          <div className="font-display mt-4 text-lg leading-tight text-ink">CBSE-first, syllabus-aware, exam-real.</div>
          <div className="mt-2 text-sm leading-6 text-ink-soft">Every workflow starts from chapter structure and blueprint constraints — not vibes.</div>
        </div>
      </div>
    </div>
  );
}
