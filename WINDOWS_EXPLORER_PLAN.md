# Windows Explorer Clone — Planning Document

**Status:** Done
**Date:** 2026-06-13
**Project Name:** Windows Explorer Take-Home Test
**Directory:** `/test infokes`
**Source:** `Copy of 17122024 - Web Developer's take home test.docx.md`

---

## Project Overview

Bikin web mirip Windows Explorer: layout 2 panel.
- **Panel kiri** — full folder tree (semua level, unlimited depth), load sekali saat halaman dibuka.
- **Panel kanan** — daftar subfolder langsung dari folder yang diklik di panel kiri.

Dinilai dari: kebersihan kode, pilihan struktur data, algoritma, best practices.

---

## Stack Decisions

| Layer | Choice | Note |
|-------|--------|------|
| Runtime | Bun | disukai panitia, lebih cepat dari Node |
| Backend | Elysia + TypeScript | disukai panitia |
| DB | PostgreSQL | bisa juga MySQL/MariaDB, pilih Postgres krn nyaman dgn ORM |
| ORM | Drizzle (bonus point) | type-safe, ringan, cocok Bun |
| Frontend | Vue 3 (Composition API) + Vite | wajib, no tree-lib |
| Monorepo | Bun workspaces (bonus point) | `apps/api`, `apps/web`, `packages/shared` |

---

## Data Model

Self-referencing tabel folder (adjacency list — paling simple & cukup buat unlimited depth):

```sql
CREATE TABLE folders (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  parent_id INTEGER REFERENCES folders(id) ON DELETE CASCADE, -- NULL = root
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_folders_parent_id ON folders(parent_id);

-- bonus: files
CREATE TABLE files (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  folder_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
  size_bytes BIGINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_files_folder_id ON files(folder_id);
```

**Kenapa adjacency list (bukan nested set / path enum):**
- Insert/update folder murah (cuma 1 row)
- Query "anak langsung" = `WHERE parent_id = ?` — simple & cepat dgn index
- Query "full tree" = ambil semua rows sekali, build tree di memory pakai map (O(n))
- Nested set ribet maintain di write-heavy case; path enumeration butuh update banyak row kalau folder dipindah — gak perlu di scope ini

---

## API Design

```
GET  /api/v1/folders/tree        → full tree (nested JSON), dipanggil sekali saat load
GET  /api/v1/folders/:id/children → direct subfolders (+ files kalau bonus) dari folder id
```

### Algoritma build tree (`/tree`)

1. `SELECT id, name, parent_id FROM folders ORDER BY parent_id, name`
2. Build `Map<parent_id, Folder[]>` — O(n)
3. Recursive attach children mulai dari root (`parent_id IS NULL`) — O(n)
4. Return nested JSON

Total: O(n), 1 query.

### Algoritma children (`/:id/children`)

1. `SELECT * FROM folders WHERE parent_id = $1 ORDER BY name`
2. (bonus) `SELECT * FROM files WHERE folder_id = $1 ORDER BY name`
3. Return flat array — gak perlu rekursi

---

## Frontend Plan

```
apps/web/src/
├── components/
│   ├── FolderTree.vue       ← recursive component, panel kiri
│   ├── FolderTreeNode.vue    ← 1 node, render children via self-reference
│   └── FolderContents.vue    ← panel kanan, list direct children
├── composables/
│   └── useFolderApi.ts       ← fetch tree + children
├── stores/ (optional, pinia)
│   └── explorer.ts           ← state: tree, selectedFolderId, contents
└── App.vue                   ← layout 2 panel (flex/grid)
```

### FolderTreeNode.vue (recursive, no lib)

- Render `name` + toggle icon (▶/▼) untuk expand/collapse (bonus)
- `@click` → emit `select(folder.id)` → fetch `/children` → render di panel kanan
- `v-if="expanded"` → render `<FolderTreeNode v-for="child in node.children" :node="child" />`

---

## Implementation Phases

### Phase 1 — Project Setup

- [x] 1. Setup monorepo (Bun workspaces) — `apps/api`, `apps/web`, `packages/shared`
- [x] 2. DB schema (`folders`, `files`) + Drizzle migration + seed data nested 3+ level

### Phase 2 — Backend Core

- [x] 3. Connect db, `folder.repository.ts` (findAll, findChildren, findFilesByFolder)
- [x] 4. `folder.service.ts` — algoritma `getTree()` (O(n) map+recursive build) + `getChildren()`
- [x] 5. Routes `GET /api/v1/folders/tree`, `GET /api/v1/folders/:id/children`

### Phase 3 — Frontend Core

- [x] 6. Setup Vue 3 + Vite, shared types dari `packages/shared`
- [x] 7. `FolderTreeNode.vue` recursive component + `FolderTree.vue` wrapper
- [x] 8. `App.vue` layout 2 panel + `useFolderApi.ts`

### Phase 4 — Wiring & UX Core

- [x] 9. Load tree on mount → render kiri
- [x] 10. Klik folder kiri → fetch `/:id/children` → render kanan + highlight selected
- [x] 11. Empty state: folder tanpa subfolder → "Folder ini kosong"

**Phase 1–4 = core, wajib selesai dulu sebelum Phase 5.**

### Phase 5 — Bonus UX

- [x] 12. Expand/collapse toggle (▶/▼) di folder kiri
- [x] 13. Tampilkan files di panel kanan (icon beda dari folder)
- [x] 14. Search box — filter tree client-side + auto-expand ancestor + highlight

### Phase 6 — Bonus Testing

- [x] 15. Unit test: `folderService.getTree()` (empty, multi-root, deep nesting)
- [x] 16. Unit test: repository layer (mock db via constructor DI)
- [x] 17. Integration test: `/tree` & `/:id/children` endpoints
- [x] 18. Component test: `FolderTreeNode.vue` (render, expand, emit select)

### Phase 7 — Bonus Scalability

- [x] 19. Dokumentasi cara migrate `/tree` ke lazy-load per level (buat case jutaan folder) — lihat `WINDOWS_EXPLORER_BLUEPRINT.md` § 11

---

## Scalability Notes (bonus, optional)

- Untuk jutaan folder: `/tree` full-load gak scalable → ganti jadi **lazy load per level**
  - `GET /:id/children` udah cocok buat ini — root level pertama, expand baru fetch
  - Index `parent_id` udah cukup buat performa query
- Search: kalau data besar, pakai Postgres full-text search / trigram index (`pg_trgm`) di kolom `name`
