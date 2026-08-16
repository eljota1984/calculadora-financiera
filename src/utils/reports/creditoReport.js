import {
  createReport, sectionTitle, statusBanner,
  table, ensureSpace, finishReport,
} from '../pdfReport';

const fmt = (n) => '$' + Math.round(n).toLocaleString('es-CL');
const fmtP = (n) => n.toFixed(2) + '%';

export function generateCreditoReport(results) {
  const { cap, n, a, b, ingreso, deudas, gastos } = results;
  const { doc } = createReport(
    'Informe Comparativo de Créditos de Consumo',
    `Monto solicitado: ${fmt(cap)} · Plazo base: ${n} cuotas`
  );
  let y = 40;

  y = sectionTitle(doc, 'Resumen comparativo', y);
  y = table(doc, y, ['Concepto', 'Banco A', 'Banco B'], [
    ['Tasa mensual', fmtP(a.tasa), fmtP(b.tasa)],
    ['Cuota mensual (con seguros y cargos)', fmt(a.cuotaTotal), fmt(b.cuotaTotal)],
    ['CAE calculado', fmtP(a.caeCalc), fmtP(b.caeCalc)],
    ['Comisión inicial', fmt(a.comision), fmt(b.comision)],
    ['Total intereses pagados', fmt(a.totalInt), fmt(b.totalInt)],
    ['Total seguros pagados', fmt(a.totalSeg), fmt(b.totalSeg)],
    ['Costo total del crédito', fmt(a.totalPagado), fmt(b.totalPagado)],
  ]);

  const diffTotal = a.totalPagado - b.totalPagado;
  const mejor = diffTotal > 0 ? 'Banco B' : 'Banco A';
  y = ensureSpace(doc, y, 30);
  y = sectionTitle(doc, 'Recomendación', y);
  y = statusBanner(
    doc, y, 'verde',
    `${mejor} resulta más conveniente en costo total, con una diferencia de ${fmt(Math.abs(diffTotal))} durante todo el plazo. Revisa también la comisión inicial y el CAE de cada banco antes de decidir, ya que reflejan el costo real del crédito.`
  );

  y = sectionTitle(doc, 'Evaluación como sujeto de crédito', y);
  function evalBanco(bk) {
    const cuotaConDeuda = bk.cuotaTotal + deudas;
    const ratio = ingreso > 0 ? (cuotaConDeuda / ingreso) * 100 : 0;
    const disponible = ingreso - cuotaConDeuda - gastos;
    let nivel = 'Riesgo alto de rechazo';
    if (ratio <= 25 && disponible > ingreso * 0.3) nivel = 'Buen candidato';
    else if (ratio <= 35) nivel = 'Candidato con condiciones';
    return { ratio, disponible, nivel };
  }
  const ea = evalBanco(a);
  const eb = evalBanco(b);
  y = table(doc, y, ['Concepto', 'Banco A', 'Banco B'], [
    ['Carga financiera total (con este crédito)', `${ea.ratio.toFixed(1)}%`, `${eb.ratio.toFixed(1)}%`],
    ['Ingreso disponible restante', fmt(ea.disponible), fmt(eb.disponible)],
    ['Evaluación', ea.nivel, eb.nivel],
  ]);

  y = ensureSpace(doc, y, 60);
  y = sectionTitle(doc, 'Tabla de cuotas — Banco A', y);
  y = table(doc, y, ['N°', 'Saldo inicial', 'Capital', 'Interés', 'Seguros', 'Cuota total', 'Saldo final'],
    a.rows.map((r) => [r.n, fmt(r.saldoIni), fmt(r.amort), fmt(r.int), fmt(r.seg), fmt(r.cuotaTotal), fmt(r.saldo)]));

  y = ensureSpace(doc, y, 60);
  y = sectionTitle(doc, 'Tabla de cuotas — Banco B', y);
  table(doc, y, ['N°', 'Saldo inicial', 'Capital', 'Interés', 'Seguros', 'Cuota total', 'Saldo final'],
    b.rows.map((r) => [r.n, fmt(r.saldoIni), fmt(r.amort), fmt(r.int), fmt(r.seg), fmt(r.cuotaTotal), fmt(r.saldo)]));

  finishReport(doc, `comparacion-creditos-${Date.now()}.pdf`);
}
