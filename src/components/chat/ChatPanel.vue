<script setup>
import { computed, nextTick, onMounted, ref, watch } from "vue";

import { usePortfolioChat } from "../../composables/usePortfolioChat";

const props = defineProps({
  compact: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: "HSH AI Interview Copilot",
  },
  description: {
    type: String,
    default: "황승현 지원자 전용 포트폴리오 AI",
  },
  fullscreenLabel: {
    type: String,
    default: "전체화면 보기",
  },
  closeLabel: {
    type: String,
    default: "닫기",
  },
  showFullscreenAction: {
    type: Boolean,
    default: true,
  },
  showCloseAction: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["open-fullscreen", "close"]);

const { state, starterPrompts, sendMessage, resetConversation } = usePortfolioChat();
const messageViewportRef = ref(null);

const visiblePrompts = computed(() => state.relatedQuestions?.length ? state.relatedQuestions : starterPrompts);

const submit = async () => {
  await sendMessage();
};

const sendStarter = async (prompt) => {
  await sendMessage(prompt);
};

const onKeydown = async (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    await submit();
  }
};

const scrollToBottom = async () => {
  await nextTick();
  const el = messageViewportRef.value;
  if (!el) return;
  el.scrollTop = el.scrollHeight;
};

watch(
  () => state.messages.length,
  () => {
    scrollToBottom();
  }
);

watch(
  () => state.isLoading,
  () => {
    scrollToBottom();
  }
);

onMounted(() => {
  scrollToBottom();
});
</script>

<template>
  <section class="portfolio-chat-panel" :class="{ compact }" aria-label="황승현 포트폴리오 챗봇">
    <header class="chat-panel-header">
      <div class="chat-panel-brand">
        <span class="chat-panel-badge">AI</span>
        <div>
          <strong>{{ title }}</strong>
          <p>{{ description }}</p>
        </div>
      </div>

      <div class="chat-panel-actions">
        <button
          v-if="showFullscreenAction"
          type="button"
          class="chat-header-btn"
          @click="emit('open-fullscreen')"
        >
          {{ fullscreenLabel }}
        </button>
        <button type="button" class="chat-header-btn secondary" @click="resetConversation">
          초기화
        </button>
        <button
          v-if="showCloseAction"
          type="button"
          class="chat-header-btn icon"
          :aria-label="closeLabel"
          @click="emit('close')"
        >
          ×
        </button>
      </div>
    </header>

    <div ref="messageViewportRef" class="chat-message-viewport">
      <div class="chat-intent-strip">
        <span>면접 답변 / 프로젝트 설명 / 강점 정리 / 기술 이해도</span>
      </div>

      <article
        v-for="message in state.messages"
        :key="message.id"
        class="chat-message"
        :class="message.role"
      >
        <div class="chat-message-bubble">
          <p>{{ message.content }}</p>
          <div v-if="message.citations?.length" class="chat-citation-list">
            <span
              v-for="citation in message.citations"
              :key="citation.id"
              class="chat-citation-pill"
            >
              {{ citation.title }}
            </span>
          </div>
        </div>
      </article>

      <article v-if="state.isLoading" class="chat-message assistant">
        <div class="chat-message-bubble loading">
          <span class="chat-dot" />
          <span class="chat-dot" />
          <span class="chat-dot" />
        </div>
      </article>
    </div>

    <div class="chat-prompt-list">
      <button
        v-for="prompt in visiblePrompts"
        :key="prompt"
        type="button"
        class="chat-prompt-chip"
        @click="sendStarter(prompt)"
      >
        {{ prompt }}
      </button>
    </div>

    <div v-if="state.error" class="chat-error">
      {{ state.error }}
    </div>

    <footer class="chat-input-shell">
      <label class="chat-input-wrap">
        <textarea
          v-model="state.input"
          class="chat-input"
          :rows="compact ? 2 : 3"
          placeholder="황승현 지원자에 대해 질문해 보세요."
          @keydown="onKeydown"
        />
      </label>
      <button type="button" class="chat-send-btn" :disabled="state.isLoading" @click="submit">
        {{ state.isLoading ? "응답 생성 중" : "보내기" }}
      </button>
    </footer>

    <p class="chat-footer-note">
      {{ state.llmEnabled ? "OpenAI 응답 활성화" : "백엔드 데모 모드" }}
    </p>
  </section>
</template>

<style scoped>
.portfolio-chat-panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto auto auto;
  gap: 0.9rem;
  height: 100%;
  min-height: 0;
  padding: 1rem;
  border: 1px solid rgba(0, 105, 77, 0.22);
  border-radius: 24px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(251, 251, 251, 0.92)),
    rgba(255, 255, 255, 0.92);
  box-shadow: 0 20px 50px rgba(12, 58, 39, 0.12);
  color: #262626;
}

.portfolio-chat-panel.compact {
  padding: 0.85rem;
  border-radius: 18px;
}

