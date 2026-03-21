import { WebrtcProvider } from "y-webrtc";
import * as Y from "yjs";

class CollabManager {
  private static instance: CollabManager;
  private cache = new Map<
    string,
    {
      doc: Y.Doc;
      provider: WebrtcProvider;
      refCount: number;
      timeout?: NodeJS.Timeout;
    }
  >();

  static getInstance() {
    if (!CollabManager.instance) {
      CollabManager.instance = new CollabManager();
    }
    return CollabManager.instance;
  }

  getRoom(roomName: string) {
    let entry = this.cache.get(roomName);
    if (entry) {
      if (entry.timeout) {
        clearTimeout(entry.timeout);
        entry.timeout = undefined;
      }
      entry.refCount++;
      return { doc: entry.doc, provider: entry.provider };
    }

    const doc = new Y.Doc();
    const provider = new WebrtcProvider(roomName, doc, {
      signaling: ["wss://zmark-signaling-server-production.up.railway.app"],
    });

    entry = { doc, provider, refCount: 1 };
    this.cache.set(roomName, entry);
    return { doc, provider };
  }

  releaseRoom(roomName: string) {
    const entry = this.cache.get(roomName);
    if (entry) {
      entry.refCount--;
      if (entry.refCount <= 0) {
        // 延迟销毁，给 React 和 Tiptap 充足的时间卸载旧的 editor 实例，
        // 避免出现 `Cannot read properties of undefined (reading 'doc')` 的错误。
        entry.timeout = setTimeout(() => {
          try {
            entry.provider.destroy();
            entry.doc.destroy();
          } catch (e) {
            console.error("Error destroying collab room", e);
          }
          this.cache.delete(roomName);
        }, 1000);
      }
    }
  }
}

export const collabManager = CollabManager.getInstance();
