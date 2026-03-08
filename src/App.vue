<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";
import portfolio from "./data/portfolio.json";

import heroCover from "./assets/images/hero-cover.svg";
import bgImage from "./assets/images/bg.png";
import profilePortrait from "./assets/images/profile-portrait.png";
import projectRoutine from "./assets/images/project-routine.svg";
import projectAssistant from "./assets/images/project-assistant.svg";
import projectChallenge from "./assets/images/project-challenge.svg";
import bg01Gif from "./assets/images/bg01.gif";
import bg00Gif from "./assets/images/bg00.gif";
import m01 from "./assets/images/m01.jpg";
import m02 from "./assets/images/m02.jpg";
import m03 from "./assets/images/m03.jpg";
import m04 from "./assets/images/m04.jpg";
import m05 from "./assets/images/m05.jpg";
import m06 from "./assets/images/m06.jpg";
import m07 from "./assets/images/m07.jpg";
import m08 from "./assets/images/m08.jpg";
import m09 from "./assets/images/m09.jpg";
import project04Slide01 from "./assets/images/r01.jpg";
import project04Slide02 from "./assets/images/r02.jpg";
import project04Slide03 from "./assets/images/r03.jpg";
import project04Slide04 from "./assets/images/r04.jpg";

const imageMap = {
  heroCover,
  profilePortrait,
  projectRoutine,
  projectAssistant,
  projectChallenge,
};
const project04ImageMap = {
  "r01.jpg": project04Slide01,
  "r02.jpg": project04Slide02,
  "r03.jpg": project04Slide03,
  "r04.jpg": project04Slide04,
};

const navItems = [
  { id: "cover", label: "HOME" },
  { id: "about", label: "ABOUT" },
  { id: "skills", label: "SkILLS" },
  { id: "career", label: "CAREER" },
  { id: "references", label: "REFERENCES" },
  { id: "archive", label: "ARCHIVE" },
  { id: "contact", label: "CONTACT" },
];

const activeSection = ref("cover");
const buttonRefs = ref({});
const resizeKey = ref(0);
const meterAnimated = ref({});
const mobileMenuOpen = ref(false);
const isMobileViewport = ref(false);

const METER_ANIM_DURATION = 1300;
const MOBILE_NAV_BREAKPOINT = 700;

