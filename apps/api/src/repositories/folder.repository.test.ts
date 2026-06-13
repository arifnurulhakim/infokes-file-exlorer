import { describe, expect, it } from "bun:test";
import { FolderRepository } from "./folder.repository";

// Chainable mock that mimics drizzle's `db.select().from().where().orderBy()`
// builder, resolving to `rows` once awaited.
function fakeDb<T>(rows: T[]) {
  const builder: any = {
    select: () => builder,
    from: () => builder,
    where: () => builder,
    orderBy: () => builder,
    then: (resolve: (rows: T[]) => void) => resolve(rows),
  };
  return builder;
}

describe("FolderRepository", () => {
  it("findAll returns folders ordered as given by the query", async () => {
    const rows = [
      { id: 1, name: "Documents", parentId: null },
      { id: 2, name: "Work", parentId: 1 },
    ];

    const repo = new FolderRepository(fakeDb(rows));
    expect(await repo.findAll()).toEqual(rows);
  });

  it("findById returns the first matching folder", async () => {
    const repo = new FolderRepository(fakeDb([{ id: 1, name: "Documents", parentId: null }]));
    expect(await repo.findById(1)).toEqual({ id: 1, name: "Documents", parentId: null });
  });

  it("findById returns undefined if no folder matches", async () => {
    const repo = new FolderRepository(fakeDb([]));
    expect(await repo.findById(999)).toBeUndefined();
  });

  it("findChildren returns direct subfolders of the given parent", async () => {
    const rows = [{ id: 2, name: "Work", parentId: 1 }];
    const repo = new FolderRepository(fakeDb(rows));
    expect(await repo.findChildren(1)).toEqual(rows);
  });

  it("findFilesByFolder returns files belonging to the given folder", async () => {
    const rows = [{ id: 1, name: "note.txt", folderId: 2, sizeBytes: 123 }];
    const repo = new FolderRepository(fakeDb(rows));
    expect(await repo.findFilesByFolder(2)).toEqual(rows);
  });
});
