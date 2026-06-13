# Windows Explorer Clone — Blueprint Lengkap

> Take-home test: Windows Explorer-like 2-panel folder browser
> Stack: Bun + Elysia + TypeScript + PostgreSQL + Drizzle + Vue 3 (Composition API)
> Directory: `/test infokes`
> Status: Planning done, implementation not started

---

## 1. Gambaran Produk

Web app 2 panel:
- **Kiri:** seluruh struktur folder (semua level, unlimited subfolder), tampil otomatis saat halaman load.
- **Kanan:** subfolder langsung (+ files, bonus) dari folder yang diklik di kiri.

**Core philosophy:** simple, correct, clean — fokus ke data structure + algoritma tree, jangan over-engineer di luar scope core.

---

## 2. Tech Stack

| Layer | Pilihan | Alasan |
|-------|---------|--------|
| Runtime | Bun | disukai panitia |
| Backend framework | Elysia (TS) | disukai panitia, type-safe routing |
| DB | PostgreSQL | requirement, support `pg_trgm` buat search bonus |
| ORM | Drizzle | bonus point, type-safe, ringan |
| Frontend | Vue 3 Composition API + Vite | wajib, no tree-display lib |
| Monorepo | Bun workspaces | bonus point |

---

## 3. Struktur Project (Monorepo)

```
test infokes/
├── apps/
│   ├── api/                     ← Elysia backend
│   │   ├── src/
│   │   │   ├── db/
│   │   │   │   ├── schema.ts        ← Drizzle schema (folders, files)
│   │   │   │   └── client.ts        ← db connection
│   │   │   ├── repositories/
│   │   │   │   └── folder.repository.ts
│   │   │   ├── services/
│   │   │   │   └── folder.service.ts   ← tree-building algorithm
│   │   │   ├── routes/
│   │   │   │   └── folders.routes.ts
│   │   │   └── index.ts             ← Elysia app entry
│   │   ├── drizzle/                 ← migrations
│   │   └── package.json
│   └── web/                      ← Vue 3 frontend
│       ├── src/
│       │   ├── components/
│       │   │   ├── FolderTree.vue
│       │   │   ├── FolderTreeNode.vue
│       │   │   └── FolderContents.vue
│       │   ├── composables/
│       │   │   └── useFolderApi.ts
│       │   ├── types/
│       │   │   └── folder.ts        ← shared types (Folder, FolderTreeNode)
│       │   └── App.vue
│       └── package.json
├── packages/
│   └── shared/                   ← shared TS types (Folder, FileEntry)
│       └── src/types.ts
└── package.json                  ← workspace root
```

---

## 4. Database Schema

```sql
CREATE TABLE folders (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  parent_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_folders_parent_id ON folders(parent_id);

CREATE TABLE files (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  folder_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
  size_bytes BIGINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_files_folder_id ON files(folder_id);
```

**Drizzle schema (`schema.ts`):**

```typescript
import { pgTable, serial, varchar, integer, bigint, timestamp } from "drizzle-orm/pg-core";

export const folders = pgTable("folders", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  parentId: integer("parent_id").references(() => folders.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  folderId: integer("folder_id").references(() => folders.id, { onDelete: "cascade" }),
  sizeBytes: bigint("size_bytes", { mode: "number" }).default(0),
  createdAt: timestamp("created_at").defaultNow(),
});
```

**Kenapa adjacency list:** insert/update folder = 1 row. Direct children = `WHERE parent_id = ?` + index. Full tree = 1 query + in-memory map build, O(n). Nested set / path enumeration overkill & ribet maintain untuk scope ini.

---

## 5. Shared Types (`packages/shared/src/types.ts`)

```typescript
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
  sizeBytes: number;
}
```

---

## 6. Backend

### Repository Layer (`folder.repository.ts`)

```typescript
export class FolderRepository {
  async findAll(): Promise<Folder[]> {
    return db.select().from(folders).orderBy(folders.parentId, folders.name);
  }

  async findChildren(parentId: number): Promise<Folder[]> {
    return db.select().from(folders)
      .where(eq(folders.parentId, parentId))
      .orderBy(folders.name);
  }

  async findFilesByFolder(folderId: number): Promise<FileEntry[]> {
    return db.select().from(files)
      .where(eq(files.folderId, folderId))
      .orderBy(files.name);
  }
}
```

