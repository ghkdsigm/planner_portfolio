<script setup>
import { onMounted, onUnmounted, ref } from "vue";

const containerRef = ref(null);
let animationId = null;
let camera = null;
let scene = null;
let renderer = null;
let mesh = null;
let material = null;
let geometry = null;
let uniforms = null;
let resizeHandler = null;

let threeLoadPromise = null;

const loadThree = () => {
  if (window.THREE) return Promise.resolve(window.THREE);
  if (threeLoadPromise) return threeLoadPromise;

  threeLoadPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-threejs-cdn="true"]');
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.THREE), { once: true });
      existingScript.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/89/three.min.js";
    script.async = true;
    script.dataset.threejsCdn = "true";
    script.onload = () => resolve(window.THREE);
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return threeLoadPromise;
};

const initThreeJS = () => {
  const container = containerRef.value;
  if (!container || !window.THREE) return;

  const THREE = window.THREE;
  container.innerHTML = "";

  camera = new THREE.Camera();
  camera.position.z = 1;

  scene = new THREE.Scene();
  geometry = new THREE.PlaneBufferGeometry(2, 2);
  uniforms = {
    time: { type: "f", value: 1.0 },
    resolution: { type: "v2", value: new THREE.Vector2() },
  };

  const vertexShader = `
    void main() {
      gl_Position = vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    #define TWO_PI 6.2831853072
    #define PI 3.14159265359

    precision highp float;
    uniform vec2 resolution;
    uniform float time;

    float random(in float x) {
      return fract(sin(x) * 1e4);
    }
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    void main(void) {
      vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);

      vec2 fMosaicScal = vec2(4.0, 2.0);
      vec2 vScreenSize = vec2(256.0, 256.0);
      uv.x = floor(uv.x * vScreenSize.x / fMosaicScal.x) / (vScreenSize.x / fMosaicScal.x);
      uv.y = floor(uv.y * vScreenSize.y / fMosaicScal.y) / (vScreenSize.y / fMosaicScal.y);

      float t = time * 0.06 + random(uv.x) * 0.4;
      float lineWidth = 0.0008;

      vec3 color = vec3(0.0);
      for (int j = 0; j < 3; j++) {
        for (int i = 0; i < 5; i++) {
          color[j] += lineWidth * float(i * i) / abs(fract(t - 0.01 * float(j) + float(i) * 0.01) - length(uv));
        }
      }

      gl_FragColor = vec4(color[2], color[1], color[0], 1.0);
    }
  `;

  material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
  });

  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  container.appendChild(renderer.domElement);

  resizeHandler = () => {
    const rect = container.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    renderer.setSize(rect.width, rect.height, false);
    uniforms.resolution.value.x = renderer.domElement.width;
    uniforms.resolution.value.y = renderer.domElement.height;
  };

  resizeHandler();
  window.addEventListener("resize", resizeHandler, false);

  const animate = () => {
    animationId = requestAnimationFrame(animate);
    uniforms.time.value += 0.05;
    renderer.render(scene, camera);
  };

  animate();
};

onMounted(async () => {
  try {
    await loadThree();
    initThreeJS();
  } catch (error) {
    console.error("Failed to load Three.js for ShaderAnimation:", error);
  }
});

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  if (resizeHandler) {
    window.removeEventListener("resize", resizeHandler, false);
    resizeHandler = null;
  }
  if (mesh && scene) {
    scene.remove(mesh);
  }
  if (geometry) geometry.dispose();
  if (material) material.dispose();
  if (renderer) renderer.dispose();

  camera = null;
  scene = null;
  renderer = null;
  mesh = null;
  material = null;
  geometry = null;
  uniforms = null;
});
</script>

<template>
  <div ref="containerRef" class="shader-three-canvas" aria-hidden="true" />
</template>

<style scoped>
.shader-three-canvas {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}
</style>

