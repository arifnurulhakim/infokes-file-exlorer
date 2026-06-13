import type { FolderTreeNode, FolderChildrenResponse, FileSearchResult } from "@shared/types";
import { mockGetTree, mockGetChildren, mockSearchFiles } from "./mockData";

// In dev, "/api" is proxied to the local API server (see vite.config.ts).
// In production, set VITE_API_BASE to the deployed API URL (e.g. https://api.example.com).
// Set VITE_USE_MOCK=true to run against static in-browser demo data (no backend/DB needed).
const API_BASE = `${import.meta.env.VITE_API_BASE ?? ""}/api/v1/folders`;
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export function useFolderApi() {
  async function getTree(): Promise<FolderTreeNode[]> {
    if (USE_MOCK) return mockGetTree();
    const res = await fetch(`${API_BASE}/tree`);
    if (!res.ok) throw new Error("Failed to load folder tree");
    return res.json();
  }

  async function getChildren(id: number): Promise<FolderChildrenResponse> {
    if (USE_MOCK) return mockGetChildren(id);
    const res = await fetch(`${API_BASE}/${id}/children`);
    if (!res.ok) throw new Error("Failed to load folder children");
    return res.json();
  }

  async function searchFiles(query: string): Promise<FileSearchResult[]> {
    if (!query.trim()) return [];
    if (USE_MOCK) return mockSearchFiles(query);
    const res = await fetch(`${API_BASE}/files/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error("Failed to search files");
    return res.json();
  }

  return { getTree, getChildren, searchFiles };
}
