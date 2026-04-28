import Link from "next/link";
import { GradientBadge, PageShell, SectionCard } from "@repo/ui";

const plans = [
  {
    title: "Student Core",
    price: "₹ low / month",
    accent: "indigo" as const,
    points: ["Tutor questions", "Chapter quizzes", "Saved mistakes & revision cues"],
    cta: "Start as student"
  },
  {
    title: "Teacher Studio",
    price: "Professional",
    accent: "emerald" as const,
    points: ["Paper blueprints", "Draft generation", "Answer key + export tools"],
    cta: "Open studio",
    featured: true
  },
  {
    title: "School Stack",
    price: "Institutional",
    accent: "amber" as const,
    points: ["Org seats", "Shared bank workflows", "Analytics + review visibility"],
    cta: "Talk to us"
  }
];

const ringStyles: Record<(typeof plans)[number]["accent"], string> = {
  indigo: "ring-primary/30",
  emerald: "ring-progress/40",
  amber: "ring-energy/30"
};

export default function PricingPage() {
  return (
    <PageShell
      eyebrow="Pricing"
      title="Plans built around real academic jobs."
      description="Students practicing, teachers building papers, institutions managing shared workflows — three tiers, no fluff."
    >
      <div className="flex flex-wrap gap-2">
        <GradientBadge label="Student tier" tone="indigo" />
        <GradientBadge label="Teacher tier" tone="emerald" />
        <GradientBadge label="Institution tier" tone="amber" />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.title}
            className={`relative overflow-hidden rounded-2xl border bg-surface p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-hover ${
              plan.featured ? `border-progress/40 ring-2 ${ringStyles[plan.accent]}` : "border-line"
            }`}
          >
            {plan.featured ? (
              <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-progress-soft px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-progress">
                Popular
              </span>
            ) : null}
            <SectionCardInline title={plan.title} accent={plan.accent} />
            <div className="font-display mt-3 text-3xl text-ink">{plan.price}</div>
            <div className="mt-5 space-y-2">
              {plan.points.map((p) => (
                <div key={p} className="flex items-center gap-2 text-sm text-ink-soft">
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-progress-soft text-progress">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  {p}
                </div>
              ))}
            </div>
            <Link
              href="/login"
              className={`mt-6 inline-flex w-full items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                plan.featured ? "bg-progress text-white hover:bg-progress/90" : "bg-ink text-white hover:bg-primary"
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

function SectionCardInline({ title, accent }: { title: string; accent: "indigo" | "emerald" | "amber" }) {
  const chipStyles: Record<typeof accent, string> = {
    indigo: "bg-primary-soft text-primary-strong",
    emerald: "bg-progress-soft text-progress",
    amber: "bg-energy-soft text-energy"
  };
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${chipStyles[accent]}`}>
        {title}
      </span>
    </div>
  );
}
