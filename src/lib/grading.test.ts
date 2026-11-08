import { describe, expect, it } from "vitest";
import { gradeExam } from "./grading";

const answerKey = [
  { questionNumber: 1, answer: 1, points: 10 },
  { questionNumber: 2, answer: 2, points: 20 },
  { questionNumber: 3, answer: 3, points: 30 },
  { questionNumber: 4, answer: 4, points: 40 },
];

describe("gradeExam", () => {
  it("computes exact scores, statistics, and stable missed-question ranking", () => {
    const result = gradeExam(
      answerKey,
      [
        { name: "A", answers: [1, 2, 3, 4] },
        { name: "B", answers: [1, 2, 1, 1] },
        { name: "C", answers: [2, 2, 3, 1] },
        { name: "D", answers: [2, 1, 1, 4] },
      ],
      [],
    );

    expect(result.totalPoints).toBe(100);
    expect(result.students.map(({ name, score }) => ({ name, score }))).toEqual([
      { name: "A", score: 100 },
      { name: "B", score: 30 },
      { name: "C", score: 50 },
      { name: "D", score: 40 },
    ]);
    expect(result.mean).toBe(55);
    expect(result.median).toBe(45);
    expect(result.populationStdDev).toBe(26.93);
    expect(result.mostMissed).toEqual([
      { questionNumber: 1, missedCount: 2, missedRate: 0.5 },
      { questionNumber: 3, missedCount: 2, missedRate: 0.5 },
      { questionNumber: 4, missedCount: 2, missedRate: 0.5 },
      { questionNumber: 2, missedCount: 1, missedRate: 0.25 },
    ]);
  });

  it("rejects a response count that differs from the answer key", () => {
    expect(() =>
      gradeExam(answerKey, [{ name: "A", answers: [1, 2] }], []),
    ).toThrow("응답 문항 수가 정답 문항 수와 다릅니다");
  });

  it("rejects duplicate student names", () => {
    expect(() =>
      gradeExam(
        answerKey,
        [
          { name: "A", answers: [1, 2, 3, 4] },
          { name: "A", answers: [1, 2, 3, 4] },
        ],
        [],
      ),
    ).toThrow("중복 학생명");
  });
});
