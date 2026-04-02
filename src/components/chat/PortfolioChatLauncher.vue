<script setup>
const emit = defineEmits(["open-fullscreen"]);
</script>

<template>
  <aside class="portfolio-chat-launcher" aria-label="포트폴리오 챗봇 실행">
    <button type="button" class="chat-launcher-button" @click="emit('open-fullscreen')">
      <span class="chat-launcher-icon" aria-hidden="true">
        <span class="chat-launcher-core">AI</span>
      </span>
      <span class="chat-launcher-label">AI에게 질문하기</span>
    </button>
  </aside>
</template>

<style scoped>
.portfolio-chat-launcher {
  position: fixed;
  top: 50%;
  left: 5rem;
  z-index: 45;
  transform: translateY(-50%);
}

.chat-launcher-button {
  display: grid;
  justify-items: center;
  gap: 0.5rem;
  padding: 0.7rem 0.75rem;
  border: 0;
  background: transparent;
  border-radius: 24px;
  
  cursor: pointer;
}

.chat-launcher-icon {
  width: 64px;
  height: 64px;
  border-radius: 22px;
  display: grid;
  place-items: center;
  background: #262525;
}

.chat-launcher-core {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #ffffff;
  color: #111111;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.chat-launcher-label {
  color: #fff;
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.35;
  text-align: center;
}

:global(body[data-theme="dark"]) .chat-launcher-button {
  background: rgba(15, 22, 20, 0.88);
  box-shadow:
    0 18px 40px rgba(0, 0, 0, 0.34),
    inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

:global(body[data-theme="dark"]) .chat-launcher-icon {
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 34px rgba(0, 0, 0, 0.32);
}

:global(body[data-theme="dark"]) .chat-launcher-core {
  background: #111111;
  color: #ffffff;
}

:global(body[data-theme="dark"]) .chat-launcher-label {
  color: #f3f8f6;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.3);
}

.chat-launcher-button:hover .chat-launcher-icon {
  transform: translateY(-1px);
}

@media (max-width: 1120px) {
  .portfolio-chat-launcher {
    top: auto;
    left: 0.8rem;
    bottom: 0.8rem;
    transform: none;
  }

  .chat-launcher-button {
    justify-items: start;
  }

  .chat-launcher-label {
    text-align: left;
  }
}

@media (max-width: 700px) {
  .portfolio-chat-launcher {
    left: 0.55rem;
    bottom: 0.55rem;
  }

  .chat-launcher-icon {
    width: 58px;
    height: 58px;
    border-radius: 20px;
  }
}
</style>
