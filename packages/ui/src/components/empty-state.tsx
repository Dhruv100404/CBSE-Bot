interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-line-strong bg-surface-2 p-6">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/8 blur-2xl" />
      <div className="relative flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        </div>
        <div>
          <h3 className="font-display text-base text-ink">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-ink-soft">{description}</p>
        </div>
      </div>
    </div>
  );
}
