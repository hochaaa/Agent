"use client";

import { useMemo, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import Image from "next/image";
import {
  AlertCircle, BarChart3, Check, ChevronLeft, ChevronRight, Download, FileSpreadsheet, FileText,
  LoaderCircle, Send, UploadCloud,
} from "lucide-react";
import type { ExamAnalysis, InputFiles } from "@/lib/exam-types";
import { parseAnswerPdf, parseOmrWorkbook, parseQuestionPdf } from "@/lib/file-parsers";
import { gradeExam } from "@/lib/grading";
import { downloadAnalysisWorkbook } from "@/lib/export-results";

const emptyFiles: InputFiles = { questions: null, answers: null, omr: null };

type UploadFieldProps = {
  label: string;
  hint: string;
  accept: string;
  file: File | null;
  icon: typeof FileText;
  onChange: (file: File | null) => void;
};

function UploadField({ label, hint, accept, file, icon: Icon, onChange }: UploadFieldProps) {
  return (
    <label className={`upload-field ${file ? "complete" : ""}`}>
      <input accept={accept} onChange={(event) => onChange(event.target.files?.[0] ?? null)} type="file" />
      <span className="upload-icon">{file ? <Check size={18} /> : <Icon size={18} />}</span>
      <span className="upload-copy"><strong>{label}</strong><small>{file?.name ?? hint}</small></span>
      <UploadCloud size={17} />
    </label>
  );
}

function MetricCard({ label, value, suffix }: { label: string; value: string | number; suffix?: string }) {
  return <div className="metric-card"><span>{label}</span><strong>{value}<small>{suffix}</small></strong></div>;
}

export function AnalysisWorkspace() {
  const [files, setFiles] = useState<InputFiles>(emptyFiles);
  const [analysis, setAnalysis] = useState<ExamAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [input, setInput] = useState("");
  const [activePanel, setActivePanel] = useState(0);
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const { messages, sendMessage, status, error, stop } = useChat({ transport });
  const canAnalyze = Boolean(files.questions && files.answers && files.omr);
  const chatBusy = status === "submitted" || status === "streaming";
  const lowestScore = analysis
    ? Math.min(...analysis.students.map((student) => student.score))
    : null;
  const lowestStudents = analysis && lowestScore !== null
    ? analysis.students
        .filter((student) => student.score === lowestScore)
        .map((student) => student.name)
        .join(", ")
    : "";

  function panelPosition(index: number) {
    const offset = (index - activePanel + 3) % 3;
    return offset === 0 ? "active" : offset === 1 ? "next" : "previous";
  }

  function movePanel(direction: -1 | 1) {
    setActivePanel((current) => (current + direction + 3) % 3);
  }

  function updateFile(key: keyof InputFiles, file: File | null) {
    setFiles((current) => ({ ...current, [key]: file }));
    setAnalysis(null);
    setAnalysisError("");
  }

  async function handleAnalyze() {
    if (!files.questions || !files.answers || !files.omr) return;
    setIsAnalyzing(true);
    setAnalysisError("");
    try {
      const [answerKey, omrRows, questions] = await Promise.all([
        parseAnswerPdf(files.answers), parseOmrWorkbook(files.omr), parseQuestionPdf(files.questions),
      ]);
      setAnalysis(gradeExam(answerKey, omrRows, questions));
      setActivePanel(1);
    } catch (caught) {
      setAnalysis(null);
      setAnalysisError(caught instanceof Error ? caught.message : "분석 중 오류가 발생했습니다.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleExport() {
    if (!analysis || isExporting) return;
    setIsExporting(true);
    setExportError("");
    try {
      await downloadAnalysisWorkbook(analysis);
    } catch {
      setExportError("엑셀 파일을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div
      aria-label="시험 분석 단계"
      className="page-width workspace-carousel"
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") movePanel(-1);
        if (event.key === "ArrowRight") movePanel(1);
      }}
      tabIndex={0}
    >
      <button aria-label="이전 단계" className="carousel-arrow carousel-arrow-left" onClick={() => movePanel(-1)} type="button"><ChevronLeft /></button>
      <div className="workspace-stage">
      <aside aria-hidden={activePanel !== 0} className={`upload-panel workspace-card panel-${panelPosition(0)}`}>
        <div className="panel-title"><span>01</span><div><h2>데이터 업로드</h2><p>평가에 사용할 원본 파일</p></div></div>
        <div className="upload-list">
          <UploadField label="문제지 PDF" hint="문항 원문을 읽습니다" accept="application/pdf" file={files.questions} icon={FileText} onChange={(file) => updateFile("questions", file)} />
          <UploadField label="정답 PDF" hint="정답과 배점을 추출합니다" accept="application/pdf" file={files.answers} icon={FileText} onChange={(file) => updateFile("answers", file)} />
          <UploadField label="OMR 결과" hint=".xlsx 파일" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" file={files.omr} icon={FileSpreadsheet} onChange={(file) => updateFile("omr", file)} />
        </div>
        <button className="analyze-button" disabled={!canAnalyze || isAnalyzing} onClick={handleAnalyze} type="button">
          {isAnalyzing ? <><LoaderCircle className="spin" size={18} /> 분석 중</> : "분석 시작"}
        </button>
        {analysisError && <div className="inline-error"><AlertCircle size={16} />{analysisError}</div>}
        <div className="privacy-note">파일은 브라우저에서 처리되며 분석을 위해 별도 저장하지 않습니다.</div>
      </aside>

      <section aria-hidden={activePanel !== 1} className={`results-panel workspace-card panel-${panelPosition(1)}`}>
        <div className="panel-title horizontal">
          <span>02</span><div><h2>분석 결과</h2><p>{analysis ? `${analysis.studentCount}명 · ${analysis.questionCount}문항` : "분석 후 결과가 표시됩니다"}</p></div>
          <button className="download-button" disabled={!analysis || isExporting} onClick={handleExport} type="button">{isExporting ? <LoaderCircle className="spin" size={17} /> : <Download size={17} />} {isExporting ? "생성 중" : "엑셀 추출"}</button>
        </div>
        {exportError ? <div className="inline-error" role="alert"><AlertCircle size={16} />{exportError}</div> : null}
        {analysis ? <>
          <div className="metric-grid">
            <MetricCard label="평균" value={analysis.mean} suffix="점" /><MetricCard label="중앙값" value={analysis.median} suffix="점" />
            <MetricCard label="표준편차" value={analysis.populationStdDev} /><MetricCard label="최저 점수" value={`${lowestStudents} · ${lowestScore}`} suffix="점" />
          </div>
          <div className="missed-card"><div className="card-heading"><BarChart3 size={18} /><strong>가장 많이 틀린 문항</strong></div>
            {analysis.mostMissed.slice(0, 3).map((item, index) => <div className="missed-row" key={item.questionNumber}><span>{index + 1}</span><b>{item.questionNumber}번</b><div><i style={{ width: `${Math.max(item.missedRate * 100, 5)}%` }} /></div><em>{item.missedCount}명</em></div>)}
          </div>
        </> : <div className="empty-results"><BarChart3 size={28} /><strong>아직 분석 결과가 없습니다.</strong><span>왼쪽에서 세 파일을 선택하고 분석을 시작해 주세요.</span></div>}
      </section>

      <section aria-hidden={activePanel !== 2} className={`chat-panel workspace-card panel-${panelPosition(2)}`}>
        <div className="panel-title horizontal"><span>03</span><div><h2>Agent 챗봇</h2><p>채점 결과에 관해 질문하세요</p></div><div className={`status-dot ${analysis ? "online" : ""}`}>{analysis ? "준비됨" : "분석 대기"}</div></div>
        <div className="chat-messages" aria-live="polite">
          <div className="message assistant"><Image alt="열공모드 무한이" className="chat-avatar" height={64} priority src="/brand/study-mode.png" width={44} /><div>안녕하세요! 분석이 완료되면 평균, 학생별 점수, 최다 오답 문항을 확인하거나 유사 문제를 만들어드릴 수 있어요.</div></div>
          {messages.map((message) => <div className={`message ${message.role}`} key={message.id}>{message.role === "assistant" ? <Image alt="열공모드 무한이" className="chat-avatar" height={64} src="/brand/study-mode.png" width={44} /> : null}<div>{message.parts.map((part, index) => part.type === "text" ? <span key={index}>{part.text}</span> : null)}</div></div>)}
          {status === "submitted" && <div className="message assistant thinking"><LoaderCircle className="spin" size={16} />분석 중...</div>}
          {error && <div className="inline-error"><AlertCircle size={16} />응답을 만들지 못했습니다. 모델 및 배포 환경 설정을 확인해 주세요.</div>}
        </div>
        <form className="chat-form" onSubmit={(event) => {
          event.preventDefault();
          const message = input.trim();
          if (!message || !analysis || chatBusy) return;
          sendMessage({ text: message }, { body: { analysis } });
          setInput("");
        }}>
          <input disabled={!analysis || chatBusy} onChange={(event) => setInput(event.target.value)} placeholder={analysis ? "예: 학생들 평균이랑 중앙값이 뭐야?" : "분석을 먼저 완료해 주세요"} value={input} />
          {chatBusy ? <button onClick={stop} type="button">중지</button> : <button disabled={!analysis || !input.trim()} type="submit"><Send size={17} /><span className="sr-only">전송</span></button>}
        </form>
      </section>
      </div>
      <button aria-label="다음 단계" className="carousel-arrow carousel-arrow-right" onClick={() => movePanel(1)} type="button"><ChevronRight /></button>
      <div aria-label={`${activePanel + 1} / 3 단계`} className="carousel-dots">
        {[0, 1, 2].map((index) => <button aria-label={`${index + 1}번 단계로 이동`} className={activePanel === index ? "active" : ""} key={index} onClick={() => setActivePanel(index)} type="button" />)}
      </div>
    </div>
  );
}
