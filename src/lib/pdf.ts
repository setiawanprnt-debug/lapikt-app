import type { Report } from "./store";

/**
 * Generate PDF from the report preview element.
 * Uses html2pdf.js for client-side HTML-to-PDF conversion.
 *
 * A4 = 210 × 297 mm. With 15mm margins on each side:
 *   Content area = 180 × 267 mm.
 *
 * Table structure matches the Word template:
 *   Row 1 (colspan=3): Photo(s) — 1 full-width or 2 side-by-side
 *   Row 2–11: Label | : | Value
 *
 * The table is set to height:100% of the wrapper so rows stretch
 * to fill the entire A4 content area.
 */

/* ── A4 content dimensions (after 15mm margins) ────────────────── */
const CONTENT_W = "180mm";
const CONTENT_H = "267mm";

function buildPhotoHtml(photos: string[]): string {
  if (!photos || photos.length === 0) return "";

  if (photos.length === 1) {
    return `
    <tr>
      <td colspan="3" style="text-align:center; padding:4px; border:1px solid #333; background:#fff;">
        <img src="${photos[0]}" style="max-width:100%; max-height:350px; width:auto; height:auto; display:inline-block; object-fit:contain;" />
      </td>
    </tr>`;
  }

  // 2 photos side by side using nested table (html2canvas doesn't handle flex well)
  return `
    <tr>
      <td colspan="3" style="padding:4px; border:1px solid #333; background:#fff;">
        <table style="width:100%; border:none; border-collapse:collapse;">
          <tr>
            <td style="width:50%; padding:0 2px 0 0; border:none;">
              <img src="${photos[0]}" alt="Foto 1" style="width:100%; height:auto; display:block; object-fit:cover;" />
            </td>
            <td style="width:50%; padding:0 0 0 2px; border:none;">
              <img src="${photos[1]}" alt="Foto 2" style="width:100%; height:auto; display:block; object-fit:cover;" />
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

function buildRow(label: string, value: string, preWrap = false): string {
  const thStyle = `width:32%; text-align:left; vertical-align:top; padding:6px 8px; border:1px solid #333; background:#eee; font-weight:700; font-size:12pt;`;
  const colonStyle = `width:1.2em; text-align:center; vertical-align:top; padding:6px 0; border:1px solid #333; background:#eee; font-weight:700; font-size:12pt;`;
  const tdStyle = `vertical-align:top; padding:6px 8px; border:1px solid #333; font-size:12pt;${preWrap ? " white-space:pre-wrap;" : ""}`;

  return `
    <tr style="vertical-align:top;">
      <th style="${thStyle}"><div style="margin:0; padding:0;">${label}</div></th>
      <td style="${colonStyle}"><div style="margin:0; padding:0;">:</div></td>
      <td style="${tdStyle}"><div style="margin:0; padding:0; ${preWrap ? 'white-space:pre-wrap;' : ''}">${value}</div></td>
    </tr>`;
}


function createSafePdfContent(report: Report): HTMLElement {
  const wrapper = document.createElement("div");

  // Ukuran A4 area (setelah margin 15mm kiri-kanan)
  wrapper.style.width = "680px";
  wrapper.style.boxSizing = "border-box";
  wrapper.style.background = "#fff";
  wrapper.style.fontFamily = "Calibri, Arial, sans-serif";
  wrapper.style.fontSize = "11pt";
  wrapper.style.lineHeight = "1.5";
  wrapper.style.color = "#000";
  wrapper.style.padding = "0";
  wrapper.style.margin = "0";

  const photos = (report.foto || []).filter(Boolean);
  const photoRow = buildPhotoHtml(photos);

  const dataRows = [
    buildRow("Hari / Tanggal / Waktu", report.tanggal),
    buildRow("Lokasi", report.lokasi),
    buildRow("Petugas", report.petugas),
    buildRow("Target Kinerja", report.targetKinerja),
    buildRow("Sasaran / Uraian Kegiatan", report.sasaran),
    buildRow("Indikator Kinerja", report.indikator),
    buildRow("Judul Kegiatan", report.judulKegiatan),
    buildRow("Arahan / Temuan", report.arahanTemuan, true),
    buildRow("Status", report.status),
    buildRow("Tindak Lanjut", report.tindakLanjut, true),
  ].join("");

  wrapper.innerHTML = `
  <div style="min-height:1000px;">

    <table style="
      width:100%;
      border-collapse:collapse;
      font-size:11pt;
      line-height:1.5;
    ">
      <tbody>
        ${photoRow}
        ${dataRows}
      </tbody>
    </table>

    <div style="height:120px;"></div>

  </div>
`;

  return wrapper;
}

export async function generateReportPDF(
  report: Report,
  element: HTMLElement,
  download = true
): Promise<Blob> {
  // @ts-ignore - html2pdf.js doesn't have perfect types
  const html2pdf = (await import("html2pdf.js")).default;

  const options: any = {
  margin: [5, 15, 15, 15],
  filename: report.judulKegiatan ? `Laporan_${report.judulKegiatan}.pdf` : "Laporan_Kinerja.pdf",

  html2canvas: {
  scale: 1,
  useCORS: true,
  backgroundColor: "#ffffff",

  scrollY: 0,
  scrollX: 0,
  },

  jsPDF: {
    unit: "mm",
    format: "a4",
    orientation: "portrait",
  },

  pagebreak: { mode: ["avoid-all"] },
};

  const safeElement = createSafePdfContent(report);
  
  const printContainer = document.createElement("div");
  printContainer.style.position = "fixed";
  printContainer.style.left = "0";
  printContainer.style.top = "0";
  printContainer.style.zIndex = "-9999";
  printContainer.appendChild(safeElement);
  document.body.appendChild(printContainer);

  console.log(safeElement);
  await new Promise((r) => setTimeout(r, 500));

  // Wait for images inside safeElement to finish loading
  const imgs = Array.from(safeElement.querySelectorAll("img"));
 if (imgs.length > 0) {
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if ((img as HTMLImageElement).complete) return resolve();
          img.addEventListener("load", () => resolve());
          img.addEventListener("error", () => resolve());
        })
    )
  );
}

// ⛔ tunggu render final
await new Promise((r) => setTimeout(r, 300));

  window.scrollTo(0, 0);

  const worker = html2pdf().set(options).from(safeElement);
  let blob: Blob;

  try {
    if (download) {
      await worker.save();
    }
    blob = await worker.outputPdf("blob");
  } catch (err) {
    console.error("html2pdf save failed, falling back to blob output:", err);
    try {
      blob = await worker.outputPdf("blob");
      if (download) {
        const a = document.createElement("a");
        const url = URL.createObjectURL(blob);
        a.href = url;
        a.download = options.filename as string;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
    } catch (err2) {
      console.error("Failed to generate PDF blob:", err2);
      throw err2;
    }
  } finally {
    printContainer.remove();
  }

  return blob;
}
