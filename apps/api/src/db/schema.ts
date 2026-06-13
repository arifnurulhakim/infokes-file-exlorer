import { pgTable, serial, varchar, integer, bigint, timestamp } from "drizzle-orm/pg-core";

export const folders = pgTable("folders", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  parentId: integer("parent_id").references((): any => folders.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  folderId: integer("folder_id")
    .notNull()
    .references(() => folders.id, { onDelete: "cascade" }),
  sizeBytes: bigint("size_bytes", { mode: "number" }).default(0),
  createdAt: timestamp("created_at").defaultNow(),
});
