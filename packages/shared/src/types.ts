export interface Folder {
  id: number;
  name: string;
  parentId: number | null;
}

export interface FolderTreeNode extends Folder {
  children: FolderTreeNode[];
}

export interface FileEntry {
  id: number;
  name: string;
  folderId: number;
  sizeBytes: number | null;
}

export interface FolderChildrenResponse {
  subfolders: Folder[];
  files: FileEntry[];
}

export interface FileSearchResult extends FileEntry {
  folderName: string;
}

/** True if node name or any descendant's name matches query (case-insensitive). */
export function treeMatches(node: FolderTreeNode, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  if (node.name.toLowerCase().includes(q)) return true;
  return node.children.some((child) => treeMatches(child, query));
}
