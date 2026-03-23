import { Type } from "class-transformer";
import { IsArray, IsOptional, IsString, MaxLength, ValidateNested } from "class-validator";

export class ChatHistoryItemDto {
  @IsString()
  role!: "user" | "assistant";

  @IsString()
  @MaxLength(4000)
  content!: string;
}

export class ChatRequestDto {
  @IsString()
  @MaxLength(1000)
  question!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatHistoryItemDto)
  history?: ChatHistoryItemDto[];
}
