import type { Role } from "@repo/types";

type NavItem = {
  href: string;
  label: string;
};

export const navigationByRole: Record<Extract<Role, "student" | "teacher" | "platform_admin">, NavItem[]> = {
  student: [
    { href: "/student", label: "Dashboard" },
    { href: "/student/subjects", label: "Subjects" },
    { href: "/student/tutor", label: "Tutor" },
    { href: "/student/quizzes", label: "Quizzes" },
    { href: "/student/papers/upload", label: "Paper Uploads" },
    { href: "/student/mistakes", label: "Mistakes" },
    { href: "/student/revision-plan", label: "Revision Plan" },
    { href: "/student/settings", label: "Settings" }
  ],
  teacher: [
    { href: "/teacher", label: "Dashboard" },
    { href: "/teacher/paper-studio", label: "Paper Studio" },
    { href: "/teacher/question-bank", label: "Question Bank" },
    { href: "/teacher/uploads", label: "Uploads" },
    { href: "/teacher/classes", label: "Classes" },
    { href: "/teacher/analytics", label: "Analytics" },
    { href: "/teacher/settings", label: "Settings" }
  ],
  platform_admin: [
    { href: "/admin", label: "Overview" },
    { href: "/admin/curriculum", label: "Curriculum" },
    { href: "/admin/documents", label: "Documents" },
    { href: "/admin/questions", label: "Questions" },
    { href: "/admin/review-queue", label: "Review Queue" },
    { href: "/admin/organizations", label: "Organizations" },
    { href: "/admin/evals", label: "Evals" }
  ]
};
