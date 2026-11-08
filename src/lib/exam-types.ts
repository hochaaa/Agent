export type AnswerKeyItem = {
  questionNumber: number;
  answer: number;
  points: number;
};

export type QuestionContent = {
  questionNumber: number;
  text: string;
  page: number;
};

export type StudentResult = {
  name: string;
  score: number;
  answers: number[];
  correctByQuestion: boolean[];
};

export type MissedQuestion = {
  questionNumber: number;
  missedCount: number;
  missedRate: number;
};

export type ExamAnalysis = {
  createdAt: string;
  studentCount: number;
  questionCount: number;
  totalPoints: number;
  mean: number;
  median: number;
  populationStdDev: number;
  students: StudentResult[];
  mostMissed: MissedQuestion[];
  answerKey: AnswerKeyItem[];
  questions: QuestionContent[];
};

export type InputFiles = {
  questions: File | null;
  answers: File | null;
  omr: File | null;
};
