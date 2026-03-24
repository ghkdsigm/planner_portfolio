<script setup>
import { computed, nextTick, onMounted, ref, watch } from "vue";

import { resolveChatPeopleVisual, resolveChatProjectVisual } from "../../data/chat-showcase-assets";
import { usePortfolioChat } from "../../composables/usePortfolioChat";

const props = defineProps({
  compact: {
    type: Boolean,
    default: false,
  },
  fullscreen: {
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
  placeholder: {
    type: String,
    default: "황승현 지원자에 대해 질문해 보세요.",
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
  showPromptList: {
    type: Boolean,
    default: true,
  },
  showFooterNote: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["open-fullscreen", "close"]);

const { state, starterPrompts, sendMessage, resetConversation } = usePortfolioChat();
const messageViewportRef = ref(null);
const inputRef = ref(null);
const showScrollToLatest = ref(false);

const visiblePrompts = computed(() => state.relatedQuestions?.length ? state.relatedQuestions : starterPrompts);

const submit = async () => {
  await sendMessage();
};

const sendStarter = async (prompt) => {
  await sendMessage(prompt);
};

const applyCitationToInput = async (citationTitle) => {
  state.input = citationTitle;
  await nextTick();
  inputRef.value?.focus();
  const length = inputRef.value?.value?.length ?? 0;
  inputRef.value?.setSelectionRange?.(length, length);
};

const getProjectThumbnail = (card) => card.thumbnailUrl || resolveChatProjectVisual(card.id).thumbnail || "";
const getProjectSlides = (card) => card.slides?.length ? card.slides : resolveChatProjectVisual(card.id).slides || [];
const getPeopleImage = (card) => card.imageUrl || resolveChatPeopleVisual(card.id);
const hasShowcase = (message) => Boolean(message.projectCards?.length || message.peopleCards?.length);

const getProjectActionLinks = (card) => {
  const links = [...(card.links || [])];
  const previewUrl = getProjectThumbnail(card) || getProjectSlides(card)[0] || "";

  if (previewUrl) {
    links.unshift({ label: "이미지 보기", url: previewUrl });
  }

  return links.filter((item, index, array) => item?.url && array.findIndex((target) => target.url === item.url) === index);
};

const openExternalLink = (url) => {
  if (!url || typeof window === "undefined") return;
  window.open(url, "_blank", "noopener,noreferrer");
};

const dragScrollState = {
  active: false,
  moved: false,
  startX: 0,
  startScrollLeft: 0,
  pointerId: null,
  element: null,
};

const onDragScrollStart = (event) => {
  if (event.pointerType === "mouse" && event.button !== 0) return;

  dragScrollState.active = true;
  dragScrollState.moved = false;
  dragScrollState.startX = event.clientX;
  dragScrollState.startScrollLeft = event.currentTarget.scrollLeft;
  dragScrollState.pointerId = event.pointerId;
  dragScrollState.element = event.currentTarget;
  dragScrollState.element.classList.add("is-dragging");
  dragScrollState.element.setPointerCapture?.(event.pointerId);
};

const onDragScrollMove = (event) => {
  if (!dragScrollState.active || dragScrollState.element !== event.currentTarget) return;

  const deltaX = event.clientX - dragScrollState.startX;
  if (Math.abs(deltaX) > 4) {
    dragScrollState.moved = true;
  }

  event.currentTarget.scrollLeft = dragScrollState.startScrollLeft - deltaX;
};

const onDragScrollEnd = (event) => {
  if (dragScrollState.element !== event.currentTarget) return;

  event.currentTarget.classList.remove("is-dragging");
  event.currentTarget.releasePointerCapture?.(dragScrollState.pointerId);
  dragScrollState.active = false;
  dragScrollState.pointerId = null;
  dragScrollState.element = null;

  window.setTimeout(() => {
    dragScrollState.moved = false;
  }, 0);
};

const onDragScrollClick = (event) => {
  if (!dragScrollState.moved) return;
  event.preventDefault();
  event.stopPropagation();
};

const onKeydown = async (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    await submit();
  }
};

const updateScrollToLatestVisibility = () => {
  const el = messageViewportRef.value;
  if (!el) return;

  const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
  showScrollToLatest.value = distanceFromBottom > 120;
};

const onViewportScroll = () => {
  updateScrollToLatestVisibility();
};

const scrollToBottom = async () => {
  await nextTick();
  const el = messageViewportRef.value;
  if (!el) return;
  el.scrollTo({
    top: el.scrollHeight,
    behavior: "smooth",
  });
  showScrollToLatest.value = false;
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
  updateScrollToLatestVisibility();
});
</script>

<template>
  <section
    class="portfolio-chat-panel"
    :class="{ compact, fullscreen: props.fullscreen }"
    aria-label="황승현 포트폴리오 챗봇"
  >
    <div class="chat-panel-glow chat-panel-glow-a" aria-hidden="true" />
    <div class="chat-panel-glow chat-panel-glow-b" aria-hidden="true" />

    <header class="chat-panel-header">
      <div class="chat-panel-brand">
        <!-- <span class="chat-panel-badge">AI</span> -->
        <div class="chat-panel-brand-copy">
          <span class="chat-panel-kicker">Interview copilot</span>
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

    <div
      ref="messageViewportRef"
      class="chat-message-viewport"
      @scroll="onViewportScroll"
    >
      <div class="chat-intent-strip" :class="{ floating: props.fullscreen }">
        <!-- <span>
          {{ props.fullscreen ? "Portfolio Interview Copilot" : "면접 답변 / 프로젝트 설명 / 강점 정리 / 기술 이해도" }}
        </span> -->
        <span>황승현지원자 관련하여 질문을 시작해보세요!</span>
      </div>

      <article
        v-for="message in state.messages"
        :key="message.id"
        class="chat-message"
        :class="message.role"
      >
        <div class="chat-message-avatar" aria-hidden="true">
          {{ message.role === "assistant" ? "AI" : "YOU" }}
        </div>
        <div class="chat-message-stack" :class="{ 'has-showcase': hasShowcase(message) }">
          <span class="chat-message-role">
            {{ message.role === "assistant" ? "AI Interview Assistant" : "You" }}
          </span>
          <div class="chat-message-bubble">
            <p>{{ message.content }}</p>
            <div v-if="message.citations?.length" class="chat-citation-list">
              <button
                v-for="citation in message.citations"
                :key="citation.id"
                type="button"
                class="chat-citation-pill"
                @click="applyCitationToInput(citation.title)"
              >
                {{ citation.title }}
              </button>
            </div>
          </div>
          <div
            v-if="message.projectCards?.length"
            class="chat-showcase-list drag-scroll-surface"
            @pointerdown="onDragScrollStart"
            @pointermove="onDragScrollMove"
            @pointerup="onDragScrollEnd"
            @pointercancel="onDragScrollEnd"
            @pointerleave="onDragScrollEnd"
            @click.capture="onDragScrollClick"
          >
            <article
              v-for="card in message.projectCards"
              :key="card.id"
              class="chat-showcase-card"
            >
              <img
                v-if="getProjectThumbnail(card)"
                :src="getProjectThumbnail(card)"
                :alt="card.title"
                class="chat-showcase-thumb"
                loading="lazy"
              />
              <div class="chat-showcase-body">
                <div class="chat-showcase-meta">
                  <span v-if="card.period" class="chat-showcase-period">{{ card.period }}</span>
                  <div v-if="card.tags?.length" class="chat-showcase-tags">
                    <span v-for="tag in card.tags.slice(0, 4)" :key="`${card.id}-${tag}`" class="chat-showcase-tag">
                      {{ tag }}
                    </span>
                  </div>
                </div>
                <strong class="chat-showcase-title">{{ card.title }}</strong>
                <div v-if="getProjectActionLinks(card).length" class="chat-showcase-actions">
                  <button
                    v-for="link in getProjectActionLinks(card)"
                    :key="`${card.id}-${link.url}`"
                    type="button"
                    class="chat-showcase-link"
                    @click="openExternalLink(link.url)"
                  >
                    {{ link.label }}
                  </button>
                </div>
              </div>
            </article>
          </div>
          <div
            v-if="message.peopleCards?.length"
            class="chat-people-strip drag-scroll-surface"
            @pointerdown="onDragScrollStart"
            @pointermove="onDragScrollMove"
            @pointerup="onDragScrollEnd"
            @pointercancel="onDragScrollEnd"
            @pointerleave="onDragScrollEnd"
            @click.capture="onDragScrollClick"
          >
            <button
              v-for="card in message.peopleCards"
              :key="card.id"
              type="button"
              class="chat-people-card"
              @click="openExternalLink(getPeopleImage(card))"
            >
              <img
                v-if="getPeopleImage(card)"
                :src="getPeopleImage(card)"
                :alt="card.label"
                loading="lazy"
              />
            </button>
          </div>
        </div>
      </article>

      <article v-if="state.isLoading" class="chat-message assistant">
        <div class="chat-message-avatar" aria-hidden="true">AI</div>
        <div class="chat-message-stack">
          <span class="chat-message-role">AI Interview Assistant</span>
          <div class="chat-message-bubble loading">
            <span class="chat-dot" />
            <span class="chat-dot" />
            <span class="chat-dot" />
          </div>
        </div>
      </article>

      <button
        v-if="showScrollToLatest"
        type="button"
        class="chat-scroll-latest-btn"
        @click="scrollToBottom"
      >
        최신 채팅으로 이동
      </button>
    </div>

    <div v-if="props.showPromptList" class="chat-prompt-list">
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
          ref="inputRef"
          v-model="state.input"
          class="chat-input"
          :rows="props.fullscreen ? 1 : compact ? 2 : 3"
          :placeholder="props.placeholder"
          @keydown="onKeydown"
        />
      </label>
      <button
        type="button"
        class="chat-send-btn"
        :class="{ icon: props.fullscreen }"
        :aria-label="state.isLoading ? '응답 생성 중' : '보내기'"
        :disabled="state.isLoading"
        @click="submit"
      >
        <span v-if="props.fullscreen" aria-hidden="true">{{ state.isLoading ? "..." : "↑" }}</span>
        <span v-else>{{ state.isLoading ? "응답 생성 중" : "보내기" }}</span>
      </button>
    </footer>

    <p v-if="props.showFooterNote" class="chat-footer-note">
      {{ state.llmEnabled ? "OpenAI 응답 활성화" : "백엔드 데모 모드" }}
    </p>
  </section>
</template>

<style scoped>
.portfolio-chat-panel {
  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto auto auto;
  gap: 1.15rem;
  height: 90vh;
  min-height: 0;
  padding: 1.5rem;
  color: #20312d;
}

.portfolio-chat-panel.fullscreen {
  grid-template-rows: auto minmax(0, 1fr) auto auto;
  gap: 0.85rem;
  padding: 1.2rem 1.4rem 1.35rem;
  
  border-radius: 34px;
  
  
}

.portfolio-chat-panel.fullscreen * {
  text-shadow: none !important;
}

.portfolio-chat-panel.compact {
  padding: 1.2rem;
  border-radius: 28px;
}

.chat-panel-glow {
  display: none;
}

.chat-panel-header,
.chat-panel-brand,
.chat-panel-actions,
.chat-intent-strip,
.chat-input-shell {
  display: flex;
}

.chat-panel-header {
  position: relative;
  z-index: 1;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.2rem;
}

.portfolio-chat-panel.fullscreen .chat-panel-header {
  align-items: center;
  padding-bottom: 0;
}

.chat-panel-brand {
  gap: 0.9rem;
  align-items: flex-start;
}

.chat-panel-brand-copy {
  display: grid;
  gap: 0.18rem;
}

.portfolio-chat-panel.fullscreen .chat-panel-brand-copy {
  gap: 0.08rem;
}

.chat-panel-kicker {
  color: #47b89b;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.portfolio-chat-panel.fullscreen .chat-panel-kicker {
  color: #8f92aa;
}

.chat-panel-brand strong {
  display: block;
  font-size: 1rem;
  line-height: 1.3;
  letter-spacing: -0.02em;
}

.portfolio-chat-panel.fullscreen .chat-panel-brand strong {
  font-size: 0.95rem;
  color: #2a3142;
}

.chat-panel-brand p {
  margin: 0;
  color: #71827e;
  font-size: 0.79rem;
}

.portfolio-chat-panel.fullscreen .chat-panel-brand p {
  color: #757d92;
}

.chat-panel-badge {
  width: 44px;
  height: 44px;
  border-radius: 16px;
  display: inline-grid;
  place-items: center;
  background: #20bb91;
  color: #ffffff;
  font-size: 0.78rem;
  font-weight: 700;
  flex: 0 0 auto;
  box-shadow: 0 12px 26px rgba(38, 173, 132, 0.2);
}

.portfolio-chat-panel.fullscreen .chat-panel-badge {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.94);
  color: #9197ab;
  box-shadow:
    0 12px 26px rgba(181, 182, 206, 0.24),
    inset 0 0 0 1px rgba(210, 212, 231, 0.9);
}

