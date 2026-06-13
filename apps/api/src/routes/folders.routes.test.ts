import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { Elysia } from "elysia";
import { db } from "../db/client";
import { folders, files } from "../db/schema";
import { folderRoutes } from "./folders.routes";

const app = new Elysia().use(folderRoutes);

let rootId: number;
let childId: number;
let leafId: number;

beforeAll(async () => {
  // isolate from any existing data
  await db.delete(files);
  await db.delete(folders);

  const [root] = await db.insert(folders).values({ name: "Root", parentId: null }).returning();
  const [child] = await db.insert(folders).values({ name: "Child", parentId: root.id }).returning();
  const [leaf] = await db.insert(folders).values({ name: "Leaf", parentId: child.id }).returning();
  await db.insert(files).values({ name: "note.txt", folderId: child.id, sizeBytes: 123 });

  rootId = root.id;
  childId = child.id;
  leafId = leaf.id;
});

afterAll(async () => {
  await db.delete(files);
  await db.delete(folders);
});

describe("GET /api/v1/folders/tree", () => {
  it("returns the full nested tree", async () => {
    const res = await app.handle(new Request("http://localhost/api/v1/folders/tree"));
    expect(res.status).toBe(200);

    const body = (await res.json()) as any;
    expect(body).toEqual([
      {
        id: rootId,
        name: "Root",
        parentId: null,
        children: [
          {
            id: childId,
            name: "Child",
            parentId: rootId,
            children: [{ id: leafId, name: "Leaf", parentId: childId, children: [] }],
          },
        ],
      },
    ]);
  });
});

describe("GET /api/v1/folders/:id/children", () => {
  it("returns direct subfolders and files for a folder", async () => {
    const res = await app.handle(new Request(`http://localhost/api/v1/folders/${rootId}/children`));
    expect(res.status).toBe(200);

    const body = (await res.json()) as any;
    expect(body.subfolders).toEqual([{ id: childId, name: "Child", parentId: rootId }]);
    expect(body.files).toEqual([]);
  });

  it("returns files alongside subfolders", async () => {
    const res = await app.handle(new Request(`http://localhost/api/v1/folders/${childId}/children`));
    expect(res.status).toBe(200);

    const body = (await res.json()) as any;
    expect(body.subfolders).toEqual([{ id: leafId, name: "Leaf", parentId: childId }]);
    expect(body.files).toEqual([
      { id: expect.any(Number), name: "note.txt", folderId: childId, sizeBytes: 123 },
    ]);
  });

  it("returns 404 for a folder that does not exist", async () => {
    const res = await app.handle(new Request("http://localhost/api/v1/folders/999999/children"));
    expect(res.status).toBe(404);
  });
});
