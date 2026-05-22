import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Camera, Sparkles, Trash2, Plus } from "lucide-react";

import { useReports } from "@/lib/store";
import {
  formatTanggalDisplay,
  tanggalToDatetimeLocal,
} from "@/lib/datetime";
import { generateTindakLanjut } from "@/lib/generate-tindak-lanjut";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const SASARAN_OPTIONS = [
  "Mengoordinasikan kegiatan pemberdayaan masyarakat",
  "Mengoordinasikan upaya penyelenggaraan ketenteraman dan ketertiban umum",
  "Mengoordinasikan pemeliharaan prasarana dan sarana pelayanan umum",
  "Mengupayakan dan membantu pencapaian target penerimaan Pajak Bumi dan Bangunan (PBB), Pajak Hotel, Restoran, jasa usaha dan Bea Perolehan Hak atas Tanah dan Bangunan",
  "Memberikan pembinaan dan pengawasan terhadap Kepala Desa/Lurah",
  "Memonitor dan mengevaluasi pelayanan administrasi umum bidang pemerintahan, pelayanan umum, sosial, ketentraman ketertiban serta pemberdayaan masyarakat desa/kelurahan",
  "Melaksanakan kewenangannya di bidang pemerintahan dan hukum/ekonomi/sosial/pertahanan berdasarkan peraturan perundang-undangan yang berlaku",
] as const;

const INDIKATOR_MAPPING: Record<string, string[]> = {
  [SASARAN_OPTIONS[0]]: ["Jumlah kegiatan pemberdayaan masyarakat yang terfasilitasi"],
  [SASARAN_OPTIONS[1]]: [
    "Jumlah kegiatan koordinasi forkopimcam bersama instansi terkait",
    "Jumlah kegiatan penertiban dan penegakan peraturan daerah / peraturan bupati",
    "Persentase pengaduan masyarakat yang berhasil ditindaklanjuti",
  ],
  [SASARAN_OPTIONS[2]]: ["Jumlah fasilitasi peningkatan kualitas sarana dan prasarana"],
  [SASARAN_OPTIONS[3]]: ["Jumlah kegiatan pembinaan / monev yang dilakukan terhadap wajib pajak"],
  [SASARAN_OPTIONS[4]]: ["Jumlah kegiatan pembinaan yang dilakukan kepada Kepala Desa/Lurah"],
  [SASARAN_OPTIONS[5]]: ["Persentase penduduk yang terfasilitasi pelayanan administrasi kependudukan"],
  [SASARAN_OPTIONS[6]]: [
    "Jumlah balita stunting yang terfasilitasi",
    "Jumlah fasilitasi anak putus sekolah",
  ],
};

const MAX_PHOTOS = 2;

const formSchema = z.object({
  id: z.string().optional(),
  tanggalInput: z.string().min(1, "Hari / Tanggal / Waktu wajib diisi"),
  lokasi: z.string().min(1, "Lokasi wajib diisi"),
  petugas: z.string().min(1, "Petugas wajib diisi"),
  targetKinerja: z.string().min(1, "Target Kinerja wajib diisi"),
  sasaran: z.string().min(1, "Sasaran wajib dipilih"),
  indikator: z.string().min(1, "Indikator wajib dipilih"),
  judulKegiatan: z.string().min(1, "Judul Kegiatan wajib diisi"),
  arahanTemuan: z.string().min(1, "Arahan / Temuan wajib diisi"),
  status: z.enum(["Perlu Tindaklanjut", "Selesai"], {
    required_error: "Status wajib dipilih",
  }),
  tindakLanjut: z.string().min(1, "Tindak Lanjut wajib diisi"),
});

