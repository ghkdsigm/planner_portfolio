<script setup>
const emit = defineEmits(["open-fullscreen"]);

const openDeckView = () => {
  if (typeof window === "undefined") return;
  window.location.assign("/?view=deck");
};
</script>

<template>
  <aside class="portfolio-chat-launcher" aria-label="포트폴리오 챗봇 실행">
    <div class="chat-launcher-stack">
      <button type="button" class="chat-launcher-button" @click="emit('open-fullscreen')">
        <span class="chat-launcher-icon" aria-hidden="true">
          <span class="chat-launcher-core">AI</span>
        </span>
        <span class="chat-launcher-label">AI에게 질문하기</span>
      </button>

      <button type="button" class="chat-launcher-button" @click="openDeckView">
        <span class="chat-launcher-icon" aria-hidden="true">
          <span class="chat-launcher-core chat-launcher-core-deck">
            <svg viewBox="0 0 24 24" role="presentation" focusable="false">
              <path
                d="M6.75 4.75h7.3l3.2 3.2v11.3a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 5.25 19.25v-13a1.5 1.5 0 0 1 1.5-1.5Z"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
              />
              <path
                d="M14.05 4.95v3a.8.8 0 0 0 .8.8h3"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
              />
              <path
                d="M8.5 12.25h6.8M8.5 15.5h4.6"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
              />
            </svg>
          </span>
        </span>
        <span class="chat-launcher-label">포트폴리오 보기</span>
      </button>
    </div>
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

.chat-launcher-stack {
  display: grid;
  gap: 0.7rem;
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

.chat-launcher-core-deck svg {
  width: 19px;
  height: 19px;
  display: block;
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
