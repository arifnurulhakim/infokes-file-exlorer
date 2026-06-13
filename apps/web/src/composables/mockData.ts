import type { FolderTreeNode, FolderChildrenResponse, FileEntry, FileSearchResult } from "@shared/types";

// Mirrors apps/api/src/db/seed.ts — used for the Netlify demo (no live backend).
const documents: FolderTreeNode = {
  id: 1,
  name: "Documents",
  parentId: null,
  children: [
    {
      id: 3,
      name: "Work",
      parentId: 1,
      children: [
        {
          id: 6,
          name: "Reports",
          parentId: 3,
          children: [{ id: 7, name: "2026", parentId: 6, children: [] }],
        },
      ],
    },
    { id: 4, name: "Personal", parentId: 1, children: [] },
  ],
};

const pictures: FolderTreeNode = {
  id: 2,
  name: "Pictures",
  parentId: null,
  children: [{ id: 5, name: "Vacation", parentId: 2, children: [] }],
};

export const mockTree: FolderTreeNode[] = [documents, pictures];

const mockFiles: FileEntry[] = [
  { id: 1, name: "resume.pdf", folderId: 4, sizeBytes: 245_000 },
  { id: 2, name: "photo1.jpg", folderId: 5, sizeBytes: 1_200_000 },
  { id: 3, name: "q1-report.docx", folderId: 7, sizeBytes: 58_000 },
];

function findFolder(nodes: FolderTreeNode[], id: number): FolderTreeNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findFolder(node.children, id);
    if (found) return found;
  }
  return undefined;
}

export function mockGetTree(): FolderTreeNode[] {
  return mockTree;
}

export function mockGetChildren(id: number): FolderChildrenResponse {
  const folder = findFolder(mockTree, id);
  return {
    subfolders: (folder?.children ?? []).map(({ id, name, parentId }) => ({ id, name, parentId })),
    files: mockFiles.filter((f) => f.folderId === id),
  };
}

export function mockSearchFiles(query: string): FileSearchResult[] {
  const q = query.toLowerCase();
  return mockFiles
    .filter((f) => f.name.toLowerCase().includes(q))
    .map((f) => ({ ...f, folderName: findFolder(mockTree, f.folderId)?.name ?? "" }));
}
