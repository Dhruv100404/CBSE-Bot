import Link from "next/link";
import { GradientBadge, PageShell, SectionCard } from "@repo/ui";

const pillars = [
  {
    title: "Student clarity",
    accent: "indigo" as const,
    summary: "Tutor flows, chapter context, paper uploads, and revision actions stay in one loop instead of feeling like separate tools.",
    notes: ["Cited tutoring", "Question-wise paper solving", "Mistake-to-revision flow"]
  },
  {
    title: "Teacher control",
    accent: "emerald" as const,
    summary: "Paper generation starts from blueprint logic, not vague prompting, so the output is easy to trust and easy to refine.",
    notes: ["Blueprint builder", "Question bank replacement", "Answer key + export pipeline"]
  },
  {
    title: "Operational visibility",
    accent: "amber" as const,
    summary: "Admin and reviewer surfaces exist to correct tags, inspect low-confidence outputs, and observe AI quality over time.",
    notes: ["Review queue", "Eval hooks", "Prompt and source observability"]
  }
];

export default function FeaturesPage() {
  return (
    <PageShell
      eyebrow="Features"
      title="A product, not a list of screens."
      description="Three interconnected academic systems: learning, paper production, and quality control."
    >
      <div className="flex flex-wrap gap-2">
        <GradientBadge label="Tutor" tone="indigo" />
        <GradientBadge label="Quiz" tone="emerald" />
        <GradientBadge label="Paper studio" tone="violet" />
        <GradientBadge label="Review ops" tone="amber" />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {pillars.map((pillar) => (
          <SectionCard key={pillar.title} accent={pillar.accent} title={pillar.title} description={pillar.summary}>
            <div className="space-y-2">
              {pillar.notes.map((note) => (
                <div key={note} className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink">
                  {note}
                </div>
              ))}
            </div>
          </SectionCard>
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <SectionCard accent="indigo" title="How the product feels" description="Confident and structured before users even sign in.">
          <div className="space-y-3 text-sm leading-6 text-ink-soft">
            <p>The interface is intentional and quiet, less like a generic AI landing page.</p>
            <p>Every page communicates purpose, not just placeholders or shiny surfaces.</p>
            <p>The voice is academic and operational — not gimmicky.</p>
          </div>
        </SectionCard>
        <SectionCard accent="emerald" title="Entry points" description="Different users recognize themselves immediately from the public layer.">
          <div className="grid gap-2">
            {[
              { href: "/student", label: "Student experience" },
              { href: "/teacher-tools", label: "Teacher toolkit" },
              { href: "/schools", label: "Institution view" }
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="group flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink transition hover:border-line-strong hover:bg-surface-2"
              >
                {l.label}
                <span className="text-ink-soft transition group-hover:translate-x-0.5 group-hover:text-ink">→</span>
              </Link>
            ))}
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}
