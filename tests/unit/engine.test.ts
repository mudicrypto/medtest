import { describe, expect, it } from "vitest";
import {
  canSubmit,
  createSession,
  currentId,
  questionState,
  sessionMistakes,
  sessionReducer,
  sessionScore,
  submissionIdFor,
  type SessionAction,
  type SessionState,
} from "../../src/lib/practice/engine";
import type { GradeResult } from "../../src/lib/types";

const result = (correct: boolean): GradeResult => ({
  correct,
  specialty: "cardiology",
  key: { correct: "B", explanationEn: "…", explanationRu: null, optionExplanations: {}, examPearl: null, tutorHint: "" },
});

const run = (state: SessionState, ...actions: SessionAction[]) => actions.reduce(sessionReducer, state);

/** Select, submit and grade one question. */
const answer = (state: SessionState, id: string, option: "A" | "B" | "C" | "D", correct: boolean) =>
  run(
    state,
    { type: "select", id, option },
    { type: "submit", id, submissionId: `sub-${id}` },
    { type: "graded", id, submissionId: `sub-${id}`, result: result(correct) },
  );

describe("answer selection", () => {
  it("starts with nothing selected and lets the student change their mind before submitting", () => {
    let s = createSession(["q1", "q2"]);
    expect(questionState(s, "q1")).toEqual({ status: "unanswered", selected: null });
    s = run(s, { type: "select", id: "q1", option: "A" }, { type: "select", id: "q1", option: "C" });
    expect(questionState(s, "q1").selected).toBe("C");
  });

  it("locks the answer once submitted", () => {
    const s = run(createSession(["q1"]), { type: "select", id: "q1", option: "A" }, { type: "submit", id: "q1", submissionId: "x" });
    expect(run(s, { type: "select", id: "q1", option: "D" })).toBe(s);
    const graded = run(s, { type: "graded", id: "q1", submissionId: "x", result: result(false) });
    expect(run(graded, { type: "select", id: "q1", option: "D" })).toBe(graded);
  });

  it("ignores selections for questions outside the session", () => {
    const s = createSession(["q1"]);
    expect(run(s, { type: "select", id: "other", option: "A" })).toBe(s);
  });
});

describe("answer submission", () => {
  it("can't submit without a selection", () => {
    const s = createSession(["q1"]);
    expect(canSubmit(s, "q1")).toBe(false);
    expect(run(s, { type: "submit", id: "q1", submissionId: "x" })).toBe(s);
  });

  it("prevents duplicate submissions while one is in flight and after grading", () => {
    let s = run(createSession(["q1"]), { type: "select", id: "q1", option: "B" }, { type: "submit", id: "q1", submissionId: "first" });
    expect(questionState(s, "q1")).toMatchObject({ status: "submitting", submissionId: "first" });
    expect(canSubmit(s, "q1")).toBe(false);
    expect(run(s, { type: "submit", id: "q1", submissionId: "second" })).toBe(s);

    s = run(s, { type: "graded", id: "q1", submissionId: "first", result: result(true) });
    expect(canSubmit(s, "q1")).toBe(false);
    expect(run(s, { type: "submit", id: "q1", submissionId: "third" })).toBe(s);
  });

  it("shows correct and incorrect feedback from the server's result", () => {
    let s = answer(createSession(["q1", "q2"]), "q1", "B", true);
    s = answer(s, "q2", "A", false);
    expect(questionState(s, "q1")).toMatchObject({ status: "answered", selected: "B", result: { correct: true } });
    expect(questionState(s, "q2")).toMatchObject({ status: "answered", selected: "A", result: { correct: false } });
  });

  it("ignores a result for a different or stale submission", () => {
    const s = run(createSession(["q1"]), { type: "select", id: "q1", option: "B" }, { type: "submit", id: "q1", submissionId: "now" });
    expect(run(s, { type: "graded", id: "q1", submissionId: "old", result: result(true) })).toBe(s);
  });

  it("after a failed submission, keeps the answer and retries with the same submission ID", () => {
    let s = run(
      createSession(["q1"]),
      { type: "select", id: "q1", option: "B" },
      { type: "submit", id: "q1", submissionId: "attempt-1" },
      { type: "submitFailed", id: "q1", submissionId: "attempt-1" },
    );
    expect(questionState(s, "q1")).toMatchObject({ status: "unanswered", selected: "B" });
    expect(canSubmit(s, "q1")).toBe(true);
    // Same answer → same ID, so the server can recognise a repeat.
    expect(submissionIdFor(s, "q1", "fresh")).toBe("attempt-1");
    // A different answer is a new submission.
    s = run(s, { type: "select", id: "q1", option: "C" });
    expect(submissionIdFor(s, "q1", "fresh")).toBe("fresh");
  });
});

