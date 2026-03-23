import { Inject, Injectable } from "@nestjs/common";
import OpenAI from "openai";

import { RagService } from "../rag/rag.service.js";
import { ChatRequestDto } from "./chat.dto.js";

type Message = {
  role: "user" | "assistant";
  content: string;
};

@Injectable()
export class ChatService {
  private readonly openai = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

  constructor(@Inject(RagService) private readonly ragService: RagService) {}

  isLlmEnabled() {
    return Boolean(this.openai);
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
}
