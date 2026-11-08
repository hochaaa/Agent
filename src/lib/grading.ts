import type {
  AnswerKeyItem,
  ExamAnalysis,
  QuestionContent,
  StudentResult,
} from "./exam-types";

export type OmrRow = { name: string; answers: number[] };

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function getMedian(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function gradeExam(
  answerKey: AnswerKeyItem[],
  omrRows: OmrRow[],
  questions: QuestionContent[],
): ExamAnalysis {
  if (answerKey.length === 0) throw new Error("정답 문항을 찾지 못했습니다.");
  if (omrRows.length === 0) throw new Error("학생 응답을 찾지 못했습니다.");

  const sortedKey = [...answerKey].sort(
    (a, b) => a.questionNumber - b.questionNumber,
  );
  sortedKey.forEach((item, index) => {
    if (item.questionNumber !== index + 1) {
      throw new Error("정답 문항 번호가 1번부터 연속적이지 않습니다.");
    }
    if (item.answer < 1 || item.answer > 5 || item.points <= 0) {
      throw new Error(`${item.questionNumber}번 정답 또는 배점이 올바르지 않습니다.`);
    }
  });

  const studentNames = new Set<string>();
  const students: StudentResult[] = omrRows.map((row) => {
    const name = row.name.trim();
    if (!name) throw new Error("학생명이 비어 있습니다.");
    if (studentNames.has(name)) throw new Error(`중복 학생명: ${name}`);
    studentNames.add(name);
    if (row.answers.length !== sortedKey.length) {
      throw new Error(`${name}의 응답 문항 수가 정답 문항 수와 다릅니다.`);
    }
    const correctByQuestion = row.answers.map(
      (answer, index) => answer === sortedKey[index].answer,
    );
    const score = correctByQuestion.reduce(
      (total, correct, index) => total + (correct ? sortedKey[index].points : 0),
      0,
    );
    return { name, score, answers: row.answers, correctByQuestion };
  });

  const scores = students.map((student) => student.score);
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const variance =
    scores.reduce((sum, score) => sum + (score - mean) ** 2, 0) / scores.length;

  const mostMissed = sortedKey
    .map((item, index) => {
      const missedCount = students.filter(
        (student) => !student.correctByQuestion[index],
      ).length;
      return {
        questionNumber: item.questionNumber,
        missedCount,
        missedRate: round(missedCount / students.length, 4),
      };
    })
    .sort(
      (a, b) =>
        b.missedCount - a.missedCount || a.questionNumber - b.questionNumber,
    );

  return {
    createdAt: new Date().toISOString(),
    studentCount: students.length,
    questionCount: sortedKey.length,
    totalPoints: sortedKey.reduce((sum, item) => sum + item.points, 0),
    mean: round(mean),
    median: round(getMedian(scores)),
    populationStdDev: round(Math.sqrt(variance)),
    students,
    mostMissed,
    answerKey: sortedKey,
    questions,
  };
}
