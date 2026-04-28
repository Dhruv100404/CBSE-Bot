import { EmptyState, GradientBadge, PageShell, SectionCard, StatCard } from "@repo/ui";

interface PlaceholderPageProps {
  title: string;
  description: string;
  badge: string;
  primaryAction: string;
  secondaryAction: string;
}

export function PlaceholderPage({
  title,
  description,
  badge,
  primaryAction,
  secondaryAction
}: PlaceholderPageProps) {
  return (
    <PageShell eyebrow="Coming up" title={title} description={description}>
      <div className="flex flex-wrap gap-2">
        <GradientBadge label={badge} tone="indigo" />
        <GradientBadge label="Structured surface" tone="emerald" />
        <GradientBadge label="Ready for data" tone="amber" />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <StatCard
          tone="indigo"
          label="Primary move"
          value={primaryAction}
          hint="This screen is laid out around one clear first action instead of a vague placeholder zone."
        />
        <StatCard
          tone="violet"
          label="Secondary move"
          value={secondaryAction}
          hint="Secondary actions sit nearby without fighting the main workflow for attention."
        />
        <StatCard
          tone="amber"
          label="Status"
          value="Fresh shell"
          hint="The page now inherits the new design language across type, spacing, and surfaces."
        />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <SectionCard
          accent="indigo"
          title="What lands next"
          description="This page can absorb charts, forms, answer panels, or workflow state without another visual rewrite."
        >
          <EmptyState
            title="Connected data pending"
            description="The next sprint plugs in real API state and domain workflows on top of this skeleton."
          />
        </SectionCard>
        <SectionCard
          accent="emerald"
          title="Interaction contract"
          description="Action hierarchy, scan rhythm, and supporting context now feel like one product system."
        >
          <div className="rounded-xl border border-line bg-surface-2 p-4 text-sm leading-6 text-ink-soft">
            Calmer, more professional surface — reads like a real product, not a rushed prototype.
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}
