import { useEffect, useRef, useState } from "react";
import { useReports } from "@/lib/store";
import { getReportById } from "@/lib/api";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Printer, Download, Loader2 } from "lucide-react";
import { generateReportPDF } from "@/lib/pdf";
import { useToast } from "@/hooks/use-toast";

export default function PreviewPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { getReport } = useReports();
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [fallbackReport, setFallbackReport] = useState<any>(null);

  const reportFromStore = id ? getReport(id) : null;
  const report = reportFromStore || fallbackReport;

  useEffect(() => {
    if (!reportFromStore && id) {
      getReportById(id).then((report) => {
        if (report) {
          setFallbackReport(report);
        }
      });
    }
  }, [id, reportFromStore]);

  if (!report) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-foreground">
          Laporan tidak ditemukan
        </h2>
        <Button
          variant="link"
          onClick={() => setLocation("/arsip")}
          className="mt-4"
        >
          Kembali ke Arsip
        </Button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setIsGeneratingPDF(true);
    try {
      await generateReportPDF(report, printRef.current, true);
      toast({
        title: "PDF berhasil dibuat",
        description: "File PDF telah diunduh ke perangkat Anda.",
      });
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast({
        title: "Gagal membuat PDF",
        description: "Terjadi kesalahan saat menghasilkan file PDF.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const photos = report.foto || [];
  const hasPhotos = photos.length > 0;

  /** Rows definition: label | value */
  const rows: Array<{ label: string; value: string; preWrap?: boolean }> = [
    { label: "Hari / Tanggal / Waktu", value: report.tanggal },
    { label: "Lokasi", value: report.lokasi },
    { label: "Petugas", value: report.petugas },
    { label: "Target Kinerja", value: report.targetKinerja },
    { label: "Sasaran / Uraian Kegiatan", value: report.sasaran },
    { label: "Indikator Kinerja", value: report.indikator },
    { label: "Judul Kegiatan", value: report.judulKegiatan },
    { label: "Arahan / Temuan", value: report.arahanTemuan, preWrap: true },
    { label: "Status", value: report.status },
    { label: "Tindak Lanjut", value: report.tindakLanjut, preWrap: true },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 print:pb-0">
      {/* Action Bar — hidden when printing */}
      <div className="flex flex-wrap justify-between items-center mb-8 gap-3 no-print">
        <Button
          variant="ghost"
          onClick={() => setLocation("/arsip")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Button>
        <div className="flex gap-3 flex-wrap">
          <Button
            variant="outline"
            onClick={() => setLocation(`/formulir?edit=${report.id}`)}
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline" onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="gap-2"
          >
            {isGeneratingPDF ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isGeneratingPDF ? "Membuat PDF…" : "Download PDF"}
          </Button>
        </div>
      </div>

      {/* Report Content — this is the printable / PDF area */}
      <div
        ref={printRef}
        className="bg-card border border-border rounded-xl p-8 md:p-12 shadow-sm print:shadow-none print:border-none print:rounded-none print:p-0 print:m-0 print-container report-template"
      >
        <table className="w-full border-collapse report-table">
          <tbody>
            {/* Photo row — inside the table, spanning all 3 columns */}
            {hasPhotos && (
              <tr>
                <td
                  colSpan={3}
                  className={`report-photo-cell ${photos.length === 1 ? "report-photo-single" : ""}`}
                >
                  {photos.length === 1 ? (
                    <img
                      src={photos[0]}
                      alt="Bukti Dukung 1"
                      style={{ width: "100%", height: "auto" }}
                    />
                  ) : (
                    <div className="report-photo-dual">
                      {photos.map((src, idx) => (
                        <img
                          key={idx}
                          src={src}
                          alt={`Bukti Dukung ${idx + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            )}

            {/* Data rows: Label | : | Value */}
            {rows.map((row, idx) => (
              <tr key={idx}>
                <th>{row.label}</th>
                <td className="col-colon">:</td>
                <td className={row.preWrap ? "whitespace-pre-wrap" : ""}>
                  {row.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Signature removed as requested */}
      </div>
    </div>
  );
}
