"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { Role } from "@repo/types";
import { useAuth } from "@/components/auth-provider";

type Track = "student" | "teacher" | "institution";

type TrackMeta = {
  id: Track;
  role: Role;
  redirect: string;
  label: string;
  tagline: string;
  emoji: string;
  accent: "indigo" | "emerald" | "amber";
  perks: string[];
};

const tracks: TrackMeta[] = [
  {
    id: "student",
    role: "student",
    redirect: "/student",
    label: "Student",
    tagline: "Tutor, quizzes, paper uploads, weak-topic radar.",
    emoji: "🎯",
    accent: "indigo",
    perks: ["Daily mission", "Streak system", "Mistake-to-revision flow"]
  },
  {
    id: "teacher",
    role: "teacher",
    redirect: "/teacher",
    label: "Teacher",
    tagline: "Blueprint-led paper studio, question bank, exports.",
    emoji: "✦",
    accent: "emerald",
    perks: ["Paper studio", "Answer keys", "Class analytics"]
  },
  {
    id: "institution",
    role: "platform_admin",
    redirect: "/admin",
    label: "Institution",
    tagline: "Seats, shared workflows, organization dashboards.",
    emoji: "◆",
    accent: "amber",
    perks: ["Bulk seats", "Shared bank", "Admin controls"]
  }
];

const accentClasses: Record<TrackMeta["accent"], { ring: string; bar: string; chip: string; bg: string; text: string; gradFrom: string; gradTo: string; ringSelected: string }> = {
  indigo: {
    ring: "hover:border-primary/40",
    bar: "bg-primary",
    chip: "bg-primary-soft text-primary-strong",
    bg: "bg-primary-soft",
    text: "text-primary",
    gradFrom: "from-primary",
    gradTo: "to-math",
    ringSelected: "border-primary ring-2 ring-primary/30"
  },
  emerald: {
    ring: "hover:border-progress/40",
    bar: "bg-progress",
    chip: "bg-progress-soft text-progress",
    bg: "bg-progress-soft",
    text: "text-progress",
    gradFrom: "from-progress",
    gradTo: "to-primary",
    ringSelected: "border-progress ring-2 ring-progress/30"
  },
  amber: {
    ring: "hover:border-energy/40",
    bar: "bg-energy",
    chip: "bg-energy-soft text-energy",
    bg: "bg-energy-soft",
    text: "text-energy",
    gradFrom: "from-energy",
    gradTo: "to-warn",
    ringSelected: "border-energy ring-2 ring-energy/30"
  }
};

const subjects = [
  { id: "physics", label: "Physics", emoji: "⚛", tone: "primary" },
  { id: "chem", label: "Chemistry", emoji: "⚗", tone: "progress" },
  { id: "math", label: "Mathematics", emoji: "∑", tone: "math" },
  { id: "bio", label: "Biology", emoji: "🧬", tone: "warn" }
];

const subjectChipStyles: Record<string, { active: string; idle: string }> = {
  primary: { active: "border-primary bg-primary-soft text-primary-strong", idle: "border-line bg-surface text-ink-soft hover:border-line-strong" },
  progress: { active: "border-progress bg-progress-soft text-progress", idle: "border-line bg-surface text-ink-soft hover:border-line-strong" },
  math: { active: "border-math bg-math-soft text-math", idle: "border-line bg-surface text-ink-soft hover:border-line-strong" },
  warn: { active: "border-warn bg-warn-soft text-warn", idle: "border-line bg-surface text-ink-soft hover:border-line-strong" }
};

const studentGoals = [
  { id: "boards", label: "Boards", emoji: "📘" },
  { id: "jee", label: "JEE", emoji: "🚀" },
  { id: "neet", label: "NEET", emoji: "🩺" },
  { id: "curious", label: "Just curious", emoji: "✨" }
];

const teacherClasses = ["XI", "XII"];

const institutionSizes = [
  { id: "xs", label: "<100" },
  { id: "sm", label: "100–500" },
  { id: "md", label: "500–2k" },
  { id: "lg", label: "2k+" }
];

function passwordStrength(pw: string): { score: number; label: string; tone: "warn" | "energy" | "progress" } {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s <= 2) return { score: s, label: "Weak", tone: "warn" };
  if (s === 3) return { score: s, label: "Okay", tone: "energy" };
  return { score: s, label: "Strong", tone: "progress" };
}

