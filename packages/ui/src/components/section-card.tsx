import type { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  description: string;
  children?: ReactNode;
  accent?: "indigo" | "amber" | "emerald" | "violet" | "rose" | "none";
}

const accentBar: Record<NonNullable<SectionCardProps["accent"]>, string> = {
  indigo: "bg-primary",
  amber: "bg-energy",
  emerald: "bg-progress",
  violet: "bg-math",
  rose: "bg-warn",
  none: "bg-transparent"
};

export function SectionCard({ title, description, children, accent = "none" }: SectionCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-line bg-surface p-6 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-hover">
      <div className={`absolute left-6 top-0 h-1 w-12 rounded-b-full ${accentBar[accent]}`} />
      <h2 className="font-display text-xl leading-tight text-ink sm:text-2xl">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-ink-soft">{description}</p>
      {children ? <div className="mt-5">{children}</div> : null}
    </div>
  );
}
