export interface SearchResult {
  metadata: {
    chunk: number;
    source: string;
    embedded_at: string;
  };
  similarity: number;
  text: string;
}
