import {
  createReport, sectionTitle, paragraph, metricRow, statusBanner,
  table, bulletList, ensureSpace, finishReport,
} from '../pdfReport';
import { formatCurrency } from '../formatters';

const fmt = formatCurrency;

// Categorías que se pueden ajustar en el corto plazo (no son deuda ni vivienda)
const REDUCIBLE = [
  { id: 'recreacion', label: 'Recreación' },
  { id: 'vestuario', label: 'Vestuario' },
  { id: 'serviciosAdicionales', label: 'Servicios adicionales (internet, TV, celular)' },
  { id: 'movilizacion', label: 'Movilización / Gasolina / Peajes' },
  { id: 'otros', label: 'Otros' },
  { id: 'alimentacion', label: 'Alimentación' },
];

function getStatus(results) {
  if (results.income === 0) return { status: 'neutral', label: 'Sin datos' };
  if (results.debtPercentage > results.limit) return { status: 'rojo', label: 'Sobre el límite recomendado' };
  if (results.debtPercentage >= results.limit * 0.85) return { status: 'amarillo', label: 'Cerca del límite' };
  return { status: 'verde', label: 'Dentro del rango recomendado' };
}

function buildReductionPlan(values, results) {
  if (results.debtPercentage <= results.limit || results.income === 0) return null;

  const excesoPct = results.debtPercentage - results.limit;
  const montoExceso = results.financialDebt - (results.limit / 100) * results.income;

  const candidatos = REDUCIBLE
    .map((c) => ({ ...c, monto: values[c.id] || 0 }))
    .filter((c) => c.monto > 0)
    .sort((a, b) => b.monto - a.monto);

  const totalReducible = candidatos.reduce((s, c) => s + c.monto, 0);
  // Recorte propuesto: hasta un 30% de cada partida reducible, priorizando las más altas
  let objetivo = Math.max(montoExceso, 0);
  const acciones = [];
  let acumulado = 0;
  for (const c of candidatos) {
    if (acumulado >= objetivo) break;
    const recorteMax = c.monto * 0.3;
    const recorte = Math.min(recorteMax, objetivo - acumulado);
    if (recorte > 1000) {
      acciones.push({ ...c, recorte });
      acumulado += recorte;
    }
  }

  return { excesoPct, montoExceso, candidatos, totalReducible, acciones, acumulado, cubierto: acumulado >= objetivo * 0.95 };
}

function buildBudgetSuggestion(results) {
  const income = results.income;
  if (income <= 0) return null;
  const limitPct = results.limit; // %
  const deudaVivienda = Math.min(results.housing + results.financialDebt, (limitPct / 100) * income);
  const ahorroObjetivoPct = results.debtPercentage > limitPct ? 5 : 10;
  const ahorroObjetivo = income * (ahorroObjetivoPct / 100);
  const gastosEsenciales = Math.max(income - deudaVivienda - ahorroObjetivo, 0);

  return [
    { label: 'Vivienda y deudas financieras', pct: `${limitPct.toFixed(0)}%`, monto: deudaVivienda },
    { label: 'Gastos esenciales y variables', pct: `${(100 - limitPct - ahorroObjetivoPct).toFixed(0)}%`, monto: gastosEsenciales },
    { label: 'Ahorro / fondo de emergencia', pct: `${ahorroObjetivoPct}%`, monto: ahorroObjetivo },
  ];
}

