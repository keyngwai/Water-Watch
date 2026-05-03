import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';

const A4_W = 595.28;
const A4_H = 841.89;
const MARGIN = 40;

function toNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Standard fonts only accept WinAnsi-safe strings; avoid PDF generation crashes. */
function pdfSafe(s: unknown, maxLen: number): string {
  const t = String(s ?? '').slice(0, maxLen);
  return Array.from(t)
    .map((ch) => {
      const code = ch.charCodeAt(0);
      if (code === 9 || code === 10 || code === 13) return ' ';
      if (code >= 32 && code <= 255 && code !== 127) return ch;
      return '?';
    })
    .join('');
}

function statLines(rows: unknown, labelKey: string): { label: string; value: number }[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => {
    const r = row as Record<string, unknown>;
    return { label: String(r[labelKey] ?? '—'), value: toNum(r.count) };
  });
}

function trendLines(raw: unknown): { label: string; value: number }[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((row) => {
    const r = row as Record<string, unknown>;
    const d = r.date as Date | string | undefined;
    const label =
      d instanceof Date ? d.toISOString().slice(0, 10) : String(d ?? '').slice(0, 10);
    return { label: label || '—', value: toNum(r.count) };
  });
}

class PdfLayout {
  page: PDFPage;
  yFromTop = MARGIN;
  constructor(
    private doc: PDFDocument,
    private font: PDFFont,
    private fontBold: PDFFont
  ) {
    this.page = doc.addPage([A4_W, A4_H]);
  }

  private toPdfY(): number {
    return A4_H - this.yFromTop;
  }

  newPage(): void {
    this.page = this.doc.addPage([A4_W, A4_H]);
    this.yFromTop = MARGIN;
  }

  ensureSpace(lines: number, lineH = 14): void {
    if (this.yFromTop + lines * lineH > A4_H - MARGIN) {
      this.newPage();
    }
  }

  heading(text: string, size = 14): void {
    this.ensureSpace(2, 20);
    this.page.drawText(pdfSafe(text, 120), {
      x: MARGIN,
      y: this.toPdfY(),
      size,
      font: this.fontBold,
      color: rgb(0.047, 0.29, 0.45),
    });
    this.yFromTop += size + 6;
  }

  line(text: string, size = 9): void {
    this.ensureSpace(1);
    this.page.drawText(pdfSafe(text, 200), {
      x: MARGIN,
      y: this.toPdfY(),
      size,
      font: this.font,
      color: rgb(0.12, 0.16, 0.22),
    });
    this.yFromTop += 12;
  }

  muted(text: string, size = 8): void {
    this.ensureSpace(1);
    this.page.drawText(pdfSafe(text, 200), {
      x: MARGIN,
      y: this.toPdfY(),
      size,
      font: this.font,
      color: rgb(0.39, 0.45, 0.55),
    });
    this.yFromTop += 11;
  }

  rule(): void {
    this.ensureSpace(1);
    const y = this.toPdfY();
    this.page.drawLine({
      start: { x: MARGIN, y },
      end: { x: A4_W - MARGIN, y },
      thickness: 0.5,
      color: rgb(0.8, 0.85, 0.9),
    });
    this.yFromTop += 8;
  }

  /** Simple horizontal bar (value vs max). */
  barRow(label: string, value: number, maxVal: number, accent: [number, number, number]): void {
    this.ensureSpace(1, 18);
    const labelW = 100;
    const barMax = A4_W - 2 * MARGIN - labelW - 40;
    const barW = Math.max(2, (value / Math.max(1, maxVal)) * barMax);
    const yTop = this.yFromTop;
    const h = 11;
    this.page.drawText(pdfSafe(label, 28), {
      x: MARGIN,
      y: A4_H - yTop - 9,
      size: 8,
      font: this.font,
      color: rgb(0.28, 0.33, 0.41),
    });
    this.page.drawRectangle({
      x: MARGIN + labelW,
      y: A4_H - yTop - h,
      width: barW,
      height: h,
      color: rgb(accent[0], accent[1], accent[2]),
    });
    this.page.drawText(pdfSafe(String(value), 8), {
      x: MARGIN + labelW + barW + 4,
      y: A4_H - yTop - 9,
      size: 8,
      font: this.font,
      color: rgb(0.12, 0.16, 0.22),
    });
    this.yFromTop += 16;
  }

