import { readFileSync } from "node:fs";
import { Inject, Injectable } from "@nestjs/common";
import OpenAI from "openai";

import { RagService } from "../rag/rag.service.js";
import { ChatRequestDto } from "./chat.dto.js";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type PortfolioData = Record<string, any>;

type ProjectCardLink = {
  label: string;
  url: string;
};

type ProjectCard = {
  id: string;
  title: string;
  subtitle?: string;
  summary: string;
  period?: string;
  tags: string[];
  thumbnailUrl?: string;
  slides?: string[];
  links: ProjectCardLink[];
};

type ProjectCatalogItem = ProjectCard & {
  featured?: boolean;
  isAi?: boolean;
  searchText: string;
};

type PeopleCard = {
  id: string;
  label: string;
  imageUrl?: string;
};

const portfolioData = readJson<PortfolioData>(new URL("../../../src/data/portfolio.json", import.meta.url));
const projectCatalog = buildProjectCatalog(portfolioData);
const peopleGallery = buildPeopleGallery();

@Injectable()
export class ChatService {
  private readonly limitExceededMessage =
    "질문횟수가 초과되었습니다. 지원자가 더 궁금하시다면 면접장에서 황승현 지원자의 역량을 확인해주세요!";
  private readonly openai = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

  constructor(@Inject(RagService) private readonly ragService: RagService) {}

  isLlmEnabled() {
    return Boolean(this.openai);
  }

  buildLimitExceededResponse() {
    return {
      answer: this.limitExceededMessage,
      intent: "limit",
      citations: [],
      relatedQuestions: [],
      projectCards: [],
      peopleCards: [],
      llmEnabled: this.isLlmEnabled(),
    };
  }

  async answer(body: ChatRequestDto) {
    const retrieval = this.ragService.retrieve(body.question);
    const history = (body.history || []).slice(-6);
    const answer = this.openai
      ? await this.generateWithOpenAI(body.question, history, retrieval)
      : this.generateFallback(body.question, retrieval);

    return {
      answer,
      intent: retrieval.intent,
      citations: retrieval.topChunks.map((chunk) => ({
        id: chunk.id,
        title: chunk.title,
        category: chunk.category,
      })),
      relatedQuestions: retrieval.relatedQuestions,
      projectCards: this.buildProjectCards(body.question, retrieval.intent),
      peopleCards: this.buildPeopleCards(body.question),
      llmEnabled: this.isLlmEnabled(),
    };
  }

