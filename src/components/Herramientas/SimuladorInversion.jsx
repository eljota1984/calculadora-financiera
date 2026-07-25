import { useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import './SimuladorInversion.css';

const fmt = (n) => "$ " + Math.round(n).toLocaleString("es-CL", { maximumFractionDigits: 0 });
const pct = (n, digits = 1) => n.toLocaleString("es-CL", { minimumFractionDigits: digits, maximumFractionDigits: digits }) + " %";

const COMPOUNDING_OPTIONS = ["Mensual", "Trimestral", "Anual"];

function validateInputs({ years, rate }) {
  const errors = [];
  if (!(years > 0)) errors.push("El plazo debe ser mayor que cero.");
  if (rate < -100) errors.push("La rentabilidad no puede ser inferior a -100 %.");
  return errors;
}

function simulate({ initial, monthly, rate, years, timing, commission, includeInitial, includeMonthly }) {
  const annual = rate / 100;
  const monthlyRate = Math.pow(1 + annual, 1 / 12) - 1;
  const monthlyCommission = commission / 100 / 12;
  const netMonthlyRate = monthlyRate - monthlyCommission;
  let balance = includeInitial ? initial : 0;
  let aportadoAcum = includeInitial ? initial : 0;
  const months = Math.round(years * 12);
  const series = [{ year: 0, aportado: aportadoAcum, total: balance, ganancia: 0 }];
  for (let m = 1; m <= months; m++) {
    if (includeMonthly && timing === "inicio") { balance += monthly; aportadoAcum += monthly; }
    balance *= 1 + netMonthlyRate;
    if (includeMonthly && timing === "fin") { balance += monthly; aportadoAcum += monthly; }
    if (m % 12 === 0) series.push({ year: m / 12, aportado: aportadoAcum, total: balance, ganancia: balance - aportadoAcum });
  }
  const totalAportado = aportadoAcum;
  const capitalFinal = balance;
  const ganancia = capitalFinal - totalAportado;
  const rentabilidadSobreAportado = totalAportado > 0 ? (ganancia / totalAportado) * 100 : 0;
  const porcentajeGenerado = capitalFinal > 0 ? (ganancia / capitalFinal) * 100 : 0;
  return { series, totalAportado, capitalFinal, ganancia, rentabilidadSobreAportado, porcentajeGenerado };
}

const TABS = [
  { id: "unica", label: "Inversión única" },
  { id: "mensual", label: "Aporte mensual" },
  { id: "completo", label: "Plan completo", sub: "Inicial + Aportes" },
];

const SCENARIO_META = [
  { id: "conservador", label: "Conservador", color: "#f97316" },
  { id: "moderado",    label: "Moderado",    color: "#2563eb" },
  { id: "optimista",  label: "Optimista",   color: "#16a34a" },
];
const DEFAULT_SCENARIO_RATES = { conservador: 4, moderado: 7, optimista: 10 };

// ── Sub-components ────────────────────────────────────────────────────────────

function Field({ label, hint, children, disabled }) {
  return (
    <div className={`si-field${disabled ? " si-field--disabled" : ""}`}>
      <label className="si-field-label">{label}</label>
      {children}
      {hint && <p className="si-field-hint">{hint}</p>}
    </div>
  );
}

function MoneyInput({ value, onChange, disabled }) {
  return (
    <div className="si-pw">
      <span>$</span>
      <input type="number" value={value} disabled={disabled}
        onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function SuffixInput({ value, onChange, suffix, disabled }) {
  return (
    <div className="si-sw">
      <input type="number" value={value} disabled={disabled}
        onChange={(e) => onChange(e.target.value)} />
      <span>{suffix}</span>
    </div>
  );
}

function StatCard({ label, value, valueColor, bg, icon }) {
  return (
    <div className="si-stat-card" style={{ background: bg }}>
      <div className="si-stat-header">
        <span className="si-stat-label">{label}</span>
        <span style={{ color: valueColor, fontSize: 16 }}>{icon}</span>
      </div>
      <p className="si-stat-value" style={{ color: valueColor }}>{value}</p>
    </div>
  );
}

function Row({ label, value, bold, accent }) {
  return (
    <div className="si-row">
      <span className={`si-row-label${bold ? " si-row-bold" : ""}`}>{label}</span>
      <span className={`si-row-value${bold ? " si-row-bold" : ""}${accent ? " si-row-accent" : ""}`}>{value}</span>
    </div>
  );
}

function Toggle({ on, onToggle }) {
  return (
    <button className={`si-toggle${on ? " si-toggle--on" : ""}`} onClick={onToggle}>
      <span className="si-toggle-thumb" style={{ left: on ? 20 : 2 }} />
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SimuladorInversion() {
  const [tab, setTab] = useState("completo");
  const [initial, setInitial] = useState(1000000);
  const [monthly, setMonthly] = useState(100000);
  const [rate, setRate] = useState(8);
  const [years, setYears] = useState(10);
  const [compounding, setCompounding] = useState("Mensual");
  const [timing, setTiming] = useState("fin");
  const [inflationOn, setInflationOn] = useState(true);
  const [inflation, setInflation] = useState(3);
  const [commission, setCommission] = useState(0.5);
  const [scenarioRates, setScenarioRates] = useState(DEFAULT_SCENARIO_RATES);

  const includeInitial = tab !== "mensual";
  const includeMonthly = tab !== "unica";

  const errors = useMemo(() => validateInputs({ years: Number(years) || 0, rate: Number(rate) || 0 }), [years, rate]);

  const result = useMemo(() => {
    if (errors.length) return null;
    return simulate({ initial: Number(initial)||0, monthly: Number(monthly)||0, rate: Number(rate)||0, years: Number(years)||0, timing, commission: Number(commission)||0, includeInitial, includeMonthly });
  }, [initial, monthly, rate, years, timing, commission, includeInitial, includeMonthly, errors]);

  const scenarios = useMemo(() => {
    if (errors.length) return null;
    return SCENARIO_META.map((s) => ({
      ...s, rate: scenarioRates[s.id],
      result: simulate({ initial: Number(initial)||0, monthly: Number(monthly)||0, rate: Number(scenarioRates[s.id])||0, years: Number(years)||0, timing, commission: Number(commission)||0, includeInitial, includeMonthly }),
    }));
  }, [initial, monthly, years, timing, commission, includeInitial, includeMonthly, errors, scenarioRates]);

  const scenarioChartData = useMemo(() => {
    if (!scenarios) return [];
    const maxLen = Math.max(...scenarios.map((s) => s.result.series.length));
    return Array.from({ length: maxLen }, (_, i) => {
      const row = { year: i };
      scenarios.forEach((s) => { row[s.id] = s.result.series[i] ? s.result.series[i].total : null; });
      return row;
    });
  }, [scenarios]);

  const realReturn = inflationOn ? ((1 + Number(rate) / 100) / (1 + Number(inflation) / 100) - 1) * 100 : null;

  const donutData = result ? [
    { name: "Total aportado", value: result.totalAportado, color: "#2563eb" },
    { name: "Ganancia por rentabilidad", value: Math.max(result.ganancia, 0), color: "#16a34a" },
  ] : [];
  const donutTotal = donutData.reduce((s, d) => s + d.value, 0) || 1;

  const setScenarioRate = (id, value) => setScenarioRates((prev) => ({ ...prev, [id]: value }));

  const reset = () => { setInitial(0); setMonthly(0); setRate(8); setYears(10); setCompounding("Mensual"); setTiming("fin"); setInflationOn(false); setInflation(3); setCommission(0); setScenarioRates(DEFAULT_SCENARIO_RATES); };

  return (
    <div className="si-page">

      {/* HEADER */}
      <div className="si-header">
        <div className="si-header-icon">📈</div>
        <div>
          <h1 className="si-title">Simulador de Inversión</h1>
          <p className="si-subtitle">Proyecta el crecimiento de tu dinero con interés compuesto.</p>
        </div>
      </div>

      <div className="si-layout">

        {/* LEFT */}
        <div className="si-left">

          {/* Tabs tipo */}
          <div className="si-type-tabs">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`si-type-tab${tab === t.id ? " active" : ""}`}>
                <span className="si-type-tab-label">{t.label}</span>
                {t.sub && <span className="si-type-tab-sub">{t.sub}</span>}
              </button>
            ))}
          </div>

          {/* Configuración */}
          <div className="si-card">
            <h2 className="si-card-title">Configura tu inversión</h2>
            <div className="si-grid2">
              <Field label="Inversión inicial" hint="Monto que invertirás hoy" disabled={!includeInitial}>
                <MoneyInput value={initial} onChange={setInitial} disabled={!includeInitial} />
              </Field>
              <Field label="Aporte mensual" hint="Cantidad mensual a invertir" disabled={!includeMonthly}>
                <MoneyInput value={monthly} onChange={setMonthly} disabled={!includeMonthly} />
              </Field>
              <Field label="Rentabilidad anual esperada" hint="Promedio histórico o esperado">
                <SuffixInput value={rate} onChange={setRate} suffix="%" />
              </Field>
              <Field label="Plazo de inversión" hint="Horizonte en años">
                <SuffixInput value={years} onChange={setYears} suffix="años" />
              </Field>
              <Field label="Capitalización">
                <select value={compounding} onChange={(e) => setCompounding(e.target.value)} className="si-select">
                  {COMPOUNDING_OPTIONS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Momento del aporte" disabled={!includeMonthly}>
                <select value={timing} onChange={(e) => setTiming(e.target.value)} disabled={!includeMonthly} className="si-select">
                  <option value="fin">A fin de mes</option>
                  <option value="inicio">A inicio de mes</option>
                </select>
              </Field>
            </div>

            <div className="si-divider" />
            <p className="si-section-label">Opciones adicionales</p>
            <div className="si-grid2">
              <div>
                <div className="si-toggle-row">
                  <span className="si-toggle-label">Considerar inflación</span>
                  <Toggle on={inflationOn} onToggle={() => setInflationOn(!inflationOn)} />
                </div>
                {inflationOn && (
                  <Field label="Inflación anual estimada" hint="Para calcular el valor real">
                    <SuffixInput value={inflation} onChange={setInflation} suffix="%" />
                  </Field>
                )}
              </div>
              <Field label="Comisión anual" hint="Costo anual del instrumento">
                <SuffixInput value={commission} onChange={setCommission} suffix="%" />
              </Field>
            </div>

            <button className="si-btn-calc">📊 Calcular proyección</button>
            <button className="si-btn-reset" onClick={reset}>↺ Limpiar campos</button>
          </div>
        </div>

        {/* RIGHT */}
        <div className="si-right">
          {errors.length > 0 ? (
            <div className="si-error-card">
              <p className="si-error-title">⚠ Revisa los datos ingresados</p>
              <ul className="si-error-list">{errors.map((e) => <li key={e}>{e}</li>)}</ul>
            </div>
          ) : result && (
            <>
              {/* Stats */}
              <div className="si-card">
                <h2 className="si-card-title" style={{ marginBottom: 14 }}>Resultados estimados</h2>
                <div className="si-stats-grid">
                  <StatCard label="Capital final estimado" value={fmt(result.capitalFinal)} valueColor="#16a34a" bg="#f0fdf4" icon="📈" />
                  <StatCard label="Total aportado" value={fmt(result.totalAportado)} valueColor="#0f172a" bg="#f8fafc" icon="💰" />
                  <StatCard label="Ganancia por rentabilidad" value={fmt(result.ganancia)} valueColor="#7c3aed" bg="#f5f3ff" icon="✨" />
                  <StatCard label="% del capital que es ganancia" value={pct(result.porcentajeGenerado, 1)} valueColor="#d97706" bg="#fffbeb" icon="%" />
                </div>
              </div>

              {/* Gráfico evolución */}
              <div className="si-card">
                <h3 className="si-card-title" style={{ marginBottom: 14 }}>Evolución de tu inversión</h3>
                <div style={{ width: "100%", height: 280 }}>
                  <ResponsiveContainer>
                    <AreaChart data={result.series} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="aportadoGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563eb" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#2563eb" stopOpacity={0.03} />
                        </linearGradient>
                        <linearGradient id="gananciaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#16a34a" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#16a34a" stopOpacity={0.03} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="year" tickFormatter={(v) => v === 0 ? "Año 0" : v} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={(v) => "$" + (v / 1e6).toFixed(0) + "M"} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(v) => fmt(v)} labelFormatter={(l) => "Año " + l} />
                      <Area type="monotone" dataKey="aportado" name="Total aportado" stackId="a" stroke="#2563eb" fill="url(#aportadoGrad)" strokeWidth={2} />
                      <Area type="monotone" dataKey="total" name="Capital final" stackId="b" stroke="#16a34a" fill="url(#gananciaGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="si-info-box">
                  Al final de <strong>{years} años</strong>, tu inversión podría crecer a <strong>{fmt(result.capitalFinal)}</strong>.
                </div>
              </div>

              {/* Resumen + Donut */}
              <div className="si-grid2">
                <div className="si-card">
                  <h3 className="si-card-title" style={{ marginBottom: 10 }}>Resumen detallado</h3>
                  <div className="si-rows">
                    <Row label="Inversión inicial" value={fmt(includeInitial ? initial : 0)} />
                    <Row label="Aporte mensual" value={fmt(includeMonthly ? monthly : 0)} />
                    <Row label="Total aportado" value={fmt(result.totalAportado)} />
                    <Row label="Ganancia por rentabilidad" value={fmt(result.ganancia)} />
                    <Row label="Capital final estimado" value={fmt(result.capitalFinal)} bold accent />
                    <Row label="Rentabilidad anual" value={pct(Number(rate), 2)} />
                    {inflationOn && <Row label="Rentabilidad real (sin inflación)" value={pct(realReturn, 2)} />}
                  </div>
                </div>

                <div className="si-card">
                  <h3 className="si-card-title" style={{ marginBottom: 10 }}>¿De dónde viene tu capital?</h3>
                  <div className="si-donut-wrap">
                    <div style={{ width: 130, height: 130 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie data={donutData} dataKey="value" innerRadius={36} outerRadius={58} paddingAngle={2}>
                            {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="si-donut-legend">
                      {donutData.map((d, i) => (
                        <div key={i} className="si-donut-item">
                          <span className="si-donut-dot" style={{ background: d.color }} />
                          <div>
                            <p className="si-donut-name">{d.name}</p>
                            <p className="si-donut-val">{fmt(d.value)} <span className="si-donut-pct">({((d.value / donutTotal) * 100).toFixed(1)}%)</span></p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabla año a año */}
              <div className="si-card">
                <h3 className="si-card-title" style={{ marginBottom: 12 }}>Tabla de crecimiento por año</h3>
                <div className="si-table-wrap">
                  <table className="si-table">
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left" }}>Año</th>
                        <th>Aportado acumulado</th>
                        <th>Ganancia acumulada</th>
                        <th>Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.series.map((row) => (
                        <tr key={row.year}>
                          <td style={{ textAlign: "left", color: "#64748b" }}>{row.year === 0 ? "Año 0" : row.year}</td>
                          <td>{fmt(row.aportado)}</td>
                          <td style={{ color: "#16a34a" }}>{fmt(row.ganancia)}</td>
                          <td style={{ fontWeight: 600 }}>{fmt(row.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Comparador de escenarios */}
              <div className="si-card">
                <h3 className="si-card-title">Comparador de escenarios</h3>
                <p className="si-card-desc">Misma inversión y plazo — solo cambia la rentabilidad esperada.</p>
                <div className="si-scenarios-grid">
                  {scenarios.map((s) => (
                    <div key={s.id} className="si-scenario-card" style={{ borderTopColor: s.color }}>
                      <div className="si-scenario-header">
                        <span className="si-scenario-label">{s.label}</span>
                        <label className="si-scenario-rate-wrap" style={{ background: s.color + "1A" }}>
                          <input type="number" step="0.1" value={scenarioRates[s.id]}
                            onChange={(e) => setScenarioRate(s.id, e.target.value)}
                            className="si-scenario-rate-input" style={{ color: s.color }} />
                          <span style={{ color: s.color, fontSize: 12 }}>%</span>
                        </label>
                      </div>
                      <p className="si-scenario-capital">{fmt(s.result.capitalFinal)}</p>
                      <p className="si-scenario-sub">capital final estimado</p>
                      <div className="si-scenario-rows">
                        <div className="si-scenario-row"><span>Total aportado</span><span>{fmt(s.result.totalAportado)}</span></div>
                        <div className="si-scenario-row"><span>Ganancia</span><span style={{ color: s.color }}>{fmt(s.result.ganancia)}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ width: "100%", height: 220, marginTop: 16 }}>
                  <ResponsiveContainer>
                    <LineChart data={scenarioChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="year" tickFormatter={(v) => v === 0 ? "Año 0" : v} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={(v) => "$" + (v / 1e6).toFixed(0) + "M"} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(v) => fmt(v)} labelFormatter={(l) => "Año " + l} />
                      <Legend formatter={(value) => SCENARIO_META.find((s) => s.id === value)?.label || value} wrapperStyle={{ fontSize: 12 }} />
                      {SCENARIO_META.map((s) => <Line key={s.id} type="monotone" dataKey={s.id} name={s.id} stroke={s.color} strokeWidth={2} dot={false} />)}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Aviso legal */}
      <div className="si-aviso">
        <span className="si-aviso-icon">⚠</span>
        <div className="si-aviso-text">
          <p className="si-aviso-title">Importante</p>
          <p>Esta herramienta entrega resultados estimados basados en una rentabilidad constante. Las inversiones pueden aumentar o disminuir su valor y los rendimientos pasados no garantizan resultados futuros.</p>
        </div>
      </div>
    </div>
  );
}
