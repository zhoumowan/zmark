import type { SearchResult } from "minisearch";

export interface FileContent {
  path: string;
  name: string;
  content: string;
}

export type SearchAction =
  | { type: "INDEX_FILES"; payload: FileContent[] }
  | { type: "ADD_OR_UPDATE_FILE"; payload: FileContent }
  | { type: "REMOVE_FILE"; payload: string }
  | { type: "SEARCH"; payload: { query: string; id: string } }
  | { type: "CLEAR_INDEX" };

export type SearchResponse =
  | { type: "SEARCH_RESULTS"; payload: { results: SearchResult[]; id: string } }
  | { type: "INDEX_UPDATED" }
  | { type: "ERROR"; payload: string };
