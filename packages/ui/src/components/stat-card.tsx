interface StatCardProps {
  label: string;
  value: string;
  hint: string;
  tone?: "indigo" | "amber" | "emerald" | "violet" | "rose";
}

const toneMap: Record<NonNullable<StatCardProps["tone"]>, { chip: string; ring: string; dot: string }> = {
  indigo: { chip: "text-primary", ring: "from-primary/20 to-primary/0", dot: "bg-primary" },
  amber: { chip: "text-energy", ring: "from-energy/25 to-energy/0", dot: "bg-energy" },
  emerald: { chip: "text-progress", ring: "from-progress/25 to-progress/0", dot: "bg-progress" },
  violet: { chip: "text-math", ring: "from-math/25 to-math/0", dot: "bg-math" },
  rose: { chip: "text-warn", ring: "from-warn/25 to-warn/0", dot: "bg-warn" }
};

export function StatCard({ label, value, hint, tone = "indigo" }: StatCardProps) {
  const t = toneMap[tone];
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-line bg-surface p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-hover">
      <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${t.ring} blur-xl`} />
      <div className="relative flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />
        <span className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${t.chip}`}>{label}</span>
      </div>
      <div className="font-display relative mt-3 text-4xl text-ink">{value}</div>
      <div className="relative mt-2 max-w-[18rem] text-sm leading-6 text-ink-soft">{hint}</div>
    </div>
  );
}