  private async generateWithOpenAI(question: string, history: Message[], retrieval: ReturnType<RagService["retrieve"]>) {
    const contextBlock = retrieval.topChunks
      .map((chunk, index) => {
        return `[문맥 ${index + 1}] ${chunk.title}\n카테고리: ${chunk.category}\n내용: ${chunk.content}`;
      })
      .join("\n\n");

    const completion = await this.openai!.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      temperature: 0.5,
      messages: [
        {
          role: "system",
          content: retrieval.systemPrompt,
        },
        {
          role: "system",
          content: [
            `감지된 질문 의도: ${retrieval.intent}`,
            "아래 문맥만을 근거로 황승현 지원자에 대한 답변을 작성합니다.",
            "문맥에 없는 내용은 추측하지 말고, 확인 가능한 범위로만 표현합니다.",
            "면접관 질문이라면 지원자의 강점과 실제 프로젝트/성과를 연결해 답변합니다.",
            "인사말 또는 첫 질문에는 '황승현 지원자 인터뷰 답변 도우미입니다.'라는 표현을 우선 사용합니다.",
            "'황승현 지원자님' 또는 '어떻게 도와드릴까요?' 같은 표현은 사용하지 않습니다.",
            contextBlock,
          ].join("\n\n"),
        },
        ...history.map((item) => ({
          role: item.role,
          content: item.content,
        })),
        {
          role: "user",
          content: question,
        },
      ],
    });

    return completion.choices[0]?.message?.content?.trim() || this.generateFallback(question, retrieval);
  }

  private generateFallback(question: string, retrieval: ReturnType<RagService["retrieve"]>) {
    const leadChunk = retrieval.topChunks[0];
    const supporting = retrieval.topChunks.slice(1, 3).map((chunk) => chunk.content).join(" ");
    const opening =
      retrieval.intent === "motivation"
        ? "황승현 지원자는 기술 자체보다 사용자의 행동 변화와 비즈니스 실행력을 만드는 AI 서비스를 지향합니다."
        : retrieval.intent === "strength"
          ? "황승현 지원자의 가장 큰 강점은 문제 구조화부터 프로토타이핑, MVP 검증, 운영 고도화까지 직접 연결하는 실행형 기획 역량입니다."
          : retrieval.intent === "project"
            ? "질문하신 주제와 가장 가까운 프로젝트를 기준으로 정리드리면 다음과 같습니다."
            : "황승현 지원자 관점에서 정리드리면 다음과 같습니다.";

    return [
      opening,
      leadChunk?.content || "현재 질문과 가장 직접적으로 연결되는 지식 조각을 찾지 못했지만, 포트폴리오 전반에서는 AI/AX 서비스 기획과 실행 경험이 핵심 강점으로 정리되어 있습니다.",
      supporting || "",
      `질문 의도는 "${question}"에 대한 지원자 적합성/경험 확인으로 이해했습니다. 더 구체적으로 원하시면 특정 프로젝트, 강점, 기술 이해도, 협업 방식 중 하나로 좁혀서 다시 물어보셔도 됩니다.`,
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  private buildProjectCards(question: string, intent: string) {
    const normalizedQuestion = normalize(question);
    const aiFocused = isAiFocusedQuestion(normalizedQuestion);
    const broadProjectQuery = isBroadProjectQuery(normalizedQuestion, intent);

    const ranked = projectCatalog
      .map((card) => ({
        ...card,
        score: scoreProjectCard(card, normalizedQuestion, intent, aiFocused),
      }))
      .sort((a, b) => b.score - a.score);

    const topScore = ranked[0]?.score ?? 0;
    const shouldShowCards =
      intent === "project" || isProjectQuestion(normalizedQuestion) || aiFocused || topScore >= 6;

    if (!shouldShowCards) {
      return [];
    }

    if (aiFocused) {
      const aiCards = ranked.filter((card) => card.score > 0 && card.isAi).slice(0, 8);
      const fallbackAiCards = projectCatalog.filter((card) => card.isAi).slice(0, 8);
      return (aiCards.length ? aiCards : fallbackAiCards).map(({ featured, isAi, searchText, ...card }) => card);
    }

    if (broadProjectQuery) {
      return [...projectCatalog]
        .sort((a, b) => Number(a.featured) - Number(b.featured))
        .map(({ featured, isAi, searchText, ...card }) => card);
    }

    const selected = ranked.filter((card) => card.score > 0).slice(0, 4);
    const fallbackCards =
      intent === "project"
        ? projectCatalog.filter((card) => card.featured || card.isAi).slice(0, 4)
        : [];

    return (selected.length ? selected : fallbackCards).map(({ featured, isAi, searchText, ...card }) => card);
  }

  private buildPeopleCards(question: string) {
    const normalizedQuestion = normalize(question);
    if (!shouldShowPeopleGallery(normalizedQuestion)) {
      return [];
    }

    return peopleGallery;
  }
}

function buildProjectCatalog(portfolio: PortfolioData): ProjectCatalogItem[] {
  const referenceCards = (portfolio?.references?.items || []).map((item: Record<string, any>) => {
    const id = getReferenceCardId(item.name);
    const links = getReferenceLinks(id);
    const tags = uniqueStrings([
      "프로젝트",
      "대표 사례",
      ...(isAiText(`${item.name} ${item.problem} ${item.solution}`) ? ["AI"] : []),
      ...extractTags(item.name),
      ...extractTags(item.solution),
    ]);

    return {
      id,
      title: item.name,
      subtitle: "대표 AI 프로젝트",
      summary: item.solution || item.problem || "",
      period: item.period || "",
      tags,
      links,
      featured: true,
      isAi: true,
      searchText: normalize([item.name, item.problem, item.solution, ...(item.impact || []), ...tags].join(" ")),
    };
  });

  const archiveCards = (portfolio?.archive?.portfolios || []).map((item: Record<string, any>) => {
    const tags = uniqueStrings([
      "프로젝트",
      ...extractTags(item.tag),
      ...extractTags(item.title),
      ...extractTags(item.content),
      ...extractTags(item.sub),
    ]);
    const links = [
      item.url ? { label: "서비스 보기", url: item.url } : null,
      item.articles ? { label: "관련 링크", url: item.articles } : null,
    ].filter(Boolean) as ProjectCardLink[];

    return {
      id: `archive-${slugify(item.title || item.sub || item.time || "")}`,
      title: item.title || "프로젝트",
      subtitle: item.sub || item.target || "",
      summary: item.content || item.sub || "",
      period: item.time || "",
      tags,
      thumbnailUrl: item.image || "",
      slides: toArray(item.innerImage),
      links,
      featured: false,
      isAi: isAiText([item.title, item.content, item.sub, item.tag].join(" ")),
      searchText: normalize(
        [
          item.title,
          item.sub,
          item.content,
          item.target,
          item.language,
          item.time,
          item.tag,
          item.things,
          ...(item.part || []).map((part: Record<string, any>) => Object.values(part).join(" ")),
          ...tags,
        ].join(" ")
      ),
    };
  });

  return [...referenceCards, ...archiveCards];
}

function buildPeopleGallery(): PeopleCard[] {
  return Array.from({ length: 8 }, (_, index) => ({
    id: `with-colleague-${index + 1}`,
    label: `협업 사진 ${index + 1}`,
  }));
}

function scoreProjectCard(card: ProjectCatalogItem, normalizedQuestion: string, intent: string, aiFocused: boolean) {
  const tokens = tokenize(normalizedQuestion);
  const titleText = normalize(card.title);
  const subtitleText = normalize(card.subtitle || "");
  const summaryText = normalize(card.summary);
  const tagsText = normalize(card.tags.join(" "));

  let score = card.featured ? 1 : 0;

  if (intent === "project") score += card.featured ? 5 : 2;
  if (aiFocused && card.isAi) score += 7;

  for (const token of tokens) {
    if (titleText.includes(token)) score += 6;
    if (subtitleText.includes(token)) score += 3;
    if (tagsText.includes(token)) score += 4;
    if (summaryText.includes(token)) score += 2;
    if (card.searchText.includes(token)) score += 1;
  }

  if (includesAny(normalizedQuestion, ["엠파크", "m park", "mpark"]) && card.searchText.includes("엠파크")) {
    score += 4;
  }
  if (includesAny(normalizedQuestion, ["동화기업", "dongwha"]) && card.searchText.includes("동화기업")) {
    score += 4;
  }
  if (includesAny(normalizedQuestion, ["아이템베이", "itembay"]) && card.searchText.includes("아이템베이")) {
    score += 4;
  }

  return score;
}

function isProjectQuestion(normalizedQuestion: string) {
  return includesAny(normalizedQuestion, [
    "프로젝트",
    "과업",
    "레퍼런스",
    "사례",
    "작업",
    "구축",
    "고도화",
    "운영",
    "런칭",
    "포트폴리오",
  ]);
}

function isAiFocusedQuestion(normalizedQuestion: string) {
  return includesAny(normalizedQuestion, [
    "ai만",
    "ai 프로젝트",
    "ai 관련",
    "rag",
    "llm",
    "agent",
    "automation",
    "자동화",
    "생성형",
    "ai",
  ]);
}

function shouldShowPeopleGallery(normalizedQuestion: string) {
  return includesAny(normalizedQuestion, ["동료", "함께한", "협업 사진", "팀원", "with colleagues"]);
}

function isBroadProjectQuery(normalizedQuestion: string, intent: string) {
  if (!(intent === "project" || isProjectQuestion(normalizedQuestion))) {
    return false;
  }

  return !hasSpecificProjectSignals(normalizedQuestion);
}

function getReferenceCardId(name: string) {
  const normalizedName = normalize(name);
  if (normalizedName.includes("dw brain")) return "reference-dw-brain";
  if (normalizedName.includes("파노라마")) return "reference-panorama";
  if (normalizedName.includes("카메이트")) return "reference-carmate";
  if (normalizedName.includes("daop")) return "reference-daop";
  return `reference-${slugify(name)}`;
}

function getReferenceLinks(id: string): ProjectCardLink[] {
  const linkMap: Record<string, ProjectCardLink[]> = {
    "reference-dw-brain": [
      { label: "MVP 보기", url: "https://web.jck40cggccckkkoo4844c44o.54.66.155.158.sslip.io/" },
    ],
    "reference-daop": [{ label: "MVP 보기", url: "https://daop.netlify.app/" }],
  };

  return linkMap[id] || [];
}

function extractTags(value: string) {
  return String(value || "")
    .split(/[\s,/]+/g)
    .map((item) => item.replace(/^#+/, "").trim())
    .filter(Boolean);
}

function toArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).map((item) => String(item));
  }

  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  return [];
}

function isAiText(value: string) {
  return /(^|\s)(ai|rag|llm|agent|automation)(\s|$)|자동화|생성형/iu.test(String(value || ""));
}

function includesAny(value: string, keywords: string[]) {
  return keywords.some((keyword) => value.includes(normalize(keyword)));
}

function hasSpecificProjectSignals(normalizedQuestion: string) {
  const genericTokens = new Set([
    "이",
    "그",
    "저",
    "사람",
    "지원자",
    "프로젝트",
    "과업",
    "결과물",
    "포트폴리오",
    "작업",
    "관련",
    "보여줘",
    "보여주",
    "알려줘",
    "알려주",
    "정리해줘",
    "정리",
    "설명해줘",
    "설명",
    "한",
    "했던",
    "여태",
    "전체",
    "다",
    "모두",
    "관련된",
    "것",
  ]);

  return tokenize(normalizedQuestion).some((token) => !genericTokens.has(token));
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

function normalize(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value: string) {
  return normalize(value).replace(/\s+/g, "-");
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function readJson<T>(url: URL) {
  return JSON.parse(readFileSync(url, "utf-8")) as T;
}
