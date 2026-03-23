<script setup>
import ChatPanel from "./ChatPanel.vue";

const emit = defineEmits(["open-fullscreen", "collapse"]);
</script>

<template>
  <aside class="portfolio-chat-widget" aria-label="포트폴리오 챗봇 배너">
    <div class="widget-ambient widget-ambient-a" aria-hidden="true" />
    <div class="widget-ambient widget-ambient-b" aria-hidden="true" />
    <div class="portfolio-chat-widget-inner">
      <div class="widget-vertical-copy">
        <span class="widget-status-dot" aria-hidden="true" />
        <strong>HSH AI</strong>
        <p>Interview copilot</p>
      </div>

      <div class="widget-panel-wrap">
        <ChatPanel
          compact
          :show-close-action="true"
          close-label="사이드 챗봇 접기"
          @open-fullscreen="emit('open-fullscreen')"
          @close="emit('collapse')"
        />
      </div>
    </div>
  </aside>
</template>

<style scoped>
.portfolio-chat-widget {
  position: fixed;
  top: 50%;
  left: 1rem;
  z-index: 45;
  transform: translateY(-50%);
  width: min(392px, calc(100vw - 2rem));
  pointer-events: none;
}

.portfolio-chat-widget-inner {
  position: relative;
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  gap: 1.1rem;
  min-height: 76vh;
  max-height: 800px;
  padding: 0.35rem;
  pointer-events: auto;
}

.widget-vertical-copy {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem 0.9rem;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.92);
  color: #284842;
  box-shadow:
    0 24px 60px rgba(112, 171, 154, 0.16),
    inset 0 0 0 1px rgba(162, 201, 189, 0.22);
}

.widget-status-dot {
  width: 0.85rem;
  height: 0.85rem;
  border-radius: 999px;
  background: #20bb91;
  box-shadow:
    0 0 0 0.35rem rgba(99, 226, 190, 0.16),
    0 8px 20px rgba(53, 192, 147, 0.24);
}

.widget-vertical-copy strong {
  font-size: 0.88rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.widget-vertical-copy p {
  margin: 0;
  font-size: 0.76rem;
  line-height: 1.45;
  color: #67817a;
}

.widget-panel-wrap {
  min-height: 0;
}

.widget-ambient {
  display: none;
}

@media (max-width: 1400px) {
  .portfolio-chat-widget {
    left: 0.7rem;
    width: min(360px, calc(100vw - 1.4rem));
  }
}

@media (max-width: 1120px) {
  .portfolio-chat-widget {
    position: fixed;
    top: auto;
    left: 0.8rem;
    right: 0.8rem;
    bottom: 0.8rem;
    transform: none;
    width: auto;
  }

  .portfolio-chat-widget-inner {
    grid-template-columns: 1fr;
    min-height: auto;
    max-height: min(72vh, 720px);
  }

  .widget-vertical-copy {
    flex-direction: row;
    gap: 0.7rem;
    padding: 0.75rem 0.95rem;
    justify-content: flex-start;
    align-items: center;
  }
}

@media (max-width: 700px) {
  .portfolio-chat-widget {
    left: 0.55rem;
    right: 0.55rem;
    bottom: 0.55rem;
  }

  .portfolio-chat-widget-inner {
    max-height: 68vh;
  }
}
</style>
