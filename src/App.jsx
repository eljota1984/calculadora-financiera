import { useMemo, useState } from 'react';
import { incomeFields, expenseFields } from './data/fields';
import { calculateFinancialSummary } from './utils/calculations';
import FinancialCard from './components/FinancialCard';
import ResultsCard from './components/ResultsCard';

const initialValues = {
  sueldo: 0,
  honorarios: 0,
  comisiones: 0,
  bonos: 0,
  aguinaldos: 0,

  serviciosBasicos: 0,
  serviciosAdicionales: 0,
  alimentacion: 0,
  educacion: 0,
  arriendo: 0,
  hipotecario: 0,
  consumo: 0,
  creditoEducacional: 0,
  tarjeta: 0,
  seguros: 0,
  salud: 0,
  recreacion: 0,
  vestuario: 0,
  movilizacion: 0,
  otros: 0,
};

function App() {
  const [values, setValues] = useState(initialValues);

  const results = useMemo(() => {
    return calculateFinancialSummary(values);
  }, [values]);

  function handleChange(id, value) {
    setValues((currentValues) => ({
      ...currentValues,
      [id]: Number(value),
    }));
  }

  return (
    <div className="wrapper">
      <header>
        <div className="badge">💸 Herramienta Personal</div>

        <h1>
          Calculadora de
          <br />
          <span>Carga Financiera</span>
        </h1>

        <p className="subtitle">
          Registra tus ingresos y gastos para conocer tu capacidad de
          endeudamiento y ahorro mensual.
        </p>
      </header>

      <div className="grid-2">
        <FinancialCard
          title="Ingresos Mensuales"
          fields={incomeFields}
          values={values}
          onChange={handleChange}
          total={results.income}
        />

        <FinancialCard
          title="Egresos Mensuales"
          fields={expenseFields}
          values={values}
          onChange={handleChange}
          total={results.expenses}
          variant="red"
        />
      </div>
      <ResultsCard results={results} />
    </div>
  );
}

export default App;