### Service Layer (`folder.service.ts`) — Tree Building Algorithm

```typescript
export class FolderService {
  constructor(private repo: FolderRepository) {}

  async getTree(): Promise<FolderTreeNode[]> {
    const all = await this.repo.findAll();

    // O(n): build lookup map parentId -> children[]
    const childrenMap = new Map<number | null, Folder[]>();
    for (const f of all) {
      const key = f.parentId;
      if (!childrenMap.has(key)) childrenMap.set(key, []);
      childrenMap.get(key)!.push(f);
    }

    // O(n): recursive attach, starting from roots (parentId === null)
    const build = (parentId: number | null): FolderTreeNode[] =>
      (childrenMap.get(parentId) ?? []).map((f) => ({
        ...f,
        children: build(f.id),
      }));

    return build(null);
  }

  async getChildren(folderId: number) {
    const subfolders = await this.repo.findChildren(folderId);
    const files = await this.repo.findFilesByFolder(folderId); // bonus
    return { subfolders, files };
  }
}
```

### Routes (`folders.routes.ts`) — REST v1

```typescript
import { Elysia } from "elysia";

export const folderRoutes = new Elysia({ prefix: "/api/v1/folders" })
  .get("/tree", async ({ folderService }) => {
    return await folderService.getTree();
  })
  .get("/:id/children", async ({ params, folderService }) => {
    return await folderService.getChildren(Number(params.id));
  });
```

---

## 7. Frontend

### `useFolderApi.ts`

```typescript
import type { FolderTreeNode, Folder, FileEntry } from "@shared/types";

const API_BASE = "/api/v1/folders";

export function useFolderApi() {
  const getTree = () => fetch(`${API_BASE}/tree`).then(r => r.json() as Promise<FolderTreeNode[]>);

  const getChildren = (id: number) =>
    fetch(`${API_BASE}/${id}/children`)
      .then(r => r.json() as Promise<{ subfolders: Folder[]; files: FileEntry[] }>);

  return { getTree, getChildren };
}
```

### `FolderTreeNode.vue` (recursive component, no library)

```vue
<script setup lang="ts">
import type { FolderTreeNode } from "@shared/types";
import { ref } from "vue";

const props = defineProps<{ node: FolderTreeNode; selectedId: number | null }>();
const emit = defineEmits<{ select: [id: number] }>();

const expanded = ref(false);
const hasChildren = props.node.children.length > 0;
</script>

<template>
  <div class="folder-node">
    <div
      class="folder-row"
      :class="{ selected: selectedId === node.id }"
      @click="emit('select', node.id)"
    >
      <span v-if="hasChildren" class="toggle" @click.stop="expanded = !expanded">
        {{ expanded ? '▼' : '▶' }}
      </span>
      <span v-else class="toggle-spacer"></span>
      📁 {{ node.name }}
    </div>
    <div v-if="expanded" class="children">
      <FolderTreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :selected-id="selectedId"
        @select="emit('select', $event)"
      />
    </div>
  </div>
</template>
```

### `App.vue` — Layout 2 Panel

```vue
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useFolderApi } from "./composables/useFolderApi";
import type { FolderTreeNode, Folder, FileEntry } from "@shared/types";
import FolderTree from "./components/FolderTree.vue";
import FolderContents from "./components/FolderContents.vue";

const { getTree, getChildren } = useFolderApi();
const tree = ref<FolderTreeNode[]>([]);
const selectedId = ref<number | null>(null);
const subfolders = ref<Folder[]>([]);
const fileList = ref<FileEntry[]>([]);

onMounted(async () => {
  tree.value = await getTree();
});

async function onSelect(id: number) {
  selectedId.value = id;
  const data = await getChildren(id);
  subfolders.value = data.subfolders;
  fileList.value = data.files;
}
</script>

<template>
  <div class="explorer">
    <aside class="left-panel">
      <FolderTree :nodes="tree" :selected-id="selectedId" @select="onSelect" />
    </aside>
    <main class="right-panel">
      <FolderContents :folders="subfolders" :files="fileList" />
    </main>
  </div>
</template>

<style>
.explorer { display: flex; height: 100vh; }
.left-panel { width: 300px; overflow-y: auto; border-right: 1px solid #ddd; }
.right-panel { flex: 1; overflow-y: auto; }
</style>
```

---

## 8. Testing Plan (bonus)