export function generateCargaFinancieraReport({ values, results }) {
  const { status, label } = getStatus(results);
  const { doc } = createReport(
    'Informe de Carga Financiera',
    'Diagnóstico de tu situación de ingresos, gastos y endeudamiento'
  );
  let y = 40;

  y = metricRow(doc, y, [
    { label: 'Ingreso mensual', value: fmt(results.income) },
    { label: 'Egresos totales', value: fmt(results.expenses) },
    { label: 'Carga financiera', value: `${results.debtPercentage.toFixed(1)}%` },
    { label: 'Capacidad de ahorro', value: fmt(results.savingsCapacity), color: results.savingsCapacity < 0 ? [220, 38, 38] : [22, 163, 74] },
  ]);

  y = sectionTitle(doc, 'Diagnóstico', y);
  y = statusBanner(
    doc, y, status,
    `${label}: tu carga financiera es ${results.debtPercentage.toFixed(1)}% de tu ingreso mensual. El máximo recomendado para tu tramo de renta es ${results.limit}%.`
  );

  y = sectionTitle(doc, 'Rango en el que te encuentras', y);
  y = table(doc, y, ['Tramo de ingreso', 'Carga financiera máxima recomendada'], [
    ['$200.000 – $600.000', '25%'],
    ['$600.001 – $1.300.000', '40%'],
    ['$1.300.001 – $2.500.000', '50%'],
    ['$2.500.001 y más', '55%'],
  ]);

  y = sectionTitle(doc, 'Detalle de resultados', y);
  y = table(doc, y, ['Concepto', 'Monto'], [
    ['Ingreso después de vivienda', fmt(results.incomeAfterHousing)],
    ['Carga financiera (deudas)', fmt(results.financialDebt)],
    ['Relación renta/dividendo', results.rentDividendRatio],
    ['Capacidad de ahorro (ingresos − egresos)', fmt(results.savingsCapacity)],
  ]);

  // Propuesta de reducción a corto plazo
  const plan = buildReductionPlan(values, results);
  y = ensureSpace(doc, y, 40);
  y = sectionTitle(doc, 'Propuesta de reducción a corto plazo', y);
  if (!plan) {
    y = paragraph(doc, 'Tu carga financiera se encuentra dentro del rango recomendado. No es necesario aplicar recortes; te sugerimos mantener este equilibrio y destinar tu capacidad de ahorro a un fondo de emergencia.', y);
  } else {
    y = paragraph(
      doc,
      `Para volver al rango recomendado necesitas reducir tu carga en aproximadamente ${fmt(plan.montoExceso)} mensuales (${plan.excesoPct.toFixed(1)} puntos porcentuales). A continuación, un plan de ajuste priorizando gastos variables antes que renegociar deudas:`,
      y
    );
    if (plan.acciones.length > 0) {
      y = table(doc, y, ['Partida a ajustar', 'Gasto actual', 'Recorte sugerido (≈30% o menos)'],
        plan.acciones.map((a) => [a.label, fmt(a.monto), fmt(a.recorte)]));
      y = paragraph(doc, `Con estos ajustes liberarías aproximadamente ${fmt(plan.acumulado)} al mes.${plan.cubierto ? ' Esto cubre el exceso detectado.' : ' Esto reduce el exceso, aunque puede no cubrirlo por completo — evalúa también renegociar plazos o tasas de tus créditos vigentes.'}`, y);
    } else {
      y = paragraph(doc, 'No se detectaron gastos variables suficientes para absorber el ajuste. Te recomendamos evaluar una renegociación de deudas (plazo o tasa) o buscar ingresos adicionales.', y);
    }
  }

  // Presupuesto sugerido
  y = ensureSpace(doc, y, 40);
  y = sectionTitle(doc, 'Presupuesto mensual sugerido', y);
  const budget = buildBudgetSuggestion(results);
  if (budget) {
    y = table(doc, y, ['Categoría', '% del ingreso', 'Monto mensual sugerido'],
      budget.map((b) => [b.label, b.pct, fmt(b.monto)]));
  } else {
    y = paragraph(doc, 'Ingresa tus datos de ingreso para obtener un presupuesto sugerido personalizado.', y);
  }

  y = ensureSpace(doc, y, 20);
  bulletList(doc, y + 2, [
    'Revisa este informe mensualmente para verificar tu avance.',
    'Prioriza el pago de deudas con mayor tasa de interés antes de aumentar tu gasto variable.',
    'Un fondo de emergencia equivalente a 3–6 meses de gastos reduce tu necesidad de recurrir a crédito.',
  ]);

  finishReport(doc, `carga-financiera-${Date.now()}.pdf`);
}
