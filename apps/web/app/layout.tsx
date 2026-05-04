import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Sora } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import "./globals.css";

const bodyFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body"
});

const displayFont = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"]
});

export const metadata: Metadata = {
  title: "Learn AI · CBSE PCMB",
  description: "Student, teacher, and admin workspace for the CBSE PCMB AI learning platform."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className={`${bodyFont.variable} ${displayFont.variable} bg-bg text-ink`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
