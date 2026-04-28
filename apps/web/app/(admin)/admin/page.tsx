import { PlaceholderPage } from "@/components/placeholder-page";

export default function AdminDashboardPage() {
  return (
    <PlaceholderPage
      title="Platform admin overview"
      description="The admin home will track review queue health, ingest failures, usage metrics, and eval snapshots."
      badge="Admin home"
      primaryAction="Review system health"
      secondaryAction="Open moderation queue"
    />
  );
}
