interface GradientBadgeProps {
  label: string;
  tone?: "indigo" | "amber" | "emerald" | "violet" | "rose" | "neutral";
}

const toneMap: Record<NonNullable<GradientBadgeProps["tone"]>, string> = {
  indigo: "bg-primary-soft text-primary-strong border-primary/20",
  amber: "bg-energy-soft text-energy border-energy/30",
  emerald: "bg-progress-soft text-progress border-progress/30",
  violet: "bg-math-soft text-math border-math/30",
  rose: "bg-warn-soft text-warn border-warn/30",
  neutral: "bg-surface-2 text-ink-soft border-line"
};

export function GradientBadge({ label, tone = "indigo" }: GradientBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${toneMap[tone]}`}
    >
      <span className="h-1 w-1 rounded-full bg-current" />
      {label}
    </span>
  );
}
