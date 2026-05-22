import { useState } from "react";
import { useReports, type Report, useAuth } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { parseISO, format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  FolderOpen,
  FileText,
  Trash2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/** Group reports: Month → Sasaran → Reports */
function buildGroupedTree(reports: Report[]) {
  const tree: Record<string, Record<string, Report[]>> = {};

  for (const report of reports) {
    // Month group
    let monthKey: string;
    try {
      const date = parseISO(report.createdAt);
      monthKey = format(date, "MMMM yyyy", { locale: idLocale });
    } catch {
      monthKey = "Bulan Tidak Diketahui";
    }

    if (!tree[monthKey]) tree[monthKey] = {};

    // Sasaran (tupoksi) group
    const sasaranKey = report.sasaran || "Tanpa Sasaran";
    if (!tree[monthKey][sasaranKey]) tree[monthKey][sasaranKey] = [];

    tree[monthKey][sasaranKey].push(report);
  }

  return tree;
}

function CollapsibleSection({
  title,
  icon,
  count,
  defaultOpen = false,
  children,
  depth = 0,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
  depth?: number;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn(depth > 0 && "ml-4 md:ml-6")}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 py-3 px-3 rounded-lg hover:bg-muted/50 transition-colors text-left group"
      >
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 transition-transform" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 transition-transform" />
        )}
        {icon}
        <span
          className={cn(
            "font-semibold flex-1 truncate",
            depth === 0 ? "text-lg text-foreground" : "text-sm text-foreground/80"
          )}
        >
          {title}
        </span>
        <Badge
          variant="secondary"
          className="text-xs tabular-nums shrink-0"
        >
          {count}
        </Badge>
      </button>
      {isOpen && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
          {children}
        </div>
      )}
    </div>
  );
}

function DeleteButton({ report, onDelete }: { report: Report; onDelete: (id: string) => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          aria-label={`Hapus laporan ${report.judulKegiatan}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Laporan?</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus laporan{" "}
            <strong>"{report.judulKegiatan}"</strong>?
            <br />
            Tindakan ini tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onDelete(report.id);
            }}
          >
            Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function ArsipPage() {
  const { reports, deleteReport } = useReports();
  const { user } = useAuth();
  const { toast } = useToast();

  const totalKegiatan = reports.length;
  const uniqueSasaran = new Set(reports.map((r) => r.sasaran)).size;
  const tree = buildGroupedTree(reports);

  const handleDelete = (id: string) => {
    deleteReport(id);
    toast({
      title: "Laporan dihapus",
      description: "Laporan berhasil dihapus dari arsip.",
    });
  };

  // Sort months: newest first
  const sortedMonths = Object.keys(tree).sort((a, b) => {
    if (a === "Bulan Tidak Diketahui") return 1;
    if (b === "Bulan Tidak Diketahui") return -1;
    // Parse back to compare dates
    try {
      const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember",
      ];
      const [mA, yA] = a.split(" ");
      const [mB, yB] = b.split(" ");
      const dateA = Number(yA) * 12 + months.indexOf(mA);
      const dateB = Number(yB) * 12 + months.indexOf(mB);
      return dateB - dateA;
    } catch {
      return b.localeCompare(a);
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2 text-foreground">
          📂 Arsip Laporan
        </h1>
        <p className="text-muted-foreground">
          Seluruh laporan kegiatan IKT, dikelompokkan berdasarkan bulan dan
          sasaran/tupoksi.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:gap-8">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Kegiatan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">
              {totalKegiatan}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tupoksi Terlaksana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">
              {uniqueSasaran}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grouped Tree */}
      <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4 md:p-6">
          {sortedMonths.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-40" />
              <p className="text-lg font-medium">Belum ada laporan</p>
              <p className="text-sm mt-1">
                Mulai isi formulir untuk menambahkan laporan kegiatan.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedMonths.map((month) => {
                const sasaranGroups = tree[month];
                const monthCount = Object.values(sasaranGroups).reduce(
                  (sum, arr) => sum + arr.length,
                  0
                );
                const sortedSasaran = Object.keys(sasaranGroups).sort();

                return (
                  <CollapsibleSection
                    key={month}
                    title={month}
                    icon={
                      <Calendar className="h-5 w-5 text-primary shrink-0" />
                    }
                    count={monthCount}
                    defaultOpen={sortedMonths.indexOf(month) === 0}
                    depth={0}
                  >
                    <div className="space-y-1 pb-2">
                      {sortedSasaran.map((sasaran) => {
                        const items = sasaranGroups[sasaran];
                        // Truncate long sasaran text for display
                        const shortSasaran =
                          sasaran.length > 80
                            ? sasaran.slice(0, 80) + "…"
                            : sasaran;

                        return (
                          <CollapsibleSection
                            key={sasaran}
                            title={shortSasaran}
                            icon={
                              <FolderOpen className="h-4 w-4 text-amber-500 shrink-0" />
                            }
                            count={items.length}
                            defaultOpen={false}
                            depth={1}
                          >
                            <div className="space-y-2 pl-4 md:pl-6 py-2">
                              {items.map((report) => (
                                <div
                                  key={report.id}
                                  className="flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-card/30 hover:border-primary/50 hover:bg-card/60 transition-all group"
                                >
                                  <Link
                                    href={`/preview/${report.id}`}
                                    className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                                  >
                                    <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm truncate text-foreground group-hover:text-primary transition-colors">
                                        {report.judulKegiatan}
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        {report.tanggal} •{" "}
                                        {report.petugas}
                                      </p>
                                    </div>
                                    <Badge
                                      variant={
                                        report.status === "Selesai"
                                          ? "default"
                                          : "destructive"
                                      }
                                      className={cn(
                                        "text-xs shrink-0",
                                        report.status === "Selesai"
                                          ? "bg-green-600 hover:bg-green-700"
                                          : "bg-amber-600 hover:bg-amber-700"
                                      )}
                                    >
                                      {report.status}
                                    </Badge>
                                  </Link>
                                  {user?.role === "admin" && (
                                    <DeleteButton
                                      report={report}
                                      onDelete={handleDelete}
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          </CollapsibleSection>
                        );
                      })}
                    </div>
                  </CollapsibleSection>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
