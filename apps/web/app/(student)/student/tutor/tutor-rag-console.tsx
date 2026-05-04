"use client";

import { useEffect, useRef, useState } from "react";

type Chapter = {
  subjectId: string;
  subjectName: string;
  classLevel: number;
  chapterId: string;
  chapterTitle: string;
  objectCount: number;
  examples: number;
  exerciseQuestions: number;
  exerciseAnswers: number;
  definitions?: number;
  formulas?: number;
  namespacePath?: string;
  pineconeNamespace?: string;
};

type Subject = {
  id: string;
  name: string;
  classLevel: number;
  available: boolean;
  chapters: Chapter[];
};

type Citation = {
  title?: string;
  objectType?: string;
  objectKey?: string;
  chapterTitle?: string;
  pageStart?: number;
  pageEnd?: number;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  citations?: Citation[];
};

type Conversation = {
  id: string;
  title: string;
  subjectId: string;
  chapterId: string;
  messages: ChatMessage[];
  summary: string;
  updatedAt: number;
};

type TutorResponse = {
  answerText: string;
  citations: Citation[];
  confidenceScore: number;
  conversationSummary: string;
};

type BrowserTab = "examples" | "exercises" | "definitions";

type ChapterItem = {
  kind: string;
  key?: string;
  title?: string;
  number?: number;
  pageStart?: number;
  pageEnd?: number;
  preview?: string;
  hasAnswer?: boolean;
  questionNumber?: number;
};

type ExerciseGroup = {
  kind: "exercise";
  exerciseNumber: string;
  questionCount: number;
  answerCount: number;
  questions: ChapterItem[];
};