function animateMeter(label, score) {
  if (meterAnimated.value[label] === score) return;
  const start = performance.now();
  const step = (now) => {
    const t = Math.min((now - start) / METER_ANIM_DURATION, 1);
    const eased = 1 - (1 - t) ** 2;
    const current = Math.round(score * eased);
    meterAnimated.value = { ...meterAnimated.value, [label]: current };
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

const setButtonRef = (el, id) => {
  const prev = buttonRefs.value[id];
  if (el) {
    if (prev !== el) {
      buttonRefs.value = { ...buttonRefs.value, [id]: el };
    }
  } else if (prev != null) {
    const next = { ...buttonRefs.value };
    delete next[id];
    buttonRefs.value = next;
  }
};

const skillGroupCards = computed(() => {
  const groups = portfolio.skills.groups || [];
  const meters = portfolio.skills.meters || [];
  const meterByLabel = Object.fromEntries(meters.map((meter) => [meter.label, meter]));
  const meterLabelsByGroupName = {
    "기획 전략": ["Problem Framing"],
    "AI/데이터": ["AI Feature Planning", "Data Analysis"],
    "프로덕트 실행": ["Delivery Management"],
    "협업/커뮤니케이션": ["UX Writing & Flow"],
    "기술 아키텍쳐 이해": ["Technical Architecture Understanding"],
    "신속한 프로토타이핑": ["Rapid Prototyping"],
    "Technical Architecture Understanding": ["Technical Architecture Understanding"],
    "Rapid Prototyping": ["Rapid Prototyping"],
  };

  return groups.map((group, index) => ({
    ...group,
    meters:
      (meterLabelsByGroupName[group.name] || [])
        .map((label) => meterByLabel[label])
        .filter(Boolean).length > 0
        ? (meterLabelsByGroupName[group.name] || [])
            .map((label) => meterByLabel[label])
            .filter(Boolean)
        : meters[index]
          ? [meters[index]]
          : [],
  }));
});

const remainingSkillMeters = computed(() => {
  const meters = portfolio.skills.meters || [];
  const assignedLabels = new Set(
    skillGroupCards.value.flatMap((card) => (card.meters || []).map((meter) => meter.label))
  );
  return meters.filter((meter) => !assignedLabels.has(meter.label));
});

const indicatorStyle = computed(() => {
  resizeKey.value;
  const el = buttonRefs.value[activeSection.value];
  if (!el) return { transform: "translate(0, -50%)", width: "0px", opacity: 0 };
  return {
    transform: `translate(${el.offsetLeft}px, -50%)`,
    width: `${el.offsetWidth}px`,
    opacity: 1,
  };
});

const getImage = (key) => imageMap[key] ?? heroCover;
const getProject04SlideImage = (slide) => project04ImageMap[slide?.image] || slide?.image || "";
const getItemLink = (item) => item.url || item.contentUrl || "";
const getItemImage = (item) => item.image || item.contentUrl || "";
const researchVoices = portfolio.research.insightBlocks.flatMap((item) =>
  (item.voices || []).map((voice) => ({ tag: item.tag, text: voice }))
);
const displayedVoices = computed(() => [...researchVoices, ...researchVoices.slice(0, 3)]);
const project04 = computed(() => portfolio.references.project04 || null);
const project04Slides = computed(() => project04.value?.slides || []);
const project04CurrentIndex = ref(0);
const project04Progress = ref(0);
const PROJECT04_SLIDE_INTERVAL = 8000;
let project04Timer = null;
const referenceMainSlides = [m01, m02, m03, m04, m05, m06, m07, m08, m09];
const referenceMainSlideIndex = ref(0);
const REFERENCE_MAIN_SLIDE_INTERVAL = 2500;
let referenceMainSlideTimer = null;

const VOICE_ROLL_INTERVAL = 3000;
const VOICE_GAP_REM = 0.8;
const rollIndex = ref(0);
const listTransitionOff = ref(false);
const rollTrackRef = ref(null);
const slotOffsetsPx = ref([0]);
const voiceViewportHeightPx = ref(250);
let rollTimer = null;

const setProject04Slide = (index) => {
  const total = project04Slides.value.length;
  if (!total) return;
  const next = ((index % total) + total) % total;
  project04CurrentIndex.value = next;
};

const nextProject04Slide = () => {
  setProject04Slide(project04CurrentIndex.value + 1);
};

const prevProject04Slide = () => {
  setProject04Slide(project04CurrentIndex.value - 1);
};

const restartProject04Timer = () => {
  if (project04Timer) clearInterval(project04Timer);
  if (!project04Slides.value.length) return;
  const start = performance.now();
  project04Progress.value = 0;
  project04Timer = setInterval(() => {
    const elapsed = performance.now() - start;
    const ratio = Math.min(elapsed / PROJECT04_SLIDE_INTERVAL, 1);
    project04Progress.value = Math.round(ratio * 100);
    if (ratio >= 1) {
      setProject04Slide(project04CurrentIndex.value + 1);
      restartProject04Timer();
    }
  }, 40);
};

const startReferenceMainSlideTimer = () => {
  if (referenceMainSlideTimer) clearInterval(referenceMainSlideTimer);
  if (referenceMainSlides.length <= 1) return;
  referenceMainSlideTimer = setInterval(() => {
    referenceMainSlideIndex.value = (referenceMainSlideIndex.value + 1) % referenceMainSlides.length;
  }, REFERENCE_MAIN_SLIDE_INTERVAL);
};

const updateVoiceRollOffsets = () => {
  const el = rollTrackRef.value;
  if (!el || !el.children.length) return;
  const gapPx = VOICE_GAP_REM * 16;
  const children = Array.from(el.children);
  const offsets = [0];
  let y = 0;
  for (let i = 0; i < children.length; i++) {
    y += children[i].offsetHeight + gapPx;
    offsets.push(y);
  }
  slotOffsetsPx.value = offsets;
  const firstThreeHeight = offsets[3] - offsets[0];
  voiceViewportHeightPx.value = firstThreeHeight + gapPx;
};

const advanceVoiceRoll = () => {
  if (rollIndex.value < 6) {
    rollIndex.value++;
  } else {
    listTransitionOff.value = true;
    nextTick(() => {
      rollIndex.value = 0;
      nextTick(() => {
        listTransitionOff.value = false;
      });
    });
  }
};
const iaStructureBranches = [
  {
    title: "1. 전체 시스템 프로세스 (상세)",
    nodes: [
      {
        label: "구성요소",
        detail: "Desktop / Web / Server / Worker / Shared 기술 스택과 역할 분리",
      },
      {
        label: "인증",
        items: [
          "개발 로그인 vs 비밀번호 로그인",
          "JWT 저장/사용 흐름",
          "로그아웃 및 세션 정리",
        ],
      },
      {
        label: "채팅",
        items: [
          "방 목록 조회 및 선택",
          "메시지 전송/수정/삭제",
          "첨부 블록 구조 관리",
        ],
      },
      {
        label: "AI (Jarvis)",
        items: [
          "트리거(\"자비스야\") vs 버튼 진입",
          "공유/개인/액션 실행 분기",
          "Worker 스트리밍 응답 흐름",
        ],
      },
      {
        label: "주변정보/위치",
        items: [
          "places 검색",
          "역지오코딩",
          "클라이언트 호출 후 메시지 삽입",
        ],
      },
      {
        label: "실시간 이벤트",
        detail: "WebSocket으로 오가는 이벤트 타입 규격화",
      },
      {
        label: "저장소",
        detail: "Postgres(Prisma) + Redis(큐/Pub/Sub) 역할 분담",
      },
    ],
  },
  // {
  //   title: "3. 서버 REST API 상세",
  //   nodes: [
  //     {
  //       label: "엔드포인트 테이블 정의",
  //       detail: "메서드, 경로, 한 줄 설명, 인증 여부",
  //     },
  //     {
  //       label: "도메인 묶음",
  //       items: [
  //         "auth, rooms, members, messages, cards",
  //         "graph, pulse-report, news, suggestions, users, translate",
  //         "holidays, speech, calendar, tools/places, tools/geo, download",
  //       ],
  //     },
  //   ],
  // },
  // {
  //   title: "4. WebSocket 프로토콜 상세",
  //   nodes: [
  //     {
  //       label: "클라이언트 → 서버",
  //       items: [
  //         "room.join / room.leave",
  //         "message.send / message.edit / message.delete",
  //         "jarvis.request, room.rename, room.delete, rtc.* signaling",
  //       ],
  //     },
  //     {
  //       label: "서버 → 클라이언트",
  //       items: [
  //         "room.joined / room.left / room.updated / room.deleted",
  //         "room.member.added / room.member.removed",
  //         "message.new / message.updated / message.deleted, ui.news.search, rtc.*",
  //       ],
  //     },
  //     {
  //       label: "에러 규격",
  //       detail: "error payload(code, message, retryable, context) 표준화",
  //     },
  //   ],
  // },
  {
    title: "3. AI Worker 작업/도구 상세",
    nodes: [
      {
        label: "BullMQ Jobs",
        items: [
          "message-embedding: 대화 임베딩 생성/갱신",
          "jarvis: AI 질의 처리 및 스트리밍",
          "meeting-summary: 회의록 요약/구조화",
        ],
      },
      {
        label: "Agent 도구 12개",
        items: [
          "search_documents, fetch_room_context, summarize_thread, extract_action_items",
          "create_idea_card, update_graph_links, generate_pulse_report, translate_text",
          "calendar_create_event, news_search, suggest_followups, resolve_user_profile",
        ],
      },
      {
        label: "주의사항",
        detail: "주변 장소(places)는 Worker가 아닌 클라이언트에서 직접 호출",
      },
    ],
  },
  {
    title: "2. IA 메뉴 트리 (상세)",
    nodes: [
      {
        label: "노드 공통 정의",
        items: [
          "화면/컴포넌트 예: RoomList, ChatPanel, jarvisOpen",
          "사용자 액션: 클릭, 우클릭, 입력, 토글",
          "연관 API 또는 WebSocket 이벤트 연결",
        ],
      },
      {
        label: "채팅 패널",
        items: [
          "헤더: 인사이트 토글, 이름 변경, 삭제",
          "미니 모드: 더보기 팝오버 항목",
          "옵션 바: 화면 공유, AI 숨기기/참여, 뉴스, 동료추가, 회의록 불러오기",
        ],
      },
      {
        label: "메시지 기능",
        items: [
          "북마크, Devil's Advocate, AI 선택",
          "첨부/주변정보 카드/번역",
          "우클릭: 확인완료, 복사, 답장, 전달",
        ],
      },
      {
        label: "인사이트 패널 3탭",
        items: [
          "아이디어 카드 + 카드 API",
          "지식 그래프 + graph API",
          "Brain Pulse 리포트 + pulse-report API",
        ],
      },
      {
        label: "Composer/가이드",
        items: [
          "텍스트, 첨부, AI 질문 모달(공유/개인/액션 실행), 주변정보",
          "모달/팝업 목록과 역할 정리",
          "가이드 탭: 사용법, 단축키, About",
        ],
      },
    ],
  },
  {
    title: "4. 주요 사용자 시나리오 (플로우)",
    nodes: [
      {
        label: "기본 채팅",
        detail: "로그인 → 방 선택 → 메시지 전송",
      },
      {
        label: "자비스 공유 질문",
        detail: "버튼 → 모달 → 공유 질문 → 스트리밍 수신",
      },
      {
        label: "일정 등록",
        detail: "액션 실행 → Worker calendar_create_event",
      },
      {
        label: "주변 장소 검색",
        detail: "클라이언트 places API → 메시지 블록 삽입",
      },
      {
        label: "인사이트/Pulse",
        detail: "카드 저장 → Brain Pulse 생성 API",
      },
      {
        label: "지난 회의록 가져오기",
        detail: "import-meeting-summary → meeting-summary job",
      },
    ],
  },
];
const iaTreeColumns = [
  {
    title: "AI Speaker Platform",
    branchIndexes: [0, 2, 4],
  },
  {
    title: "Cross Platform",
    branchIndexes: [1, 3, 5],
  },
];
const getIaBranches = (indexes = []) =>
  indexes
    .map((index) => iaStructureBranches[index])
    .filter(Boolean);
const getDonutStyle = (segments = []) => {
  if (!segments.length) {
    return { background: "conic-gradient(var(--accent) 0 100%)" };
  }

  let offset = 0;
  const stops = segments.map((segment) => {
    const start = offset;
    const end = offset + segment.value;
    offset = end;
    return `${segment.color} ${start}% ${end}%`;
  });

  return {
    background: `conic-gradient(${stops.join(", ")})`,
  };
};
const THEME_STORAGE_KEY = "planner-theme";
const isDarkMode = ref(true);
const showTopButton = ref(false);

const applyTheme = () => {
  const theme = isDarkMode.value ? "dark" : "light";
  document.body.dataset.theme = theme;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
};

const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value;
  applyTheme();
};

const syncMobileNavState = () => {
  isMobileViewport.value = window.innerWidth <= MOBILE_NAV_BREAKPOINT;
  if (!isMobileViewport.value) {
    mobileMenuOpen.value = false;
  }
};

const toggleMobileNav = () => {
  if (!isMobileViewport.value) return;
  mobileMenuOpen.value = !mobileMenuOpen.value;
};

const smoothScroll = (id) => {
  const target = document.getElementById(id);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  if (isMobileViewport.value) {
    mobileMenuOpen.value = false;
  }
};

const updateTopButtonVisibility = () => {
  showTopButton.value = window.scrollY > 360;
};

const updateActiveSection = () => {
  const y = window.scrollY + 180;
  let current = "cover";
  for (const item of navItems) {
    const el = document.getElementById(item.id);
    if (el && el.offsetTop <= y) current = item.id;
  }
  activeSection.value = current;
};

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const handleWindowResize = () => {
  resizeKey.value++;
  syncMobileNavState();
};

onMounted(() => {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === "light") {
    isDarkMode.value = false;
  }
  applyTheme();
  syncMobileNavState();
  updateTopButtonVisibility();
  updateActiveSection();
  window.addEventListener("scroll", updateTopButtonVisibility, { passive: true });
  window.addEventListener("scroll", updateActiveSection, { passive: true });
  window.addEventListener("resize", handleWindowResize);

  const reveals = document.querySelectorAll("[data-reveal]");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          if (entry.target.classList.contains("meter-item")) {
            const label = entry.target.dataset.label;
            const score = Number(entry.target.dataset.score) || 0;
            if (label != null) animateMeter(label, score);
          }
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  reveals.forEach((item) => observer.observe(item));

  nextTick(() => updateVoiceRollOffsets());
  window.addEventListener("resize", updateVoiceRollOffsets);

  rollTimer = setInterval(advanceVoiceRoll, VOICE_ROLL_INTERVAL);
  restartProject04Timer();
  startReferenceMainSlideTimer();
});

