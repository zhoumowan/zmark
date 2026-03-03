import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CHAT_ROLE } from "@/consts/chat";
import type {
  ChatMessage,
  Document,
  KnowledgeBase,
  ThinkingProcess,
} from "@/types/kb";

interface KbState {
  currentKbId: string | null;
  knowledgeBases: KnowledgeBase[];
  documents: Document[];
  messages: ChatMessage[];
  isStreaming: boolean;
  apiKey: string;

  setApiKey: (key: string) => void;
  setCurrentKbId: (id: string | null) => void;
  fetchKnowledgeBases: () => Promise<void>;
  fetchDocuments: (kbId: string) => Promise<void>;
  createKnowledgeBase: (name: string) => Promise<void>;
  addDocument: (
    kbId: string,
    filename: string,
    content: string,
  ) => Promise<void>;
  deleteDocument: (docId: string) => Promise<void>;
  sendMessage: (question: string) => Promise<void>;
  clearMessages: () => void;
}

export const useKbStore = create<KbState>()(
  persist(
    (set, get) => ({
      currentKbId: null,
      knowledgeBases: [],
      documents: [],
      messages: [],
      isStreaming: false,
      apiKey: "",

      setApiKey: (apiKey) => set({ apiKey }),

      setCurrentKbId: (currentKbId) => {
        set({ currentKbId });
        if (currentKbId) {
          get().fetchDocuments(currentKbId);
        } else {
          set({ documents: [] });
        }
      },

      fetchKnowledgeBases: async () => {
        try {
          const kbs = await invoke<KnowledgeBase[]>("list_knowledge_bases");
          set({ knowledgeBases: kbs });
        } catch (error) {
          console.error("Failed to fetch knowledge bases:", error);
        }
      },

      fetchDocuments: async (kbId) => {
        try {
          const docs = await invoke<Document[]>("list_documents", { kbId });
          set({ documents: docs });
        } catch (error) {
          console.error("Failed to fetch documents:", error);
        }
      },

      createKnowledgeBase: async (name) => {
        try {
          const newKb = await invoke<KnowledgeBase>("create_knowledge_base", {
            name,
          });
          set((state) => ({
            knowledgeBases: [newKb, ...state.knowledgeBases],
            currentKbId: state.currentKbId || newKb.id,
          }));
        } catch (error) {
          console.error("Failed to create knowledge base:", error);
          throw error;
        }
      },

      addDocument: async (kbId, filename, content) => {
        try {
          const { apiKey } = get();
          if (!apiKey) throw new Error("API Key is required");
          const newDoc = await invoke<Document>("add_document", {
            kbId,
            filename,
            content,
            apiKey,
          });
          set((state) => ({
            documents: [newDoc, ...state.documents],
          }));
        } catch (error) {
          console.error("Failed to add document:", error);
          throw error;
        }
      },

      deleteDocument: async (docId) => {
        try {
          await invoke("delete_document", { docId });
          set((state) => ({
            documents: state.documents.filter((d) => d.id !== docId),
          }));
        } catch (error) {
          console.error("Failed to delete document:", error);
          throw error;
        }
      },

      sendMessage: async (question) => {
        const { currentKbId, apiKey, isStreaming } = get();
        if (!currentKbId || !apiKey || isStreaming) return;

        set((state) => ({
          messages: [
            ...state.messages,
            { role: CHAT_ROLE.USER, content: question },
            { role: CHAT_ROLE.ASSISTANT, content: "" },
          ],
          isStreaming: true,
        }));

        try {
          const unlistenThinking = await listen<ThinkingProcess>(
            "chat-thinking",
            (event) => {
              set((state) => {
                const newMessages = [...state.messages];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage && lastMessage.role === CHAT_ROLE.ASSISTANT) {
                  lastMessage.thinking = event.payload;
                }
                return { messages: newMessages };
              });
            },
          );

          const unlistenStream = await listen<string>(
            "chat-stream",
            (event) => {
              set((state) => {
                const newMessages = [...state.messages];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage && lastMessage.role === CHAT_ROLE.ASSISTANT) {
                  lastMessage.content += event.payload;
                }
                return { messages: newMessages };
              });
            },
          );

          const unlistenDone = await listen("chat-done", () => {
            set({ isStreaming: false });
            unlistenThinking();
            unlistenStream();
            unlistenDone();
          });

          await invoke("chat", {
            kbId: currentKbId,
            question,
            apiKey,
          });
        } catch (error) {
          console.error("Chat failed:", error);
          set({ isStreaming: false });
          throw error;
        }
      },

      clearMessages: () => set({ messages: [] }),
    }),
    {
      name: "kb-storage",
      partialize: (state) => ({ apiKey: state.apiKey }),
    },
  ),
);
