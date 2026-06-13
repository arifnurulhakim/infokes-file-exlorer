import { describe, expect, it } from "bun:test";
import type { Folder } from "@windows-explorer/shared";
import { buildTree } from "./folder.service";

describe("buildTree", () => {
  it("returns empty array for empty input", () => {
    expect(buildTree([], null)).toEqual([]);
  });

  it("builds a flat list of roots when no folder has children", () => {
    const folders: Folder[] = [
      { id: 1, name: "A", parentId: null },
      { id: 2, name: "B", parentId: null },
    ];

    expect(buildTree(folders, null)).toEqual([
      { id: 1, name: "A", parentId: null, children: [] },
      { id: 2, name: "B", parentId: null, children: [] },
    ]);
  });

  it("nests children under their parent", () => {
    const folders: Folder[] = [
      { id: 1, name: "Documents", parentId: null },
      { id: 2, name: "Work", parentId: 1 },
      { id: 3, name: "Personal", parentId: 1 },
    ];

    const tree = buildTree(folders, null);

    expect(tree).toEqual([
      {
        id: 1,
        name: "Documents",
        parentId: null,
        children: [
          { id: 2, name: "Work", parentId: 1, children: [] },
          { id: 3, name: "Personal", parentId: 1, children: [] },
        ],
      },
    ]);
  });

  it("handles unlimited depth nesting", () => {
    const folders: Folder[] = [
      { id: 1, name: "L1", parentId: null },
      { id: 2, name: "L2", parentId: 1 },
      { id: 3, name: "L3", parentId: 2 },
      { id: 4, name: "L4", parentId: 3 },
    ];

    const tree = buildTree(folders, null);

    expect(tree).toEqual([
      {
        id: 1,
        name: "L1",
        parentId: null,
        children: [
          {
            id: 2,
            name: "L2",
            parentId: 1,
            children: [
              {
                id: 3,
                name: "L3",
                parentId: 2,
                children: [{ id: 4, name: "L4", parentId: 3, children: [] }],
              },
            ],
          },
        ],
      },
    ]);
  });

  it("supports multiple roots, each with their own subtree", () => {
    const folders: Folder[] = [
      { id: 1, name: "Documents", parentId: null },
      { id: 2, name: "Pictures", parentId: null },
      { id: 3, name: "Work", parentId: 1 },
      { id: 4, name: "Vacation", parentId: 2 },
    ];

    const tree = buildTree(folders, null);

    expect(tree).toHaveLength(2);
    expect(tree[0]).toMatchObject({ id: 1, children: [{ id: 3 }] });
    expect(tree[1]).toMatchObject({ id: 2, children: [{ id: 4 }] });
  });

  it("ignores folders unreachable from the given root parentId", () => {
    const folders: Folder[] = [
      { id: 1, name: "Reachable", parentId: 99 },
      { id: 2, name: "Child", parentId: 1 },
      { id: 3, name: "Orphan", parentId: 12345 }, // parent doesn't exist in list
    ];

    const tree = buildTree(folders, 99);

    expect(tree).toEqual([
      {
        id: 1,
        name: "Reachable",
        parentId: 99,
        children: [{ id: 2, name: "Child", parentId: 1, children: [] }],
      },
    ]);
  });
});
