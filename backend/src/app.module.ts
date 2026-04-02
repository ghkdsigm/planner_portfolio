import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { ChatController } from "./chat/chat.controller.js";
import { ChatLimitService } from "./chat/chat-limit.service.js";
import { ChatService } from "./chat/chat.service.js";
import { RagService } from "./rag/rag.service.js";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [ChatController],
  providers: [ChatService, ChatLimitService, RagService],
})
export class AppModule {}
