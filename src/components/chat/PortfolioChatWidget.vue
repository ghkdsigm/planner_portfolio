<script setup>
import ChatPanel from "./ChatPanel.vue";

const emit = defineEmits(["open-fullscreen"]);
</script>

<template>
  <aside class="portfolio-chat-widget" aria-label="포트폴리오 챗봇 배너">
    <div class="portfolio-chat-widget-inner">
      <div class="widget-vertical-copy">
        <span>HSH</span>
        <span>AI</span>
        <span>COPILOT</span>
      </div>

      <div class="widget-panel-wrap">
        <ChatPanel compact @open-fullscreen="emit('open-fullscreen')" />
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
  width: min(360px, calc(100vw - 2rem));
  pointer-events: none;
}

.portfolio-chat-widget-inner {
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr);
  gap: 0.85rem;
  min-height: 74vh;
  max-height: 760px;
  pointer-events: auto;
}

.widget-vertical-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 0.9rem;
  padding: 1rem 0.35rem;
  border-radius: 18px;
  background: linear-gradient(180deg, #0c3a27, #00694d 45%, #00ad50);
  color: #ffffff;
  box-shadow: 0 20px 40px rgba(12, 58, 39, 0.28);
}

.widget-vertical-copy span {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-size: 0.72rem;
  letter-spacing: 0.16em;
  font-weight: 700;
}

.widget-panel-wrap {
  min-height: 0;
}

@media (max-width: 1400px) {
  .portfolio-chat-widget {
    left: 0.7rem;
    width: min(330px, calc(100vw - 1.4rem));
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
    gap: 0.5rem;
    padding: 0.65rem 0.9rem;
    justify-content: flex-start;
  }

  .widget-vertical-copy span {
    writing-mode: initial;
    transform: none;
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
