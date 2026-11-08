import { AnalysisWorkspace } from "@/components/analysis-workspace";

export default function AnalyzePage() {
  return (
    <main className="analysis-page">
      <div className="page-width analysis-heading"><div><h1>시험 데이터 분석</h1><p>분석에 필요한 세가지 파일을 업로드하면 정답표 검증부터 성적 분석까지 자동으로 진행할게요.</p></div></div>
      <AnalysisWorkspace />
    </main>
  );
}
