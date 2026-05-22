/**
 * Menyusun draf tindak lanjut berdasarkan judul kegiatan dan arahan/temuan.
 * Dipanggil otomatis saat kedua field terisi; user tetap bisa mengedit hasilnya.
 *
 * Acuan contoh:
 * - Melakukan koordinasi dengan dinas PU Pengairan / dinas terkait
 * - Membuat surat kepada dinas PU Pengairan
 * - Melakukan monitoring wilayah setiap minggu sekali
 */

/** Keyword → dinas / instansi mapping */
const DINAS_KEYWORDS: Array<{ keywords: string[]; dinas: string }> = [
  { keywords: ["saluran", "air", "irigasi", "sungai", "banjir", "pengairan", "drainase"], dinas: "Dinas PU Pengairan" },
  { keywords: ["jalan", "jembatan", "gorong", "trotoar", "aspal"], dinas: "Dinas PU Bina Marga" },
  { keywords: ["gedung", "bangunan", "kantor", "pasar"], dinas: "Dinas PU Cipta Karya" },
  { keywords: ["sampah", "limbah", "lingkungan", "polusi", "pencemaran"], dinas: "Dinas Lingkungan Hidup" },
  { keywords: ["kesehatan", "puskesmas", "stunting", "gizi", "posyandu", "balita"], dinas: "Dinas Kesehatan" },
  { keywords: ["sekolah", "pendidikan", "paud", "siswa", "guru", "putus sekolah"], dinas: "Dinas Pendidikan" },
  { keywords: ["pajak", "pbb", "retribusi", "hotel", "restoran"], dinas: "Badan Pendapatan Daerah" },
  { keywords: ["sosial", "bantuan", "pkh", "bpnt", "kemiskinan"], dinas: "Dinas Sosial" },
  { keywords: ["pertanian", "sawah", "pupuk", "padi", "panen"], dinas: "Dinas Pertanian" },
  { keywords: ["ketertiban", "satpol", "perda", "tibum"], dinas: "Satpol PP" },
];

function detectDinas(text: string): string {
  const lower = text.toLowerCase();
  for (const { keywords, dinas } of DINAS_KEYWORDS) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return dinas;
    }
  }
  return "dinas terkait";
}

/** Detect if the issue is resolved or still needs follow-up */
function isResolved(arahan: string): boolean {
  const resolvedWords = ["selesai", "sudah diperbaiki", "sudah selesai", "beres", "tuntas", "sudah baik", "tidak ada masalah"];
  const lower = arahan.toLowerCase();
  return resolvedWords.some((w) => lower.includes(w));
}

export function generateTindakLanjut(
  judulKegiatan: string,
  arahanTemuan: string
): string {
  const judul = judulKegiatan.trim();
  const arahan = arahanTemuan.trim();

  if (!judul || !arahan) {
    return "";
  }

  const combinedText = `${judul} ${arahan}`;
  const dinas = detectDinas(combinedText);
  const resolved = isResolved(arahan);

  if (resolved) {
    return [
      `Menindaklanjuti kegiatan "${judul}":`,
      `1. Melakukan dokumentasi dan pelaporan hasil kegiatan`,
      `2. Melakukan monitoring wilayah setiap minggu sekali`,
      `3. Melaporkan hasil kepada pimpinan`,
    ].join("\n");
  }

  return [
    `Menindaklanjuti kegiatan "${judul}":`,
    `1. Melakukan koordinasi dengan ${dinas}`,
    `2. Membuat surat kepada ${dinas}`,
    `3. Melakukan monitoring wilayah setiap minggu sekali`,
  ].join("\n");
}
