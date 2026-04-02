<script setup>
const props = defineProps({
  size: {
    type: Number,
    default: 40,
  },
  padding: {
    type: Number,
    default: 8,
  },
  rounded: {
    type: Number,
    default: 18,
  },
  shadow: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <span
    class="chat-sparkle-icon"
    :class="{ shadow }"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      padding: `${padding}px`,
      borderRadius: `${rounded}px`,
    }"
    aria-hidden="true"
  >
    <svg viewBox="0 0 64 64" role="presentation" focusable="false">
      <path
        d="M34.5 13.2c.58 0 1.07.41 1.17.97l.74 4.42a8.4 8.4 0 0 0 6.74 6.74l4.42.74a1.2 1.2 0 0 1 0 2.36l-4.42.74a8.4 8.4 0 0 0-6.74 6.74l-.74 4.42a1.2 1.2 0 0 1-2.36 0l-.74-4.42a8.4 8.4 0 0 0-6.74-6.74l-4.42-.74a1.2 1.2 0 0 1 0-2.36l4.42-.74a8.4 8.4 0 0 0 6.74-6.74l.74-4.42c.1-.56.59-.97 1.19-.97Z"
      />
      <path
        d="M20.2 21.5c.43 0 .8.3.88.73l.49 2.93a5.56 5.56 0 0 0 4.47 4.47l2.93.49a.9.9 0 0 1 0 1.76l-2.93.49a5.56 5.56 0 0 0-4.47 4.47l-.49 2.93a.9.9 0 0 1-1.76 0l-.49-2.93a5.56 5.56 0 0 0-4.47-4.47l-2.93-.49a.9.9 0 0 1 0-1.76l2.93-.49a5.56 5.56 0 0 0 4.47-4.47l.49-2.93a.9.9 0 0 1 .89-.73Z"
      />
      <path
        d="M44.55 7.76c.31 0 .58.22.64.53l.3 1.81a3.44 3.44 0 0 0 2.76 2.76l1.81.3a.66.66 0 0 1 0 1.3l-1.81.3a3.44 3.44 0 0 0-2.76 2.76l-.3 1.81a.66.66 0 0 1-1.3 0l-.3-1.81a3.44 3.44 0 0 0-2.76-2.76l-1.81-.3a.66.66 0 0 1 0-1.3l1.81-.3a3.44 3.44 0 0 0 2.76-2.76l.3-1.81a.66.66 0 0 1 .66-.53Z"
      />
    </svg>
  </span>
</template>

<style scoped>
.chat-sparkle-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* background: #ffffff; */
}

.chat-sparkle-icon.shadow {
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.12);
}

svg {
  width: 100%;
  height: 100%;
  display: block;
  fill: #839af1;
}
</style>
