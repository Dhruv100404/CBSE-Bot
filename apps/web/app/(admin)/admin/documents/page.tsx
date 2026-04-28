import { PlaceholderPage } from "@/components/placeholder-page";

export default function AdminDocumentsPage() {
  return (
    <PlaceholderPage
      title="Document operations"
      description="Document processing status, OCR quality, and low-confidence ingest items will be visible here."
      badge="Ingest ops"
      primaryAction="Review failed jobs"
      secondaryAction="Inspect document queue"
    />
  );
}
