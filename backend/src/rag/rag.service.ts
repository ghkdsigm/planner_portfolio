import { readFileSync } from "node:fs";
import { Injectable } from "@nestjs/common";

type SourceChunk = {
  id: string;
  title: string;
  category: string;
  tags?: string[];
  intent?: string;
  questionHints?: string[];
  priority?: number;
  content: string;
};

type IntentRule = {
  id: string;
  description: string;
  keywords: string[];
};

type KnowledgeBase = {
  candidate: {
    name: string;
    englishName: string;
    role: string;
    headline: string;
    positioning: string;
    tone: string[];
    guardrails: string[];
  };
  intentRules: IntentRule[];
  sampleQuestions: string[];
  chunks: SourceChunk[];
};

type PortfolioData = Record<string, any>;

export type RetrievedChunk = SourceChunk & {
  score: number;
};

export type RetrievalResult = {
  intent: string;
  rewrittenQuestion: string;
  topChunks: RetrievedChunk[];
  relatedQuestions: string[];
  systemPrompt: string;
};

const manualKb = readJson<KnowledgeBase>(new URL("../data/portfolio-rag.json", import.meta.url));
const portfolioData = readJson<PortfolioData>(new URL("../../../src/data/portfolio.json", import.meta.url));

const kb: KnowledgeBase = {
  ...manualKb,
  sampleQuestions: uniqueStrings([
    ...manualKb.sampleQuestions,
    ...buildPortfolioSampleQuestions(portfolioData),
  ]),
  chunks: dedupeChunksById([
    ...manualKb.chunks,
    ...buildPortfolioChunks(portfolioData),
  ]),
};

@Injectable()
export class RagService {
  private readonly intentRules = kb.intentRules;
  private readonly sampleQuestions = kb.sampleQuestions;
  private readonly chunks = kb.chunks.map((chunk) => ({
    ...chunk,
    priority: chunk.priority ?? 1,
    tags: chunk.tags ?? [],
    questionHints: chunk.questionHints ?? [],
  }));

  getSystemPrompt() {
    return [
      `${kb.candidate.name}(${kb.candidate.englishName}) 지원자 전용 AI 면접/포트폴리오 도우미입니다.`,
      `지원자의 포지셔닝: ${kb.candidate.positioning}`,
      `답변 톤: ${kb.candidate.tone.join(", ")}`,
      "규칙:",
      ...kb.candidate.guardrails.map((rule) => `- ${rule}`),
      "- 답변은 한국어로 작성합니다.",
      "- 가능하면 핵심 결론 -> 근거 -> 예시 순으로 답변합니다.",
    ].join("\n");
  }

  retrieve(question: string): RetrievalResult {
    const normalizedQuestion = normalize(question);
    const intent = this.detectIntent(normalizedQuestion);
    const topChunks = this.rankChunks(normalizedQuestion, intent).slice(0, 4);
    const relatedQuestions = this.sampleQuestions
      .filter((item) => item !== question)
      .filter((item) => {
        const tokens = tokenize(item);
        return tokens.some((token) => normalizedQuestion.includes(token));
      })
      .slice(0, 3);

    return {
      intent,
      rewrittenQuestion: normalizedQuestion,
      topChunks,
      relatedQuestions: relatedQuestions.length ? relatedQuestions : this.sampleQuestions.slice(0, 3),
      systemPrompt: this.getSystemPrompt(),
    };
  }

  private detectIntent(question: string) {
    let bestIntent = "general";
    let bestScore = -1;

    for (const rule of this.intentRules) {
      const score = rule.keywords.reduce((acc, keyword) => {
        return acc + (question.includes(normalize(keyword)) ? 1 : 0);
      }, 0);

      if (score > bestScore) {
        bestScore = score;
        bestIntent = rule.id;
      }
    }

    return bestIntent;
  }

  private rankChunks(question: string, intent: string) {
    const questionTokens = tokenize(question);

    return this.chunks
      .map((chunk) => {
        const titleText = normalize(chunk.title);
        const contentText = normalize(chunk.content);
        const tagsText = normalize((chunk.tags || []).join(" "));
        const hintsText = normalize((chunk.questionHints || []).join(" "));

        let score = Number(chunk.priority || 1);

        for (const token of questionTokens) {
          if (titleText.includes(token)) score += 6;
          if (tagsText.includes(token)) score += 4;
          if (hintsText.includes(token)) score += 3;
          if (contentText.includes(token)) score += 1.2;
        }

        if (chunk.intent === intent) {
          score += 5;
        }

        return {
          ...chunk,
          score,
        };
      })
      .sort((a, b) => b.score - a.score);
  }
}

function normalize(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string) {
  return Array.from(
    new Set(
      normalize(value)
        .split(" ")
        .filter((token) => token.length >= 2)
    )
  );
}

