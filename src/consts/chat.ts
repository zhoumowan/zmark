export const CHAT_ROLE = {
  USER: "user",
  ASSISTANT: "assistant",
} as const;

export type ChatRole = (typeof CHAT_ROLE)[keyof typeof CHAT_ROLE];
