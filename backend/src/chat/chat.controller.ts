import { Body, Controller, Get, Inject, Post } from "@nestjs/common";

import { ChatRequestDto } from "./chat.dto.js";
import { ChatService } from "./chat.service.js";

@Controller()
export class ChatController {
  constructor(@Inject(ChatService) private readonly chatService: ChatService) {}

  @Get("health")
  getHealth() {
    return {
      ok: true,
      service: "portfolio-chat-backend",
      llmEnabled: this.chatService.isLlmEnabled(),
    };
  }

  @Post("chat")
  async chat(@Body() body: ChatRequestDto) {
    return this.chatService.answer(body);
  }
}
