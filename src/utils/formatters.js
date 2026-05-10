export function formatCurrency(value) {
  return '$' + Math.round(value).toLocaleString('es-CL');
}