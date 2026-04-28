import type { ReactNode } from "react";

interface PageShellProps {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
  accent?: "indigo" | "amber" | "emerald" | "violet" | "rose";
}

const accentMap: Record<NonNullable<PageShellProps["accent"]>, { dot: string; eyebrow: string }> = {
  indigo: { dot: "bg-primary", eyebrow: "text-primary" },
  amber: { dot: "bg-energy", eyebrow: "text-energy" },
  emerald: { dot: "bg-progress", eyebrow: "text-progress" },
  violet: { dot: "bg-math", eyebrow: "text-math" },
  rose: { dot: "bg-warn", eyebrow: "text-warn" }
};

export function PageShell({ eyebrow, title, description, children, accent = "indigo" }: PageShellProps) {
  const tone = accentMap[accent];

  return (
    <section className="relative overflow-hidden rounded-3xl border border-line bg-surface px-6 py-9 shadow-card xl:px-10 xl:py-12">
      <div className="bg-mesh-soft absolute inset-0 opacity-90" />
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl animate-aurora" />
      <div className="absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-energy/10 blur-3xl animate-aurora" />

      <div className="relative">
        {eyebrow ? (
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] backdrop-blur">
            <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
            <span className={tone.eyebrow}>{eyebrow}</span>
          </div>
        ) : null}
        <div className="max-w-4xl">
          <h1 className="font-display text-[2.25rem] leading-[1.05] text-ink sm:text-5xl xl:text-[3.5rem]">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-ink-soft xl:text-lg">{description}</p>
        </div>
        {children ? <div className="mt-10">{children}</div> : null}
      </div>
    </section>
  );
}
