import { ProtectedShell } from "@/components/protected-shell";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedShell role="student">{children}</ProtectedShell>;
}
