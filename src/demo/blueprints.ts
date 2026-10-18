import type { ExamBlueprint } from "@/lib/types";

// These are prototype formats ONLY. The real exam format (question count, time
// limit, pass mark) will be entered as configuration with a source link and a
// "last verified" date — we never hardcode official rules. See PROPOSAL §3.5.
export const blueprints: ExamBlueprint[] = [
  {
    id: "demo-quick",
    name: "Quick demo mock",
    questionCount: 6,
    timeLimitMinutes: 8,
    passThresholdPct: 70,
    isDemo: true,
    note: "Demo format for trying the exam runner. Not the official exam format.",
  },
  {
    id: "demo-full",
    name: "Full demo set",
    questionCount: 18,
    timeLimitMinutes: 25,
    passThresholdPct: 70,
    isDemo: true,
    note: "18 questions picked at random from the bank. Not the official exam format.",
  },
  {
    id: "demo-general-medicine",
    name: "General Medicine practice mock",
    questionCount: 60,
    timeLimitMinutes: 60,
    passThresholdPct: 70,
    isDemo: true,
    topicRoot: "pa-general-medicine",
    note: "60 questions picked at random from the General Medicine (31.05.01) bank only. Not the official exam format.",
  },
];