.chat-panel-actions {
  gap: 0.4rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.chat-header-btn,
.chat-send-btn,
.chat-prompt-chip {
  border-radius: 999px;
  border: 1px solid rgba(126, 186, 167, 0.24);
  font: inherit;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.chat-header-btn {
  min-height: 36px;
  padding: 0.55rem 0.95rem;
  background: rgba(255, 255, 255, 0.84);
  color: #33544b;
  box-shadow: 0 10px 24px rgba(162, 198, 189, 0.15);
}

.portfolio-chat-panel.fullscreen .chat-header-btn {
  min-height: 34px;
  padding: 0.5rem 0.82rem;
  background: rgba(255, 255, 255, 0.76);
  color: #5e667a;
  box-shadow: 0 10px 20px rgba(185, 186, 214, 0.18);
}

.chat-header-btn.secondary,
.chat-prompt-chip {
  background: rgba(246, 250, 249, 0.96);
  color: #44615a;
  border-color: rgba(126, 186, 167, 0.22);
}

.chat-header-btn.icon {
  min-width: 36px;
  padding-inline: 0;
  background: rgba(255, 255, 255, 0.84);
  color: #44615a;
}

.chat-message-viewport {
  position: relative;
  z-index: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 0.95rem;
  padding: 1rem 0.85rem 1rem 0.8rem;
  border-radius: 26px;
  background: #f7fbf9;
  box-shadow: inset 0 0 0 1px rgba(164, 202, 190, 0.22);
}

.portfolio-chat-panel.fullscreen .chat-message-viewport {
  gap: 1.45rem;
  padding: 0.2rem 0.5rem 0.4rem;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.chat-message-viewport::-webkit-scrollbar {
  width: 10px;
}

.chat-message-viewport::-webkit-scrollbar-track {
  background: transparent;
}

.chat-message-viewport::-webkit-scrollbar-thumb {
  border: 3px solid transparent;
  border-radius: 999px;
  background: rgba(134, 183, 168, 0.42);
  background-clip: padding-box;
}

.chat-scroll-latest-btn {
  position: sticky;
  left: 50%;
  bottom: 0.9rem;
  z-index: 3;
  align-self: center;
  min-height: 38px;
  padding: 0.58rem 0.95rem;
  border: 0;
  border-radius: 999px;
  background: rgba(0, 105, 77, 0.94);
  color: #ffffff;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 14px 28px rgba(0, 105, 77, 0.24);
}

.chat-scroll-latest-btn:hover {
  transform: translateY(-1px);
}

.chat-intent-strip {
  align-self: flex-start;
  padding: 0.55rem 0.9rem;
  border-radius: 999px;
  background: rgba(82, 193, 164, 0.14);
  color: #279877;
  font-size: 0.74rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.chat-intent-strip.floating {
  align-self: center;
  margin: 0 auto 0.45rem;
  padding: 0.42rem 0.9rem;
  background: rgba(255, 255, 255, 0.68);
  color: #7f86a0;
  box-shadow:
    0 12px 26px rgba(189, 190, 214, 0.16),
    inset 0 0 0 1px rgba(255, 255, 255, 0.8);
}

.chat-message {
  display: flex;
  gap: 0.65rem;
  align-items: flex-end;
}

.portfolio-chat-panel.fullscreen .chat-message {
  gap: 0.95rem;
  align-items: flex-start;
}

.chat-message.user {
  justify-content: flex-end;
  flex-direction: row-reverse;
}

.portfolio-chat-panel.fullscreen .chat-message.user {
  justify-content: end;
  flex-direction: row-reverse;
}

.chat-message.assistant {
  justify-content: flex-start;
}

.chat-message-avatar {
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #ffffff;
  background: #20bb91;
  box-shadow: 0 8px 20px rgba(33, 181, 137, 0.2);
}

.portfolio-chat-panel.fullscreen .chat-message-avatar {
  width: 44px;
  height: 44px;
  flex-basis: 44px;
  margin-top: 0.15rem;
  background: rgba(255, 255, 255, 0.94);
  color: #a3a6bf;
  box-shadow:
    0 14px 28px rgba(180, 181, 210, 0.22),
    inset 0 0 0 1px rgba(210, 212, 231, 0.9);
}

.chat-message.user .chat-message-avatar {
  background: #d9efea;
  color: #3c685f;
  box-shadow: 0 8px 18px rgba(154, 190, 182, 0.18);
}

.portfolio-chat-panel.fullscreen .chat-message.user .chat-message-avatar {
  background: rgba(255, 255, 255, 0.9);
  color: #7b8297;
  box-shadow:
    0 14px 28px rgba(180, 181, 210, 0.18),
    inset 0 0 0 1px rgba(210, 212, 231, 0.82);
}

.chat-message-stack {
  display: grid;
  gap: 0.32rem;
  max-width: min(88%, 700px);
}

.portfolio-chat-panel.fullscreen .chat-message-stack {
  gap: 0.38rem;
  max-width: min(72%, 680px);
}

.chat-message-stack.has-showcase,
.portfolio-chat-panel.fullscreen .chat-message-stack.has-showcase {
  max-width: min(92%, 980px);
}

.chat-message.user .chat-message-stack {
  justify-items: end;
}

.portfolio-chat-panel.fullscreen .chat-message.user .chat-message-stack {
  justify-items: end;
}

.chat-message-role {
  padding-inline: 0.2rem;
  color: #7a8d87;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.portfolio-chat-panel.fullscreen .chat-message-role {
  padding-inline: 0;
  color: #242c39;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  text-transform: none;
}

.chat-message-bubble {
  width: fit-content;
  max-width: 100%;
  padding: 1rem 1.1rem;
  border-radius: 22px;
  background: #ffffff;
  color: #233330;
  box-shadow:
    0 12px 28px rgba(171, 204, 194, 0.16),
    inset 0 0 0 1px rgba(174, 204, 195, 0.18);
}

.portfolio-chat-panel.fullscreen .chat-message-bubble {
  width: auto;
  padding: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.chat-message.user .chat-message-bubble {
  background: #20bb91;
  color: #ffffff;
  box-shadow: 0 16px 32px rgba(48, 181, 140, 0.24);
}

.portfolio-chat-panel.fullscreen .chat-message.user .chat-message-bubble {
  background: transparent;
  color: #30384a;
  box-shadow: none;
}

.chat-message-bubble p {
  margin: 0;
  white-space: pre-wrap;
  word-break: keep-all;
}

.portfolio-chat-panel.fullscreen .chat-message-bubble p {
  color: #202020;
  font-size: 0.98rem;
  line-height: 1.65;
}

.chat-citation-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.7rem;
}

.chat-citation-pill {
  padding: 0.28rem 0.58rem;
  border: 0;
  border-radius: 999px;
  background: rgba(82, 193, 164, 0.12);
  color: #279877;
  font-size: 0.72rem;
  font-weight: 400;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;
}

.portfolio-chat-panel.fullscreen .chat-citation-pill {
  background: rgb(220 224 255 / 86%);
  color: #000000;
  /* box-shadow: inset 0 0 0 1px rgba(214, 216, 234, 0.9); */
}

.chat-message.user .chat-citation-pill {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

.portfolio-chat-panel.fullscreen .chat-message.user .chat-citation-pill {
  background: rgba(255, 255, 255, 0.86);
  color: #7c82a0;
}

.chat-citation-pill:hover {
  transform: translateY(-1px);
  background: rgba(82, 193, 164, 0.2);
}

.chat-showcase-list,
.chat-people-strip {
  display: flex;
  gap: 0.85rem;
  overflow-x: auto;
  padding-bottom: 0.2rem;
  -ms-overflow-style: none;
  scrollbar-width: none;
  padding-top: 1rem;
}

.chat-showcase-list::-webkit-scrollbar,
.chat-people-strip::-webkit-scrollbar {
  display: none;
}

.drag-scroll-surface {
  cursor: grab;
  user-select: none;
}

.drag-scroll-surface.is-dragging {
  cursor: grabbing;
}

.drag-scroll-surface.is-dragging * {
  cursor: grabbing !important;
}

.chat-showcase-card {
  min-width: min(360px, 78vw);
  max-width: 420px;
  border-radius: 24px;
  overflow: hidden;
  background: #ffffff;
  box-shadow:
    0 16px 36px rgba(155, 195, 183, 0.18),
    inset 0 0 0 1px rgba(170, 205, 194, 0.16);
}

.portfolio-chat-panel.fullscreen .chat-showcase-card {
  background: rgba(255, 255, 255, 0.92);
}

.chat-showcase-thumb {
  display: block;
  width: 100%;
  height: 180px;
  object-fit: cover;
  background: #eef5f2;
}

.chat-showcase-body {
  display: grid;
  gap: 0.7rem;
  padding: 1rem;
}

.chat-showcase-meta,
.chat-showcase-tags,
.chat-showcase-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
}

.chat-showcase-period,
.chat-showcase-tag {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  background: rgba(0, 105, 77, 0.08);
  color: #00694d;
  font-size: 0.72rem;
  font-weight: 600;
}

.chat-showcase-title {
  color: #262626;
  font-size: 0.98rem;
  line-height: 1.45;
}

.chat-showcase-link,
.chat-showcase-slide,
.chat-people-card {
  border: 0;
  background: none;
  cursor: pointer;
}

.chat-showcase-link {
  min-height: 34px;
  padding: 0.5rem 0.8rem;
  border-radius: 999px;
  background: #00694d;
  color: #ffffff;
  font-size: 0.76rem;
  font-weight: 600;
}

.chat-people-card {
  flex: 0 0 auto;
  width: 148px;
  height: 188px;
  border-radius: 22px;
  overflow: hidden;
  background: #ffffff;
  box-shadow:
    0 14px 30px rgba(155, 195, 183, 0.18),
    inset 0 0 0 1px rgba(170, 205, 194, 0.16);
}

.chat-people-card img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.chat-message-bubble.loading {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.chat-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #1aad82;
  animation: chatPulse 1.1s infinite ease-in-out;
}

.chat-dot:nth-child(2) {
  animation-delay: 0.16s;
}

.chat-dot:nth-child(3) {
  animation-delay: 0.32s;
}

.chat-prompt-list {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.chat-prompt-chip {
  padding: 0.58rem 0.86rem;
  font-size: 0.78rem;
  text-align: left;
}

.chat-error {
  position: relative;
  z-index: 1;
  padding: 0.8rem 0.95rem;
  border-radius: 18px;
  background: rgba(251, 79, 79, 0.08);
  color: #b42318;
  font-size: 0.82rem;
  box-shadow: inset 0 0 0 1px rgba(180, 35, 24, 0.08);
}

.chat-input-shell {
  position: relative;
  z-index: 1;
  gap: 0.75rem;
  align-items: center;
  padding: 0.6rem;
  border-radius: 26px;
  background: #f7fbf9;
  box-shadow: inset 0 0 0 1px rgba(164, 202, 190, 0.24);
}

.portfolio-chat-panel.fullscreen .chat-input-shell {
  gap: 0.5rem;
  padding: 0.4rem;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow:
    0 24px 36px rgba(181, 182, 210, 0.2),
    inset 0 0 0 1px rgba(221, 223, 238, 0.95);
}

.chat-input-wrap {
  flex: 1;
  align-items: center;
  display: flex;
}

.chat-input {
  width: 100%;
  resize: none;
  min-height: 72px;
  border: 0;
  border-radius: 20px;
  padding: 0.9rem 1rem;
  font: inherit;
  color: #20312d;
  background: rgba(255, 255, 255, 0.84);
  outline: none;
}

.portfolio-chat-panel.fullscreen .chat-input {
  min-height: 58px;
  padding: 1rem 1.15rem;
  background: transparent;
  color: #2d3443;
}

.chat-input:focus {
  box-shadow:
    inset 0 0 0 1px rgba(28, 179, 134, 0.28),
    0 0 0 4px rgba(28, 179, 134, 0.1);
}

.portfolio-chat-panel.fullscreen .chat-input:focus {
  box-shadow: none;
}

.chat-send-btn {
  min-width: 116px;
  min-height: 48px;
  padding: 0.8rem 1.08rem;
  background: #20bb91;
  color: #ffffff;
  border-color: transparent;
  box-shadow: 0 14px 28px rgba(53, 192, 147, 0.24);
}

.chat-send-btn.icon {
  min-width: 48px;
  width: 48px;
  padding: 0;
  border-radius: 50%;
  font-size: 1rem;
  line-height: 1;
  box-shadow: 0 14px 28px rgba(177, 179, 208, 0.22);
}

.portfolio-chat-panel.fullscreen .chat-send-btn.icon {
  background: #ececf7;
  color: #8d91a8;
  border-color: #ececf7;
  box-shadow: 0 12px 24px rgba(183, 185, 210, 0.24);
}

.chat-send-btn:disabled {
  cursor: default;
  opacity: 0.6;
}

.chat-footer-note {
  margin: 0;
  color: #7c8f89;
  font-size: 0.74rem;
  padding-inline: 0.2rem;
}

.chat-header-btn:hover,
.chat-send-btn:hover,
.chat-prompt-chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 28px rgba(156, 199, 186, 0.2);
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
  .portfolio-chat-panel {
    padding: 1.1rem;
    border-radius: 26px;
  }

  .portfolio-chat-panel.fullscreen {
    padding: 0.9rem 1rem 1rem;
    border-radius: 28px;
  }

  .chat-panel-header,
  .chat-input-shell {
    flex-direction: column;
    align-items: center;
  }

  .chat-panel-actions {
    justify-content: flex-start;
  }

  .chat-message-stack {
    max-width: calc(100% - 2.8rem);
  }

  .portfolio-chat-panel.fullscreen .chat-message-stack {
    max-width: calc(100% - 3.5rem);
  }

  .chat-send-btn {
    width: 100%;
  }

  .chat-send-btn.icon {
    width: 48px;
  }
}
</style>
