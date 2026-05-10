export function getFinancialLimit(income) {
  if (income <= 600000) return 0.25;
  if (income <= 1300000) return 0.4;
  if (income <= 2500000) return 0.5;
  return 0.55;
}

export function calculateFinancialSummary(values) {
  const income =
    values.sueldo +
    values.honorarios +
    values.comisiones +
    values.bonos +
    values.aguinaldos;

  const housing = values.arriendo + values.hipotecario;

  const financialDebt =
    values.hipotecario +
    values.consumo +
    values.creditoEducacional +
    values.tarjeta;

  const expenses =
    values.serviciosBasicos +
    values.serviciosAdicionales +
    values.alimentacion +
    values.educacion +
    values.arriendo +
    values.hipotecario +
    values.consumo +
    values.creditoEducacional +
    values.tarjeta +
    values.seguros +
    values.salud +
    values.recreacion +
    values.vestuario +
    values.movilizacion +
    values.otros;

  const incomeAfterHousing = income - housing;
  const savingsCapacity = income - expenses;
  const debtPercentage = income > 0 ? (financialDebt / income) * 100 : 0;
  const limit = getFinancialLimit(income) * 100;

  const rentDividendRatio =
    housing > 0 && income > 0
      ? `${((housing / income) * 100).toFixed(1)}%`
      : '—';

  return {
    income,
    expenses,
    housing,
    financialDebt,
    incomeAfterHousing,
    savingsCapacity,
    debtPercentage,
    limit,
    rentDividendRatio,
  };
}