function readJson<T>(url: URL) {
  return JSON.parse(readFileSync(url, "utf-8")) as T;
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function dedupeChunksById(chunks: SourceChunk[]) {
  const seen = new Set<string>();
  return chunks.filter((chunk) => {
    if (!chunk?.id || seen.has(chunk.id)) return false;
    seen.add(chunk.id);
    return true;
  });
}

function stripHtml(value: string) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function joinList(values: unknown[]) {
  return (values || [])
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .join(", ");
}

function buildPortfolioSampleQuestions(portfolio: PortfolioData) {
  const questions = [
    "포트폴리오 핵심 소개를 요약해 주세요.",
    "보유 역량과 스킬셋을 설명해 주세요.",
    "커리어 타임라인을 요약해 주세요.",
    "대표 AI 프로젝트를 비교해 주세요.",
    "업무 프로세스와 일하는 방식을 설명해 주세요.",
  ];

  if (portfolio?.archive?.projectGroups?.length) {
    questions.push("과거 수행 프로젝트와 아카이브까지 요약해 주세요.");
  }

  return questions;
}

function buildPortfolioChunks(portfolio: PortfolioData): SourceChunk[] {
  const chunks: SourceChunk[] = [];
  const meta = portfolio?.meta || {};
  const hero = portfolio?.hero || {};
  const about = portfolio?.about || {};
  const skills = portfolio?.skills || {};
  const research = portfolio?.research || {};
  const career = portfolio?.career || {};
  const references = portfolio?.references || {};
  const process = portfolio?.process || {};
  const closing = portfolio?.closing || {};
  const archive = portfolio?.archive || {};

  chunks.push({
    id: "portfolio-meta-summary",
    title: "포트폴리오 메타 요약",
    category: "portfolio",
    intent: "strength",
    tags: ["포트폴리오", "자기소개", meta.nameKo, meta.role],
    questionHints: ["자기소개", "포트폴리오 요약", "한 줄 소개", "지원자 소개"],
    priority: 5,
    content: `${meta.nameKo}(${meta.nameEn})은 ${meta.role}로, ${meta.headline} ${meta.subline || ""}`.trim(),
  });

  chunks.push({
    id: "portfolio-hero-summary",
    title: "히어로 메시지와 대표 수치",
    category: "portfolio",
    intent: "strength",
    tags: ["hero", "성과", "프로토타입", "ai 기능"],
    questionHints: ["대표 수치", "핵심 성과", "포트폴리오 첫 소개"],
    priority: 4,
    content: [
      stripHtml(hero.description),
      `주요 수치: ${(hero.stats || [])
        .map((stat: Record<string, unknown>) => `${stat.label} ${stat.value}`)
        .join(", ")}`,
    ]
      .filter(Boolean)
      .join(" "),
  });

  chunks.push({
    id: "portfolio-about-summary",
    title: "ABOUT 요약",
    category: "portfolio",
    intent: "strength",
    tags: ["about", "가치", "problem structuring", "mvp delivery"],
    questionHints: ["어떤 관점을 가졌나", "일하는 철학", "about me"],
    priority: 4,
    content: `${about.title || ""} ${(about.paragraphs || []).map(stripHtml).join(" ")} 키워드: ${joinList(
      about.keywords || []
    )}`.trim(),
  });

  chunks.push({
    id: "portfolio-skills-summary",
    title: "스킬 그룹 요약",
    category: "skills",
    intent: "strength",
    tags: ["skills", "역량", "기획 전략", "ai 데이터", "프로덕트 실행"],
    questionHints: ["보유 스킬", "스킬셋", "역량 구성"],
    priority: 5,
    content: (skills.groups || [])
      .map((group: Record<string, unknown>) => `${group.name}: ${joinList(group.items as unknown[])}`)
      .join(" / "),
  });

  chunks.push({
    id: "portfolio-skill-metrics",
    title: "역량 지표 요약",
    category: "skills",
    intent: "strength",
    tags: ["skill metrics", "problem framing", "rapid prototyping"],
    questionHints: ["역량 수치", "강점 지표", "스코어"],
    priority: 4,
    content: (skills.meters || [])
      .map((meter: Record<string, unknown>) => `${meter.label} ${meter.score}%`)
      .join(", "),
  });

  if (research?.aiSurvey2025) {
    chunks.push({
      id: "portfolio-research-survey",
      title: "리서치 설문 핵심 요약",
      category: "research",
      intent: "project",
      tags: ["리서치", "설문", "자동화", "ai 도입"],
      questionHints: ["리서치 결과", "설문 결과", "인사이트"],
      priority: 4,
      content: [
        research.description,
        research.aiSurvey2025.executiveHeadline,
        joinList(research.aiSurvey2025.executivePoints || []),
        `주요 니즈: ${joinList(research.aiSurvey2025.needs || [])}`,
      ]
        .filter(Boolean)
        .join(" "),
    });
  }

  if (Array.isArray(research?.insightBlocks) && research.insightBlocks.length) {
    chunks.push({
      id: "portfolio-research-insight-blocks",
      title: "리서치 인사이트 블록 요약",
      category: "research",
      intent: "project",
      tags: ["리서치", "insight blocks", "도입장벽", "운영지표"],
      questionHints: ["정성 인사이트", "인터뷰 내용", "현업 의견"],
      priority: 3,
      content: research.insightBlocks
        .map(
          (block: Record<string, unknown>) =>
            `${block.tag}: ${block.headline} / ${block.accent} / 인터뷰: ${block.interview}`
        )
        .join(" "),
    });
  }

  if (Array.isArray(career?.timeline) && career.timeline.length) {
    chunks.push({
      id: "portfolio-career-summary",
      title: "커리어 타임라인 요약",
      category: "career",
      intent: "career",
      tags: ["career", "timeline", "엠파크", "동화기업"],
      questionHints: ["커리어 타임라인", "회사별 이력", "경력 요약"],
      priority: 5,
      content: career.timeline
        .map(
          (job: Record<string, unknown>) =>
            `${job.period} ${job.company} ${job.position}: ${job.summary} 주요 성과 ${joinList(job.highlights as unknown[])}`
        )
        .join(" "),
    });

    career.timeline.forEach((job: Record<string, unknown>, index: number) => {
      chunks.push({
        id: `portfolio-career-role-${index + 1}`,
        title: `커리어 상세: ${job.company}`,
        category: "career",
        intent: "career",
        tags: [String(job.company || ""), String(job.position || ""), "경력", "회사"],
        questionHints: [String(job.company || ""), "어떤 역할을 했나", "회사별 성과"],
        priority: 4,
        content: `${job.period} ${job.company}에서 ${job.position}로 근무하며 ${job.summary} 주요 하이라이트: ${joinList(
          job.highlights as unknown[]
        )}`,
      });
    });
  }

  if (Array.isArray(references?.items) && references.items.length) {
    chunks.push({
      id: "portfolio-reference-summary",
      title: "대표 AI 프로젝트 요약",
      category: "project",
      intent: "project",
      tags: ["references", "대표 프로젝트", "dw-brain", "carmate", "daop"],
      questionHints: ["대표 프로젝트 요약", "포트폴리오 대표 사례", "주요 프로젝트"],
      priority: 5,
      content: references.items
        .map(
          (item: Record<string, unknown>) =>
            `${item.name}(${item.period}) 문제: ${item.problem} 해결: ${item.solution} 성과: ${joinList(
              item.impact as unknown[]
            )}`
        )
        .join(" "),
    });

    references.items.forEach((item: Record<string, unknown>, index: number) => {
      chunks.push({
        id: `portfolio-reference-project-${index + 1}`,
        title: `포트폴리오 프로젝트: ${item.name}`,
        category: "project",
        intent: "project",
        tags: [String(item.name || ""), "프로젝트", String(item.period || "")],
        questionHints: [String(item.name || ""), "이 프로젝트 설명", "문제와 해결"],
        priority: 4,
        content: `${item.name} 프로젝트는 ${item.problem} 문제를 해결하기 위해 ${item.solution} 방향으로 설계되었고, 주요 성과는 ${joinList(
          item.impact as unknown[]
        )} 입니다.`,
      });
    });
  }

  if (Array.isArray(process?.steps) && process.steps.length) {
    chunks.push({
      id: "portfolio-process-summary",
      title: "업무 프로세스 요약",
      category: "process",
      intent: "technical",
      tags: ["process", "업무 방식", "mvp", "실험", "운영"],
      questionHints: ["일하는 방식", "업무 프로세스", "프로세스 설명"],
      priority: 5,
      content: `${process.description} 원칙: ${joinList(process.principles || [])}. 단계: ${process.steps
        .map((step: Record<string, unknown>) => `${step.phase} ${step.name} - ${step.detail}`)
        .join(" / ")}`,
    });
  }

  if (closing?.title || closing?.description) {
    chunks.push({
      id: "portfolio-closing-message",
      title: "마무리 메시지와 연락 정보",
      category: "portfolio",
      intent: "motivation",
      tags: ["closing", "연락", "message"],
      questionHints: ["마지막 메시지", "연락처", "클로징"],
      priority: 2,
      content: `${closing.title || ""} ${closing.description || ""} 연락처: ${(closing.contacts || [])
        .map((item: Record<string, unknown>) => `${item.label} ${item.value}`)
        .join(", ")}`.trim(),
    });
  }

  if (Array.isArray(archive?.projectGroups) && archive.projectGroups.length) {
    chunks.push({
      id: "portfolio-archive-summary",
      title: "프로젝트 아카이브 요약",
      category: "archive",
      intent: "career",
      tags: ["archive", "아카이브", "포트폴리오", "운영", "사이드프로젝트"],
      questionHints: ["아카이브 요약", "과거 프로젝트", "추가 경험"],
      priority: 3,
      content: `${stripHtml(archive.description || "")} 카테고리: ${archive.projectGroups
        .map((group: Record<string, unknown>) => `${group.name} ${Array.isArray(group.items) ? group.items.length : 0}건`)
        .join(", ")}`,
    });
  }

  return chunks.filter((chunk) => Boolean(chunk.content));
}
