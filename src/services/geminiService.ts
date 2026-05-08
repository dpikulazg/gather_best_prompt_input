import { GoogleGenAI } from "@google/genai";
import { Message, MessagePart, ModelId, Role } from "../types";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || '' 
});

export async function* sendMessageStream(
  messages: Message[],
  modelId: ModelId,
  systemInstruction?: string
) {
  // Convert our Message format to Gemini format
  const contents = messages.map(msg => ({
    role: msg.role === Role.USER ? 'user' : 'model',
    parts: msg.parts.map(part => {
      if (part.text) return { text: part.text };
      if (part.inlineData) return { 
        inlineData: { 
          mimeType: part.inlineData.mimeType, 
          data: part.inlineData.data 
        } 
      };
      return { text: '' };
    })
  }));

  const stream = await ai.models.generateContentStream({
    model: modelId,
    contents,
    config: {
      systemInstruction,
      temperature: 0.7,
    }
  });

  for await (const chunk of stream) {
    if (chunk.text) {
      yield chunk.text;
    }
  }
}
