import { PlaceholderPage } from "@/components/placeholder-page";

export default function StudentPaperUploadPage() {
  return (
    <PlaceholderPage
      title="Paper upload solver"
      description="This route will host the dropzone, upload queue, extracted question previews, and solution mode switching."
      badge="Paper solver"
      primaryAction="Upload paper"
      secondaryAction="Inspect extracted questions"
    />
  );
}
