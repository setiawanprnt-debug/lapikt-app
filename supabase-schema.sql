create table if not exists public.laporan (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  tanggal text not null,
  lokasi text not null,
  petugas text not null,
  target_kinerja text not null,
  sasaran text not null,
  indikator text not null,
  judul_kegiatan text not null,
  arahan_temuan text not null,
  status text not null,
  tindak_lanjut text not null,
  foto text[] not null default '{}'
);

alter table public.laporan enable row level security;

create policy "Allow public read laporan"
  on public.laporan
  for select
  to anon
  using (true);

create policy "Allow public insert laporan"
  on public.laporan
  for insert
  to anon
  with check (true);
