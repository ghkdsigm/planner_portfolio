import { reactive } from "vue";

import { requestPortfolioChat } from "../services/chatApi";

const STORAGE_KEY = "portfolio-chat-state-v1";
const MAX_HISTORY = 8;

const starterPrompts = [
  "황승현 지원자의 가장 큰 강점은 뭐야?",
  "대표 프로젝트 3개를 면접 답변처럼 요약해줘",
  "RAG나 LLM 기능을 실무에 어떻게 연결했는지 설명해줘",
  "엠파크와 동화기업에서 만든 성과를 알려줘",
];

const initialMessages = [
  {
    id: createId(),
    role: "assistant",
    content:
      "안녕하세요. 저는 황승현 지원자 전용 포트폴리오 AI입니다.\n\n면접관처럼 질문하시면 강점, 프로젝트, 기술 이해도, 협업 방식까지 포트폴리오 근거를 바탕으로 답변드릴게요.",
    citations: [
      { id: "summary-positioning", title: "지원자 포지셔닝 요약", category: "summary" },
      { id: "fit-why-company", title: "채용 적합성 요약", category: "summary" },
    ],
  },
];

const state = reactive({
  messages: [...initialMessages],
  input: "",
  isLoading: false,
  error: "",
  relatedQuestions: [...starterPrompts],
  llmEnabled: false,
  hydrated: false,
});

export function usePortfolioChat() {
  hydrate();

  async function sendMessage(rawText) {
    const question = String(rawText ?? state.input).trim();
    if (!question || state.isLoading) return;

    state.error = "";

    const userMessage = {
      id: createId(),
      role: "user",
      content: question,
    };

    state.messages.push(userMessage);
    state.input = "";
    state.isLoading = true;
    persist();

    try {
      const history = state.messages
        .filter((item) => item.role === "user" || item.role === "assistant")
        .slice(-MAX_HISTORY - 1, -1)
        .map((item) => ({
          role: item.role,
          content: item.content,
        }));

      const data = await requestPortfolioChat({
        question,
        history,
      });

      state.messages.push({
        id: createId(),
        role: "assistant",
        content: data.answer,
        citations: data.citations || [],
        intent: data.intent || "general",
      });
      state.relatedQuestions = data.relatedQuestions?.length ? data.relatedQuestions : starterPrompts;
      state.llmEnabled = Boolean(data.llmEnabled);
    } catch (error) {
      state.error = error instanceof Error ? error.message : "답변 생성 중 오류가 발생했습니다.";
      state.messages.push({
        id: createId(),
        role: "assistant",
        content:
          "현재 챗봇 응답을 생성하지 못했습니다. 백엔드 서버 실행 여부와 OpenAI API 설정을 확인한 뒤 다시 시도해 주세요.",
        citations: [],
      });
    } finally {
      state.isLoading = false;
      persist();
    }
  }

  function resetConversation() {
    state.messages = [...initialMessages];
    state.input = "";
    state.error = "";
    state.relatedQuestions = [...starterPrompts];
    persist();
  }

  return {
    state,
    starterPrompts,
    sendMessage,
    resetConversation,
  };
}

function hydrate() {
  if (state.hydrated || typeof window === "undefined") return;

  state.hydrated = true;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const saved = JSON.parse(raw);
    if (Array.isArray(saved.messages) && saved.messages.length) {
      state.messages = saved.messages;
    }
    if (Array.isArray(saved.relatedQuestions) && saved.relatedQuestions.length) {
      state.relatedQuestions = saved.relatedQuestions;
    }
    state.llmEnabled = Boolean(saved.llmEnabled);
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

function persist() {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      messages: state.messages.slice(-16),
      relatedQuestions: state.relatedQuestions.slice(0, 4),
      llmEnabled: state.llmEnabled,
    })
  );
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