onUnmounted(() => {
  window.removeEventListener("scroll", updateTopButtonVisibility);
  window.removeEventListener("scroll", updateActiveSection);
  window.removeEventListener("resize", handleWindowResize);
  window.removeEventListener("resize", updateVoiceRollOffsets);
  if (rollTimer) clearInterval(rollTimer);
  if (project04Timer) clearInterval(project04Timer);
  if (referenceMainSlideTimer) clearInterval(referenceMainSlideTimer);
});
</script>

<template>
  <div class="page-shell">
    <header class="floating-nav" data-reveal>
      <div class="nav-top-row">
        <div class="brand">
          <span>{{ portfolio.meta.role }}</span>
          <button
            type="button"
            class="theme-toggle"
            :aria-label="isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환'"
            @click="toggleTheme"
          >
            <svg
              v-if="isDarkMode"
              class="theme-toggle-icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M14.2 3.2a1 1 0 0 1 .3 1.04A7.8 7.8 0 1 0 19.76 9.5a1 1 0 0 1 1.04-1.3 9.8 9.8 0 1 1-6.6-6.6Z"
                fill="currentColor"
              />
            </svg>
            <svg v-else class="theme-toggle-icon" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="4.2" fill="currentColor" />
              <path
                d="M12 2.4a1 1 0 0 1 1 1v2.1a1 1 0 1 1-2 0V3.4a1 1 0 0 1 1-1Zm0 16a1 1 0 0 1 1 1v2.1a1 1 0 1 1-2 0v-2.1a1 1 0 0 1 1-1Zm9.6-7.4a1 1 0 1 1 0 2h-2.1a1 1 0 1 1 0-2h2.1Zm-17.1 0a1 1 0 1 1 0 2H2.4a1 1 0 1 1 0-2h2.1Zm13.28-5.88a1 1 0 0 1 1.41 1.41l-1.49 1.49a1 1 0 1 1-1.41-1.41l1.49-1.49Zm-11.12 11.12a1 1 0 0 1 1.41 1.41l-1.49 1.49a1 1 0 1 1-1.41-1.41l1.49-1.49Zm12.61 2.9a1 1 0 1 1-1.41 1.41l-1.49-1.49a1 1 0 0 1 1.41-1.41l1.49 1.49ZM8.06 8.06a1 1 0 1 1-1.41 1.41L5.16 7.98a1 1 0 1 1 1.41-1.41l1.49 1.49Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
        <button
          type="button"
          class="nav-menu-toggle"
          :class="{ 'is-open': mobileMenuOpen }"
          :aria-expanded="mobileMenuOpen"
          aria-label="모바일 메뉴 열기/닫기"
          @click="toggleMobileNav"
        >
          <span class="bar" />
          <span class="bar" />
          <span class="bar" />
        </button>
      </div>
      <nav class="nav-with-indicator" :class="{ 'is-open': mobileMenuOpen }">
        <div
          class="nav-indicator"
          :style="indicatorStyle"
          aria-hidden="true"
        />
        <button
          v-for="item in navItems"
          :key="item.id"
          type="button"
          class="nav-btn"
          :class="{ active: activeSection === item.id }"
          :ref="(el) => setButtonRef(el, item.id)"
          @click="smoothScroll(item.id)"
        >
          {{ item.label }}
        </button>
      </nav>
    </header>

    <main>
      <section id="cover" class="section cover">
        <!-- <img class="cover-bg" :src="getImage('heroCover')" alt="portfolio cover visual" /> -->
        <picture style="
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: -2;
      ">
          <source media="(min-width: 64.1rem)" :srcset="bg01Gif">
          <source media="(max-width: 64rem)" :srcset="bg01Gif">
          <img
            :src="bg01Gif"
            alt=""
            loading="lazy"
            :style="{
              width: isMobileViewport ? 'auto' : '100%',
              height: isMobileViewport ? '100%' : 'auto',
              opacity: 0.3,
            }"
          >
        </picture>
        <div class="overlay" />
        <div class="container cover-content" data-reveal>
          <p class="mini-badge">{{ portfolio.hero.badge }}</p>
          <!-- <p class="nameplate">
            {{ portfolio.meta.nameKo }} · {{ portfolio.meta.nameEn }}
          </p> -->
          <h1>
            {{ portfolio.hero.titleTop }}<br />
            <span class="accent">{{ portfolio.hero.titleAccent }}</span><br />
            {{ portfolio.hero.titleBottom }}
            {{ portfolio.hero.titleName }}
          </h1>
          <p class="lead">{{ portfolio.meta.headline }}</p>
          <p class="desc">{{ portfolio.hero.description }}</p>

          <div class="stats">
            <article v-for="stat in portfolio.hero.stats" :key="stat.label" class="stat-card">
              <p class="stat-value">{{ stat.value }}</p>
              <p class="stat-label">{{ stat.label }}</p>
            </article>
          </div>
        </div>
      </section>

      <section id="about" class="section">
        <div class="container grid-about">
          <div class="about-text" data-reveal>
            <p class="section-label">{{ portfolio.about.label }}</p>
            <h2>{{ portfolio.about.title }}</h2>
            <p v-for="line in portfolio.about.paragraphs" :key="line" class="paragraph">
              {{ line }}
            </p>
            <div class="chip-wrap">
              <span v-for="item in portfolio.about.keywords" :key="item" class="chip">
                {{ item }}
              </span>
            </div>
          </div>
          <div class="about-image" style="border:none; background: #1b2028; overflow: hidden; border-radius: 1.4rem;" data-reveal>
            <img :src="getImage('profilePortrait')" alt="profile visual" />
          </div>
        </div>
      </section>

      <section id="skills" class="section deep">
        <div class="container">
          <div class="section-head" data-reveal>
            <p class="section-label">{{ portfolio.skills.label }}</p>
            <h2>{{ portfolio.skills.title }}</h2>
          </div>

          <div class="skill-grid">
            <article
              v-for="card in skillGroupCards"
              :key="card.name"
              class="panel skill-panel"
              data-reveal
            >
              <h3>{{ card.name }}</h3>
              <ul>
                <li v-for="item in card.items" :key="item">{{ item }}</li>
              </ul>
              <div
                v-for="meter in card.meters"
                :key="`${card.name}-${meter.label}`"
                class="meter-item skill-meter"
                data-reveal
                :data-label="meter.label"
                :data-score="meter.score"
              >
                <div class="meter-head">
                  <span>{{ meter.label }}</span>
                  <strong>{{ meterAnimated[meter.label] ?? 0 }}%</strong>
                </div>
                <div class="meter-track">
                  <span class="meter-fill" :style="{ width: `${meterAnimated[meter.label] ?? 0}%` }" />
                </div>
              </div>
            </article>
          </div>

          <div v-if="remainingSkillMeters.length" class="meter-list">
            <article
              v-for="meter in remainingSkillMeters"
              :key="meter.label"
              class="panel meter-item"
              data-reveal
              :data-label="meter.label"
              :data-score="meter.score"
            >
              <div class="meter-head">
                <span>{{ meter.label }}</span>
                <strong>{{ meterAnimated[meter.label] ?? 0 }}%</strong>
              </div>
              <div class="meter-track">
                <span class="meter-fill" :style="{ width: `${meterAnimated[meter.label] ?? 0}%` }" />
              </div>
            </article>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <div class="section-head" data-reveal>
            <p class="section-label">{{ portfolio.research.label }}</p>
            <h2>{{ portfolio.research.title }}</h2>
            <p class="section-desc">{{ portfolio.research.description }}</p>
          </div>
          <div class="research-grid">
            <article
              v-for="item in portfolio.research.insightBlocks"
              :key="item.tag"
              class="panel research-card"
              data-reveal
            >
              <span class="tag">{{ item.tag }}</span>
              <h3>{{ item.headline }}</h3>
              <p class="accent-line">{{ item.accent }}</p>
              <div class="mini-cards">
                <div class="mini-card">
                  <p class="mini-head">Survey</p>
                  <p class="survey-question">{{ item.surveyChart.question }}</p>
                  <div class="donut-wrap">
                    <span class="donut-chart" :style="getDonutStyle(item.surveyChart.segments)">
                      <strong>{{ item.surveyChart.focusValue }}%</strong>
                    </span>
                    <div class="donut-legend">
                      <p
                        v-for="segment in item.surveyChart.segments"
                        :key="`${item.tag}-${segment.label}`"
                        class="donut-legend-item"
                      >
                        <span class="legend-dot" :style="{ background: segment.color }" />
                        <span>{{ segment.label }}</span>
                        <strong>{{ segment.value }}%</strong>
                      </p>
                    </div>
                  </div>
                </div>
                <div class="mini-card">
                  <p class="mini-head">Interview</p>
                  <p>{{ item.interview }}</p>
                </div>
              </div>
            </article>
          </div>
          <div class="panel research-voices" data-reveal>
            <div
              class="voice-list voice-roll-viewport"
              :style="{ height: `${voiceViewportHeightPx}px` }"
            >
              <div
                ref="rollTrackRef"
                class="voice-roll-track"
                :style="{
                  transform: `translateY(-${slotOffsetsPx[rollIndex] ?? 0}px)`,
                  transition: listTransitionOff ? 'none' : 'transform 0.6s ease-out',
                }"
              >
                <p
                  v-for="(voice, index) in displayedVoices"
                  :key="`roll-${index}-${voice.tag}-${voice.text.slice(0, 20)}`"
                  :class="['voice-item', 'voice-roll-slot', ((index - rollIndex) % 2 + 2) % 2 ? 'is-right' : 'is-left']"
                >
                  <span class="voice-tag">{{ voice.tag }}</span>
                  {{ voice.text }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="career" class="section deep">
        <div class="container">
          <div class="section-head" data-reveal>
            <p class="section-label">{{ portfolio.career.label }}</p>
            <h2>{{ portfolio.career.title }}</h2>
          </div>

          <div class="timeline">
            <article
              v-for="job in portfolio.career.timeline"
              :key="`${job.company}-${job.period}`"
              class="panel timeline-item"
              data-reveal
            >
              <p class="period">{{ job.period }}</p>
              <h3>{{ job.company }}</h3>
              <p class="position">{{ job.position }}</p>
              <p class="paragraph">{{ job.summary }}</p>
              <ul>
                <li v-for="point in job.highlights" :key="point">{{ point }}</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section id="references" class="section section-references">
        <div class="container">
          <div class="section-head reference-head" data-reveal>
            <p class="section-label">{{ portfolio.references.label }}</p>
            <h2>{{ portfolio.references.title }}</h2>
          </div>
        </div>

        <div class="reference-list">
          <template v-for="(item, index) in portfolio.references.items" :key="item.name">
              <article
                class="reference-scene"
                :class="`scene-${(index % 3) + 1}`"
                data-reveal
              >
                <div class="scene-grid">
                  <div class="scene-copy">
                    <p class="scene-kicker">
                      PROJECT {{ String(index + 1).padStart(2, "0") }} · {{ item.period }}
                    </p>
                    <h3>{{ item.name }}</h3>
                    <p class="scene-line"><strong style="display: block;">Problem.</strong> {{ item.problem }}</p>
                    <p class="scene-line"><strong style="display: block;">Solution.</strong> {{ item.solution }}</p>
                    <ul class="scene-impact">
                      <li v-for="point in item.impact" :key="point">{{ point }}</li>
                    </ul>
                  </div>

                  <div class="scene-visual">
                    <span class="scene-glow" />
                    <figure class="phone-mock primary">
                      <div
                        v-if="index === 0"
                        class="reference-main-slider-track"
                        :style="{ transform: `translateX(-${referenceMainSlideIndex * 100}%)` }"
                      >
                        <img
                          v-for="(slide, slideIdx) in referenceMainSlides"
                          :key="`reference-main-${slideIdx}`"
                          :src="slide"
                          :alt="`${item.name} ${slideIdx + 1}`"
                        />
                      </div>
                      <img v-else :src="getImage(item.imageKey)" :alt="item.name" />
                    </figure>
                    <figure class="phone-mock secondary">
                      <img :src="getImage(item.imageKey)" :alt="`${item.name} detail`" />
                    </figure>
                    <figure class="phone-mock tertiary">
                      <img :src="getImage(item.imageKey)" :alt="`${item.name} dashboard`" />
                    </figure>
                  </div>
                </div>
              </article>

              <section v-if="index === 0" class="reference-ia-zone" data-reveal>
                <img
                  class="ia-bg-image"
                  :src="bgImage"
                  alt="IA Structure background"
                />
                <div class="ia-overlay" />
                <div class="ia-structure">
                  <p class="ia-title">IA Structure Example</p>
                  <div class="ia-column-grid">
                    <article
                      v-for="column in iaTreeColumns"
                      :key="column.title"
                      class="ia-column"
                    >
                      <h3>{{ column.title }}</h3>
                      <div
                        v-for="branch in getIaBranches(column.branchIndexes)"
                        :key="branch.title"
                        class="ia-tree-branch"
                      >
                        <p class="ia-root-node">{{ branch.title }}</p>
                        <ul class="ia-child-list">
                          <li
                            v-for="node in branch.nodes"
                            :key="`${branch.title}-${node.label}`"
                            class="ia-child-item"
                          >
                            <p class="ia-node-label">{{ node.label }}</p>
                            <div class="ia-leaf-wrap">
                              <span v-if="node.detail" class="ia-leaf">{{ node.detail }}</span>
                              <span
                                v-for="subItem in node.items || []"
                                :key="subItem"
                                class="ia-leaf"
                              >
                                {{ subItem }}
                              </span>
                            </div>
                          </li>
                        </ul>
                      </div>
                    </article>
                  </div>
                </div>
              </section>
          </template>
        </div>

        <section v-if="project04" class="project04-showcase" data-reveal>
          <div class="project04-grid">
            <div class="project04-copy">
              <p class="scene-kicker">PROJECTS · ~{{ project04.period }}</p>
              <h3>{{ project04.name }}</h3>
              <p class="paragraph">{{ project04.description }}</p>
            </div>

            <div class="project04-slider">
              <div class="project04-slider-window">
                <div
                  class="project04-slider-track"
                  :style="{ transform: `translateX(-${project04CurrentIndex * 100}%)` }"
                >
                  <article
                    v-for="(slide, slideIndex) in project04Slides"
                    :key="`project04-slide-${slideIndex}`"
                    class="project04-slide"
                  >
                    <figure class="project04-visual">
                      <img
                        v-if="getProject04SlideImage(slide)"
                        :src="getProject04SlideImage(slide)"
                        :alt="slide.title"
                        loading="lazy"
                      />
                      <div v-else class="project04-placeholder">
                        <strong>{{ slide.title }}</strong>
                        <p>기획서 이미지 삽입 예정</p>
                      </div>
                    </figure>
                    <div class="project04-meta">
                      <p class="mini-head">{{ slide.title }}</p>
                      <p>{{ slide.caption }}</p>
                    </div>
                  </article>
                </div>
              </div>

              <div class="project04-controls">
                <div class="project04-progress">
                  <button
                    v-for="(slide, idx) in project04Slides"
                    :key="`project04-step-${idx}`"
                    type="button"
                    class="project04-step"
                    :class="{ active: project04CurrentIndex === idx }"
                    :aria-label="`${idx + 1}번 슬라이드`"
                    @click="setProject04Slide(idx); restartProject04Timer()"
                  >
                    <span
                      class="step-fill"
                      :style="{
                        width: `${idx < project04CurrentIndex ? 100 : idx === project04CurrentIndex ? project04Progress : 0}%`,
                      }"
                    />
                    <span class="step-number">{{ idx + 1 }}.</span>
                    <span class="step-label">{{ slide.navLabel || slide.caption }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </section>

      <section class="section deep">
        <div class="container">
          <div class="section-head" data-reveal>
            <p class="section-label">{{ portfolio.process.label }}</p>
            <h2>{{ portfolio.process.title }}</h2>
          </div>

          <div class="process-grid">
            <article
              v-for="step in portfolio.process.steps"
              :key="step.name"
              class="panel process-card"
              data-reveal
            >
              <h3>{{ step.name }}</h3>
              <p>{{ step.detail }}</p>
            </article>
          </div>
        </div>
      </section>

      <section id="archive" class="section">
        <div class="container">
          <div class="section-head" data-reveal>
            <p class="section-label">{{ portfolio.archive.label }}</p>
            <h2>{{ portfolio.archive.title }}</h2>
            <p class="section-desc">{{ portfolio.archive.description }}</p>
          </div>

          <div class="archive-group" data-reveal>
            <h3>{{ portfolio.archive.contentGroupTitle }}</h3>
            <div class="archive-grid">
              <article
                v-for="item in portfolio.archive.contents"
                :key="`content-${item.contentId}`"
                class="panel archive-card"
              >
                <figure v-if="getItemImage(item)" class="archive-thumb">
                  <img :src="getItemImage(item)" :alt="`${item.title} thumbnail`" loading="lazy" />
                </figure>
                <p class="mini-head">{{ item.time }}</p>
                <h3>{{ item.title }}</h3>
                <p class="paragraph">{{ item.summary }}</p>
                <p class="archive-meta">참여도 {{ item.party }}</p>
                <a
                  v-if="getItemLink(item)"
                  :href="getItemLink(item)"
                  class="archive-link"
                  target="_blank"
                  rel="noreferrer"
                >
                  콘텐츠 보기
                </a>
              </article>
            </div>
          </div>

          <div
            v-for="group in portfolio.archive.projectGroups"
            :key="group.name"
            class="archive-group"
            data-reveal
          >
            <h3>{{ group.name }}</h3>
            <div class="archive-grid">
              <article v-for="item in group.items" :key="item.title" class="panel archive-card">
                <figure v-if="getItemImage(item)" class="archive-thumb">
                  <img :src="getItemImage(item)" :alt="`${item.title} thumbnail`" loading="lazy" />
                </figure>
                <p class="mini-head">{{ item.time }}</p>
                <h3>{{ item.title }}</h3>
                <p class="paragraph">{{ item.content }}</p>
                <p class="archive-meta">{{ item.tag }} · 참여도 {{ item.party }}</p>
                <a
                  v-if="getItemLink(item)"
                  :href="getItemLink(item)"
                  class="archive-link"
                  target="_blank"
                  rel="noreferrer"
                >
                  프로젝트 링크
                </a>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" class="section closing">
        <picture>
        <source media="(min-width: 64.1rem)" :srcset="bg00Gif">
        <source media="(max-width: 64rem)" :srcset="bg00Gif">
        <img :src="bg00Gif" alt="" loading="lazy">
      </picture>
        <div class="container closing-wrap" data-reveal>
          <p class="section-label">LET'S BUILD TOGETHER</p>
          <h2>{{ portfolio.closing.title }}</h2>
          <p class="section-desc">{{ portfolio.closing.description }}</p>
          <div class="contact-grid">
            <article v-for="contact in portfolio.closing.contacts" :key="contact.label" class="panel">
              <p class="mini-head">{{ contact.label }}</p>
              <p>{{ contact.value }}</p>
            </article>
          </div>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <p class="footer-copy">{{ new Date().getFullYear() }}. 0{{ new Date().getMonth() + 1 }}. AI 서비스 전략 기획 황승현.</p>
    </footer>

    <button
      v-show="showTopButton"
      type="button"
      class="top-btn"
      aria-label="페이지 상단으로 이동"
      @click="scrollToTop"
    >
      TOP
    </button>
  </div>
</template>

