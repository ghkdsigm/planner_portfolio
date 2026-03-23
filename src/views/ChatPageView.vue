<script setup>
import ChatPanel from "../components/chat/ChatPanel.vue";

const emit = defineEmits(["close"]);
</script>

<template>
  <section class="chat-page-view">
    <div class="chat-page-shell">
      <div class="chat-page-panel-frame">
        <div class="chat-page-panel">
          <div class="chat-page-topline" aria-hidden="true">
            <span class="chat-page-topline-bar" />
            <span class="chat-page-topline-badge">Portfolio chat</span>
            <span class="chat-page-topline-bar" />
          </div>

        <ChatPanel
          fullscreen
          title="Something AI"
          description="포트폴리오 기반 인터뷰 답변 도우미"
          placeholder="Ask me anything..."
          :show-fullscreen-action="false"
          :show-close-action="true"
          :show-prompt-list="false"
          :show-footer-note="false"
          close-label="포트폴리오로 돌아가기"
          @close="emit('close')"
        />
      </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.chat-page-view {
  min-height: 100vh;
  padding: 1.5rem;
  background:
    radial-gradient(circle at 16% 14%, rgba(255, 255, 255, 0.94), rgba(255, 255, 255, 0) 24%),
    radial-gradient(circle at 84% 16%, rgba(220, 230, 255, 0.74), rgba(220, 230, 255, 0) 28%),
    radial-gradient(circle at 76% 80%, rgba(233, 221, 255, 0.62), rgba(233, 221, 255, 0) 24%),
    radial-gradient(circle at 18% 82%, rgba(214, 240, 236, 0.5), rgba(214, 240, 236, 0) 22%),
    linear-gradient(180deg, #f6f4fb 0%, #eef2fb 100%);
}

.chat-page-shell {
  width: min(1180px, 100%);
  min-height: calc(100vh - 3rem);
  margin: 0 auto;
  display: flex;
  align-items: stretch;
}

.chat-page-panel-frame {
  flex: 1;
  padding: 0.45rem;
  border-radius: 36px;  
}

.chat-page-panel {
  height: calc(100vh - 3.9rem);
  min-height: 0;
}

.chat-page-topline {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  margin-bottom: 0.8rem;
  padding-inline: 0.8rem;
}

.chat-page-topline-bar {
  flex: 1;
  height: 1px;
  background: rgba(164, 168, 190, 0.34);
}

.chat-page-topline-badge {
  padding: 0.38rem 0.8rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.68);
  color: #8b90a8;
  font-size: 0.74rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  box-shadow:
    0 10px 24px rgba(183, 184, 211, 0.18),
    inset 0 0 0 1px rgba(255, 255, 255, 0.86);
}

@media (max-width: 960px) {
  .chat-page-view {
    padding: 0.9rem;
  }

  .chat-page-shell {
    min-height: calc(100vh - 1.8rem);
  }

  .chat-page-panel-frame {
    padding: 0.3rem;
    border-radius: 28px;
  }

  .chat-page-panel {
    height: calc(100vh - 2.4rem);
  }

  .chat-page-topline {
    gap: 0.6rem;
    margin-bottom: 0.55rem;
    padding-inline: 0.35rem;
  }
}
</style>