type ChapterContentMap = {
  available: boolean;
  examples: ChapterItem[];
  exercises: ExerciseGroup[];
  definitions: ChapterItem[];
  formulas: ChapterItem[];
  content: ChapterItem[];
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const STORE_KEY = "learn-ai-tutor-conversations-v3";

const starters = [
  "Give me solution of Example 1 in detail",
  "In Exercise 1.1 tell me answer of Q1",
  "Explain equivalence relation in simple terms"
];

const thinkingSteps = ["Finding source", "Reading chapter", "Framing answer"];

export function TutorRagConsole() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState("");
  const [contentMap, setContentMap] = useState<ChapterContentMap | null>(null);
  const [tab, setTab] = useState<BrowserTab>("examples");
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingIndex, setThinkingIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const active = conversations.find((conversation) => conversation.id === activeId);
  const availableSubjects = subjects.filter((subject) => subject.available);
  const selectedSubject =
    subjects.find((subject) => subject.id === active?.subjectId) ?? availableSubjects[0] ?? subjects[0];
  const selectedChapter =
    selectedSubject?.chapters.find((chapter) => chapter.chapterId === active?.chapterId) ?? selectedSubject?.chapters[0];

  const sourceStats = [
    { label: "Examples", value: selectedChapter?.examples ?? 0 },
    { label: "Questions", value: selectedChapter?.exerciseQuestions ?? 0 },
    { label: "Answer keys", value: selectedChapter?.exerciseAnswers ?? 0 },
    { label: "Definitions", value: selectedChapter?.definitions ?? 0 }
  ];

  useEffect(() => {
    fetch(`${API_BASE_URL}/v1/tutor/context`)
      .then((res) => res.json())
      .then((payload: { subjects: Subject[] }) => {
        setSubjects(payload.subjects);
        const restored = restoreConversations();
        if (restored.length) {
          setConversations(restored);
          setActiveId(restored[0].id);
          return;
        }

        const firstSubject = payload.subjects.find((subject) => subject.available && subject.chapters.length);
        const firstChapter = firstSubject?.chapters[0];
        if (firstSubject && firstChapter) {
          const first = createConversation(firstSubject.id, firstChapter.chapterId);
          setConversations([first]);
          setActiveId(first.id);
        }
      })
      .catch(() => setError("Could not load tutor context."));
  }, []);

  useEffect(() => {
    if (conversations.length) {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(conversations));
    }
  }, [conversations]);

  useEffect(() => {
    if (!selectedSubject?.id || !selectedChapter?.chapterId) return;
    fetch(`${API_BASE_URL}/v1/tutor/chapters/${selectedSubject.id}/${selectedChapter.chapterId}/objects`)
      .then((res) => res.json())
      .then((payload: ChapterContentMap) => setContentMap(payload))
      .catch(() => setContentMap(null));
  }, [selectedSubject?.id, selectedChapter?.chapterId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [active?.messages.length, isThinking]);

  useEffect(() => {
    if (!isThinking) {
      setThinkingIndex(0);
      return;
    }
    const timer = window.setInterval(() => {
      setThinkingIndex((index) => (index + 1) % thinkingSteps.length);
    }, 850);
    return () => window.clearInterval(timer);
  }, [isThinking]);

  function setActiveConversation(updater: (conversation: Conversation) => Conversation) {
    setConversations((current) =>
      current
        .map((conversation) => (conversation.id === activeId ? updater(conversation) : conversation))
        .sort((a, b) => b.updatedAt - a.updatedAt)
    );
  }

  function startNewChat(subjectId = selectedSubject?.id, chapterId = selectedChapter?.chapterId) {
    if (!subjectId || !chapterId) return;
    const next = createConversation(subjectId, chapterId);
    setConversations((current) => [next, ...current]);
    setActiveId(next.id);
    setInput("");
  }

  function changeSubject(subjectId: string) {
    const nextSubject = subjects.find((subject) => subject.id === subjectId);
    const nextChapter = nextSubject?.chapters[0];
    if (nextSubject?.available && nextChapter) startNewChat(nextSubject.id, nextChapter.chapterId);
  }

  function changeChapter(chapterId: string) {
    if (!active) return;
    setActiveConversation((conversation) => ({
      ...conversation,
      chapterId,
      messages: [],
      summary: "",
      title: "New chat",
      updatedAt: Date.now()
    }));
  }

  function sendMessage(nextInput = input) {
    const text = nextInput.trim();
    if (!text || !active || !selectedChapter || isThinking) return;

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", text };
    const outgoingMessages = [...active.messages, userMessage];
    setActiveConversation((conversation) => ({
      ...conversation,
      title: conversation.messages.length ? conversation.title : titleFrom(text),
      messages: outgoingMessages,
      updatedAt: Date.now()
    }));
    setInput("");
    setError(null);
    setIsThinking(true);

    void (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/v1/tutor/respond`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            subjectId: active.subjectId,
            chapterId: active.chapterId,
            mode: "rag_direct",
            conversationSummary: active.summary,
            recentMessages: outgoingMessages.slice(-6).map((message) => ({
              role: message.role,
              content: message.text
            })),
            attachments: []
          })
        });

        if (!res.ok) throw new Error(`Tutor API failed with ${res.status}`);
        const payload = (await res.json()) as TutorResponse;
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          text: payload.answerText,
          citations: payload.citations
        };
        setActiveConversation((conversation) => ({
          ...conversation,
          messages: [...conversation.messages, assistantMessage],
          summary: payload.conversationSummary,
          updatedAt: Date.now()
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Tutor request failed");
      } finally {
        setIsThinking(false);
      }
    })();
  }

  return (
    <section className="h-[calc(100vh-2rem)] min-h-[720px] overflow-hidden rounded-[2rem] border border-[#dedbd1] bg-[#f3efe4] shadow-soft">
      <div className="grid h-full min-h-0 grid-cols-1 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.13),transparent_34%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.11),transparent_32%)] xl:grid-cols-[280px_minmax(0,1fr)_340px]">
        <aside className="hidden min-h-0 border-r border-[#dedbd1] bg-[#161616] text-white xl:flex xl:flex-col">
          <div className="border-b border-white/10 p-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">Learn AI Tutor</div>
            <button
              onClick={() => startNewChat()}
              className="mt-4 w-full rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#161616] transition hover:bg-[#f7d778]"
            >
              New conversation
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <div className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">History</div>
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => setActiveId(conversation.id)}
                  className={`w-full rounded-2xl px-3 py-3 text-left transition ${
                    conversation.id === activeId
                      ? "bg-white text-[#161616]"
                      : "bg-white/[0.07] text-white/72 hover:bg-white/[0.12] hover:text-white"
                  }`}
                >
                  <div className="truncate text-sm font-semibold">{conversation.title}</div>
                  <div className="mt-1 text-xs text-current opacity-55">{conversation.messages.length} messages</div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex min-h-0 flex-col">
          <header className="shrink-0 border-b border-[#dedbd1] bg-white/70 px-4 py-4 backdrop-blur md:px-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">Grounded study chat</div>
                <h1 className="mt-1 font-display text-2xl text-ink md:text-3xl">{selectedChapter?.chapterTitle ?? "Tutor"}</h1>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <select
                  value={selectedSubject?.id ?? ""}
                  onChange={(event) => changeSubject(event.target.value)}
                  className="rounded-2xl border border-[#dedbd1] bg-white px-3 py-3 text-sm font-bold text-ink outline-none"
                >
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id} disabled={!subject.available}>
                      {subject.name} Class {subject.classLevel}
                      {subject.available ? "" : " - coming soon"}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedChapter?.chapterId ?? ""}
                  onChange={(event) => changeChapter(event.target.value)}
                  className="rounded-2xl border border-[#dedbd1] bg-white px-3 py-3 text-sm font-bold text-ink outline-none"
                >
                  {(selectedSubject?.chapters ?? []).map((chapter) => (
                    <option key={chapter.chapterId} value={chapter.chapterId}>
                      {chapter.chapterTitle}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </header>

          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6">
            <div className="mx-auto max-w-3xl space-y-4">
              {!active?.messages.length ? (
                <EmptyChat
                  sourceStats={sourceStats}
                  onAsk={sendMessage}
                  selectedChapter={selectedChapter}
                  contentMap={contentMap}
                />
              ) : null}

              {active?.messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}

              {isThinking ? <ThinkingBubble step={thinkingSteps[thinkingIndex]} /> : null}
            </div>
          </div>

          <form
            className="shrink-0 border-t border-[#dedbd1] bg-white/85 px-4 py-4 backdrop-blur md:px-6"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <div className="mx-auto max-w-3xl">
              {error ? <div className="mb-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
              <div className="flex gap-2 rounded-[1.35rem] border border-[#d8d3c6] bg-[#fbfaf6] p-2 shadow-sm">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                  rows={1}
                  className="max-h-32 min-h-12 flex-1 resize-none bg-transparent px-3 py-3 text-[15px] text-ink outline-none placeholder:text-muted"
                  placeholder="Ask only what you need: Example 1, Exercise 1.1 Q1, or a concept..."
                />
                <button
                  disabled={!input.trim() || isThinking || !active}
                  className="rounded-2xl bg-[#161616] px-5 py-2 text-sm font-bold text-white transition hover:bg-primary disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Send
                </button>
              </div>
            </div>
          </form>
        </main>

        <aside className="hidden min-h-0 border-l border-[#dedbd1] bg-[#fbfaf6]/88 backdrop-blur xl:flex xl:flex-col">
          <div className="border-b border-[#dedbd1] p-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted">Chapter sources</div>
            <div className="mt-2 text-lg font-bold text-ink">{selectedChapter?.chapterTitle ?? "No chapter"}</div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {sourceStats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-[#dedbd1] bg-white p-3">
                  <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">{stat.label}</div>
                  <div className="mt-1 font-display text-2xl text-ink">{stat.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-1 border-b border-[#dedbd1] p-3">
            {(["examples", "exercises", "definitions"] as BrowserTab[]).map((item) => (
              <button
                key={item}
                onClick={() => setTab(item)}
                className={`flex-1 rounded-xl px-3 py-2 text-xs font-bold capitalize transition ${
                  tab === item ? "bg-[#161616] text-white" : "bg-white text-ink-soft hover:bg-[#eee9db]"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <ChapterBrowser tab={tab} contentMap={contentMap} onAsk={sendMessage} />
          </div>
        </aside>
      </div>
    </section>
  );
}

function EmptyChat({
  sourceStats,
  onAsk,
  selectedChapter,
  contentMap
}: {
  sourceStats: { label: string; value: number }[];
  onAsk: (prompt: string) => void;
  selectedChapter?: Chapter;
  contentMap: ChapterContentMap | null;
}) {
  return (
    <div className="rounded-[2rem] border border-[#dedbd1] bg-white/88 p-5 shadow-soft md:p-7">
      <div className="inline-flex rounded-full bg-[#161616] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
        RAG active
      </div>
      <h2 className="mt-4 font-display text-3xl text-ink md:text-4xl">Ask the chapter. Get the exact thing back.</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        Current data is scoped to {selectedChapter?.chapterTitle ?? "the selected chapter"}. Exact examples and exercise
        answers are pulled from structured objects; concept doubts use Pinecone retrieval before the AI formats the answer.
      </p>

      <div className="mt-5 grid gap-2 sm:grid-cols-4">
        {sourceStats.map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-[#f3efe4] p-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">{stat.label}</div>
            <div className="mt-1 font-display text-2xl text-ink">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {starters.map((starter) => (
          <button
            key={starter}
            onClick={() => onAsk(starter)}
            className="rounded-full border border-[#dedbd1] bg-[#fbfaf6] px-4 py-2 text-sm font-bold text-ink-soft transition hover:border-primary hover:text-primary"
          >
            {starter}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {(contentMap?.examples ?? []).slice(0, 4).map((item) => (
          <button
            key={item.key}
            onClick={() => onAsk(promptForItem("examples", item))}
            className="rounded-2xl border border-[#dedbd1] bg-[#fbfaf6] p-3 text-left transition hover:border-primary"
          >
            <div className="text-sm font-bold text-ink">{item.title}</div>
            <div className="mt-1 text-xs text-muted">Page {item.pageStart}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[92%] rounded-[1.45rem] px-4 py-3 text-[15px] leading-7 md:max-w-[80%] ${
          isUser
            ? "rounded-br-md bg-[#161616] text-white"
            : "rounded-bl-md border border-[#dedbd1] bg-white text-ink shadow-sm"
        }`}
      >
        <StudyText text={message.text} />
        {!isUser && message.citations?.length ? <CitationRow citations={message.citations} /> : null}
      </div>
    </div>
  );
}

function CitationRow({ citations }: { citations: Citation[] }) {
  const unique = uniqueCitations(citations).slice(0, 3);
  return (
    <div className="mt-3 border-t border-[#ece7da] pt-2">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">Sources</div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {unique.map((citation) => (
          <span
            key={`${citation.objectKey}-${citation.pageStart}`}
            className="rounded-full bg-[#eef0ff] px-2.5 py-1 text-[11px] font-bold text-primary-strong"
          >
            {citation.title ?? citation.objectType} p.{citation.pageStart ?? "?"}
          </span>
        ))}
      </div>
    </div>
  );
}

function ThinkingBubble({ step }: { step: string }) {
  return (
    <div className="flex justify-start">
      <div className="rounded-[1.45rem] rounded-bl-md border border-[#dedbd1] bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9">
            <span className="absolute inset-0 rounded-full border-2 border-[#ddd6fe]" />
            <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary" />
            <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Thinking</div>
            <div className="text-sm font-bold text-ink">{step}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChapterBrowser({
  tab,
  contentMap,
  onAsk
}: {
  tab: BrowserTab;
  contentMap: ChapterContentMap | null;
  onAsk: (prompt: string) => void;
}) {
  if (!contentMap?.available) {
    return <div className="rounded-2xl bg-white p-4 text-sm text-muted">Loading chapter sources...</div>;
  }

  if (tab === "exercises") {
    return (
      <div className="space-y-3">
        {contentMap.exercises.map((exercise) => (
          <div key={exercise.exerciseNumber} className="rounded-2xl border border-[#dedbd1] bg-white p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-ink">Exercise {exercise.exerciseNumber}</div>
              <div className="text-xs font-bold text-muted">
                {exercise.answerCount}/{exercise.questionCount} keys
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {exercise.questions.slice(0, 12).map((question) => (
                <SourceButton
                  key={question.key}
                  title={`Question ${question.questionNumber}`}
                  meta={question.hasAnswer ? "Answer mapped" : "Question only"}
                  preview={question.preview}
                  onClick={() => onAsk(promptForExercise(exercise.exerciseNumber, question))}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const items = contentMap[tab] ?? [];
  return (
    <div className="space-y-2">
      {items.slice(0, 18).map((item) => (
        <SourceButton
          key={item.key}
          title={item.title ?? item.key ?? tab}
          meta={`Page ${item.pageStart ?? "?"}`}
          preview={item.preview}
          onClick={() => onAsk(promptForItem(tab, item))}
        />
      ))}
    </div>
  );
}

function SourceButton({
  title,
  meta,
  preview,
  onClick
}: {
  title: string;
  meta: string;
  preview?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl border border-[#ece7da] bg-[#fbfaf6] p-3 text-left transition hover:border-primary hover:bg-white"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="line-clamp-1 text-sm font-bold text-ink">{title}</div>
        <div className="shrink-0 text-[10px] font-bold uppercase tracking-[0.12em] text-muted">{meta}</div>
      </div>
      {preview ? <div className="mt-2 line-clamp-2 text-xs leading-5 text-muted">{preview}</div> : null}
    </button>
  );
}

function StudyText({ text }: { text: string }) {
  return (
    <div className="space-y-2 whitespace-pre-wrap">
      {text.split("\n").map((line, index) => (
        <p key={`${index}-${line.slice(0, 18)}`} className={lineLooksLikeMath(line) ? "font-mono text-[13px] leading-6" : ""}>
          {line || "\u00a0"}
        </p>
      ))}
    </div>
  );
}

function lineLooksLikeMath(line: string) {
  return /[=<>+\-*/^{}]|R\s*=|f\s*\(|\([a-z],\s*[a-z]\)/i.test(line);
}

function promptForExercise(exerciseNumber: string, question: ChapterItem) {
  if (question.hasAnswer) return `In Exercise ${exerciseNumber} tell me answer of Q${question.questionNumber}`;
  return `Solve Exercise ${exerciseNumber} Question ${question.questionNumber} in detail`;
}

function promptForItem(tab: BrowserTab, item: ChapterItem) {
  if (tab === "examples") return `Give me solution of Example ${item.number} in detail`;
  if (tab === "definitions") return `Explain ${item.title} in simple terms`;
  return item.title ?? "Explain this chapter item";
}

function uniqueCitations(citations: Citation[]) {
  const seen = new Set<string>();
  return citations.filter((citation) => {
    const key = `${citation.objectKey}-${citation.pageStart}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function restoreConversations() {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as Conversation[]) : [];
  } catch {
    window.localStorage.removeItem(STORE_KEY);
    return [];
  }
}

function createConversation(subjectId: string, chapterId: string): Conversation {
  return {
    id: crypto.randomUUID(),
    title: "New chat",
    subjectId,
    chapterId,
    messages: [],
    summary: "",
    updatedAt: Date.now()
  };
}

function titleFrom(text: string) {
  return text.length > 42 ? `${text.slice(0, 42)}...` : text;
}
