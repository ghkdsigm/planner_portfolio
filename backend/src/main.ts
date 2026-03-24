import "reflect-metadata";

import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: false,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN?.split(",").map((origin) => origin.trim()) || [
      "http://localhost:4000",
    ],
    credentials: false,
  });

  const port = Number(process.env.PORT || 3011);
  await app.listen(port);
  console.log(`Portfolio chat backend listening on http://localhost:${port}`);
}

bootstrap().catch((error) => {
  console.error("Failed to bootstrap Nest app", error);
  process.exit(1);
});
