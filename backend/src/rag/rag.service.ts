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

const kb = JSON.parse(
  readFileSync(new URL("../data/portfolio-rag.json", import.meta.url), "utf-8")
) as KnowledgeBase;

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
