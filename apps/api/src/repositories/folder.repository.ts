import { eq, asc, ilike } from "drizzle-orm";
import { db as defaultDb } from "../db/client";
import { folders, files } from "../db/schema";
import type { Folder, FileEntry, FileSearchResult } from "@windows-explorer/shared";

type Database = typeof defaultDb;

export class FolderRepository {
  constructor(private db: Database = defaultDb) {}

  async findAll(): Promise<Folder[]> {
    return this.db
      .select({ id: folders.id, name: folders.name, parentId: folders.parentId })
      .from(folders)
      .orderBy(asc(folders.parentId), asc(folders.name));
  }

  async findById(id: number): Promise<Folder | undefined> {
    const [folder] = await this.db
      .select({ id: folders.id, name: folders.name, parentId: folders.parentId })
      .from(folders)
      .where(eq(folders.id, id));
    return folder;
  }

  async findChildren(parentId: number): Promise<Folder[]> {
    return this.db
      .select({ id: folders.id, name: folders.name, parentId: folders.parentId })
      .from(folders)
      .where(eq(folders.parentId, parentId))
      .orderBy(asc(folders.name));
  }

  async findFilesByFolder(folderId: number): Promise<FileEntry[]> {
    return this.db
      .select({
        id: files.id,
        name: files.name,
        folderId: files.folderId,
        sizeBytes: files.sizeBytes,
      })
      .from(files)
      .where(eq(files.folderId, folderId))
      .orderBy(asc(files.name));
  }

  async searchFiles(query: string): Promise<FileSearchResult[]> {
    return this.db
      .select({
        id: files.id,
        name: files.name,
        folderId: files.folderId,
        sizeBytes: files.sizeBytes,
        folderName: folders.name,
      })
      .from(files)
      .innerJoin(folders, eq(files.folderId, folders.id))
      .where(ilike(files.name, `%${query}%`))
      .orderBy(asc(files.name));
  }
}
