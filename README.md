# Windows Explorer Clone

2-panel folder browser: panel kiri = full folder tree (expand/collapse + search), panel kanan = subfolder & file dari folder yang dipilih.

## Stack

- **Monorepo**: Bun workspaces (`apps/api`, `apps/web`, `packages/shared`)
- **Backend**: Elysia + Drizzle ORM + PostgreSQL
- **Frontend**: Vue 3 (Composition API) + Vite

## Clone

```bash
git clone https://github.com/arifnurulhakim/infokes-file-exlorer.git
cd infokes-file-exlorer
```

## Prasyarat

- [Bun](https://bun.sh) terinstall
- PostgreSQL jalan di local (default `localhost:5432`)

## Setup

1. Install dependencies (dari root):

   ```bash
   bun install
   ```

2. Buat database:

   ```bash
   createdb windows_explorer
   ```

3. Buat file `apps/api/.env` (copy dari `.env.example`), sesuaikan kredensial DB:

   ```bash
   cd apps/api
   cp .env.example .env
   ```

   Contoh isi `.env`:

   ```
   DATABASE_URL=postgres://<user>@localhost:5432/windows_explorer
   ```

4. Jalankan migration & seed data awal:

   ```bash
   bun run db:migrate
   bun run db:seed
   ```

## Menjalankan dev server

Dari root project, di 2 terminal terpisah:

```bash
bun run dev:api   # -> http://localhost:3001
bun run dev:web   # -> http://localhost:5173 (atau port lain kalau 5173 dipakai)
```

Buka URL frontend di browser. Vite proxy `/api` ke backend (port 3001), jadi cukup buka 1 URL.

## E2E Testing (Playwright)

Install browser Playwright sekali (kalau belum):

```bash
bunx playwright install chromium
```

Pastikan dev server api + web udah jalan di port default (5173 & 3001) — lihat bagian "Menjalankan dev server", lalu jalankan dari root:

```bash
bun run e2e.ts   # cek tree, klik folder, isi panel kanan, search (auto-expand & no-results)
```

Script ini pakai Playwright (`chromium.launch()`), browser headless dibuka otomatis ke `http://localhost:5173` dan hasil di-print ke console. Kalau port 5173 lagi dipakai (vite auto-pindah ke 5174 dst), edit URL di `e2e.ts` sesuai port yang aktif.

## Testing

```bash
# backend (unit + integration, perlu DB jalan)
cd apps/api && bun run test

# frontend (component test)
cd apps/web && bun run test
```

> Catatan: integration test backend akan menghapus & menulis ulang data di DB. Jalankan `bun run db:seed` lagi setelah test kalau perlu data awal balik.

## API

- `GET /api/v1/folders/tree` — full folder tree
- `GET /api/v1/folders/:id/children` — subfolder + file langsung di bawah folder `:id`
- `GET /api/v1/folders/files/search?q=` — cari file by nama (case-insensitive, partial match)

## Deploy (Render + Netlify)

Backend + DB di **Render**, frontend di **Netlify**.

### 1. Backend + DB → Render

Repo udah ada `render.yaml` (Blueprint) di root — bikin 1 web service `explorer-api` + 1 Postgres `explorer-db` otomatis:

1. Render dashboard → **New** → **Blueprint** → connect repo `infokes-file-exlorer`.
2. Render baca `render.yaml`, bikin DB + web service. `DATABASE_URL` otomatis di-link dari DB ke service.
3. Setelah deploy pertama selesai, jalankan seed sekali lewat Shell tab service `explorer-api`:
   ```bash
   bun run db:seed
   ```
4. Catat URL publik service (`https://explorer-api-xxxx.onrender.com`) — dipakai di step 2.

> Free plan Render: service sleep kalau idle, request pertama setelah idle bakal lambat (cold start).

### 2. Frontend → Netlify

Repo udah ada `netlify.toml` di root (base dir `apps/web`, build `vite build`, publish `dist`, SPA redirect ke `index.html`).

1. Netlify dashboard → **Add new site** → **Import an existing project** → connect repo `infokes-file-exlorer`.
2. Build settings ke-detect otomatis dari `netlify.toml`.
3. Tambah environment variable: `VITE_API_BASE` = URL service Render dari step 1 (contoh `https://explorer-api-xxxx.onrender.com`). **Harus diset sebelum build** karena Vite inline env saat build time.
4. Deploy. Buka URL Netlify-nya.

### Catatan
- Kode udah disiapkan: API listen di `0.0.0.0:$PORT` (env Render) + CORS enabled; frontend baca `VITE_API_BASE` buat tentuin base URL API (kosong = relative, cuma valid kalau di-proxy/domain sama).
- Push ulang/redeploy site Netlify tiap kali `VITE_API_BASE` berubah (perlu rebuild).

## Dokumentasi tambahan

- [WINDOWS_EXPLORER_PRD.md](./WINDOWS_EXPLORER_PRD.md) — requirements & acceptance criteria
- [WINDOWS_EXPLORER_BLUEPRINT.md](./WINDOWS_EXPLORER_BLUEPRINT.md) — technical design, termasuk rencana scalability (lazy-load)
- [WINDOWS_EXPLORER_PLAN.md](./WINDOWS_EXPLORER_PLAN.md) — checklist progres implementasi
