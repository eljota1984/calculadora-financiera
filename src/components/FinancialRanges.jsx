import { financialRanges } from '../data/ranges';

function FinancialRanges() {
  return (
    <section className="tramos">
      <div className="tramos-title">
        Tramos de Carga Financiera
      </div>

      <div className="tramos-grid">
        {financialRanges.map((range) => (
          <div className="tramo-item" key={range.income}>
            <div className="tramo-renta">{range.income}</div>
            <div className="tramo-pct">{range.percentage}</div>
          </div>
        ))}
      </div>

      <p className="tramos-note">
        Valores referenciales para orientar la carga financiera máxima según nivel de ingreso.
      </p>
    </section>
  );
}

export default FinancialRanges;