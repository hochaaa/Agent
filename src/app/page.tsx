import Link from "next/link";
import { ArrowRight, BarChart3, Bot, FileCheck2, ShieldCheck } from "lucide-react";
import { MascotStage } from "@/components/mascot-stage";

const features = [
  { icon: FileCheck2, title: "PDF에서 정답 자동 추출", description: "정답표를 업로드해주시면 알아서 채점합니다." },
  { icon: BarChart3, title: "정확한 성적 분석", description: "학생별 점수와 오답 현황, 평균·중앙값·표준편차를 계산합니다." },
  { icon: Bot, title: "Agent 챗봇", description: "학생 성적 관련 질문에 대한 답변은 물론 최다 오답 문항과 같은 문제 생성까지 가능합니다." },
  { icon: ShieldCheck, title: "근거가 있는 답변", description: "보내주신 자료에 없는 내용에 대해서는 임의로 추측하지 않고 확인할 수 없다고 안내합니다." },
];

export default function Home() {
  return (
    <main>
      <section className="hero-shell">
        <div className="page-width hero-content">
          <div className="hero-copy-block">
            <h1>무한 영어 학원 <span>도우미</span></h1>
            <p className="hero-copy">문제지와 정답, 학생들의 OMR만으로<br className="desktop-break" /> 자동 채점과 분석, 유사 문항 생성까지<br className="desktop-break" /> 한 번에 도와드릴게요.</p>
            <div className="hero-actions">
              <Link className="primary-button" href="/analyze">분석 시작하기 <ArrowRight size={18} /></Link>
              <a className="text-link" href="#workflow">작동 방식 보기</a>
            </div>
          </div>
          <MascotStage />
        </div>
      </section>

      <section className="page-width feature-section" id="workflow">
        <div className="section-heading single"><h2>어떻게 작동하나요?</h2></div>
        <div className="feature-grid">
          {features.map(({ icon: Icon, title, description }) => (
            <article className="feature-card" key={title}><div className="feature-icon"><Icon size={22} /></div><h3>{title}</h3><p>{description}</p></article>
          ))}
        </div>
      </section>
    </main>
  );
}
