<script setup>
import ChatPanel from "../components/chat/ChatPanel.vue";

const emit = defineEmits(["close"]);
</script>

<template>
  <section class="chat-page-view">
    <div class="chat-page-shell">
      <aside class="chat-page-hero">
        <p class="chat-page-kicker">AI Interview Copilot</p>
        <h1>황승현 지원자 전용 챗봇</h1>
        <p>
          포트폴리오, 대표 프로젝트, 강점, 기술 이해도, 협업 방식에 대해 면접관처럼 질문하면
          지식 JSON과 GPT 응답을 기반으로 답변합니다.
        </p>

        <ul>
          <li>질문 의도를 해석해 면접 답변처럼 정리</li>
          <li>포트폴리오 기반 근거 중심 답변</li>
          <li>OpenAI API 연결 시 더 자연스러운 응답 생성</li>
        </ul>

        <button type="button" class="chat-page-back-btn" @click="emit('close')">
          포트폴리오로 돌아가기
        </button>
      </aside>

      <div class="chat-page-panel">
        <ChatPanel
          title="HSH Fullscreen Interview Copilot"
          description="황승현 지원자 전용 RAG + GPT 챗봇"
          :show-fullscreen-action="false"
          :show-close-action="true"
          close-label="포트폴리오로 돌아가기"
          @close="emit('close')"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.chat-page-view {
  min-height: 100vh;
  padding: 2rem;
  background:
    radial-gradient(circle at top left, rgba(120, 192, 70, 0.18), transparent 24%),
    linear-gradient(135deg, #f5fbf7, #eef7f2 45%, #ffffff);
}

.chat-page-shell {
  width: min(1400px, 100%);
  min-height: calc(100vh - 4rem);
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
  gap: 1.2rem;
}

.chat-page-hero,
.chat-page-panel {
  min-height: 0;
}

.chat-page-hero {
  padding: 2rem;
  border-radius: 28px;
  background: linear-gradient(180deg, #0c3a27, #00694d 42%, #00ad50);
  color: #ffffff;
  box-shadow: 0 20px 50px rgba(12, 58, 39, 0.22);
}

.chat-page-kicker {
  margin: 0;
  font-size: 0.85rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  opacity: 0.8;
}

.chat-page-hero h1 {
  margin: 1rem 0 1rem;
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1.1;
}

.chat-page-hero p,
.chat-page-hero li {
  color: rgba(255, 255, 255, 0.88);
}

.chat-page-hero ul {
  margin: 1.5rem 0 0;
  padding-left: 1rem;
}

.chat-page-hero li + li {
  margin-top: 0.55rem;
}

.chat-page-back-btn {
  margin-top: 1.5rem;
  min-height: 42px;
  padding: 0.8rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  font: inherit;
  cursor: pointer;
}

.chat-page-panel {
  height: calc(100vh - 4rem);
}

@media (max-width: 960px) {
  .chat-page-view {
    padding: 1rem;
  }

  .chat-page-shell {
    min-height: calc(100vh - 2rem);
    grid-template-columns: 1fr;
  }

  .chat-page-panel {
    height: auto;
    min-height: 70vh;
  }
}
</style>