| Type | Target | Tool |
|------|--------|------|
| Unit | `FolderService.getTree()` — tree dari flat array, edge case: empty, multi-root, deep nesting | Bun test / Vitest |
| Unit | `FolderRepository` — mock db | Bun test |
| Component | `FolderTreeNode.vue` — render, expand/collapse, emit select | Vitest + Vue Test Utils |
| Integration | `GET /api/v1/folders/tree`, `GET /:id/children` — real test DB | Elysia `.handle()` |
| E2E | klik folder kiri → panel kanan update | Playwright (optional) |

---

## 9. Seed Data (untuk dev/demo)

```sql
INSERT INTO folders (id, name, parent_id) VALUES
(1, 'Documents', NULL),
(2, 'Pictures', NULL),
(3, 'Work', 1),
(4, 'Personal', 1),
(5, 'Vacation', 2),
(6, 'Reports', 3),
(7, '2026', 6);

INSERT INTO files (name, folder_id) VALUES
('resume.pdf', 4),
('photo1.jpg', 5),
('q1-report.docx', 7);
```

Tree hasil:
```
Documents
├── Work
│   └── Reports
│       └── 2026
├── Personal
Pictures
└── Vacation
```

---

## 10. Roadmap

| Step | Status |
|------|--------|
| 1. Monorepo setup (Bun workspaces) | ✅ |
| 2. DB schema + Drizzle migration + seed | ✅ |
| 3. Backend repo/service/route layers | ✅ |
| 4. `GET /api/v1/folders/tree` + `/:id/children` | ✅ |
| 5. Frontend layout 2 panel + recursive tree | ✅ |
| 6. Click → fetch children → render kanan | ✅ |
| 7. Bonus: expand/collapse | ✅ |
| 8. Bonus: files di panel kanan | ✅ |
| 9. Bonus: search | ✅ |
| 10. Bonus: unit/integration/component tests | ✅ |

---

## 11. Scalability — Migrating to Lazy-Load Per Level

`GET /tree` saat ini load semua folder dalam 1 query + 1 response. Cocok untuk ribuan baris. Untuk jutaan folder & ribuan concurrent user, migrasi ke **lazy-load per level** — tanpa ubah schema, cukup ubah kontrak API & frontend.

### Kenapa perlu

- `findAll()` full table scan + serialize seluruh tree → payload besar, memory spike di tiap request.
- User biasanya cuma expand beberapa level — render semua node di awal sia-sia.

### Perubahan API

```
GET /api/v1/folders/roots          → folder dgn parent_id IS NULL (top-level saja)
GET /api/v1/folders/:id/children   → SUDAH ADA, generic untuk semua level
```

`/tree` dan `buildTree()` tetap dipakai untuk dataset kecil (mis. mode "load all" admin), tapi default frontend pakai `/roots` + `/:id/children` on-demand.

### Perubahan Service Layer

```typescript
// folder.service.ts — tambahan, getTree() tetap ada untuk dataset kecil
async getRoots(): Promise<Folder[]> {
  return this.repo.findChildren(null); // findChildren sudah generic, terima null = root
}
```

`findChildren` & query `WHERE parent_id = ?` sudah pakai index `idx_folders_parent_id` — tidak perlu query baru, cukup expose endpoint root.

### Perubahan Frontend (`FolderTreeNode.vue`)

- `node.children` jadi optional/lazy — fetch saat user klik toggle expand pertama kali (bukan dari payload awal).
- State per-node: `loaded: boolean`, `loading: boolean`.
- Toggle handler:
  ```typescript
  async function toggle() {
    expanded.value = !expanded.value;
    if (expanded.value && !loaded.value) {
      loading.value = true;
      children.value = await getChildren(node.id).then(r => r.subfolders);
      loaded.value = true;
      loading.value = false;
    }
  }
  ```
- Root level: `App.vue` fetch `/roots` saat mount, bukan `/tree`.

### Trade-off

- Search (FR6) jadi lebih kompleks — client-side filter butuh tree lengkap. Pilihan: batasi search ke level yang udah di-load, atau pindah search ke backend (`GET /folders/search?q=` pakai `pg_trgm` index di kolom `name`, return path ke root buat auto-expand).
- Untuk dataset kecil (seperti seed data di project ini), `/tree` tetap lebih simple & cepat — gak perlu migrasi kecuali ada requirement scale nyata.
