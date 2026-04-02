import { Injectable } from "@nestjs/common";

type RequestLike = {
  ip?: string;
  headers?: Record<string, string | string[] | undefined>;
  socket?: {
    remoteAddress?: string;
  };
};

@Injectable()
export class ChatLimitService {
  private readonly usageByIp = new Map<string, number>();
  private readonly maxQuestionsPerIp = Math.max(1, Number(process.env.CHAT_IP_LIMIT || 5));

  getClientIp(request: RequestLike) {
    const forwarded = this.readForwardedIp(request.headers?.["x-forwarded-for"]);
    const ip = forwarded || request.ip || request.socket?.remoteAddress || "unknown";
    return this.normalizeIp(ip);
  }

  isLimitExceeded(ip: string) {
    return this.getUsageCount(ip) >= this.maxQuestionsPerIp;
  }

  recordUsage(ip: string) {
    const normalizedIp = this.normalizeIp(ip);
    const nextCount = this.getUsageCount(normalizedIp) + 1;
    this.usageByIp.set(normalizedIp, nextCount);
    return nextCount;
  }

  private getUsageCount(ip: string) {
    return this.usageByIp.get(this.normalizeIp(ip)) || 0;
  }

  private readForwardedIp(value?: string | string[]) {
    const raw = Array.isArray(value) ? value[0] : value;
    return raw?.split(",")[0]?.trim();
  }

  private normalizeIp(ip: string) {
    if (!ip) return "unknown";
    if (ip === "::1") return "127.0.0.1";
    if (ip.startsWith("::ffff:")) return ip.slice(7);
    return ip;
  }
}