describe("scoring", () => {
  it("counts only answered questions; unanswered questions are never incorrect", () => {
    let s = createSession(["q1", "q2", "q3", "q4"]);
    s = answer(s, "q1", "B", true);
    s = answer(s, "q2", "A", false);
    // q3 selected but not submitted, q4 untouched.
    s = run(s, { type: "select", id: "q3", option: "D" });
    expect(sessionScore(s)).toEqual({ total: 4, answered: 2, correct: 1, incorrect: 1, unanswered: 2, accuracy: 50 });
  });

  it("does not count a submission that is still awaiting the server", () => {
    const s = run(createSession(["q1"]), { type: "select", id: "q1", option: "B" }, { type: "submit", id: "q1", submissionId: "x" });
    expect(sessionScore(s)).toMatchObject({ answered: 0, incorrect: 0, unanswered: 1, accuracy: null });
  });

  it("has no accuracy until something is answered, and rounds to whole percent", () => {
    expect(sessionScore(createSession(["q1"])).accuracy).toBeNull();
    let s = createSession(["a", "b", "c"]);
    s = answer(s, "a", "B", true);
    s = answer(s, "b", "B", true);
    s = answer(s, "c", "A", false);
    expect(sessionScore(s).accuracy).toBe(67);
  });

  it("lists the session's mistakes in order", () => {
    let s = createSession(["q1", "q2", "q3"]);
    s = answer(s, "q3", "A", false);
    s = answer(s, "q1", "A", false);
    s = answer(s, "q2", "B", true);
    expect(sessionMistakes(s)).toEqual(["q1", "q3"]);
  });

  it("ignores duplicate IDs in the question list", () => {
    expect(createSession(["q1", "q1", "q2"]).ids).toEqual(["q1", "q2"]);
  });
});

describe("question navigation", () => {
  it("moves forward and back, and finishes after the last question", () => {
    let s = createSession(["q1", "q2", "q3"]);
    expect(currentId(s)).toBe("q1");
    s = run(s, { type: "previous" });
    expect(s.index).toBe(0); // can't go before the first
    s = run(s, { type: "next" }, { type: "next" });
    expect(currentId(s)).toBe("q3");
    expect(s.finished).toBe(false);
    s = run(s, { type: "next" });
    expect(s.finished).toBe(true);
    expect(currentId(s)).toBe("q3");
    // Going back from the results returns to the last question.
    s = run(s, { type: "previous" });
    expect(s.finished).toBe(false);
  });

  it("skipping leaves the question unanswered", () => {
    const s = run(createSession(["q1", "q2"]), { type: "next" });
    expect(currentId(s)).toBe("q2");
    expect(questionState(s, "q1").status).toBe("unanswered");
    expect(sessionScore(s).incorrect).toBe(0);
  });

  it("jumps to a question (e.g. from the results list) within bounds only", () => {
    let s = run(createSession(["q1", "q2", "q3"]), { type: "finish" });
    s = run(s, { type: "goTo", index: 1 });
    expect(s).toMatchObject({ index: 1, finished: false });
    expect(run(s, { type: "goTo", index: 9 })).toBe(s);
    expect(run(s, { type: "goTo", index: -1 })).toBe(s);
  });

  it("can end the session early", () => {
    const s = run(createSession(["q1", "q2", "q3"]), { type: "finish" });
    expect(s.finished).toBe(true);
    expect(sessionScore(s).unanswered).toBe(3);
  });
});

describe("restarting", () => {
  it("restarting a question clears its answer and removes it from the score", () => {
    let s = answer(createSession(["q1", "q2"]), "q1", "A", false);
    s = run(s, { type: "restartQuestion", id: "q1" });
    expect(questionState(s, "q1")).toEqual({ status: "unanswered", selected: null });
    expect(sessionScore(s)).toMatchObject({ answered: 0, incorrect: 0 });
    s = answer(s, "q1", "B", true);
    expect(sessionScore(s)).toMatchObject({ answered: 1, correct: 1 });
  });

  it("a response arriving after the question was restarted is ignored", () => {
    let s = run(createSession(["q1"]), { type: "select", id: "q1", option: "A" }, { type: "submit", id: "q1", submissionId: "late" });
    s = run(s, { type: "restartQuestion", id: "q1" });
    expect(run(s, { type: "graded", id: "q1", submissionId: "late", result: result(false) })).toBe(s);
  });

  it("restarting the session clears every answer and returns to the first question", () => {
    let s = answer(createSession(["q1", "q2"]), "q1", "B", true);
    s = run(s, { type: "next" }, { type: "next" });
    expect(s.finished).toBe(true);
    s = run(s, { type: "restartSession" });
    expect(s).toEqual(createSession(["q1", "q2"]));
  });
});
