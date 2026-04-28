export type Role =
  | "visitor"
  | "student"
  | "parent"
  | "teacher"
  | "org_admin"
  | "platform_admin"
  | "reviewer";

export type UserStatus = "active" | "pending" | "suspended";
export type SubjectCode = "physics" | "chemistry" | "mathematics" | "biology";
export type ClassLevel = 11 | 12;
export type TutorMode = "normal" | "board_style" | "hint_only" | "revision";
export type DifficultyLevel = "easy" | "medium" | "hard";
export type QuestionType =
  | "mcq"
  | "short_answer"
  | "long_answer"
  | "numerical"
  | "case_based";

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
}

export interface ApiResponse<T> {
  ok: boolean;
  message?: string;
  data?: T;
}
