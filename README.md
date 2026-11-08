# 영어 시험 분석 Agent

- 학번: 202235107
- 이름: 이호찬
- 배포 URL: https://agent-project-rho.vercel.app

## 프로젝트 소개

문제지 PDF, 정답 PDF, OMR 엑셀을 업로드하면 자동으로 채점하고 성적 통계와 오답 순위를 분석하는 Agent 기반 웹 서비스입니다.

분석 결과를 엑셀로 다운로드할 수 있으며, Agent 챗봇을 통해 학생 점수와 시험 통계를 조회하거나 최다 오답 문항과 유사한 문제를 생성할 수 있습니다.

## 주요 기능

- 정답 PDF에서 문항 번호, 정답, 배점 자동 추출
- OMR 응답 검증 및 학생별 자동 채점
- 평균, 중앙값, 모집단 표준편차 계산
- 문항별 오답자 수와 최다 오답 문항 분석
- 전체 성적 요약과 학생별 정오표 엑셀 다운로드
- 채점 결과 기반 Agent 챗봇
- 최다 오답 문항과 유사한 영어 문제 생성
- 같은 대화 세션 내 이전 대화 기억
- 자료에 없는 질문 회피 및 내부 도구 정보 보호

## 기술 구성

- Next.js App Router
- React, TypeScript
- Vercel AI SDK `ToolLoopAgent`
- OpenAI API
- PDF.js
- ExcelJS
- Vitest, ESLint
- Vercel

PDF와 엑셀 파싱, 자동 채점, 결과 파일 생성은 브라우저에서 실행됩니다. 원본 파일은 서버에 저장하지 않으며, Agent 응답 생성에 필요한 분석 결과와 대화 내용만 서버 API로 전달합니다.

## 로컬 실행

Node.js 22 이상이 필요합니다.

```bash
npm install
npm run dev
```

환경변수 설정은 `.env.example` 파일을 참고하세요.
