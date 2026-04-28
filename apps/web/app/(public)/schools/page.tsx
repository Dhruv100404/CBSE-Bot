import { GradientBadge, PageShell, SectionCard, StatCard } from "@repo/ui";

export default function SchoolsPage() {
  return (
    <PageShell
      accent="amber"
      eyebrow="For schools"
      title="A serious briefing — not generic sales copy."
      description="A structured academic system for schools, coaching centers, and shared teaching teams."
    >
      <div className="flex flex-wrap gap-2">
        <GradientBadge label="Org dashboards" tone="indigo" />
        <GradientBadge label="Shared banks" tone="emerald" />
        <GradientBadge label="Seat visibility" tone="amber" />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard tone="indigo" label="Use case" value="Schools" hint="Academic leadership, shared question workflows, class-level insight." />
        <StatCard tone="emerald" label="Ops view" value="Centralized" hint="One place for member roles, draft quality, and question usage." />
        <StatCard tone="amber" label="Outcome" value="Faster prep" hint="Less fragmentation across teachers, sections, paper cycles." />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <SectionCard accent="indigo" title="Why institutions care" description="Consistency and visibility — not just AI novelty.">
          <div className="space-y-3 text-sm leading-6 text-ink-soft">
            <p>Shared question banks reduce duplication and improve continuity across teachers.</p>
            <p>Review and observability tooling lets admins inspect quality instead of trusting black-box output.</p>
            <p>Role-aware dashboards support schools, coaching centers, and larger teaching teams.</p>
          </div>
        </SectionCard>
        <SectionCard accent="emerald" title="What gets managed" description="The institution story spelled out clearly.">
          <div className="grid gap-2">
            {["Organization memberships", "Shared question workflows", "Class analytics", "Review queue visibility"].map((item) => (
              <div key={item} className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink">
                {item}
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}
