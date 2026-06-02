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

async function checkIsPortrait(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.height > img.width);
    img.onerror = () => resolve(true);
    img.src = src;
  });
}

async function buildPhotoHtml(photos: string[]): Promise<string> {
  if (!photos || photos.length === 0) return "";

  const containerStyle = `border-bottom: 1px solid #333; background: #fff; padding: 12px; box-sizing: border-box;`;
  const imgStyle = `max-width: 100%; max-height: 350px; object-fit: contain; border: 2px solid #555; padding: 4px; box-sizing: border-box; display: block; margin: 0 auto; background: #fafafa;`;

  if (photos.length === 1) {
    return `
      <div style="${containerStyle}">
        <img src="${photos[0]}" style="${imgStyle}" />
      </div>`;
  }

  const isPortrait = await checkIsPortrait(photos[0]);

  if (isPortrait) {
    // Side by side
    return `
      <div style="${containerStyle} display: flex; gap: 16px; justify-content: center;">
        <div style="flex: 1;">
          <img src="${photos[0]}" style="${imgStyle} width: 100%;" />
        </div>
        <div style="flex: 1;">
          <img src="${photos[1]}" style="${imgStyle} width: 100%;" />
        </div>
      </div>`;
  } else {
    // Top and bottom
    return `
      <div style="${containerStyle}">
        <img src="${photos[0]}" style="${imgStyle} margin-bottom: 16px;" />
        <img src="${photos[1]}" style="${imgStyle}" />
      </div>`;
  }
}

function buildRow(label: string, value: string, preWrap = false): string {
  const rowStyle = `display: flex; border-bottom: 1px solid #333;`;
  const thStyle = `width: 32%; padding: 6px 8px; background: #eee; font-weight: 700; box-sizing: border-box; flex-shrink: 0;`;
  const colonStyle = `width: 1.5em; text-align: center; padding: 6px 0; background: #eee; font-weight: 700; box-sizing: border-box; border-left: 1px solid #333; flex-shrink: 0;`;
  const tdStyle = `flex: 1; padding: 6px 8px; box-sizing: border-box; border-left: 1px solid #333; ${preWrap ? "white-space: pre-wrap;" : ""}`;

  return `
    <div style="${rowStyle}">
      <div style="${thStyle}">${label}</div>
      <div style="${colonStyle}">:</div>
      <div style="${tdStyle}">${value || ""}</div>
    </div>`;
}


async function createSafePdfContent(report: Report): Promise<HTMLElement> {
  const wrapper = document.createElement("div");

  // Ukuran A4 area (setelah margin 15mm kiri-kanan)
  wrapper.style.width = "680px";
  wrapper.style.boxSizing = "border-box";
  wrapper.style.background = "#fff";
  wrapper.style.fontFamily = "Calibri";
  wrapper.style.fontSize = "12pt";
  wrapper.style.lineHeight = "1.5";
  wrapper.style.color = "#000";
  wrapper.style.padding = "0";
  wrapper.style.margin = "0";

  const photos = (report.foto || []).filter(Boolean);
  const photoRow = await buildPhotoHtml(photos);

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
    <div style="border-top: 1px solid #333; border-left: 1px solid #333; border-right: 1px solid #333; display: flex; flex-direction: column;">
      ${photoRow}
      ${dataRows}
    </div>
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

  const safeElement = await createSafePdfContent(report);
  
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
