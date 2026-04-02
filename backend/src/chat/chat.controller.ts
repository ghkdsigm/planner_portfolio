import { Body, Controller, Get, Inject, Post, Req } from "@nestjs/common";

import { ChatLimitService } from "./chat-limit.service.js";
import { ChatRequestDto } from "./chat.dto.js";
import { ChatService } from "./chat.service.js";

@Controller()
export class ChatController {
  constructor(
    @Inject(ChatService) private readonly chatService: ChatService,
    @Inject(ChatLimitService) private readonly chatLimitService: ChatLimitService
  ) {}

  @Get("health")
  getHealth() {
    return {
      ok: true,
      service: "portfolio-chat-backend",
      llmEnabled: this.chatService.isLlmEnabled(),
    };
  }

  @Post("chat")
  async chat(@Body() body: ChatRequestDto, @Req() request: { ip?: string; headers?: Record<string, string | string[]> }) {
    const clientIp = this.chatLimitService.getClientIp(request);
    if (this.chatLimitService.isLimitExceeded(clientIp)) {
      return this.chatService.buildLimitExceededResponse();
    }

    const response = await this.chatService.answer(body);
    this.chatLimitService.recordUsage(clientIp);
    return response;
  }
}
