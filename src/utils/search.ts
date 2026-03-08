import MiniSearch from "minisearch";

interface FileContent {
  path: string;
  name: string;
  content: string;
}

export const miniSearch = new MiniSearch({
  fields: ["title", "content"], // fields to index for full-text search
  storeFields: ["title", "path", "content"], // fields to return with search results
  searchOptions: {
    boost: { title: 2 }, // boost title matches
    fuzzy: 0.2, // fuzzy matching
    prefix: true, // prefix matching
  },
  idField: "path", // use file path as unique ID
});

// 事件总线，用于通知搜索结果更新
type SearchListener = () => void;
const listeners: SearchListener[] = [];

export function subscribeToSearch(listener: SearchListener) {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
}

function notifyListeners() {
  [...listeners].forEach((listener) => {
    try {
      listener();
    } catch (error) {
      console.error("Error in search listener:", error);
    }
  });
}

export function indexFiles(files: FileContent[]) {
  miniSearch.removeAll();

  const docs = files.map((file) => ({
    path: file.path,
    title: file.name, // using filename as title for now
    content: file.content,
  }));

  miniSearch.addAll(docs);
  notifyListeners();
}

export function addOrUpdateFile(file: FileContent) {
  if (miniSearch.has(file.path)) {
    miniSearch.remove({ path: file.path });
  }

  miniSearch.add({
    path: file.path,
    title: file.name,
    content: file.content,
  });
  notifyListeners();
}

export function removeFile(path: string) {
  if (miniSearch.has(path)) {
    miniSearch.remove({ path });
  }
  notifyListeners();
}

export function search(query: string) {
  return miniSearch.search(query, {
    prefix: true,
    fuzzy: 0.5,
    boost: { title: 2 },
  });
}
