import { supabase } from "./supabase";

type RawReportRow = {
  id?: string;
  created_at?: string;
  createdAt?: string;
  foto?: string | string[];
  tanggal?: string;
  lokasi?: string;
  petugas?: string;
  target_kinerja?: string;
  targetKinerja?: string;
  sasaran?: string;
  indikator?: string;
  judul_kegiatan?: string;
  judulKegiatan?: string;
  arahan_temuan?: string;
  arahanTemuan?: string;
  status?: string;
  tindak_lanjut?: string;
  tindakLanjut?: string;
};

function mapReportRow(row: RawReportRow) {
  return {
    id: row.id ?? "",
    createdAt: row.created_at ?? row.createdAt ?? "",
    foto: Array.isArray(row.foto)
      ? row.foto
      : typeof row.foto === "string"
      ? [row.foto]
      : [],
    tanggal: row.tanggal ?? "",
    lokasi: row.lokasi ?? "",
    petugas: row.petugas ?? "",
    targetKinerja: row.target_kinerja ?? row.targetKinerja ?? "",
    sasaran: row.sasaran ?? "",
    indikator: row.indikator ?? "",
    judulKegiatan: row.judul_kegiatan ?? row.judulKegiatan ?? "",
    arahanTemuan: row.arahan_temuan ?? row.arahanTemuan ?? "",
    status: row.status ?? "",
    tindakLanjut: row.tindak_lanjut ?? row.tindakLanjut ?? "",
  };
}

export async function saveReport(report: any) {
  const { data, error } = await supabase
    .from("laporan")
    .insert([
      {
        tanggal: report.tanggal,
        lokasi: report.lokasi,
        petugas: report.petugas,
        target_kinerja: report.targetKinerja,
        sasaran: report.sasaran,
        indikator: report.indikator,
        judul_kegiatan: report.judulKegiatan,
        arahan_temuan: report.arahanTemuan,
        status: report.status,
        tindak_lanjut: report.tindakLanjut,
        foto: report.foto,
      },
    ])
    .select();

  if (error) {
    console.error("Supabase save error:", error);
    return null;
  }

  return data?.[0] ? mapReportRow(data[0]) : null;
}

export async function getReports() {
  const { data, error } = await supabase.from("laporan").select("*");

  if (error) {
    console.error("Gagal ambil data:", error);
    return [];
  }

  return data.map(mapReportRow);
}

export async function getReportById(id: string) {
  const { data, error } = await supabase
    .from("laporan")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Gagal ambil laporan by id:", error);
    return null;
  }

  return data ? mapReportRow(data) : null;
}