.chat-panel-header,
.chat-panel-brand,
.chat-panel-actions,
.chat-intent-strip,
.chat-input-shell {
  display: flex;
}

.chat-panel-header {
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.chat-panel-brand {
  gap: 0.75rem;
  align-items: center;
}

.chat-panel-brand strong {
  display: block;
  font-size: 0.95rem;
  line-height: 1.3;
}

.chat-panel-brand p {
  margin: 0.18rem 0 0;
  color: #777777;
  font-size: 0.8rem;
}

.chat-panel-badge {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  display: inline-grid;
  place-items: center;
  background: linear-gradient(135deg, #00694d, #00ad50);
  color: #ffffff;
  font-size: 0.78rem;
  font-weight: 700;
  flex: 0 0 auto;
}

.chat-panel-actions {
  gap: 0.4rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.chat-header-btn,
.chat-send-btn,
.chat-prompt-chip {
  border-radius: 12px;
  border: 1px solid transparent;
  font: inherit;
  cursor: pointer;
  transition: transform 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
}

.chat-header-btn {
  min-height: 36px;
  padding: 0.55rem 0.85rem;
  background: #00694d;
  color: #ffffff;
}

.chat-header-btn.secondary,
.chat-prompt-chip {
  background: #ffffff;
  color: #262626;
  border-color: #e0e0e0;
}

.chat-header-btn.icon {
  min-width: 36px;
  padding-inline: 0;
  background: #ffffff;
  color: #262626;
  border-color: #e0e0e0;
}

.chat-message-viewport {
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-right: 0.25rem;
}

.chat-intent-strip {
  padding: 0.55rem 0.7rem;
  border-radius: 12px;
  background: rgba(0, 105, 77, 0.08);
  color: #00694d;
  font-size: 0.78rem;
  font-weight: 600;
}

.chat-message {
  display: flex;
}

.chat-message.user {
  justify-content: flex-end;
}

.chat-message.assistant {
  justify-content: flex-start;
}

.chat-message-bubble {
  max-width: min(88%, 700px);
  padding: 0.9rem 1rem;
  border-radius: 18px;
  background: #f3f5f7;
  color: #262626;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.03);
}

.chat-message.user .chat-message-bubble {
  background: linear-gradient(135deg, #00694d, #00ad50);
  color: #ffffff;
}

.chat-message-bubble p {
  margin: 0;
  white-space: pre-wrap;
  word-break: keep-all;
}

.chat-citation-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.7rem;
}

.chat-citation-pill {
  padding: 0.25rem 0.55rem;
  border-radius: 999px;
  background: rgba(0, 105, 77, 0.1);
  color: #00694d;
  font-size: 0.72rem;
  font-weight: 600;
}

.chat-message.user .chat-citation-pill {
  background: rgba(255, 255, 255, 0.16);
  color: #ffffff;
}

.chat-message-bubble.loading {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.chat-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #00694d;
  animation: chatPulse 1.1s infinite ease-in-out;
}

.chat-dot:nth-child(2) {
  animation-delay: 0.16s;
}

.chat-dot:nth-child(3) {
  animation-delay: 0.32s;
}

.chat-prompt-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.chat-prompt-chip {
  padding: 0.5rem 0.75rem;
  font-size: 0.78rem;
  text-align: left;
}

.chat-error {
  padding: 0.75rem 0.85rem;
  border-radius: 12px;
  background: rgba(251, 79, 79, 0.08);
  color: #b42318;
  font-size: 0.82rem;
}

.chat-input-shell {
  gap: 0.65rem;
  align-items: flex-end;
}

.chat-input-wrap {
  flex: 1;
}

.chat-input {
  width: 100%;
  resize: none;
  min-height: 72px;
  border: 1px solid #d9e1dd;
  border-radius: 16px;
  padding: 0.85rem 0.95rem;
  font: inherit;
  color: #262626;
  background: #ffffff;
  outline: none;
}

.chat-input:focus {
  border-color: #00ad50;
  box-shadow: 0 0 0 4px rgba(0, 173, 80, 0.12);
}

.chat-send-btn {
  min-width: 110px;
  min-height: 44px;
  padding: 0.75rem 1rem;
  background: #00694d;
  color: #ffffff;
}

.chat-send-btn:disabled {
  cursor: default;
  opacity: 0.6;
}

.chat-footer-note {
  margin: 0;
  color: #777777;
  font-size: 0.75rem;
}

.chat-header-btn:hover,
.chat-send-btn:hover,
.chat-prompt-chip:hover {
  transform: translateY(-1px);
}

@keyframes chatPulse {
  0%,
  80%,
  100% {
    opacity: 0.35;
    transform: translateY(0);
  }

  40% {
    opacity: 1;
    transform: translateY(-2px);
  }
}

@media (max-width: 720px) {
  .chat-panel-header,
  .chat-input-shell {
    flex-direction: column;
    align-items: stretch;
  }

  .chat-panel-actions {
    justify-content: flex-start;
  }

  .chat-send-btn {
    width: 100%;
  }
}
</style>