export default function FormulirPage() {
  const [, setLocation] = useLocation();
  const { addReport, updateReport, getReport } = useReports();
  const { toast } = useToast();
  const [photos, setPhotos] = useState<string[]>([]);
  const tindakLanjutTouched = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const searchParams = new URLSearchParams(window.location.search);
  const editId = searchParams.get("edit");
  const editReport = editId ? getReport(editId) : null;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: editReport?.id || undefined,
      tanggalInput: tanggalToDatetimeLocal(
        editReport?.tanggal,
        editReport?.createdAt
      ),
      lokasi: editReport?.lokasi || "",
      petugas: editReport?.petugas || "",
      targetKinerja: editReport?.targetKinerja || "",
      sasaran: editReport?.sasaran || "",
      indikator: editReport?.indikator || "",
      judulKegiatan: editReport?.judulKegiatan || "",
      arahanTemuan: editReport?.arahanTemuan || "",
      status: editReport?.status || "Perlu Tindaklanjut",
      tindakLanjut: editReport?.tindakLanjut || "",
    },
  });

  const selectedSasaran = form.watch("sasaran");
  const judulKegiatan = form.watch("judulKegiatan");
  const arahanTemuan = form.watch("arahanTemuan");
  const availableIndikators = selectedSasaran ? INDIKATOR_MAPPING[selectedSasaran] || [] : [];

  const applyTindakLanjutSuggestion = () => {
    const suggestion = generateTindakLanjut(judulKegiatan, arahanTemuan);
    if (suggestion) {
      form.setValue("tindakLanjut", suggestion, { shouldValidate: true });
    }
  };

  useEffect(() => {
    if (editReport?.foto && editReport.foto.length > 0) {
      setPhotos([...editReport.foto]);
    }
    if (editReport?.tindakLanjut) {
      tindakLanjutTouched.current = true;
    }
  }, [editReport]);

  useEffect(() => {
    // Reset indikator if sasaran changes and it's not in the new list
    const currentIndikator = form.getValues("indikator");
    if (
      selectedSasaran &&
      currentIndikator &&
      !availableIndikators.includes(currentIndikator)
    ) {
      form.setValue("indikator", "");
    }
  }, [selectedSasaran, availableIndikators, form]);

  useEffect(() => {
    if (tindakLanjutTouched.current) return;
    if (!judulKegiatan.trim() || !arahanTemuan.trim()) return;

    const timer = window.setTimeout(() => {
      if (!tindakLanjutTouched.current) {
        applyTindakLanjutSuggestion();
      }
    }, 600);

    return () => window.clearTimeout(timer);
  }, [judulKegiatan, arahanTemuan]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (photos.length >= MAX_PHOTOS) {
      toast({
        title: "Batas foto tercapai",
        description: `Maksimal ${MAX_PHOTOS} foto yang dapat diunggah.`,
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPhotos((prev) => [...prev, base64]);
    };
    reader.readAsDataURL(file);

    // Reset input so the same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    const { tanggalInput, ...rest } = values;
    const payload = {
      ...rest,
      foto: photos,
      tanggal: formatTanggalDisplay(tanggalInput),
    };

    if (values.id) {
      updateReport(values.id, payload);
      toast({ title: "Berhasil", description: "Laporan berhasil diperbarui" });
      setLocation(`/preview/${values.id}`);
    } else {
      const newReport = addReport(payload);
      toast({ title: "Berhasil", description: "Laporan berhasil disimpan" });
      setLocation(`/preview/${newReport.id}`);
    }
  }

  function onInvalid() {
    toast({
      title: "Gagal menyimpan",
      description: "Lengkapi semua field yang wajib diisi.",
      variant: "destructive",
    });
  }

  const handleCancel = () => {
    if (editId) {
      setLocation(`/preview/${editId}`);
    } else {
      form.reset();
      setPhotos([]);
      tindakLanjutTouched.current = false;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2 text-foreground">
          🖎 Formulir Pengisian Kegiatan dan Bukti Dukung
        </h1>
        <p className="text-muted-foreground">
          Isi form di bawah ini untuk melaporkan aktivitas harian Anda.
        </p>
      </div>

      <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit, onInvalid)}
              className="space-y-8"
            >
              
              {/* Photo Upload Section — up to 2 photos */}
              <div className="space-y-3">
                <Label>Upload Foto Kegiatan (Maks. {MAX_PHOTOS})</Label>
                <div className="flex flex-wrap items-start gap-4">
                  {photos.map((photo, idx) => (
                    <div
                      key={idx}
                      className="relative group rounded-md overflow-hidden border border-border h-40 w-40 bg-black/20 shrink-0"
                    >
                      <img
                        src={photo}
                        alt={`Foto ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => removePhoto(idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <span className="absolute top-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                        {idx + 1}
                      </span>
                    </div>
                  ))}

                  {photos.length < MAX_PHOTOS && (
                    <label className="flex flex-col items-center justify-center h-40 w-40 rounded-md border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-colors shrink-0">
                      {photos.length === 0 ? (
                        <Camera className="h-8 w-8 text-muted-foreground mb-2" />
                      ) : (
                        <Plus className="h-8 w-8 text-muted-foreground mb-2" />
                      )}
                      <span className="text-sm font-medium text-muted-foreground text-center px-2">
                        {photos.length === 0 ? "Ambil Foto" : "Tambah Foto"}
                      </span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />
                    </label>
                  )}

                  <div className="text-sm text-muted-foreground space-y-1 self-center">
                    <p>Format: JPG, PNG. Maks. 5MB/file.</p>
                    <p className="text-xs">
                      {photos.length}/{MAX_PHOTOS} foto diunggah
                    </p>
                  </div>
                </div>
              </div>

              <FormField
                control={form.control}
                name="tanggalInput"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hari / Tanggal / Waktu</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="lokasi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lokasi</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Kantor Kecamatan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="petugas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Petugas</FormLabel>
                      <FormControl>
                        <Input placeholder="Nama Petugas" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="targetKinerja"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Kinerja</FormLabel>
                    <FormControl>
                      <Input placeholder="Target kinerja yang diharapkan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-6">
                <FormField
                  control={form.control}
                  name="sasaran"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sasaran / Uraian Kegiatan</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih sasaran kegiatan" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SASARAN_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="indikator"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Indikator Kinerja</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={!selectedSasaran}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih indikator kinerja" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableIndikators.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="judulKegiatan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Judul Kegiatan</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan judul kegiatan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="arahanTemuan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Arahan / Temuan</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Deskripsikan arahan atau temuan di lapangan..." 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Perlu Tindaklanjut">Perlu Tindaklanjut</SelectItem>
                        <SelectItem value="Selesai">Selesai</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tindakLanjut"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between gap-2">
                      <FormLabel>Tindak Lanjut</FormLabel>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 text-muted-foreground"
                        onClick={() => {
                          applyTindakLanjutSuggestion();
                          toast({
                            title: "Saran AI diterapkan",
                            description:
                              "Isi tindak lanjut yang akan dilakukan berkaitan dengan kegiatan ini.",
                          });
                        }}
                        
                      >
                       
                      </Button>
                    </div>
                    
                    <FormControl>
                      <Textarea
                        placeholder="Deskripsikan tindak lanjut yang dilakukan...Contoh : 
                        1. Melakukan koordinasi dengan dinas terkait
                        2. Membuat surat kepada dinas terkait
                        3. Melakukan monitoring wilayah setiap minggu sekali"
                        className="min-h-[100px]"
                        {...field}
                        onChange={(e) => {
                          tindakLanjutTouched.current = true;
                          field.onChange(e);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-end gap-4 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Batal
                </Button>
                <Button type="submit">
                  Simpan Data
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
