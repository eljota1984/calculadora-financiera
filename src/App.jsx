import { useMemo, useState } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { incomeFields, expenseFields } from './data/fields';
import { calculateFinancialSummary } from './utils/calculations';
import FinancialCard from './components/Herramientas/FinancialCard';
import ResultsCard from './components/Herramientas/ResultsCard';
import FinancialRanges from './components/Herramientas/FinancialRanges';
import CalculadoraCredito from './components/Herramientas/CalculadoraCredito';
import CalculadoraTarjetas from './components/Herramientas/CalculadoraTarjetas';
import SimuladorInversion from './components/Herramientas/SimuladorInversion';
import LandingPage from './components/LandingPage';
import BlogList from './components/BlogList';
import BlogPost from './components/BlogPost';
import PdfButton from './components/Herramientas/PdfButton';
import { generateCargaFinancieraReport } from './utils/reports/cargaFinancieraReport';

const initialValues = {
  sueldo: 0, honorarios: 0, comisiones: 0, bonos: 0, aguinaldos: 0,
  serviciosBasicos: 0, serviciosAdicionales: 0, alimentacion: 0,
  educacion: 0, arriendo: 0, hipotecario: 0, consumo: 0,
  creditoEducacional: 0, tarjeta: 0, seguros: 0, salud: 0,
  recreacion: 0, vestuario: 0, movilizacion: 0, otros: 0,
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

      <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
        <PdfButton
          disabled={results.income === 0}
          label="Descargar informe de carga financiera"
          onGenerate={() => generateCargaFinancieraReport({ values, results })}
        />
      </div>
    </>
  );
}

function Herramientas() {
  const [values, setValues] = useState(initialValues);
  const navigate = useNavigate();

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
          <div className="badge" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
            💸 Finanzas Personales
          </div>

          <nav className="tab-nav">
            <NavLink
              to="/herramientas"
              end
              className={({ isActive }) => isActive ? 'tab-btn tab-btn--active' : 'tab-btn'}
            >
              Carga Financiera
            </NavLink>
            <NavLink
              to="/herramientas/credito"
              className={({ isActive }) => isActive ? 'tab-btn tab-btn--active' : 'tab-btn'}
            >
              Crédito de Consumo
            </NavLink>
            <NavLink
              to="/herramientas/tarjetas"
              className={({ isActive }) => isActive ? 'tab-btn tab-btn--active' : 'tab-btn'}
            >
              Tarjetas
            </NavLink>
            <NavLink
              to="/herramientas/inversiones"
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

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/herramientas/*" element={<Herramientas />} />
      <Route path="/blog" element={<BlogList />} />
      <Route path="/blog/:slug" element={<BlogPost />} />
    </Routes>
  );
}

export default App;
