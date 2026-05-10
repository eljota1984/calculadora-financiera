import MoneyInput from './MoneyInput';
import { formatCurrency } from '../utils/formatters';

function FinancialCard({
  title,
  fields,
  values,
  onChange,
  total,
  variant = 'green',
}) {
  return (
    <section className="card">
      <div className="card-title">
        <span className={`dot ${variant === 'red' ? 'red' : ''}`}></span>
        {title}
      </div>

      {fields.map((field) => (
        <MoneyInput
          key={field.id}
          id={field.id}
          label={field.label}
          value={values[field.id]}
          onChange={onChange}
        />
      ))}

      <div className="total-row">
        <span className="total-label">
          {variant === 'red' ? 'Total egresos' : 'Total ingresos'}
        </span>

        <span className={`total-value ${variant === 'red' ? 'red' : ''}`}>
          {formatCurrency(total)}
        </span>
      </div>
    </section>
  );
}

export default FinancialCard;