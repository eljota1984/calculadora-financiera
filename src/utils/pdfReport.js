import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ── Identidad visual ──────────────────────────────────────────────────────
const BRAND = {
  dark: [15, 23, 42],       // slate-900
  primary: [37, 99, 235],   // blue-600
  green: [22, 163, 74],
  amber: [217, 119, 6],
  red: [220, 38, 38],
  gray: [100, 116, 139],
  lightGray: [241, 245, 249],
};

const PAGE_W = 210;
const MARGIN = 14;

function todayStr() {
  return new Date().toLocaleDateString('es-CL', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

export function createReport(title, subtitle) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y;

  // Encabezado
  doc.setFillColor(...BRAND.dark);
  doc.rect(0, 0, PAGE_W, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('💸 Finanzas Personales', MARGIN, 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(200, 210, 230);
  doc.text('Informe generado automáticamente · finanzas personales para Chile', MARGIN, 16.5);

  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(title, MARGIN, 24);

  y = 34;
  if (subtitle) {
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...BRAND.gray);
    doc.text(subtitle, MARGIN, y);
    y += 6;
  }
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.gray);
  doc.text(`Fecha de emisión: ${todayStr()}`, MARGIN, y);
  y += 6;

  doc.setDrawColor(...BRAND.lightGray);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 6;

  return { doc, y, BRAND, PAGE_W, MARGIN };
}

export function sectionTitle(doc, text, y) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(...BRAND.dark);
  doc.text(text, MARGIN, y);
  return y + 6;
}

export function paragraph(doc, text, y, opts = {}) {
  const width = opts.width || PAGE_W - MARGIN * 2;
  doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
  doc.setFontSize(opts.size || 9.5);
  doc.setTextColor(...(opts.color || BRAND.dark));
  const lines = doc.splitTextToSize(text, width);
  doc.text(lines, MARGIN, y);
  return y + lines.length * (opts.lineHeight || 4.6) + (opts.gap ?? 3);
}

// Tarjetas de métricas en fila (2 a 4 por fila)
export function metricRow(doc, y, metrics) {
  const gap = 4;
  const w = (PAGE_W - MARGIN * 2 - gap * (metrics.length - 1)) / metrics.length;
  const h = 20;
  metrics.forEach((m, i) => {
    const x = MARGIN + i * (w + gap);
    doc.setFillColor(...BRAND.lightGray);
    doc.roundedRect(x, y, w, h, 2, 2, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...BRAND.gray);
    doc.text(m.label, x + 3, y + 6, { maxWidth: w - 6 });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...(m.color || BRAND.dark));
    doc.text(m.value, x + 3, y + 15, { maxWidth: w - 6 });
  });
  return y + h + 6;
}

// Banner de estado (verde/amarillo/rojo)
export function statusBanner(doc, y, status, message) {
  const colors = { verde: BRAND.green, amarillo: BRAND.amber, rojo: BRAND.red, neutral: BRAND.gray };
  const color = colors[status] || BRAND.gray;
  const width = PAGE_W - MARGIN * 2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const lines = doc.splitTextToSize(message, width - 8);
  const h = lines.length * 4.4 + 6;

  doc.setFillColor(color[0], color[1], color[2]);
  doc.rect(MARGIN, y, 1.6, h, 'F');
  doc.setFillColor(...BRAND.lightGray);
  doc.rect(MARGIN + 1.6, y, width - 1.6, h, 'F');
  doc.setTextColor(...BRAND.dark);
  doc.text(lines, MARGIN + 5, y + 5.2);
  return y + h + 6;
}

export function table(doc, y, head, body, opts = {}) {
  autoTable(doc, {
    startY: y,
    head: [head],
    body,
    margin: { left: MARGIN, right: MARGIN },
    styles: { fontSize: 8, cellPadding: 2, textColor: BRAND.dark },
    headStyles: { fillColor: BRAND.dark, textColor: 255, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: BRAND.lightGray },
    ...opts,
  });
  return doc.lastAutoTable.finalY + 7;
}

export function bulletList(doc, y, items) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...BRAND.dark);
  items.forEach((item) => {
    const lines = doc.splitTextToSize(item, PAGE_W - MARGIN * 2 - 6);
    doc.circle(MARGIN + 1, y - 1.2, 0.7, 'F');
    doc.text(lines, MARGIN + 5, y);
    y += lines.length * 4.6 + 2;
  });
  return y + 2;
}

export function ensureSpace(doc, y, needed) {
  const pageH = doc.internal.pageSize.getHeight();
  if (y + needed > pageH - 18) {
    doc.addPage();
    return 20;
  }
  return y;
}

export function addImage(doc, y, dataUrl, imgW, imgH) {
  const x = MARGIN + (PAGE_W - MARGIN * 2 - imgW) / 2;
  doc.addImage(dataUrl, 'PNG', x, y, imgW, imgH);
  return y + imgH + 6;
}

export function finishReport(doc, filename) {
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...BRAND.gray);
    doc.text('Informe referencial, no constituye asesoría financiera profesional.', MARGIN, pageH - 10);
    doc.text(`Página ${i} de ${pageCount}`, PAGE_W - MARGIN, pageH - 10, { align: 'right' });
  }
  doc.save(filename);
}

export { BRAND, PAGE_W, MARGIN };
