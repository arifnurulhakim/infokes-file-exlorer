import type { Folder, FolderTreeNode, FolderChildrenResponse, FileSearchResult } from "@windows-explorer/shared";
import { FolderRepository } from "../repositories/folder.repository";

export class FolderService {
  constructor(private repo: FolderRepository) {}

  /**
   * Builds the full folder tree from a flat list in O(n):
   * 1. group folders by parentId into a map
   * 2. recursively attach children starting from roots (parentId === null)
   */
  async getTree(): Promise<FolderTreeNode[]> {
    const all = await this.repo.findAll();
    return buildTree(all, null);
  }

  async getChildren(folderId: number): Promise<FolderChildrenResponse | null> {
    const folder = await this.repo.findById(folderId);
    if (!folder) return null;

    const [subfolders, files] = await Promise.all([
      this.repo.findChildren(folderId),
      this.repo.findFilesByFolder(folderId),
    ]);

    return { subfolders, files };
  }

  async searchFiles(query: string): Promise<FileSearchResult[]> {
    if (!query.trim()) return [];
    return this.repo.searchFiles(query);
  }
}

export function buildTree(all: Folder[], rootParentId: number | null): FolderTreeNode[] {
  const childrenMap = new Map<number | null, Folder[]>();
  for (const folder of all) {
    const key = folder.parentId;
    const siblings = childrenMap.get(key);
    if (siblings) siblings.push(folder);
    else childrenMap.set(key, [folder]);
  }

  const attach = (parentId: number | null): FolderTreeNode[] =>
    (childrenMap.get(parentId) ?? []).map((folder) => ({
      ...folder,
      children: attach(folder.id),
    }));

  return attach(rootParentId);
}
