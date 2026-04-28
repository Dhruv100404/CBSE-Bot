import { GradientBadge, PageShell, SectionCard } from "@repo/ui";

const contextItems = [
  { label: "Subject", value: "Physics", tone: "indigo" },
  { label: "Chapter", value: "Electrostatics", tone: "indigo" },
  { label: "Mode", value: "Board style", tone: "violet" },
  { label: "Attachment", value: "None yet", tone: "neutral" }
] as const;

const chipStyles: Record<(typeof contextItems)[number]["tone"], string> = {
  indigo: "bg-primary-soft text-primary-strong",
  violet: "bg-math-soft text-math",
  neutral: "bg-surface-2 text-muted"
};

const followUps = [
  "Generate 5 follow-up numericals on the same concept.",
  "Convert the answer into a quick revision note.",
  "Save the doubt and tag it as weak-topic evidence."
];

export default function StudentTutorPage() {
  return (
    <PageShell
      eyebrow="Tutor"
      title="Ask sharper questions. Read cleaner answers. Stay inside the chapter."
      description="An editorial explanation flow with visible context, calm framing, and room for citations and follow-up drills."
    >
      <div className="flex flex-wrap gap-2">
        <GradientBadge label="Board-style mode" tone="indigo" />
        <GradientBadge label="Citations" tone="emerald" />
        <GradientBadge label="Follow-up drills" tone="amber" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard
          accent="indigo"
          title="Conversation"
          description="A guided explanation sheet — not a loose chatbot transcript."
        >
          <div className="space-y-4">
            {/* Student prompt */}
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-ink px-4 py-3 text-sm leading-6 text-white">
                Explain why electric field inside a conductor is zero, and show how this idea appears in numerical questions.
              </div>
            </div>

            {/* Tutor response */}
            <div className="flex items-start gap-3">
              <div className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-math text-white">
                <span className="font-display text-xs">L</span>
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-line bg-surface px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Tutor · structured</div>
                <div className="mt-2 space-y-3 text-sm leading-6 text-ink">
                  <p><strong className="text-ink">Intuition.</strong> Inside a conductor at electrostatic equilibrium, free charges have already redistributed so that no internal field can keep pushing them.</p>
                  <p><strong className="text-ink">Argument.</strong> If E ≠ 0, charges would accelerate — contradicting equilibrium. So E must be 0 inside.</p>
                  <p><strong className="text-ink">Exam bridge.</strong> This is the unstated assumption behind most "spherical shell" and "cavity inside conductor" numericals in CBSE.</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-medium text-primary-strong">NCERT 12 · Ch. 1</span>
                  <span className="rounded-full bg-progress-soft px-2 py-0.5 text-[10px] font-medium text-progress">Concept · Equilibrium</span>
                </div>
              </div>
            </div>

            {/* Input bar */}
            <div className="rounded-2xl border border-line bg-surface-2 p-3">
              <div className="flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-3">
                <span className="text-muted">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </span>
                <span className="flex-1 text-sm text-muted">Ask a doubt, paste a problem, or attach a paper page…</span>
                <button className="rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary">
                  Send
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 px-1">
                {["Attach image", "From paper", "Voice"].map((c) => (
                  <button key={c} className="rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-medium text-ink-soft transition hover:bg-surface-2">
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        <div className="space-y-4">
          <SectionCard accent="violet" title="Context rail" description="Subject, chapter, and mode stay visible so the tutor never feels detached from syllabus scope.">
            <div className="grid grid-cols-2 gap-2">
              {contextItems.map((c) => (
                <div key={c.label} className="rounded-xl border border-line bg-surface p-3">
                  <div className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${chipStyles[c.tone]}`}>
                    {c.label}
                  </div>
                  <div className="font-display mt-2 text-base text-ink">{c.value}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard accent="amber" title="What's next" description="The tutor always suggests the next move, not just the current answer.">
            <div className="space-y-2">
              {followUps.map((f) => (
                <button
                  key={f}
                  className="group flex w-full items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-left transition hover:border-line-strong hover:bg-surface-2"
                >
                  <span className="text-sm leading-6 text-ink">{f}</span>
                  <span className="text-ink-soft transition group-hover:translate-x-0.5 group-hover:text-ink">→</span>
                </button>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </PageShell>
  );
}
