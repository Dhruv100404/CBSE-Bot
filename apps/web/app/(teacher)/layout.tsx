import { ProtectedShell } from "@/components/protected-shell";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedShell role="teacher">{children}</ProtectedShell>;
}