export default function SignupPage() {
  const router = useRouter();
  const { loginAsDemo } = useAuth();

  const [track, setTrack] = useState<Track | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [studentClass, setStudentClass] = useState<"11" | "12">("11");
  const [studentSubjects, setStudentSubjects] = useState<string[]>([]);
  const [studentGoal, setStudentGoal] = useState<string>("boards");
  const [school, setSchool] = useState("");
  const [teacherSubjects, setTeacherSubjects] = useState<string[]>([]);
  const [teacherClassesPicked, setTeacherClassesPicked] = useState<string[]>([]);
  const [years, setYears] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgSize, setOrgSize] = useState<string>("md");
  const [teacherCount, setTeacherCount] = useState("");
  const [accept, setAccept] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const meta = tracks.find((t) => t.id === track);
  const pw = passwordStrength(password);

  const canSubmit = useMemo(() => {
    if (!track || !name.trim() || !email.trim() || password.length < 6 || !accept) return false;
    if (track === "student") return studentSubjects.length > 0;
    if (track === "teacher") return school.trim() && teacherSubjects.length > 0;
    if (track === "institution") return orgName.trim();
    return false;
  }, [track, name, email, password, accept, studentSubjects, school, teacherSubjects, orgName]);

  function toggleIn(list: string[], val: string, setter: (v: string[]) => void) {
    setter(list.includes(val) ? list.filter((x) => x !== val) : [...list, val]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !meta) return;
    setSubmitting(true);
    setTimeout(() => {
      loginAsDemo(meta.role, name);
      router.push(meta.redirect);
    }, 600);
  }

  return (
    <div className="relative">
      {/* Floating decorations */}
      <div className="animate-float pointer-events-none absolute -left-4 top-32 hidden h-12 w-12 rotate-12 rounded-2xl border border-primary/20 bg-primary-soft md:block" />
      <div className="animate-float pointer-events-none absolute right-2 top-72 hidden h-10 w-10 -rotate-6 rounded-xl border border-energy/30 bg-energy-soft md:block" />
      <div className="animate-float pointer-events-none absolute left-10 bottom-24 hidden h-14 w-14 rotate-6 rounded-2xl border border-progress/20 bg-progress-soft md:block" />

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        {/* LEFT — form */}
        <form onSubmit={handleSubmit} className="relative overflow-hidden rounded-3xl border border-line bg-surface p-6 shadow-card xl:p-10">
          <div className="bg-mesh-soft pointer-events-none absolute inset-x-0 top-0 h-72 opacity-70" />
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl animate-aurora" />

          <div className="relative">
            {/* Step indicator */}
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
              <span className={`h-2 w-2 rounded-full ${track ? "bg-progress" : "bg-primary animate-pulse-soft"}`} />
              <span className={track ? "text-progress" : "text-primary"}>Step 1 · Track</span>
              <span className="h-px w-6 bg-line" />
              <span className={`h-2 w-2 rounded-full ${track ? "bg-primary animate-pulse-soft" : "bg-line"}`} />
              <span className={track ? "text-primary" : ""}>Step 2 · Details</span>
            </div>

            <h1 className="font-display mt-4 text-3xl leading-tight text-ink sm:text-5xl">
              Let's get you set up.
            </h1>
            <p className="mt-2 max-w-xl text-base leading-7 text-ink-soft">
              Pick your track. We'll only ask what's actually useful for that workspace.
            </p>

            {/* Track picker */}
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {tracks.map((t) => {
                const a = accentClasses[t.accent];
                const selected = track === t.id;
                return (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => setTrack(t.id)}
                    className={`group relative overflow-hidden rounded-2xl border bg-surface p-4 text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-hover ${
                      selected ? a.ringSelected : `border-line ${a.ring}`
                    }`}
                  >
                    <span className={`absolute left-0 top-0 h-full w-1 ${a.bar}`} />
                    {selected ? (
                      <span className={`absolute right-3 top-3 inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br ${a.gradFrom} ${a.gradTo} text-white shadow-ring`}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    ) : null}
                    <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-xl ${a.bg} ${a.text}`}>
                      {t.emoji}
                    </div>
                    <div className="font-display mt-3 text-lg text-ink">{t.label}</div>
                    <div className="mt-1 text-xs leading-5 text-ink-soft">{t.tagline}</div>
                  </button>
                );
              })}
            </div>

            {/* Form (revealed after track selected) */}
            <div
              className={`grid transition-all duration-500 ease-out ${
                track ? "mt-8 grid-rows-[1fr] opacity-100" : "mt-0 grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                {track ? (
                  <div className="space-y-6">
                    {/* SHARED — name / email / password */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Full name">
                        <input
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder={track === "institution" ? "Your name" : "e.g. Aanya Sharma"}
                          className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition focus:border-primary focus:shadow-ring"
                        />
                      </Field>
                      <Field label={track === "institution" ? "Work email" : "Email"}>
                        <input
                          required
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@school.edu"
                          className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition focus:border-primary focus:shadow-ring"
                        />
                      </Field>
                    </div>

                    <Field label="Password" hint={password ? `${pw.label} — minimum 6 characters` : "Minimum 6 characters"}>
                      <input
                        required
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition focus:border-primary focus:shadow-ring"
                      />
                      {password ? (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                            <div
                              className={`h-full rounded-full transition-all ${
                                pw.tone === "warn" ? "bg-warn" : pw.tone === "energy" ? "bg-energy" : "bg-progress"
                              }`}
                              style={{ width: `${(pw.score / 5) * 100}%` }}
                            />
                          </div>
                          <span
                            className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${
                              pw.tone === "warn" ? "text-warn" : pw.tone === "energy" ? "text-energy" : "text-progress"
                            }`}
                          >
                            {pw.label}
                          </span>
                        </div>
                      ) : null}
                    </Field>

                    {/* STUDENT */}
                    {track === "student" ? (
                      <>
                        <Field label="Class">
                          <div className="inline-flex rounded-xl border border-line bg-surface-2 p-1">
                            {(["11", "12"] as const).map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setStudentClass(c)}
                                className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                                  studentClass === c ? "bg-surface text-ink shadow-card" : "text-ink-soft hover:text-ink"
                                }`}
                              >
                                Class {c}
                              </button>
                            ))}
                            <span className="ml-1 inline-flex items-center gap-1 rounded-lg bg-primary-soft px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-strong">
                              CBSE
                            </span>
                          </div>
                        </Field>

                        <Field label="Subjects you study" hint="Pick at least one">
                          <div className="flex flex-wrap gap-2">
                            {subjects.map((s) => {
                              const active = studentSubjects.includes(s.id);
                              const styles = subjectChipStyles[s.tone];
                              return (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => toggleIn(studentSubjects, s.id, setStudentSubjects)}
                                  className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition ${
                                    active ? styles.active : styles.idle
                                  }`}
                                >
                                  <span className="text-base">{s.emoji}</span>
                                  {s.label}
                                </button>
                              );
                            })}
                          </div>
                        </Field>

                        <Field label="Your main goal">
                          <div className="grid gap-2 sm:grid-cols-4">
                            {studentGoals.map((g) => {
                              const active = studentGoal === g.id;
                              return (
                                <button
                                  key={g.id}
                                  type="button"
                                  onClick={() => setStudentGoal(g.id)}
                                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                                    active
                                      ? "border-primary bg-primary-soft text-primary-strong"
                                      : "border-line bg-surface text-ink-soft hover:border-line-strong"
                                  }`}
                                >
                                  <span>{g.emoji}</span>
                                  {g.label}
                                </button>
                              );
                            })}
                          </div>
                        </Field>
                      </>
                    ) : null}

                    {/* TEACHER */}
                    {track === "teacher" ? (
                      <>
                        <Field label="School / coaching name">
                          <input
                            required
                            value={school}
                            onChange={(e) => setSchool(e.target.value)}
                            placeholder="e.g. Delhi Public School, R.K. Puram"
                            className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition focus:border-progress focus:shadow-ring"
                          />
                        </Field>
                        <Field label="Subjects you teach" hint="Pick at least one">
                          <div className="flex flex-wrap gap-2">
                            {subjects.map((s) => {
                              const active = teacherSubjects.includes(s.id);
                              const styles = subjectChipStyles[s.tone];
                              return (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => toggleIn(teacherSubjects, s.id, setTeacherSubjects)}
                                  className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition ${
                                    active ? styles.active : styles.idle
                                  }`}
                                >
                                  <span className="text-base">{s.emoji}</span>
                                  {s.label}
                                </button>
                              );
                            })}
                          </div>
                        </Field>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <Field label="Classes you teach">
                            <div className="flex gap-2">
                              {teacherClasses.map((c) => {
                                const active = teacherClassesPicked.includes(c);
                                return (
                                  <button
                                    key={c}
                                    type="button"
                                    onClick={() => toggleIn(teacherClassesPicked, c, setTeacherClassesPicked)}
                                    className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                                      active
                                        ? "border-progress bg-progress-soft text-progress"
                                        : "border-line bg-surface text-ink-soft hover:border-line-strong"
                                    }`}
                                  >
                                    Class {c}
                                  </button>
                                );
                              })}
                            </div>
                          </Field>
                          <Field label="Years of experience">
                            <input
                              type="number"
                              min={0}
                              value={years}
                              onChange={(e) => setYears(e.target.value)}
                              placeholder="e.g. 7"
                              className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition focus:border-progress focus:shadow-ring"
                            />
                          </Field>
                        </div>
                      </>
                    ) : null}

                    {/* INSTITUTION */}
                    {track === "institution" ? (
                      <>
                        <Field label="Organization name">
                          <input
                            required
                            value={orgName}
                            onChange={(e) => setOrgName(e.target.value)}
                            placeholder="e.g. Brilliance Academy"
                            className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition focus:border-energy focus:shadow-ring"
                          />
                        </Field>
                        <Field label="Approximate student count">
                          <div className="grid grid-cols-4 gap-2">
                            {institutionSizes.map((s) => {
                              const active = orgSize === s.id;
                              return (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => setOrgSize(s.id)}
                                  className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                                    active
                                      ? "border-energy bg-energy-soft text-energy"
                                      : "border-line bg-surface text-ink-soft hover:border-line-strong"
                                  }`}
                                >
                                  {s.label}
                                </button>
                              );
                            })}
                          </div>
                        </Field>
                        <Field label="Approximate teacher count">
                          <input
                            type="number"
                            min={0}
                            value={teacherCount}
                            onChange={(e) => setTeacherCount(e.target.value)}
                            placeholder="e.g. 24"
                            className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition focus:border-energy focus:shadow-ring"
                          />
                        </Field>
                      </>
                    ) : null}

                    {/* Terms + submit */}
                    <label className="flex items-start gap-3 rounded-xl border border-line bg-surface-2 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={accept}
                        onChange={(e) => setAccept(e.target.checked)}
                        className="mt-0.5 h-4 w-4 cursor-pointer accent-[var(--primary)]"
                      />
                      <span className="text-sm leading-6 text-ink-soft">
                        I agree to the <span className="text-ink underline-offset-2 hover:underline">Terms</span> and{" "}
                        <span className="text-ink underline-offset-2 hover:underline">Privacy Policy</span>.
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={!canSubmit || submitting}
                      className={`group relative w-full overflow-hidden rounded-xl px-6 py-4 text-sm font-semibold text-white shadow-card transition ${
                        canSubmit && !submitting
                          ? `bg-gradient-to-r ${meta ? accentClasses[meta.accent].gradFrom : "from-primary"} ${meta ? accentClasses[meta.accent].gradTo : "to-math"} hover:shadow-hover`
                          : "cursor-not-allowed bg-surface-3 text-muted"
                      }`}
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {submitting ? (
                          <>
                            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-white" />
                            Setting up your workspace…
                          </>
                        ) : (
                          <>
                            Create my workspace
                            <span className="transition group-hover:translate-x-0.5">→</span>
                          </>
                        )}
                      </span>
                    </button>

                    <div className="text-center text-sm text-ink-soft">
                      Already have an account?{" "}
                      <Link href="/login" className="font-semibold text-primary hover:text-primary-strong">
                        Login →
                      </Link>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </form>

        {/* RIGHT — live preview */}
        <aside className="relative">
          <div className="sticky top-24 space-y-4">
            <PreviewCard track={track} name={name} subjects={studentSubjects} school={school} orgName={orgName} orgSize={orgSize} />

            {/* Trust bar */}
            <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Why teams sign up</div>
              <ul className="mt-3 space-y-2 text-sm text-ink-soft">
                {[
                  ["No credit card required to start.", "indigo"],
                  ["CBSE syllabus-aware from day one.", "emerald"],
                  ["Built for board prep — not generic AI.", "amber"]
                ].map(([msg, tone]) => (
                  <li key={msg} className="flex items-start gap-2">
                    <span
                      className={`mt-1 inline-flex h-4 w-4 items-center justify-center rounded-full ${
                        tone === "indigo" ? "bg-primary-soft text-primary" : tone === "emerald" ? "bg-progress-soft text-progress" : "bg-energy-soft text-energy"
                      }`}
                    >
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    {msg}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">{label}</span>
        {hint ? <span className="text-[11px] text-muted">{hint}</span> : null}
      </div>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function PreviewCard({
  track,
  name,
  subjects: picked,
  school,
  orgName,
  orgSize
}: {
  track: Track | null;
  name: string;
  subjects: string[];
  school: string;
  orgName: string;
  orgSize: string;
}) {
  const meta = tracks.find((t) => t.id === track);
  const accent = meta ? accentClasses[meta.accent] : accentClasses.indigo;
  const displayName = name.trim() || (track === "institution" ? "Your organization" : track === "teacher" ? "Teacher" : "Student");
  const sizeLabel = institutionSizes.find((s) => s.id === orgSize)?.label ?? "—";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-surface p-6 shadow-card">
      <div className={`absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br ${accent.gradFrom} ${accent.gradTo} opacity-15 blur-3xl animate-aurora`} />

      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Your workspace · preview</div>
          {track ? (
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${accent.chip}`}>
              <span className={`h-1 w-1 rounded-full ${accent.bar}`} />
              {meta?.label}
            </span>
          ) : null}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className={`relative inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accent.gradFrom} ${accent.gradTo} text-white shadow-ring`}>
            <span className="font-display text-base">{displayName.slice(0, 1).toUpperCase()}</span>
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-energy ring-2 ring-surface" />
          </span>
          <div className="min-w-0">
            <div className="font-display truncate text-lg text-ink">{displayName}</div>
            <div className="truncate text-xs text-muted">
              {track === "student" ? "Student · CBSE" : track === "teacher" ? school || "Add your school" : track === "institution" ? orgName || "Add your org" : "Choose a track to preview"}
            </div>
          </div>
        </div>

        {/* Track-specific preview body */}
        {!track ? (
          <div className="mt-6 rounded-xl border border-dashed border-line-strong bg-surface-2 p-5 text-center text-sm text-ink-soft">
            Pick a track to see what your dashboard will feel like.
          </div>
        ) : null}

        {track === "student" ? (
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-energy/25 bg-energy-soft px-4 py-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-energy">Streak</div>
                <div className="font-display text-lg text-ink">Day 1 → Day 100</div>
              </div>
              <span className="animate-pulse-soft inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-[11px] font-semibold text-energy">
                🔥 starting
              </span>
            </div>
            <div className="rounded-xl border border-primary/20 bg-primary-soft p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Today's mission</div>
              <div className="font-display mt-1 text-base text-ink">A short tutor + drill loop</div>
              <div className="mt-1 text-xs text-ink-soft">Picks the weakest concept, clears it, then quizzes you on it.</div>
            </div>
            {picked.length ? (
              <div className="flex flex-wrap gap-1.5">
                {picked.map((sid) => {
                  const s = subjects.find((x) => x.id === sid);
                  if (!s) return null;
                  const styles = subjectChipStyles[s.tone].active;
                  return (
                    <span key={sid} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${styles}`}>
                      <span>{s.emoji}</span>
                      {s.label}
                    </span>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}

        {track === "teacher" ? (
          <div className="mt-5 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-progress/20 bg-progress-soft p-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-progress">Drafts</div>
                <div className="font-display text-2xl text-ink">0</div>
                <div className="text-[11px] text-ink-soft">Start your first paper</div>
              </div>
              <div className="rounded-xl border border-primary/20 bg-primary-soft p-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Bank fit</div>
                <div className="font-display text-2xl text-ink">—</div>
                <div className="text-[11px] text-ink-soft">Builds with usage</div>
              </div>
            </div>
            <div className="rounded-xl border border-line bg-surface-2 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Class pulse</div>
              <div className="mt-1 text-sm text-ink-soft">
                Once you add a class, this shows weak topics by section so the next paper writes itself.
              </div>
            </div>
          </div>
        ) : null}

        {track === "institution" ? (
          <div className="mt-5 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-energy/20 bg-energy-soft p-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-energy">Students</div>
                <div className="font-display text-2xl text-ink">{sizeLabel}</div>
              </div>
              <div className="rounded-xl border border-warn/20 bg-warn-soft p-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-warn">Teachers</div>
                <div className="font-display text-2xl text-ink">—</div>
              </div>
            </div>
            <div className="rounded-xl border border-line bg-surface-2 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Shared bank</div>
              <div className="mt-1 text-sm text-ink-soft">
                Teachers in your org will share question inventory and review queues from one place.
              </div>
            </div>
          </div>
        ) : null}

        {/* Perks */}
        {meta ? (
          <div className="mt-5 border-t border-line pt-4">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">You'll unlock</div>
            <ul className="mt-2 space-y-1.5">
              {meta.perks.map((p) => (
                <li key={p} className="flex items-center gap-2 text-sm text-ink-soft">
                  <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full ${accent.bg} ${accent.text}`}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
