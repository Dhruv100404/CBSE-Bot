"use client";

import { useEffect, useMemo, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type SectionConfig = {
  title: string;
  instructions: string;
  questionType: string;
  questionCount: number;
  marksPerQuestion: number;
  sourceTypes: string[];
};

type BankQuestion = {
  id: string;
  sourceKey: string;
  sourceType: string;
  title: string;
  questionType: string;
  difficulty: string;
  defaultMarks: number;
  questionText: string;
  answerText?: string;
  pageStart?: number;
  tags: string[];
};

type DraftQuestion = BankQuestion & {
  id: string;
  paperQuestionNumber: number;
  marks: number;
  editableText: string;
};

type DraftSection = {
  id: string;
  title: string;
  instructions: string;
  questionType: string;
  marksPerQuestion: number;
  questionCount: number;
  totalMarks: number;
  questions: DraftQuestion[];
};

type PaperDraft = {
  id: string;
  title: string;
  classLevel: number;
  subjectName: string;
  durationMinutes: number;
  totalMarks: number;
  requestedMarks: number;
  instructions: string;
  sections: DraftSection[];
  answerKey: { questionNumber: number; sourceKey: string; answerText: string; marks: number }[];
  quality: {
    questionCount: number;
    answerKeyCoverage: number;
    marksMatched: boolean;
    duplicateCount: number;
    notes: string[];
  };
};

const defaultSections: SectionConfig[] = [
  {
    title: "Section A",
    instructions: "Answer all questions. Keep responses brief.",
    questionType: "short_answer",
    questionCount: 5,
    marksPerQuestion: 1,
    sourceTypes: ["exercise"]
  },
  {
    title: "Section B",
    instructions: "Show the important steps.",
    questionType: "proof",
    questionCount: 4,
    marksPerQuestion: 3,
    sourceTypes: ["exercise", "example"]
  },
  {
    title: "Section C",
    instructions: "Attempt in detail with reasoning.",
    questionType: "application",
    questionCount: 3,
    marksPerQuestion: 4,
    sourceTypes: ["exercise"]
  }
];

const questionTypeLabels: Record<string, string> = {
  short_answer: "Short answer",
  proof: "Proof / show that",
  application: "Application",
  solved_example: "Solved example"
};

export function PaperStudioBuilder() {
  const [title, setTitle] = useState("Class 12 Mathematics - Relations and Functions Test");
  const [schoolName, setSchoolName] = useState("St. Xavier's Gandhinagar");
  const [courseName, setCourseName] = useState("Full Course");
  const [examName, setExamName] = useState("Annual Exam");
  const [examDate, setExamDate] = useState("15/04/26");
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [instructions, setInstructions] = useState(
    "All questions are compulsory unless stated otherwise. Write clean steps for full marks."
  );
  const [sections, setSections] = useState<SectionConfig[]>(defaultSections);
  const [bank, setBank] = useState<BankQuestion[]>([]);
  const [draft, setDraft] = useState<PaperDraft | null>(null);
  const [activeAnswerKey, setActiveAnswerKey] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestedMarks = useMemo(
    () => sections.reduce((total, section) => total + section.questionCount * section.marksPerQuestion, 0),
    [sections]
  );

  useEffect(() => {
    fetch(`${API_BASE_URL}/v1/paper-blueprints/question-bank`)
      .then((res) => res.json())
      .then((payload: { questions: BankQuestion[] }) => setBank(payload.questions))
      .catch(() => setError("Could not load structured question bank."));
  }, []);

  async function generateDraft() {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/v1/paper-blueprints/generate-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          classLevel: 12,
          subjectId: "mathematics-12",
          chapterIds: ["relations-and-functions"],
          totalMarks: requestedMarks,
          durationMinutes,
          instructions,
          seed: `${title}-${Date.now()}`,
          sections
        })
      });
      if (!res.ok) throw new Error(`Draft generation failed with ${res.status}`);
      setDraft((await res.json()) as PaperDraft);
      setActiveAnswerKey(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Draft generation failed");
    } finally {
      setIsGenerating(false);
    }
  }

  function updateSection(index: number, patch: Partial<SectionConfig>) {
    setSections((current) => current.map((section, itemIndex) => (itemIndex === index ? { ...section, ...patch } : section)));
  }

  function addSection() {
    setSections((current) => [
      ...current,
      {
        title: `Section ${String.fromCharCode(65 + current.length)}`,
        instructions: "Answer as directed.",
        questionType: "short_answer",
        questionCount: 3,
        marksPerQuestion: 2,
        sourceTypes: ["exercise"]
      }
    ]);
  }

  function removeSection(index: number) {
    setSections((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function updateQuestion(sectionId: string, questionId: string, patch: Partial<DraftQuestion>) {
    setDraft((current) => {
      if (!current) return current;
      const next = {
        ...current,
        sections: current.sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                questions: section.questions.map((question) =>
                  question.id === questionId ? { ...question, ...patch } : question
                )
              }
            : section
        )
      };
      return recalcDraft(next);
    });
  }

  function replaceQuestion(sectionId: string, questionId: string) {
    if (!draft) return;
    const used = new Set(draft.sections.flatMap((section) => section.questions.map((question) => question.sourceKey)));
    const section = draft.sections.find((item) => item.id === sectionId);
    const replacement = bank.find(
      (question) =>
        !used.has(question.sourceKey) &&
        (question.questionType === section?.questionType || section?.questionType === "short_answer")
    );
    if (!replacement || !section) return;
    updateQuestion(sectionId, questionId, {
      ...replacement,
      id: questionId,
      marks: section.marksPerQuestion,
      editableText: replacement.questionText
    });
  }

  function addCustomQuestion(sectionId: string) {
    setDraft((current) => {
      if (!current) return current;
      const next = {
        ...current,
        sections: current.sections.map((section) => {
          if (section.id !== sectionId) return section;
          const question: DraftQuestion = {
            id: crypto.randomUUID(),
            sourceKey: `custom:${crypto.randomUUID()}`,
            sourceType: "custom",
            title: "Custom question",
            questionType: section.questionType,
            difficulty: "teacher-set",
            defaultMarks: section.marksPerQuestion,
            questionText: "Type your question here.",
            editableText: "Type your question here.",
            answerText: "",
            paperQuestionNumber: 0,
            marks: section.marksPerQuestion,
            tags: ["custom"]
          };
          return { ...section, questions: [...section.questions, question] };
        })
      };
      return recalcDraft(next);
    });
  }

  function downloadEditableHtml() {
    if (!draft) return;
    const html = document.querySelector("[data-paper-export]")?.outerHTML ?? "";
    const blob = new Blob([`<!doctype html><html><head><meta charset="utf-8"><title>${draft.title}</title></head><body>${html}</body></html>`], {
      type: "text/html"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${draft.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.html`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function downloadPdf() {
    if (!draft) return;
    const res = await fetch(`${API_BASE_URL}/v1/paper-blueprints/export-pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        draft,
        schoolName,
        courseName,
        examName,
        examDate,
        showAnswerKey: activeAnswerKey
      })
    });
    if (!res.ok) {
      setError(`PDF export failed with ${res.status}`);
      return;
    }
    const pdf = await res.blob();
    const blob = new Blob([pdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${draft.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-[#d8d2c2] bg-[#fffdf6] p-6 text-ink shadow-soft">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(16,185,129,0.20),transparent_34%),radial-gradient(circle_at_88%_8%,rgba(245,158,11,0.18),transparent_32%),linear-gradient(135deg,#fffdf6_0%,#f0ebdc_100%)]" />
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-progress/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative grid gap-6 xl:grid-cols-[1fr_360px]">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-progress">Teacher paper studio</div>
            <h1 className="mt-3 max-w-3xl font-display text-4xl leading-tight text-[#121212] md:text-5xl">
              Build a paper from structured questions, then edit it like a teacher.
            </h1>
            <p className="mt-4 max-w-2xl text-sm font-medium leading-6 text-[#4a4f59]">
              This first version uses the structured Mathematics Chapter 1 question bank. Vector search stays for content
              discovery, while paper generation picks exact stored examples and exercise questions.
            </p>
          </div>
          <div className="rounded-3xl border border-[#ddd6c8] bg-white/75 p-4 shadow-card backdrop-blur">
            <div className="grid grid-cols-2 gap-3">
              <Metric label="Bank questions" value={bank.length} />
              <Metric label="Paper marks" value={requestedMarks} />
              <Metric label="Sections" value={sections.length} />
              <Metric label="Duration" value={`${durationMinutes}m`} />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[430px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="rounded-[1.5rem] border border-line bg-surface p-5 shadow-card">
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">Blueprint</div>
            <label className="mt-4 block">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Paper title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-line bg-surface-2 px-4 py-3 text-sm font-semibold text-ink outline-none focus:border-progress"
              />
            </label>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted">School</span>
                <input
                  value={schoolName}
                  onChange={(event) => setSchoolName(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-line bg-surface-2 px-4 py-3 text-sm font-semibold text-ink outline-none focus:border-progress"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Course</span>
                <input
                  value={courseName}
                  onChange={(event) => setCourseName(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-line bg-surface-2 px-4 py-3 text-sm font-semibold text-ink outline-none focus:border-progress"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Exam</span>
                <input
                  value={examName}
                  onChange={(event) => setExamName(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-line bg-surface-2 px-4 py-3 text-sm font-semibold text-ink outline-none focus:border-progress"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Date</span>
                <input
                  value={examDate}
                  onChange={(event) => setExamDate(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-line bg-surface-2 px-4 py-3 text-sm font-semibold text-ink outline-none focus:border-progress"
                />
              </label>
            </div>
            <label className="mt-3 block">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Duration minutes</span>
              <input
                type="number"
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(Number(event.target.value))}
                className="mt-2 w-full rounded-2xl border border-line bg-surface-2 px-4 py-3 text-sm font-semibold text-ink outline-none focus:border-progress"
              />
            </label>
            <label className="mt-3 block">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Instructions</span>
              <textarea
                value={instructions}
                onChange={(event) => setInstructions(event.target.value)}
                rows={3}
                className="mt-2 w-full resize-none rounded-2xl border border-line bg-surface-2 px-4 py-3 text-sm text-ink outline-none focus:border-progress"
              />
            </label>
          </div>

          <div className="rounded-[1.5rem] border border-line bg-surface p-5 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">Sections</div>
                <div className="mt-1 text-sm text-ink-soft">Set marks, question count, and type.</div>
              </div>
              <button onClick={addSection} className="rounded-full bg-ink px-3 py-2 text-xs font-bold text-white">
                Add
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {sections.map((section, index) => (
                <SectionEditor
                  key={`${section.title}-${index}`}
                  section={section}
                  index={index}
                  onChange={(patch) => updateSection(index, patch)}
                  onRemove={() => removeSection(index)}
                />
              ))}
            </div>
            {error ? <div className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
            <button
              onClick={generateDraft}
              disabled={isGenerating}
              className="mt-4 w-full rounded-2xl bg-progress px-5 py-3 text-sm font-bold text-white transition hover:bg-ink disabled:opacity-50"
            >
              {isGenerating ? "Generating paper..." : "Generate editable draft"}
            </button>
          </div>
        </aside>

        <main className="space-y-4">
          {draft ? (
            <>
              <div className="sticky top-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-line bg-surface/95 p-4 shadow-card backdrop-blur">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-progress">Draft ready</div>
                  <div className="text-sm text-ink-soft">
                    {draft.quality.questionCount} questions - {Math.round(draft.quality.answerKeyCoverage * 100)}% answer key coverage
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setActiveAnswerKey((value) => !value)} className="rounded-full border border-line bg-surface-2 px-4 py-2 text-sm font-bold text-ink">
                    {activeAnswerKey ? "Hide key" : "Answer key"}
                  </button>
                  <button onClick={downloadEditableHtml} className="rounded-full border border-line bg-surface-2 px-4 py-2 text-sm font-bold text-ink">
                    Download HTML
                  </button>
                  <button onClick={downloadPdf} className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-white">
                    Download PDF
                  </button>
                  <button onClick={() => window.print()} className="rounded-full border border-line bg-surface-2 px-4 py-2 text-sm font-bold text-ink">
                    Print
                  </button>
                </div>
              </div>

              <PrintablePaper
                draft={draft}
                schoolName={schoolName}
                courseName={courseName}
                examName={examName}
                examDate={examDate}
                showAnswerKey={activeAnswerKey}
                onQuestionChange={updateQuestion}
                onReplaceQuestion={replaceQuestion}
                onAddQuestion={addCustomQuestion}
              />
            </>
          ) : (
            <div className="rounded-[2rem] border border-dashed border-line-strong bg-surface p-10 text-center shadow-card">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-progress-soft text-progress">
                <span className="font-display text-xl">P</span>
              </div>
              <h2 className="mt-4 font-display text-3xl text-ink">No decorative demo here.</h2>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted">
                Configure the sections and generate a real editable paper from the structured question bank.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-[#ece6d8] bg-[#fbf8ee] p-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7b735f]">{label}</div>
      <div className="mt-1 font-display text-2xl text-[#121212]">{value}</div>
    </div>
  );
}

function SectionEditor({
  section,
  index,
  onChange,
  onRemove
}: {
  section: SectionConfig;
  index: number;
  onChange: (patch: Partial<SectionConfig>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface-2 p-3">
      <div className="flex items-center gap-2">
        <input
          value={section.title}
          onChange={(event) => onChange({ title: event.target.value })}
          className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 py-2 text-sm font-bold text-ink outline-none"
        />
        <button onClick={onRemove} disabled={index === 0} className="rounded-xl border border-line bg-surface px-3 py-2 text-xs font-bold text-muted disabled:opacity-35">
          Remove
        </button>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <select
          value={section.questionType}
          onChange={(event) => onChange({ questionType: event.target.value })}
          className="rounded-xl border border-line bg-surface px-2 py-2 text-xs font-bold text-ink outline-none"
        >
          {Object.entries(questionTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={section.questionCount}
          onChange={(event) => onChange({ questionCount: Number(event.target.value) })}
          className="rounded-xl border border-line bg-surface px-2 py-2 text-xs font-bold text-ink outline-none"
        />
        <input
          type="number"
          value={section.marksPerQuestion}
          onChange={(event) => onChange({ marksPerQuestion: Number(event.target.value) })}
          className="rounded-xl border border-line bg-surface px-2 py-2 text-xs font-bold text-ink outline-none"
        />
      </div>
      <textarea
        value={section.instructions}
        onChange={(event) => onChange({ instructions: event.target.value })}
        rows={2}
        className="mt-2 w-full resize-none rounded-xl border border-line bg-surface px-3 py-2 text-xs text-ink-soft outline-none"
      />
    </div>
  );
}

function PrintablePaper({
  draft,
  schoolName,
  courseName,
  examName,
  examDate,
  showAnswerKey,
  onQuestionChange,
  onReplaceQuestion,
  onAddQuestion
}: {
  draft: PaperDraft;
  schoolName: string;
  courseName: string;
  examName: string;
  examDate: string;
  showAnswerKey: boolean;
  onQuestionChange: (sectionId: string, questionId: string, patch: Partial<DraftQuestion>) => void;
  onReplaceQuestion: (sectionId: string, questionId: string) => void;
  onAddQuestion: (sectionId: string) => void;
}) {
  return (
    <div data-paper-export className="rounded-[1.5rem] border border-line bg-white p-6 shadow-card print:rounded-none print:border-0 print:p-0 print:shadow-none">
      <div className="mx-auto max-w-[794px] bg-white text-[#111] print:max-w-none">
        <div className="border border-[#222] p-3 print:border-black">
          <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-[#222] pb-2 text-[13px] leading-5">
            <div>
              <div className="text-[18px] font-bold leading-6">{schoolName}</div>
              <div className="capitalize">{courseName}</div>
              <div>Std {draft.classLevel} : {draft.subjectName}</div>
            </div>
            <div className="min-w-44 text-right">
              <div>Date : {examDate}</div>
              <div>Total Marks : {draft.totalMarks}</div>
              <div className="capitalize">{examName}</div>
              <div>Time : {formatDuration(draft.durationMinutes)}</div>
            </div>
          </div>
          <div className="mt-2 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-[#333]">
            Welcome To Future - Quantum Paper
          </div>
          <div className="mt-2 border-t border-[#222] pt-2 text-center text-[15px] font-bold">
            {draft.title}
          </div>
        </div>

        <div className="mt-3 text-[12px] leading-5">
          <span className="font-bold">Instructions:</span> {draft.instructions}
        </div>

        <div className="mt-4 space-y-5">
          {draft.sections.map((section) => (
            <section key={section.id} className="break-inside-avoid">
              <div className="border-b border-[#222] pb-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[13px] font-bold">
                    • Write the answer of the following questions. [Each carries {section.marksPerQuestion}{" "}
                    Mark{section.marksPerQuestion === 1 ? "" : "s"}]
                  </div>
                  <button onClick={() => onAddQuestion(section.id)} className="rounded-full border border-line px-3 py-1.5 text-xs font-bold text-ink-soft print:hidden">
                    Add question
                  </button>
                </div>
                {section.instructions ? <div className="mt-1 text-[11px] text-[#555]">{section.instructions}</div> : null}
              </div>
              <div className="mt-2 space-y-2">
                {section.questions.map((question) => (
                  <div key={question.id} className="group grid gap-2 rounded-xl border border-transparent bg-white p-2 hover:border-line print:break-inside-avoid print:p-0">
                    <div className="grid grid-cols-[32px_1fr_54px] gap-2 text-[12.5px] leading-5">
                      <div className="font-bold">{question.paperQuestionNumber}.</div>
                      <div>
                        <textarea
                          value={question.editableText}
                          onChange={(event) => onQuestionChange(section.id, question.id, { editableText: event.target.value })}
                          rows={Math.max(2, Math.ceil(question.editableText.length / 120))}
                          className="w-full resize-none border-0 bg-transparent p-0 text-[12.5px] leading-5 text-[#111] outline-none"
                        />
                        <div className="mt-1 flex flex-wrap gap-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-muted print:hidden">
                          <span>{question.sourceType}</span>
                          <span>{question.difficulty}</span>
                          {question.pageStart ? <span>p.{question.pageStart}</span> : null}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="print:hidden">
                          <input
                            type="number"
                            value={question.marks}
                            onChange={(event) => onQuestionChange(section.id, question.id, { marks: Number(event.target.value) })}
                            className="w-full rounded-lg border border-line bg-white px-2 py-1 text-center text-xs font-bold text-ink outline-none"
                          />
                        </span>
                        <span className="hidden text-[11px] font-bold print:inline">[{question.marks}]</span>
                        <button onClick={() => onReplaceQuestion(section.id, question.id)} className="mt-1 w-full rounded-lg bg-ink px-2 py-1.5 text-[10px] font-bold text-white print:hidden">
                          Replace
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {showAnswerKey ? (
          <div className="mt-8 break-before-page border-t border-[#222] pt-4">
            <h3 className="text-lg font-bold text-[#111]">Answer Key</h3>
            <div className="mt-3 space-y-2">
              {draft.answerKey.map((item) => (
                <div key={`${item.sourceKey}-${item.questionNumber}`} className="text-[12px] leading-5 text-[#111]">
                  <span className="font-bold">Q{item.questionNumber}.</span> {item.answerText}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (!hours) return `${mins} Min`;
  if (!mins) return `${String(hours).padStart(2, "0")} Hour`;
  return `${String(hours).padStart(2, "0")} Hour ${mins} Min`;
}

function buildPaperPdf({
  draft,
  schoolName,
  courseName,
  examName,
  examDate,
  showAnswerKey
}: {
  draft: PaperDraft;
  schoolName: string;
  courseName: string;
  examName: string;
  examDate: string;
  showAnswerKey: boolean;
}) {
  const width = 595;
  const height = 842;
  const margin = 42;
  const bottom = 42;
  const pages: string[][] = [[]];
  let pageIndex = 0;
  let y = height - margin;

  function current() {
    return pages[pageIndex];
  }

  function addPage() {
    pages.push([]);
    pageIndex += 1;
    y = height - margin;
  }

  function ensure(space: number) {
    if (y - space < bottom) addPage();
  }

  function text(value: string, x: number, size = 10, font = "F1") {
    current().push(`BT /${font} ${size} Tf ${x} ${y} Td (${escapePdf(value)}) Tj ET`);
  }

  function line(x1: number, y1: number, x2: number, y2: number) {
    current().push(`${x1} ${y1} m ${x2} ${y2} l S`);
  }

  function write(value: string, x: number, size = 10, leading = 14, maxWidth = width - margin * 2, font = "F1") {
    const lines = wrapPdfText(value, maxWidth, size);
    for (const item of lines) {
      ensure(leading);
      text(item, x, size, font);
      y -= leading;
    }
  }

  function writeHeader() {
    current().push("0.8 w");
    line(margin, y + 8, width - margin, y + 8);
    write(schoolName, margin, 14, 18, 300, "F2");
    write(courseName, margin, 10, 13, 260);
    write(`Std ${draft.classLevel} : ${draft.subjectName}`, margin, 10, 13, 260);
    const top = height - margin;
    current().push(`BT /F1 10 Tf ${width - margin - 150} ${top} Td (Date : ${escapePdf(examDate)}) Tj ET`);
    current().push(`BT /F1 10 Tf ${width - margin - 150} ${top - 14} Td (Total Marks : ${draft.totalMarks}) Tj ET`);
    current().push(`BT /F1 10 Tf ${width - margin - 150} ${top - 28} Td (${escapePdf(examName)}) Tj ET`);
    current().push(`BT /F1 10 Tf ${width - margin - 150} ${top - 42} Td (Time : ${escapePdf(formatDuration(draft.durationMinutes))}) Tj ET`);
    y -= 8;
    line(margin, y, width - margin, y);
    y -= 18;
    write("Welcome To Future - Quantum Paper", margin + 155, 9, 13, 260, "F2");
    y -= 2;
    line(margin, y, width - margin, y);
    y -= 16;
    write(draft.title, margin, 12, 16, width - margin * 2, "F2");
    y -= 6;
    write(`Instructions: ${draft.instructions}`, margin, 9, 13);
    y -= 10;
  }

  writeHeader();

  for (const section of draft.sections) {
    ensure(70);
    write(
      `• Write the answer of the following questions. [Each carries ${section.marksPerQuestion} Mark${section.marksPerQuestion === 1 ? "" : "s"}]`,
      margin,
      10,
      14,
      width - margin * 2,
      "F2"
    );
    if (section.instructions) write(section.instructions, margin, 8, 11);
    y -= 4;

    for (const question of section.questions) {
      ensure(48);
      const prefix = `${question.paperQuestionNumber}. `;
      const questionLines = wrapPdfText(question.editableText, width - margin * 2 - 48, 10);
      text(prefix, margin, 10, "F2");
      text(`[${question.marks}]`, width - margin - 30, 9, "F2");
      for (let index = 0; index < questionLines.length; index += 1) {
        if (index > 0) ensure(13);
        text(questionLines[index], margin + 24, 10);
        y -= 13;
      }
      y -= 5;
    }
    y -= 6;
  }

  if (showAnswerKey) {
    addPage();
    write("Answer Key", margin, 14, 18, width - margin * 2, "F2");
    y -= 6;
    for (const item of draft.answerKey) {
      write(`Q${item.questionNumber}. ${item.answerText}`, margin, 9, 13);
      y -= 2;
    }
  }

  return assemblePdf(pages, width, height);
}

function wrapPdfText(text: string, maxWidth: number, fontSize: number) {
  const normalized = normalizePdfText(text);
  const maxChars = Math.max(24, Math.floor(maxWidth / (fontSize * 0.52)));
  const output: string[] = [];
  for (const paragraph of normalized.split("\n")) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let line = "";
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (next.length > maxChars && line) {
        output.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    if (line) output.push(line);
  }
  return output.length ? output : [""];
}

function normalizePdfText(text: string) {
  return text
    .replace(/[≤]/g, "<=")
    .replace(/[≥]/g, ">=")
    .replace(/[∈]/g, "in")
    .replace(/[∉]/g, "not in")
    .replace(/[⊂]/g, "subset")
    .replace(/[∪]/g, "union")
    .replace(/[∩]/g, "intersection")
    .replace(/[→]/g, "->")
    .replace(/[⇒]/g, "=>")
    .replace(/[×]/g, "x")
    .replace(/[φ]/g, "phi")
    .replace(/[–—−]/g, "-")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");
}

function escapePdf(value: string) {
  return normalizePdfText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function assemblePdf(pageContents: string[][], width: number, height: number) {
  const objects: string[] = [];
  const catalogId = 1;
  const pagesId = 2;
  const fontRegularId = 3;
  const fontBoldId = 4;
  let nextId = 5;
  const pageIds: number[] = [];

  objects[catalogId] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[fontRegularId] = "<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>";
  objects[fontBoldId] = "<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold >>";

  for (const commands of pageContents) {
    const contentId = nextId++;
    const pageId = nextId++;
    const stream = commands.join("\n");
    objects[contentId] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
    objects[pageId] =
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${width} ${height}] ` +
      `/Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentId} 0 R >>`;
    pageIds.push(pageId);
  }

  objects[pagesId] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = pdf.length;
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id += 1) {
    pdf += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return pdf;
}

function recalcDraft(draft: PaperDraft): PaperDraft {
  let questionNumber = 1;
  const sections = draft.sections.map((section) => {
    const questions = section.questions.map((question) => ({
      ...question,
      paperQuestionNumber: questionNumber++
    }));
    return {
      ...section,
      questions,
      questionCount: questions.length,
      totalMarks: questions.reduce((total, question) => total + Number(question.marks || 0), 0)
    };
  });
  const answerKey = sections.flatMap((section) =>
    section.questions.map((question) => ({
      questionNumber: question.paperQuestionNumber,
      sourceKey: question.sourceKey,
      answerText: question.answerText || "Answer key not available yet.",
      marks: question.marks
    }))
  );
  return {
    ...draft,
    sections,
    totalMarks: sections.reduce((total, section) => total + section.totalMarks, 0),
    answerKey,
    quality: {
      ...draft.quality,
      questionCount: answerKey.length,
      answerKeyCoverage: answerKey.length
        ? Math.round((answerKey.filter((item) => !item.answerText.includes("not available")).length / answerKey.length) * 100) / 100
        : 0
    }
  };
}
