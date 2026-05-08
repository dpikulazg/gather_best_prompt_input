export enum Role {
  USER = 'user',
  BOT = 'bot'
}

export interface MessagePart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export interface Message {
  id: string;
  role: Role;
  parts: MessagePart[];
  timestamp: number;
}

export enum ModelId {
  FLASH = 'gemini-3-flash-preview',
  PRO = 'gemini-3.1-pro-preview'
}

export interface ChatSettings {
  modelId: ModelId;
  systemInstruction: string;
  temperature: number;
}
