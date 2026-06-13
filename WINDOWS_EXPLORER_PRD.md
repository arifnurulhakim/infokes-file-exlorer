# Windows Explorer Clone — PRD (Product Requirements Document)

**Status:** Implemented
**Date:** 2026-06-13
**Project:** Windows Explorer Take-Home Test
**Source:** `Copy of 17122024 - Web Developer's take home test.docx.md`

---

## 1. Background

Take-home test dari Infokes buat posisi Web Developer. Tujuan: nilai cara kerja dgn nested data, pilihan struktur data, algoritma, dan kebersihan kode — bukan fitur kompleks.

---

## 2. Problem Statement

User butuh cara navigasi folder bertingkat (unlimited depth) mirip File/Windows Explorer: lihat seluruh struktur sekaligus di kiri, lalu fokus ke isi 1 folder di kanan tanpa reload/replace tree kiri.

---

## 3. Goals

- Tampilkan seluruh folder tree (semua level) di panel kiri saat load.
- Klik folder kiri → tampil daftar subfolder langsung di panel kanan.
- Data dari DB via API, bukan hardcode di frontend.
- Kode bersih, struktur data tepat, algoritma efisien (O(n) buat build tree).

## Non-Goals (v1)

- Tidak ada CRUD folder/file dari UI (read-only).
- Tidak ada drag-and-drop, rename, upload.
- Tidak ada auth/multi-user.
- Tidak ada pagination (asumsi data demo kecil-menengah).

---

## 4. User Stories

| # | As a | I want to | So that |
|---|------|-----------|---------|
| 1 | User | lihat semua folder dalam struktur tree saat buka halaman | tahu peta lengkap struktur |
| 2 | User | klik folder di kiri | lihat isi (subfolder) di kanan |
| 3 | User | (bonus) klik toggle expand/collapse | bisa fokus ke bagian tree tertentu |
| 4 | User | (bonus) lihat file di panel kanan, bukan cuma folder | tahu isi folder sepenuhnya |
| 5 | User | (bonus) cari folder/file by name | nemu cepat tanpa scroll manual |

---

## 5. Functional Requirements

### FR1 — Load Folder Tree
- Frontend call `GET /api/v1/folders/tree` sekali saat mount.
- Response: nested JSON, semua level, unlimited depth.
- Render di panel kiri pakai komponen rekursif custom (no tree-lib).

### FR2 — Select Folder → Show Children
- Klik folder di kiri → `GET /api/v1/folders/:id/children`.
- Response: list direct subfolder (+ files kalau FR4 aktif).
- Render di panel kanan, replace konten sebelumnya.
- Folder kiri yang dipilih dapat visual highlight.

### FR3 — Empty State
- Folder tanpa subfolder/file → panel kanan tampil "Folder ini kosong".

### FR4 (Bonus) — Show Files
- `/:id/children` juga return files dalam folder tsb.
- Tampil terpisah dari subfolder (beda icon).

### FR5 (Bonus) — Expand/Collapse
- Folder dengan children punya toggle ▶/▼.
- Default collapsed kecuali root level.
- State expand per-node disimpan di component (tidak perlu persist).

### FR6 (Bonus) — Search
- Input search di atas panel kiri.
- Filter tree client-side (match nama folder, highlight + auto-expand ancestor).
- File search via `GET /api/v1/folders/files/search?q=` (case-insensitive, partial match), hasil tampil di bawah tree dengan nama folder asalnya; klik hasil → buka & highlight folder tersebut.

---

## 6. Non-Functional Requirements

- **Performance:** `/tree` endpoint O(n) query + O(n) build, single round-trip.
- **Code quality:** layered (repository → service → route), typed end-to-end (shared types FE/BE).
- **Scalability (bonus):** desain harus bisa diubah ke lazy-load per level tanpa ubah schema — `/:id/children` udah generic untuk itu.
- **Testability:** algoritma tree-building harus pure function, mudah di-unit test tanpa DB.

---

## 7. API Contract

```
GET /api/v1/folders/tree
→ 200: FolderTreeNode[]

GET /api/v1/folders/:id/children
→ 200: { subfolders: Folder[], files: FileEntry[] }
→ 404: folder tidak ditemukan

GET /api/v1/folders/files/search?q=
→ 200: FileSearchResult[]  (FileEntry + folderName)
```

Lihat tipe lengkap di `WINDOWS_EXPLORER_BLUEPRINT.md` § 5.

---

## 8. Success Criteria / Acceptance Test

- [x] Buka halaman → panel kiri tampil seluruh folder tree (cek dgn data seed minimal 3 level dalam).
- [x] Klik folder manapun → panel kanan tampil subfolder langsung (benar, bukan semua descendant).
- [x] Klik folder tanpa subfolder → panel kanan kosong/"folder ini kosong".
- [x] Refresh halaman → tree ke-render ulang dari API, bukan cache statis.
- [x] (bonus) toggle expand/collapse jalan tanpa fetch ulang.
- [x] (bonus) files muncul di panel kanan kalau ada.
- [x] (bonus) search nemu folder by nama parsial, case-insensitive.
- [x] (bonus) search nemu file by nama parsial, klik hasil buka folder asalnya + auto-expand tree.

---

## 9. Open Questions (resolved)

- Breadcrumb path di panel kanan? → Diimplementasi sederhana sebagai path-bar (nama folder terpilih).
- File size formatted (KB/MB)? → Ya, diimplementasi (`formatSize` di `FolderContents.vue`).

---

## 10. References

- Plan teknis: `WINDOWS_EXPLORER_PLAN.md`
- Blueprint implementasi: `WINDOWS_EXPLORER_BLUEPRINT.md`
- Spec asli: `Copy of 17122024 - Web Developer's take home test.docx.md`
