import { GoogleGenAI } from "@google/genai";
import { Message, ModelId, Role } from "../types";

const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 15;
const MAX_CONCURRENT_REQUESTS = 2;

const recentRequestTimestamps: number[] = [];
let activeRequests = 0;

export function getRateLimitState() {
  const now = Date.now();
  const recent = recentRequestTimestamps.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS);

  return {
    activeRequests,
    maxConcurrentRequests: MAX_CONCURRENT_REQUESTS,
    requestCount: recent.length,
    maxRequestsPerWindow: MAX_REQUESTS_PER_WINDOW,
    windowMs: RATE_LIMIT_WINDOW_MS,
  };
}

export async function waitForRateLimit() {
  while (true) {
    const now = Date.now();
    const recent = recentRequestTimestamps.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS);
    recentRequestTimestamps.length = 0;
    recentRequestTimestamps.push(...recent);

    if (recent.length < MAX_REQUESTS_PER_WINDOW && activeRequests < MAX_CONCURRENT_REQUESTS) {
      recentRequestTimestamps.push(now);
      activeRequests += 1;
      return;
    }

    const waitTime = recent.length >= MAX_REQUESTS_PER_WINDOW
      ? Math.max(250, RATE_LIMIT_WINDOW_MS - (now - recent[0]) + 50)
      : 300;

    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export async function* sendMessageStream(
  messages: Message[],
  modelId: ModelId,
  systemInstruction?: string
) {
  await waitForRateLimit();

  try {
    const contents = messages.map(msg => ({
      role: msg.role === Role.USER ? "user" : "model",
      parts: msg.parts.map(part => {
        if (part.text) return { text: part.text };
        if (part.inlineData) {
          return {
            inlineData: {
              mimeType: part.inlineData.mimeType,
              data: part.inlineData.data,
            },
          };
        }
        return { text: "" };
      }),
    }));

    const stream = await ai.models.generateContentStream({
      model: modelId,
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    for await (const chunk of stream) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } finally {
    activeRequests = Math.max(0, activeRequests - 1);
  }
}
