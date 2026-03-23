# AI/AX Service Planner Portfolio

황승현 지원자 포트폴리오와 전용 RAG 챗봇이 함께 들어간 Vue 3 + Vite 프론트엔드, NestJS 백엔드 프로젝트입니다.

## 구성

- 프론트 포트폴리오: `src/App.vue`
- 챗봇 컴포넌트: `src/components/chat`
- 챗봇 전체화면 페이지: `src/views/ChatPageView.vue`
- 프론트 데이터: `src/data/portfolio.json`
- 백엔드: `backend`
- RAG 지식 JSON: `backend/src/data/portfolio-rag.json`

## 실행

### 1. 프론트엔드

```bash
npm install
npm run dev
```

기본 주소는 `http://localhost:4000`입니다.

### 2. 백엔드

```bash
cd backend
npm install
npm run dev
```

기본 주소는 `http://localhost:3001`입니다.

`.env.example`를 참고해서 `backend/.env`를 만들면 OpenAI API를 실제로 연결할 수 있습니다.

```env
PORT=3001
FRONTEND_ORIGIN=http://localhost:4000
OPENAI_API_KEY=sk-your-openai-key
OPENAI_MODEL=gpt-4.1-mini
```

`OPENAI_API_KEY`가 없으면 챗봇은 데모 모드로 동작하며, JSON RAG 문맥 기반의 로컬 응답을 반환합니다.

## 사용 방법

- 메인 포트폴리오 화면 좌측에 세로형 챗봇 배너가 표시됩니다.
- `전체화면 보기`를 누르거나 `#/chat`으로 이동하면 전체화면 챗 페이지가 열립니다.
- 프론트는 `/api/chat` 요청을 Vite 프록시로 백엔드 `http://localhost:3001/chat`에 연결합니다.

## 빌드

### 프론트

```bash
npm run build
```

### 백엔드

```bash
npm run build:backend
```