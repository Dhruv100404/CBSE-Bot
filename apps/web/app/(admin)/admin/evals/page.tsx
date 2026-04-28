import { PlaceholderPage } from "@/components/placeholder-page";

export default function AdminEvalsPage() {
  return (
    <PlaceholderPage
      title="Evals dashboard"
      description="Prompt quality, tagging accuracy, and retrieval adherence checks will be monitored from this internal evaluation surface."
      badge="Observable AI"
      primaryAction="Run eval"
      secondaryAction="Inspect metrics"
    />
  );
}
