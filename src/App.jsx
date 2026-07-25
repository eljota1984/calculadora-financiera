import { useMemo, useState } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { incomeFields, expenseFields } from './data/fields';
import { calculateFinancialSummary } from './utils/calculations';
import FinancialCard from './components/FinancialCard';
import ResultsCard from './components/ResultsCard';
import FinancialRanges from './components/FinancialRanges';
import CalculadoraCredito from './components/CalculadoraCredito';
import CalculadoraTarjetas from './components/CalculadoraTarjetas';
import SimuladorInversion from './components/SimuladorInversion';

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

function CalculadoraFinanciera({ values, results, handleChange }) {
  return (
    <>
      <FinancialRanges />
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
    </>
  );
}

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
    <>
      <div className="glow"></div>
      <div className="glow2"></div>

      <div className="wrapper">
        <header>
          <div className="badge">💸 Herramienta Personal</div>

          <h1>
            Finanzas
            <br />
            <span>Personales</span>
          </h1>

          <p className="subtitle">
            Gestiona tu salud financiera, simula créditos y organiza tus tarjetas.
          </p>

          <nav className="tab-nav">
            <NavLink
              to="/"
              end
              className={({ isActive }) => isActive ? 'tab-btn tab-btn--active' : 'tab-btn'}
            >
              Carga Financiera
            </NavLink>
            <NavLink
              to="/credito"
              className={({ isActive }) => isActive ? 'tab-btn tab-btn--active' : 'tab-btn'}
            >
              Crédito de Consumo
            </NavLink>
            <NavLink
              to="/tarjetas"
              className={({ isActive }) => isActive ? 'tab-btn tab-btn--active' : 'tab-btn'}
            >
              Tarjetas
            </NavLink>
            <NavLink
              to="/inversiones"
              className={({ isActive }) => isActive ? 'tab-btn tab-btn--active' : 'tab-btn'}
            >
              Simulador de Inversión
            </NavLink>
          </nav>
        </header>

        <Routes>
          <Route
            path="/"
            element={
              <CalculadoraFinanciera
                values={values}
                results={results}
                handleChange={handleChange}
              />
            }
          />
          <Route
            path="/credito"
            element={
              <CalculadoraCredito
                ingreso={results.income}
                deudas={values.consumo + values.hipotecario + values.creditoEducacional + values.tarjeta}
                gastos={results.expenses}
              />
            }
          />
          <Route path="/tarjetas" element={<CalculadoraTarjetas />} />
          <Route path="/inversiones" element={<SimuladorInversion />} />
        </Routes>
      </div>
    </>
  );
}

export default App;

