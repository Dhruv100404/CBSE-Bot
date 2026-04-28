import Link from "next/link";
import { GradientBadge, PageShell, SectionCard } from "@repo/ui";

export default function TryPage() {
  return (
    <PageShell
      eyebrow="Try it"
      title="A guided demo, not a teaser."
      description="A controlled preview of the product's strongest flows — without an account."
    >
      <div className="flex flex-wrap gap-2">
        <GradientBadge label="Tutor preview" tone="indigo" />
        <GradientBadge label="Paper preview" tone="emerald" />
        <GradientBadge label="Teacher preview" tone="violet" />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <SectionCard accent="indigo" title="Ask a guided doubt" description="See how a cited, chapter-aware answer would feel — before making an account.">
          <Link href="/login" className="inline-flex rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary">
            Open demo →
          </Link>
        </SectionCard>
        <SectionCard accent="emerald" title="Upload a sample paper" description="Preview the paper-solver flow with controlled demo boundaries and watermarking.">
          <div className="rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-ink-soft">
            Public solver preview — coming next
          </div>
        </SectionCard>
        <SectionCard accent="violet" title="Teacher workflow" description="Inspect blueprint-led generation and exports — positioned for teachers.">
          <Link href="/teacher-tools" className="inline-flex rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:bg-surface-2">
            See teacher tools
          </Link>
        </SectionCard>
      </div>
    </PageShell>
  );
}
