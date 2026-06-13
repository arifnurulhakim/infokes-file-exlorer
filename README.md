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

## Deploy ke Railway

1 project Railway, 3 service:

1. **Postgres** — Add plugin "PostgreSQL" (otomatis kasih `DATABASE_URL`).

2. **Service `api`**
   - Root Directory: `apps/api` (config-as-code `railway.json` udah ada di sana — build = `bun install` di root monorepo, start = jalankan migration lalu `src/index.ts`).
   - Env var: `DATABASE_URL` → reference dari plugin Postgres (`${{Postgres.DATABASE_URL}}`).
   - Setelah deploy pertama, jalankan seed sekali: `railway run --service api bun run db:seed` (atau lewat shell Railway).
   - Catat domain publiknya (generate domain di Settings → Networking).

3. **Service `web`**
   - Root Directory: `apps/web` (config-as-code `railway.json` ada di sana — build = `vite build`, start = serve static `dist` pakai `serve`).
   - Env var: `VITE_API_BASE` = domain service `api` dari langkah 2 (contoh `https://api-xxxx.up.railway.app`), **harus diset sebelum build** karena Vite inline env saat build time.
   - Generate domain di Settings → Networking → ini yang dibuka user.

### Catatan
- Kode udah disiapkan: API listen di `0.0.0.0:$PORT` (env Railway) + CORS enabled; frontend baca `VITE_API_BASE` buat tentuin base URL API (kosong = relative, cuma valid kalau di-proxy/domain sama).
- Push ulang/redeploy tiap kali env var di service `web` berubah (perlu rebuild).

## Dokumentasi tambahan

- [WINDOWS_EXPLORER_PRD.md](./WINDOWS_EXPLORER_PRD.md) — requirements & acceptance criteria
- [WINDOWS_EXPLORER_BLUEPRINT.md](./WINDOWS_EXPLORER_BLUEPRINT.md) — technical design, termasuk rencana scalability (lazy-load)
- [WINDOWS_EXPLORER_PLAN.md](./WINDOWS_EXPLORER_PLAN.md) — checklist progres implementasi
