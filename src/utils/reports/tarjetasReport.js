import {
  createReport, sectionTitle, paragraph, metricRow, statusBanner,
  table, ensureSpace, finishReport,
} from '../pdfReport';

const fmt = (n) => '$' + Math.round(n).toLocaleString('es-CL');

const ESTRATEGIA_INFO = {
  avalancha: {
    titulo: '🏔 Estrategia Avalancha',
    desc: 'Paga primero la tarjeta con mayor tasa de interés. Minimiza el total de intereses pagados durante todo el proceso.',
  },
  bolanieve: {
    titulo: '⛄ Estrategia Bola de Nieve',
    desc: 'Paga primero la tarjeta con menor saldo. Elimina deudas más rápido, lo que genera motivación para mantener el plan.',
  },
};

export function generateTarjetasReport({ plan, estrategia, tarjetasConDeuda, presupuesto, planAlternativo, estrategiaAlternativa }) {
  const info = ESTRATEGIA_INFO[estrategia];
  const fechaFin = new Date();
  fechaFin.setMonth(fechaFin.getMonth() + plan.meses);
  const mesStr = fechaFin.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });

  const { doc } = createReport(
    'Plan de Pago de Tarjetas de Crédito',
    `${info.titulo} — plan elegido`
  );
  let y = 40;

  y = paragraph(doc, info.desc, y, { italic: false });

  const deudaTotal = tarjetasConDeuda.reduce((s, t) => s + t.deuda, 0);
  y = metricRow(doc, y, [
    { label: 'Deuda total inicial', value: fmt(deudaTotal) },
    { label: 'N° de tarjetas', value: String(tarjetasConDeuda.length) },
    { label: 'Presupuesto mensual asignado', value: fmt(presupuesto) },
    { label: 'Tiempo estimado para liquidar', value: `${plan.meses} meses` },
  ]);

  y = sectionTitle(doc, 'Resultado del plan elegido', y);
  y = statusBanner(
    doc, y, 'verde',
    `Siguiendo la ${info.titulo.replace(/^\S+\s/, '')}, terminarías de pagar todas tus tarjetas en ${plan.meses} meses (aprox. ${mesStr}), pagando un total de ${fmt(plan.totalIntereses)} en intereses.`
  );

  if (planAlternativo) {
    const altInfo = ESTRATEGIA_INFO[estrategiaAlternativa];
    const diffInt = plan.totalIntereses - planAlternativo.totalIntereses;
    const diffMeses = plan.meses - planAlternativo.meses;
    y = sectionTitle(doc, 'Comparación con la otra estrategia', y);
    y = table(doc, y, ['Concepto', info.titulo, altInfo.titulo], [
      ['Meses para liquidar deuda', String(plan.meses), String(planAlternativo.meses)],
      ['Total intereses pagados', fmt(plan.totalIntereses), fmt(planAlternativo.totalIntereses)],
    ]);
    if (Math.abs(diffInt) > 500 || diffMeses !== 0) {
      y = paragraph(
        doc,
        diffInt > 0
          ? `La otra estrategia (${altInfo.titulo.replace(/^\S+\s/, '')}) te ahorraría ${fmt(diffInt)} en intereses respecto al plan elegido.`
          : `El plan elegido (${info.titulo.replace(/^\S+\s/, '')}) es la opción más eficiente en intereses, ahorrando ${fmt(-diffInt)} frente a la alternativa.`,
        y
      );
    }
  }

  y = ensureSpace(doc, y, 40);
  y = sectionTitle(doc, 'Detalle de tus tarjetas', y);
  y = table(doc, y, ['Tarjeta', 'Deuda actual', 'Tasa mensual', 'Pago mínimo'],
    tarjetasConDeuda.map((t) => [
      t.nombre || '—', fmt(t.deuda), `${t.tasaMensual.toFixed(2)}%`,
      fmt(Math.max(t.deuda * (t.pagoMinimoPct / 100) + t.cargoFijo, 5000)),
    ]));

  // Tabla de calendario de pagos (limitada para no generar un PDF excesivo)
  const MAX_ROWS = 36;
  const historialMostrado = plan.historial.slice(0, MAX_ROWS);
  const nombres = tarjetasConDeuda.map((t) => t.nombre || '—');

  y = ensureSpace(doc, y, 40);
  y = sectionTitle(doc, 'Calendario de pagos mes a mes', y);
  const head = ['Mes', ...nombres.map((n) => `Saldo ${n}`), 'Pago total del mes'];
  const body = historialMostrado.map((fila) => {
    const totalPago = fila.tarjetas.reduce((s, t) => s + t.pago, 0);
    return [
      fila.mes,
      ...fila.tarjetas.map((t) => (t.saldo < 0.5 ? '✓ Pagada' : fmt(t.saldo))),
      fmt(totalPago),
    ];
  });
  y = table(doc, y, head, body, { styles: { fontSize: 7, cellPadding: 1.5 } });
  if (plan.historial.length > MAX_ROWS) {
    paragraph(doc, `Se muestran los primeros ${MAX_ROWS} meses de ${plan.historial.length} totales.`, y, { size: 8, color: [100, 116, 139] });
  }

  finishReport(doc, `plan-tarjetas-${estrategia}-${Date.now()}.pdf`);
}
