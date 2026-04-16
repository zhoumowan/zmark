import type { ChatRole } from "@/consts/chat";

export interface KnowledgeBase {
  id: string;
  name: string;
  created_at: number;
}

export interface Document {
  id: string;
  kb_id: string;
  filename: string;
  content: string;
  created_at: number;
}

export interface RetrievedDocument {
  filename: string;
  content: string;
  similarity: number;
}

export interface ThinkingProcess {
  retrieved_docs: RetrievedDocument[];
}

export interface ChatMessage {
  role: ChatRole;
  content: string;
  thinking?: ThinkingProcess;
}

export interface ChatSession {
  id: string;
  kbId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

export interface ChatHistoryMessage {
  role: ChatRole;
  content: string;
}