  /** Sparkline-style trend using line segments. */
  trend(title: string, points: { label: string; value: number }[]): void {
    this.ensureSpace(1);
    this.heading(title, 11);
    const slice = points.slice(-28);
    if (slice.length === 0) {
      this.muted('No trend data for the selected filters.');
      return;
    }
    const chartH = 100;
    const chartW = A4_W - 2 * MARGIN;
    const yStart = this.yFromTop;
    const pad = 8;
    const innerW = chartW - 2 * pad;
    const innerH = chartH - 2 * pad;
    const maxV = Math.max(1, ...slice.map((p) => p.value));
    const baseY = A4_H - (yStart + chartH - pad);

    this.page.drawRectangle({
      x: MARGIN,
      y: A4_H - yStart - chartH,
      width: chartW,
      height: chartH,
      borderColor: rgb(0.89, 0.91, 0.94),
      borderWidth: 0.5,
    });

    if (slice.length === 1) {
      const py = baseY - (slice[0].value / maxV) * (innerH - 6);
      const px = MARGIN + pad + innerW / 2;
      this.page.drawRectangle({
        x: px - 2,
        y: py - 2,
        width: 4,
        height: 4,
        color: rgb(0.01, 0.41, 0.63),
      });
    } else {
      for (let i = 1; i < slice.length; i += 1) {
        const x1 = MARGIN + pad + ((i - 1) / (slice.length - 1)) * innerW;
        const x2 = MARGIN + pad + (i / (slice.length - 1)) * innerW;
        const y1 = baseY - (slice[i - 1].value / maxV) * (innerH - 6);
        const y2 = baseY - (slice[i].value / maxV) * (innerH - 6);
        this.page.drawLine({
          start: { x: x1, y: y1 },
          end: { x: x2, y: y2 },
          thickness: 1,
          color: rgb(0.01, 0.41, 0.63),
        });
      }
    }

    this.yFromTop = yStart + chartH + 6;
    this.muted(`${pdfSafe(slice[0]?.label, 12)} -> ${pdfSafe(slice[slice.length - 1]?.label, 12)}`);
  }

  tableRow(cols: string[], widths: number[]): void {
    this.ensureSpace(1, 18);
    let x = MARGIN;
    const y = this.toPdfY() - 3;
    cols.forEach((cell, i) => {
      const w = widths[i] ?? 80;
      this.page.drawText(pdfSafe(cell, 80), {
        x: x + 2,
        y,
        size: 7,
        font: this.font,
        color: rgb(0.12, 0.16, 0.22),
        maxWidth: w - 4,
      });
      x += w;
    });
    this.yFromTop += 14;
  }
}

/** Build admin PDF bytes (pdf-lib — avoids pdfkit/fontkit/tslib resolution issues). */
export async function buildReportPdfBytes(
  rows: Record<string, unknown>[],
  stats: Record<string, unknown>
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const layout = new PdfLayout(doc, font, fontBold);

  layout.page.drawText('Maji Watch', {
    x: MARGIN,
    y: A4_H - MARGIN - 22,
    size: 20,
    font: fontBold,
    color: rgb(0.047, 0.29, 0.45),
  });
  layout.page.drawText('Reports export & analytics snapshot', {
    x: MARGIN,
    y: A4_H - MARGIN - 44,
    size: 12,
    font: font,
    color: rgb(0.2, 0.25, 0.33),
  });
  layout.yFromTop = MARGIN + 56;
  layout.muted(`Generated (UTC): ${new Date().toISOString()}`);
  layout.muted(`Total records matching filters: ${rows.length}`);
  layout.yFromTop += 6;

  const byStatus = statLines(stats.byStatus, 'status');
  const byCategory = statLines(stats.byCategory, 'category');
  const daily = trendLines(stats.dailyTrend);

  layout.heading('Analytics (same filters as export)', 12);
  layout.rule();

  const maxS = Math.max(1, ...byStatus.map((x) => x.value));
  byStatus.slice(0, 12).forEach((item) => {
    layout.barRow(item.label, item.value, maxS, [0.01, 0.52, 0.78]);
  });

  const maxC = Math.max(1, ...byCategory.map((x) => x.value));
  layout.yFromTop += 4;
  byCategory.slice(0, 12).forEach((item) => {
    layout.barRow(item.label, item.value, maxC, [0.02, 0.59, 0.41]);
  });

  layout.yFromTop += 6;
  layout.trend('Daily volume (last ~90 days, filtered)', daily);

  layout.yFromTop += 8;
  layout.heading('Report detail (excerpt)', 12);
  layout.rule();

  const colW = [72, 56, 200, A4_W - 2 * MARGIN - 72 - 56 - 200];
  layout.ensureSpace(1);
  layout.page.drawRectangle({
    x: MARGIN,
    y: A4_H - layout.yFromTop - 14,
    width: A4_W - 2 * MARGIN,
    height: 14,
    color: rgb(0.047, 0.29, 0.45),
  });
  const headerY = A4_H - layout.yFromTop - 11;
  let hx = MARGIN;
  ['Ref', 'Status', 'Title', 'County'].forEach((h, i) => {
    layout.page.drawText(pdfSafe(h, 20), {
      x: hx + 3,
      y: headerY,
      size: 8,
      font: fontBold,
      color: rgb(1, 1, 1),
      maxWidth: colW[i] - 6,
    });
    hx += colW[i];
  });
  layout.yFromTop += 18;

  const maxRows = 120;
  rows.slice(0, maxRows).forEach((row, index) => {
    if (layout.yFromTop > A4_H - MARGIN - 24) {
      layout.newPage();
    }
    const bg = index % 2 === 0 ? rgb(0.97, 0.98, 0.99) : rgb(1, 1, 1);
    layout.page.drawRectangle({
      x: MARGIN,
      y: A4_H - layout.yFromTop - 16,
      width: A4_W - 2 * MARGIN,
      height: 16,
      color: bg,
    });
    layout.tableRow(
      [
        String(row.reference_code ?? ''),
        String(row.status ?? ''),
        String(row.title ?? ''),
        String(row.county ?? ''),
      ],
      colW
    );
  });

  layout.yFromTop += 4;
  layout.muted(
    rows.length > maxRows
      ? `Showing first ${maxRows} rows. Use CSV export for the full dataset.`
      : `Showing all ${rows.length} rows in this export window.`
  );

  return doc.save();
}
