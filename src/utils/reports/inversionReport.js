import html2canvas from 'html2canvas';
import {
  createReport, sectionTitle, paragraph, metricRow,
  table, addImage, ensureSpace, finishReport, MARGIN, PAGE_W,
} from '../pdfReport';

const fmt = (n) => '$ ' + Math.round(n).toLocaleString('es-CL', { maximumFractionDigits: 0 });
const pct = (n, digits = 1) => n.toLocaleString('es-CL', { minimumFractionDigits: digits, maximumFractionDigits: digits }) + ' %';

export async function generateInversionReport({
  chartElement, initial, monthly, rate, years, result,
  includeInitial, includeMonthly, scenarios,
}) {
  const { doc } = createReport(
    'Informe del Simulador de Inversión',
    `Plazo: ${years} años · Rentabilidad anual estimada: ${pct(Number(rate), 2)}`
  );
  let y = 40;

  y = sectionTitle(doc, 'Parámetros de la simulación', y);
  y = metricRow(doc, y, [
    { label: 'Inversión inicial', value: fmt(includeInitial ? initial : 0) },
    { label: 'Aporte mensual', value: fmt(includeMonthly ? monthly : 0) },
    { label: 'Plazo', value: `${years} años` },
    { label: 'Rentabilidad anual', value: pct(Number(rate), 2) },
  ]);

  y = sectionTitle(doc, 'Resultado proyectado', y);
  y = metricRow(doc, y, [
    { label: 'Total aportado', value: fmt(result.totalAportado) },
    { label: 'Ganancia por rentabilidad', value: fmt(result.ganancia), color: [22, 163, 74] },
    { label: 'Capital final estimado', value: fmt(result.capitalFinal), color: [37, 99, 235] },
  ]);

  y = paragraph(doc, `Al cabo de ${years} años, tu inversión de ${fmt(includeInitial ? initial : 0)} inicial${includeMonthly ? ` más aportes mensuales de ${fmt(monthly)}` : ''} podría alcanzar un capital de ${fmt(result.capitalFinal)}, de los cuales ${fmt(result.ganancia)} corresponden a ganancia por rentabilidad (${pct(result.porcentajeGenerado, 1)} del capital final).`, y);

  // Captura del gráfico de evolución
  if (chartElement) {
    try {
      const canvas = await html2canvas(chartElement, { backgroundColor: '#ffffff', scale: 2 });
      const dataUrl = canvas.toDataURL('image/png');
      const imgW = PAGE_W - MARGIN * 2;
      const imgH = (canvas.height / canvas.width) * imgW;
      y = ensureSpace(doc, y, imgH + 14);
      y = sectionTitle(doc, 'Evolución de la inversión', y);
      y = addImage(doc, y, dataUrl, imgW, imgH);
    } catch {
      // si falla la captura, se omite el gráfico sin interrumpir el informe
    }
  }

  y = ensureSpace(doc, y, 50);
  y = sectionTitle(doc, 'Tabla de crecimiento por año', y);
  y = table(doc, y, ['Año', 'Aportado acumulado', 'Ganancia acumulada', 'Saldo total'],
    result.series.map((row) => [
      row.year === 0 ? 'Año 0' : row.year, fmt(row.aportado), fmt(row.ganancia), fmt(row.total),
    ]));

  if (scenarios && scenarios.length) {
    y = ensureSpace(doc, y, 40);
    y = sectionTitle(doc, 'Comparación de escenarios', y);
    y = table(doc, y, ['Escenario', 'Rentabilidad anual', 'Total aportado', 'Ganancia', 'Capital final'],
      scenarios.map((s) => [s.label, pct(Number(s.rate), 2), fmt(s.result.totalAportado), fmt(s.result.ganancia), fmt(s.result.capitalFinal)]));
  }

  y = ensureSpace(doc, y, 20);
  paragraph(doc, 'Este informe entrega resultados estimados basados en una rentabilidad constante. Las inversiones pueden aumentar o disminuir su valor y los rendimientos pasados no garantizan resultados futuros.', y, { size: 8, color: [100, 116, 139] });

  finishReport(doc, `simulador-inversion-${Date.now()}.pdf`);
}
