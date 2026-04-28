import { PlaceholderPage } from "@/components/placeholder-page";

export default function AdminReviewQueuePage() {
  return (
    <PlaceholderPage
      title="Review queue"
      description="Low-confidence tags, moderation items, and human-in-the-loop approvals will be routed through this queue."
      badge="Reviewer tools"
      primaryAction="Approve item"
      secondaryAction="Reject item"
    />
  );
}
