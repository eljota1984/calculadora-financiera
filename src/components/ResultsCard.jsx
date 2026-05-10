import { formatCurrency } from '../utils/formatters';
import ProgressBar from './ProgressBar';
import StatusBar from './StatusBar';

function getStatus(results) {
  if (results.income === 0) {
    return {
      status: 'neutral',
      message: 'Ingresa tus datos para ver tu situación financiera.',
    };
  }

  if (results.debtPercentage > results.limit) {
    return {
      status: 'rojo',
      message: `Tu carga financiera (${results.debtPercentage.toFixed(
        1
      )}%) supera el máximo recomendado de ${results.limit}% para tu tramo de renta.`,
    };
  }

  if (results.debtPercentage >= results.limit * 0.85) {
    return {
      status: 'amarillo',
      message: `Tu carga financiera (${results.debtPercentage.toFixed(
        1
      )}%) está cerca del límite recomendado (${results.limit}%). Precaución.`,
    };
  }

  return {
    status: 'verde',
    message: `Tu carga financiera (${results.debtPercentage.toFixed(
      1
    )}%) está dentro del rango recomendado de ${results.limit}%. ¡Bien!`,
  };
}

function ResultsCard({ results }) {
  const { status, message } = getStatus(results);

  return (
    <section className="results">
      <div className="results-card">
        <div className="results-title">Resultado</div>

        <div className="result-grid">
          <div className="result-item">
            <div className="result-item-label">Ingreso después de vivienda</div>
            <div className="result-item-value">
              {formatCurrency(results.incomeAfterHousing)}
            </div>
          </div>

          <div className="result-item">
            <div className="result-item-label">Carga financiera</div>
            <div className="result-item-value">
              {formatCurrency(results.financialDebt)}
            </div>
          </div>

          <div className="result-item">
            <div className="result-item-label">Relación renta/dividendo</div>
            <div className="result-item-value">
              {results.rentDividendRatio}
            </div>
          </div>
        </div>

        <ProgressBar
          percentage={results.debtPercentage}
          status={status}
        />

        <div className="saldo-highlight">
          <div>
            <div className="saldo-label">Capacidad de ahorro</div>
            <div className="saldo-description">
              Ingresos − Egresos totales
            </div>
          </div>

          <div
            className={`saldo-val ${
              results.savingsCapacity < 0 ? 'negative' : ''
            }`}
          >
            {formatCurrency(results.savingsCapacity)}
          </div>
        </div>

        <StatusBar status={status} message={message} />

        <div className="legend">
          <div className="legend-item">
            <div className="legend-dot green"></div>
            Dentro del límite recomendado
          </div>

          <div className="legend-item">
            <div className="legend-dot yellow"></div>
            Cerca del límite
          </div>

          <div className="legend-item">
            <div className="legend-dot red"></div>
            Excede carga financiera máxima
          </div>
        </div>
      </div>
    </section>
  );
}

export default ResultsCard;