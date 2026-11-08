"use client";

import type { ExamAnalysis } from "./exam-types";

export async function downloadAnalysisWorkbook(analysis: ExamAnalysis) {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "영어 시험 분석 Agent";

  const summary = workbook.addWorksheet("전체 학생 성적 개요");
  const lowestScore = Math.min(...analysis.students.map((student) => student.score));
  const lowestStudents = analysis.students
    .filter((student) => student.score === lowestScore)
    .map((student) => student.name)
    .join(", ");
  summary.columns = [
    { header: "항목", key: "metric", width: 28 },
    { header: "값", key: "value", width: 22 },
  ];
  summary.addRows([
    { metric: "학생 수", value: analysis.studentCount },
    { metric: "문항 수", value: analysis.questionCount },
    { metric: "총점", value: analysis.totalPoints },
    { metric: "평균", value: analysis.mean },
    { metric: "중앙값", value: analysis.median },
    { metric: "표준편차(모집단)", value: analysis.populationStdDev },
    { metric: "최저 점수", value: `${lowestStudents} (${lowestScore}점)` },
    ...analysis.mostMissed.slice(0, 3).map((item, index) => ({
      metric: `최다 오답 ${index + 1}위`,
      value: `${item.questionNumber}번 (${item.missedCount}명)`,
    })),
  ]);

  const detail = workbook.addWorksheet("학생별 결과");
  detail.columns = [
    { header: "학생명", key: "name", width: 18 },
    { header: "점수", key: "score", width: 10 },
    ...analysis.answerKey.map((item) => ({
      header: `Q${String(item.questionNumber).padStart(2, "0")}`,
      key: `q${item.questionNumber}`,
      width: 8,
    })),
  ];
  for (const student of analysis.students) {
    const row: Record<string, string | number> = {
      name: student.name,
      score: student.score,
    };
    student.correctByQuestion.forEach((correct, index) => {
      row[`q${analysis.answerKey[index].questionNumber}`] = correct ? "O" : "X";
    });
    detail.addRow(row);
  }

  const questions = workbook.addWorksheet("문항 정보");
  questions.columns = [
    { header: "문항", key: "questionNumber", width: 12 },
    { header: "정답", key: "answer", width: 12 },
    { header: "배점", key: "points", width: 12 },
    { header: "오답자 수", key: "missedCount", width: 15 },
    { header: "오답률", key: "missedRate", width: 14 },
  ];
  const missedByQuestion = new Map(
    analysis.mostMissed.map((item) => [item.questionNumber, item]),
  );
  questions.addRows(
    analysis.answerKey.map((item) => ({
      ...item,
      missedCount: missedByQuestion.get(item.questionNumber)?.missedCount ?? 0,
      missedRate: missedByQuestion.get(item.questionNumber)?.missedRate ?? 0,
    })),
  );
  questions.getColumn("missedRate").numFmt = "0.0%";

  for (const worksheet of [summary, detail, questions]) {
    worksheet.views = [{ state: "frozen", ySplit: 1 }];
    const header = worksheet.getRow(1);
    header.font = { bold: true, color: { argb: "FFFFFFFF" } };
    header.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF172554" },
    };
    header.alignment = { horizontal: "center", vertical: "middle" };
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: worksheet.columnCount },
    };
  }

  summary.pageSetup = { orientation: "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 1, paperSize: 9 };
  detail.views = [{ state: "frozen", xSplit: 2, ySplit: 1, topLeftCell: "C2" }];
  detail.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 3, fitToHeight: 1, paperSize: 9 };
  questions.pageSetup = { orientation: "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 1, paperSize: 9 };

  detail.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    row.eachCell((cell, column) => {
      if (column <= 2) return;
      cell.alignment = { horizontal: "center" };
      if (cell.value === "X") {
        cell.font = { color: { argb: "FFB91C1C" }, bold: true };
      } else if (cell.value === "O") {
        cell.font = { color: { argb: "FF166534" }, bold: true };
      }
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer as BlobPart], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `영어시험_분석결과_${new Date().toISOString().slice(0, 10)}.xlsx`;
  anchor.click();
  URL.revokeObjectURL(url);
}
