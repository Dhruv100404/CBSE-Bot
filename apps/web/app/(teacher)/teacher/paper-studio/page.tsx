import Link from "next/link";
import { GradientBadge, PageShell, SectionCard, StatCard } from "@repo/ui";

const blueprint = [
  { label: "Class", value: "XII" },
  { label: "Subject", value: "Physics" },
  { label: "Marks", value: "70" },
  { label: "Duration", value: "3 hours" },
  { label: "Profile", value: "Balanced + hard tail" }
];

const sections = [
  {
    title: "Section A",
    subtitle: "Objective + very short answers",
    detail: "12 questions · high syllabus coverage · scan readability strong.",
    status: "Healthy",
    tone: "emerald" as const
  },
  {
    title: "Section B",
    subtitle: "Short numericals and concept questions",
    detail: "Needs two better differentiators so toppers separate from medium achievers.",
    status: "Needs swap",
    tone: "rose" as const
  },
  {
    title: "Section C",
    subtitle: "Long answers and derivations",
    detail: "Good structure, but one repeated electrostatics idea should be replaced.",
    status: "Minor fix",
    tone: "amber" as const
  }
];

const sectionStyles: Record<(typeof sections)[number]["tone"], { bar: string; chip: string }> = {
  emerald: { bar: "bg-progress", chip: "bg-progress-soft text-progress" },
  rose: { bar: "bg-warn", chip: "bg-warn-soft text-warn" },
  amber: { bar: "bg-energy", chip: "bg-energy-soft text-energy" }
};

export default function TeacherPaperStudioPage() {
  return (
    <PageShell
      accent="emerald"
      eyebrow="Paper studio"
      title="Blueprint first. Draft second. Export only when it's ready."
      description="Constraints on one side, live paper quality in the middle, export actions held until the draft earns them."
    >
      <div className="flex flex-wrap gap-2">
        <GradientBadge label="Draft preview" tone="indigo" />
        <GradientBadge label="Replace question" tone="amber" />
        <GradientBadge label="Answer key + marking" tone="emerald" />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <StatCard tone="emerald" label="Drafts in flight" value="6" hint="Working sets across Physics, Chemistry, Mathematics." />
        <StatCard tone="indigo" label="Coverage" value="82%" hint="Most current drafts match chapter distribution targets." />
        <StatCard tone="rose" label="Duplicates flagged" value="2" hint="Two question collisions need replacement before export." />
        <StatCard tone="amber" label="Ready to export" value="3" hint="Three papers are close to PDF/DOCX handoff." />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[0.78fr_1.22fr_0.9fr]">
        <SectionCard accent="indigo" title="Blueprint" description="Structural constraints stay visible at all times.">
          <div className="space-y-2">
            {blueprint.map((b) => (
              <div key={b.label} className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{b.label}</div>
                <div className="font-display text-sm text-ink">{b.value}</div>
              </div>
            ))}
          </div>
          <Link href="/teacher/paper-studio/new" className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary">
            New blueprint →
          </Link>
        </SectionCard>

        <SectionCard accent="emerald" title="Live paper preview" description="Watch the paper take shape section by section.">
          <div className="space-y-3">
            {sections.map((s) => {
              const style = sectionStyles[s.tone];
              return (
                <div key={s.title} className="relative overflow-hidden rounded-xl border border-line bg-surface p-4 transition hover:border-line-strong hover:shadow-card">
                  <span className={`absolute left-0 top-0 h-full w-1 ${style.bar}`} />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-display text-lg text-ink">{s.title}</div>
                      <div className="mt-0.5 text-xs text-muted">{s.subtitle}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${style.chip}`}>
                        {s.status}
                      </span>
                      <button className="rounded-full border border-line bg-surface px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft transition hover:bg-surface-2 hover:text-ink">
                        Replace
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 text-sm leading-6 text-ink-soft">{s.detail}</div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard accent="amber" title="Output controls" description="Once the draft feels right, export should feel immediate and trustworthy.">
          <div className="space-y-2">
            {[
              "Generate answer key + marking scheme alongside the paper.",
              "Export PDF for print flow, DOCX for school-side edits.",
              "Create alternate sets after de-duplication, not before."
            ].map((tip) => (
              <div key={tip} className="rounded-xl border border-line bg-surface-2 px-4 py-3 text-xs leading-5 text-ink-soft">
                {tip}
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-2">
            <button type="button" className="rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-progress">
              Export draft
            </button>
            <button type="button" className="rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-surface-2">
              Generate answer key
            </button>
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}
