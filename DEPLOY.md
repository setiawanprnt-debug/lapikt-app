# Update Deploy ke Vercel

Project ini adalah app Vite React. Build production dibuat ke folder `dist`, sedangkan routing SPA ditangani oleh `vercel.json`.

## 1. Siapkan environment Supabase

Di Supabase, buka **Project Settings > API**, lalu salin:

- `Project URL` ke `VITE_SUPABASE_URL`
- `anon public` key ke `VITE_SUPABASE_ANON_KEY`

Untuk lokal, buat file `.env` berdasarkan `.env.example`.

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Jangan commit file `.env`. File itu sudah diabaikan oleh `.gitignore`.

## 2. Masukkan environment ke Vercel

Di dashboard Vercel:

1. Buka project.
2. Masuk ke **Settings > Environment Variables**.
3. Tambahkan `VITE_SUPABASE_URL`.
4. Tambahkan `VITE_SUPABASE_ANON_KEY`.
5. Pilih environment yang dipakai, minimal **Production**. Tambahkan juga ke **Preview** jika ingin test dari branch/preview deploy.
6. Simpan.

Catatan: Vite hanya membaca variabel client-side yang diawali `VITE_`.

## 3. Cek struktur tabel Supabase

Kode app membaca dan menulis ke tabel `laporan`. Jika tabel belum dibuat, jalankan isi `supabase-schema.sql` di Supabase **SQL Editor**.

Schema tersebut membuat kolom yang dipakai app dan menambahkan policy RLS untuk `select` dan `insert` dari anon key. Jika nanti login sudah memakai Supabase Auth, policy ini sebaiknya diperketat.

## 4. Cek build lokal

Jalankan:

```bash
npm install
npm run build
```

Di Windows PowerShell, kalau `npm run build` diblokir oleh execution policy, jalankan:

```bash
npm.cmd run build
```

Build sukses jika Vite selesai membuat folder `dist`.

## 5. Update deploy

Jika project Vercel sudah terhubung ke GitHub/GitLab:

```bash
git add .
git commit -m "Prepare Supabase deployment"
git push
```

Vercel akan deploy otomatis dari push tersebut.

Jika deploy manual memakai Vercel CLI:

```bash
npm i -g vercel
vercel login
vercel --prod
```

## 6. Verifikasi setelah deploy

Setelah deploy selesai:

1. Buka URL production Vercel.
2. Coba tambah laporan dari halaman formulir.
3. Buka halaman arsip dan pastikan data dari tabel `laporan` muncul.
4. Jika data tidak masuk, cek **Browser Console** dan pastikan environment Vercel sudah berisi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`.

## Konfigurasi Vercel yang dipakai

- Framework: Vite
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`
