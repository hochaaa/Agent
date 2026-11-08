"use client";

import type { AnswerKeyItem, QuestionContent } from "./exam-types";
import type { OmrRow } from "./grading";

type PdfToken = { text: string; x: number; y: number };

const circledAnswers: Record<string, number> = {
  "①": 1,
  "②": 2,
  "③": 3,
  "④": 4,
  "⑤": 5,
};

function tokensToLines(tokens: PdfToken[]) {
  const rows: PdfToken[][] = [];
  for (const token of [...tokens].sort((a, b) => b.y - a.y || a.x - b.x)) {
    const row = rows.find((candidate) => Math.abs(candidate[0].y - token.y) < 3);
    if (row) row.push(token);
    else rows.push([token]);
  }
  return rows
    .sort((a, b) => b[0].y - a[0].y)
    .map((row) =>
      row
        .sort((a, b) => a.x - b.x)
        .map((token) => token.text)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean);
}

async function extractPdfColumns(file: File) {
  const pdfjs = await import("pdfjs-dist");
  if (typeof window !== "undefined") {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();
  }
  const document = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages: { page: number; text: string }[] = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const tokens = content.items.flatMap((item) => {
      if (!("str" in item) || !item.str.trim()) return [];
      return [{ text: item.str.trim(), x: item.transform[4], y: item.transform[5] }];
    });
    const midpoint = viewport.width / 2;
    const left = tokensToLines(tokens.filter((token) => token.x < midpoint));
    const right = tokensToLines(tokens.filter((token) => token.x >= midpoint));
    pages.push({ page: pageNumber, text: [...left, ...right].join("\n") });
  }

  return pages;
}

export async function parseAnswerPdf(file: File): Promise<AnswerKeyItem[]> {
  const pages = await extractPdfColumns(file);
  const answerMap = new Map<number, AnswerKeyItem>();
  const rowPattern = /(\d{1,2})\s*([①②③④⑤1-5])\s*([1-9])/g;

  for (const { text } of pages) {
    for (const line of text.split("\n")) {
      for (const match of line.matchAll(rowPattern)) {
        const questionNumber = Number(match[1]);
        const answer = circledAnswers[match[2]] ?? Number(match[2]);
        const points = Number(match[3]);
        if (
          questionNumber >= 1 &&
          questionNumber <= 200 &&
          answer >= 1 &&
          answer <= 5 &&
          points >= 1 &&
          points <= 10
        ) {
          answerMap.set(questionNumber, { questionNumber, answer, points });
        }
      }
    }
  }

  const answerKey = [...answerMap.values()].sort(
    (a, b) => a.questionNumber - b.questionNumber,
  );
  if (answerKey.length < 2) {
    throw new Error("정답 PDF의 표에서 문항·정답·배점을 추출하지 못했습니다.");
  }
  return answerKey;
}

export async function parseQuestionPdf(file: File): Promise<QuestionContent[]> {
  const pages = await extractPdfColumns(file);
  const questions: QuestionContent[] = [];
  const startPattern = /(?:^|\n)(\d{1,3})\.\s/g;

  for (const page of pages) {
    const matches = [...page.text.matchAll(startPattern)];
    matches.forEach((match, index) => {
      const questionNumber = Number(match[1]);
      const start = (match.index ?? 0) + match[0].length;
      const end = matches[index + 1]?.index ?? page.text.length;
      const text = `${questionNumber}. ${page.text.slice(start, end)}`
        .replace(/\s+/g, " ")
        .trim();
      if (questionNumber >= 1 && questionNumber <= 200 && text.length > 20) {
        questions.push({ questionNumber, text, page: page.page });
      }
    });
  }

  const unique = new Map<number, QuestionContent>();
  for (const question of questions) {
    if (!unique.has(question.questionNumber)) unique.set(question.questionNumber, question);
  }
  return [...unique.values()].sort((a, b) => a.questionNumber - b.questionNumber);
}

export async function parseOmrWorkbook(file: File): Promise<OmrRow[]> {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error("OMR 엑셀에 워크시트가 없습니다.");

  const header = worksheet.getRow(1);
  const questionColumns: { column: number; questionNumber: number }[] = [];
  header.eachCell((cell, column) => {
    const match = String(cell.value ?? "").trim().match(/^Q(\d{1,3})$/i);
    if (match) questionColumns.push({ column, questionNumber: Number(match[1]) });
  });
  questionColumns.sort((a, b) => a.questionNumber - b.questionNumber);
  if (questionColumns.length === 0) {
    throw new Error("OMR 엑셀에서 Q01 형식의 문항 열을 찾지 못했습니다.");
  }

  const rows: OmrRow[] = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const name = String(row.getCell(1).value ?? "").trim();
    if (!name) return;
    const answers = questionColumns.map(({ column, questionNumber }) => {
      const answer = Number(row.getCell(column).value);
      if (!Number.isInteger(answer) || answer < 1 || answer > 5) {
        throw new Error(`${name}의 ${questionNumber}번 응답이 1~5가 아닙니다.`);
      }
      return answer;
    });
    rows.push({ name, answers });
  });
  return rows;
}
