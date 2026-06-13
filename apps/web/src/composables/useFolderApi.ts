import type { FolderTreeNode, FolderChildrenResponse, FileSearchResult } from "@shared/types";

// In dev, "/api" is proxied to the local API server (see vite.config.ts).
// In production, set VITE_API_BASE to the deployed API URL (e.g. https://api.example.com).
const API_BASE = `${import.meta.env.VITE_API_BASE ?? ""}/api/v1/folders`;

export function useFolderApi() {
  async function getTree(): Promise<FolderTreeNode[]> {
    const res = await fetch(`${API_BASE}/tree`);
    if (!res.ok) throw new Error("Failed to load folder tree");
    return res.json();
  }

  async function getChildren(id: number): Promise<FolderChildrenResponse> {
    const res = await fetch(`${API_BASE}/${id}/children`);
    if (!res.ok) throw new Error("Failed to load folder children");
    return res.json();
  }

  async function searchFiles(query: string): Promise<FileSearchResult[]> {
    if (!query.trim()) return [];
    const res = await fetch(`${API_BASE}/files/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error("Failed to search files");
    return res.json();
  }

  return { getTree, getChildren, searchFiles };
}
