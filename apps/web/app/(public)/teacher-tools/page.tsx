import Link from "next/link";
import { GradientBadge, PageShell, SectionCard } from "@repo/ui";

export default function TeacherToolsPage() {
  return (
    <PageShell
      accent="emerald"
      eyebrow="Teacher tools"
      title="Paper generation as a craft desk — not a spin-the-wheel prompt box."
      description="Built for teachers who need structure, replacement controls, answer keys, and exports that are actually usable."
    >
      <div className="flex flex-wrap gap-2">
        <GradientBadge label="Blueprint builder" tone="emerald" />
        <GradientBadge label="Question bank" tone="indigo" />
        <GradientBadge label="Answer key + export" tone="amber" />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <SectionCard accent="emerald" title="What teachers get" description="Built around the reality of setting papers under academic constraints.">
          <div className="grid gap-2 md:grid-cols-2">
            {[
              "Set marks, duration, sections, and difficulty first",
              "Fill drafts from retrieved questions before generation",
              "Replace weak questions without breaking structure",
              "Export paper, answer key, and marking scheme together"
            ].map((item) => (
              <div key={item} className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink">
                {item}
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard accent="indigo" title="Open the studio" description="Lead directly into the product's strongest teacher flow.">
          <Link href="/teacher/paper-studio" className="inline-flex rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-progress">
            Open paper studio →
          </Link>
        </SectionCard>
      </div>
    </PageShell>
  );
}
