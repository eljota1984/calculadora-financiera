import { useState } from "react";
import './CalculadoraTarjetas.css';
import PdfButton from './PdfButton';
import { generateTarjetasReport } from '../../utils/reports/tarjetasReport';

const fmt = (n) => "$" + Math.round(n).toLocaleString("es-CL");
const fmtP = (n) => n.toFixed(2) + "%";

function calcPlanTarjeta(tarjeta, pagoExtra) {
  const { deuda, tasaMensual, pagoMinimoPct, cargoFijo } = tarjeta;
  const r = tasaMensual / 100;
  let saldo = deuda;
  const rows = [];
  let totalIntereses = 0;
  let mes = 0;

  while (saldo > 0.5 && mes < 600) {
    mes++;
    const interes = saldo * r;
    const pagoMinimo = Math.max(saldo * (pagoMinimoPct / 100) + cargoFijo, 5000);
    const pago = Math.min(Math.max(pagoMinimo, pagoExtra + cargoFijo), saldo + interes + cargoFijo);
    const capital = Math.min(pago - interes - cargoFijo, saldo);
    totalIntereses += interes;
    const saldoAnterior = saldo;
    saldo = Math.max(0, saldo - capital);
    rows.push({ mes, saldoInicial: saldoAnterior, interes, cargoFijo, capital: Math.max(0, capital), pago: capital + interes + cargoFijo, saldo });
  }
  return { rows, totalIntereses, meses: mes };
}

function calcPlanAvalancha(tarjetas, presupuesto) {
  // copia de saldos
  let saldos = tarjetas.map(t => ({ ...t, saldo: t.deuda }));
  const historial = [];
  let mes = 0;
  let totalIntereses = 0;

  while (saldos.some(t => t.saldo > 0.5) && mes < 600) {
    mes++;
    const fila = { mes, tarjetas: [] };
    let presupuestoRestante = presupuesto;

    // pagos mínimos primero
    const pagosMinimos = saldos.map(t => {
      if (t.saldo <= 0) return 0;
      return Math.min(Math.max(t.saldo * (t.pagoMinimoPct / 100) + t.cargoFijo, 5000), t.saldo * (1 + t.tasaMensual / 100));
    });
    const totalMinimos = pagosMinimos.reduce((a, b) => a + b, 0);
    const extra = Math.max(0, presupuesto - totalMinimos);

    // ordenar por estrategia (avalancha = mayor tasa primero)
    const orden = saldos
      .map((t, i) => ({ i, tasa: t.tasaMensual, saldo: t.saldo }))
      .filter(t => t.saldo > 0)
      .sort((a, b) => b.tasa - a.tasa);

    let extraRestante = extra;

    saldos = saldos.map((t, idx) => {
      if (t.saldo <= 0) {
        fila.tarjetas.push({ nombre: t.nombre, saldoInicial: 0, interes: 0, pago: 0, saldo: 0 });
        return t;
      }
      const interes = t.saldo * (t.tasaMensual / 100);
      let pago = pagosMinimos[idx];
      // agregar extra a la de mayor tasa
      const esLaPrimera = orden[0]?.i === idx;
      if (esLaPrimera && extraRestante > 0) {
        pago += extraRestante;
        extraRestante = 0;
      }
      pago = Math.min(pago, t.saldo + interes + t.cargoFijo);
      const capital = Math.max(0, pago - interes - t.cargoFijo);
      const nuevoSaldo = Math.max(0, t.saldo - capital);
      totalIntereses += interes;
      fila.tarjetas.push({ nombre: t.nombre, saldoInicial: t.saldo, interes, cargoFijo: t.cargoFijo, pago, saldo: nuevoSaldo });
      return { ...t, saldo: nuevoSaldo };
    });

    historial.push(fila);
  }
  return { historial, totalIntereses, meses: mes };
}

function calcPlanBolaNieve(tarjetas, presupuesto) {
  let saldos = tarjetas.map(t => ({ ...t, saldo: t.deuda }));
  const historial = [];
  let mes = 0;
  let totalIntereses = 0;

  while (saldos.some(t => t.saldo > 0.5) && mes < 600) {
    mes++;
    const fila = { mes, tarjetas: [] };
    const pagosMinimos = saldos.map(t => {
      if (t.saldo <= 0) return 0;
      return Math.min(Math.max(t.saldo * (t.pagoMinimoPct / 100) + t.cargoFijo, 5000), t.saldo * (1 + t.tasaMensual / 100));
    });
    const totalMinimos = pagosMinimos.reduce((a, b) => a + b, 0);
    const extra = Math.max(0, presupuesto - totalMinimos);

    // bola de nieve = menor saldo primero
    const orden = saldos
      .map((t, i) => ({ i, saldo: t.saldo }))
      .filter(t => t.saldo > 0)
      .sort((a, b) => a.saldo - b.saldo);

    let extraRestante = extra;

    saldos = saldos.map((t, idx) => {
      if (t.saldo <= 0) {
        fila.tarjetas.push({ nombre: t.nombre, saldoInicial: 0, interes: 0, pago: 0, saldo: 0 });
        return t;
      }
      const interes = t.saldo * (t.tasaMensual / 100);
      let pago = pagosMinimos[idx];
      const esLaPrimera = orden[0]?.i === idx;
      if (esLaPrimera && extraRestante > 0) {
        pago += extraRestante;
        extraRestante = 0;
      }
      pago = Math.min(pago, t.saldo + interes + t.cargoFijo);
      const capital = Math.max(0, pago - interes - t.cargoFijo);
      const nuevoSaldo = Math.max(0, t.saldo - capital);
      totalIntereses += interes;
      fila.tarjetas.push({ nombre: t.nombre, saldoInicial: t.saldo, interes, cargoFijo: t.cargoFijo, pago, saldo: nuevoSaldo });
      return { ...t, saldo: nuevoSaldo };
    });

    historial.push(fila);
  }
  return { historial, totalIntereses, meses: mes };
}

const TARJETA_VACIA = () => ({
  id: Date.now(),
  nombre: "",
  deuda: 0,
  tasaMensual: 3.5,
  pagoMinimoPct: 3,
  cargoFijo: 0,
  cae: 0,
});

function TarjetaInput({ t, onChange, onRemove }) {
  const f = (key) => (e) => onChange({ ...t, [key]: parseFloat(e.target.value) || 0 });
  const fs = (key) => (e) => onChange({ ...t, [key]: e.target.value });

  return (
    <div className="ct-tarjeta-card">
      <div className="ct-tarjeta-header">
        <div className="ct-field" style={{ flex: 1 }}>
          <label>Nombre de la tarjeta</label>
          <input type="text" value={t.nombre} onChange={fs("nombre")} placeholder="Ej: Visa BancoEstado" />
        </div>
        <button className="ct-btn-remove" onClick={onRemove} title="Eliminar tarjeta">✕</button>
      </div>
      <div className="ct-grid3">
        <div className="ct-field">
          <label>Deuda actual ($)</label>
          <div className="ct-pw"><span>$</span><input type="number" value={t.deuda} onChange={f("deuda")} min={0} step={10000} /></div>
        </div>
        <div className="ct-field">
          <label>Tasa mensual (%)</label>
          <div className="ct-sw"><input type="number" value={t.tasaMensual} onChange={f("tasaMensual")} min={0} step={0.01} /><span>%</span></div>
        </div>
        <div className="ct-field">
          <label>CAE (%)</label>
          <div className="ct-sw"><input type="number" value={t.cae} onChange={f("cae")} min={0} step={0.1} /><span>%</span></div>
        </div>
        <div className="ct-field">
          <label>Pago mínimo (%)</label>
          <div className="ct-sw"><input type="number" value={t.pagoMinimoPct} onChange={f("pagoMinimoPct")} min={0} step={0.5} /><span>%</span></div>
          <span className="ct-hint">% sobre saldo</span>
        </div>
        <div className="ct-field">
          <label>Cargo fijo mensual ($)</label>
          <div className="ct-pw"><span>$</span><input type="number" value={t.cargoFijo} onChange={f("cargoFijo")} min={0} step={500} /></div>
          <span className="ct-hint">Mantención, seguros, etc.</span>
        </div>
        <div className="ct-field">
          <label>Pago mínimo estimado</label>
          <div className="ct-display">
            {fmt(Math.max(t.deuda * (t.pagoMinimoPct / 100) + t.cargoFijo, t.deuda > 0 ? 5000 : 0))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ResumenCard({ plan, estrategia, color }) {
  const fechaFin = new Date();
  fechaFin.setMonth(fechaFin.getMonth() + plan.meses);
  const mesStr = fechaFin.toLocaleDateString("es-CL", { month: "long", year: "numeric" });

  return (
    <div className={`ct-resumen-card ct-resumen-${color}`}>
      <p className="ct-resumen-estrategia">{estrategia}</p>
      <div className="ct-resumen-grid">
        <div className="ct-resumen-item">
          <p className="ct-resumen-label">Meses para saldar</p>
          <p className="ct-resumen-value">{plan.meses} meses</p>
        </div>
        <div className="ct-resumen-item">
          <p className="ct-resumen-label">Fecha estimada fin</p>
          <p className="ct-resumen-value">{mesStr}</p>
        </div>
        <div className="ct-resumen-item">
          <p className="ct-resumen-label">Total intereses pagados</p>
          <p className="ct-resumen-value ct-danger">{fmt(plan.totalIntereses)}</p>
        </div>
        <div className="ct-resumen-item">
          <p className="ct-resumen-label">Total pagado</p>
          <p className="ct-resumen-value">{fmt(plan.totalIntereses + plan.historial[0]?.tarjetas.reduce((s, t) => s + t.saldoInicial, 0) || 0)}</p>
        </div>
      </div>
    </div>
  );
}

function TablaDetalle({ historial, tarjetas }) {
  const [mesActivo, setMesActivo] = useState(null);

  return (
    <div className="ct-tabla-wrap">
      <div className="ct-tabla-scroll">
        <table>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Mes</th>
              {tarjetas.map(t => (
                <th key={t.id} colSpan={3}>{t.nombre || "Tarjeta"}</th>
              ))}
              <th>Total pagado</th>
            </tr>
            <tr className="ct-subheader">
              <th></th>
              {tarjetas.map(t => (
                <>
                  <th key={t.id + "s"}>Saldo</th>
                  <th key={t.id + "i"}>Interés</th>
                  <th key={t.id + "p"}>Pago</th>
                </>
              ))}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {historial.map((fila) => {
              const totalPago = fila.tarjetas.reduce((s, t) => s + t.pago, 0);
              const todoPagado = fila.tarjetas.every(t => t.saldo < 0.5);
              return (
                <tr key={fila.mes} className={todoPagado ? "ct-row-done" : ""}>
                  <td className="ct-mes">{fila.mes}</td>
                  {fila.tarjetas.map((t, i) => (
                    <>
                      <td key={i + "s"} className={t.saldo < 0.5 ? "ct-cell-done" : ""}>{t.saldo < 0.5 ? "✓" : fmt(t.saldo)}</td>
                      <td key={i + "i"} className="ct-danger-cell">{t.interes > 0 ? fmt(t.interes) : "—"}</td>
                      <td key={i + "p"} className="ct-pago-cell">{t.pago > 0 ? fmt(t.pago) : "—"}</td>
                    </>
                  ))}
                  <td className="ct-total-cell">{fmt(totalPago)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function CalculadoraTarjetas() {
  const [tarjetas, setTarjetas] = useState([{ ...TARJETA_VACIA(), nombre: "Tarjeta 1" }]);
  const [ingreso, setIngreso] = useState(0);
  const [gastos, setGastos] = useState(0);
  const [pagoExtra, setPagoExtra] = useState(0);
  const [estrategia, setEstrategia] = useState("avalancha");
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState("resumen");

  const deudaTotal = tarjetas.reduce((s, t) => s + t.deuda, 0);
  const pagoMinimoTotal = tarjetas.reduce((s, t) => s + Math.max(t.deuda * (t.pagoMinimoPct / 100) + t.cargoFijo, t.deuda > 0 ? 5000 : 0), 0);
  const disponible = ingreso - gastos;
  const presupuestoTotal = Math.max(pagoMinimoTotal + pagoExtra, pagoMinimoTotal);

  function agregar() {
    setTarjetas([...tarjetas, { ...TARJETA_VACIA(), nombre: `Tarjeta ${tarjetas.length + 1}` }]);
  }

  function actualizar(id, nueva) {
    setTarjetas(tarjetas.map(t => t.id === id ? nueva : t));
  }

  function eliminar(id) {
    if (tarjetas.length === 1) return;
    setTarjetas(tarjetas.filter(t => t.id !== id));
  }

  function calcular() {
    const tarjetasConDeuda = tarjetas.filter(t => t.deuda > 0);
    if (tarjetasConDeuda.length === 0) return;
    const presupuesto = disponible > 0 ? Math.min(disponible, presupuestoTotal) : pagoMinimoTotal;
    const planAv = calcPlanAvalancha(tarjetasConDeuda, presupuesto + pagoExtra);
    const planBn = calcPlanBolaNieve(tarjetasConDeuda, presupuesto + pagoExtra);
    setResults({ planAv, planBn, tarjetasConDeuda, presupuesto: presupuesto + pagoExtra });
    setActiveTab("resumen");
  }

  const TABS = [
    { key: "resumen", label: "Resumen" },
    { key: "avalancha", label: "Avalancha" },
    { key: "bolanieve", label: "Bola de nieve" },
  ];

  return (
    <div className="ct-page">

      {/* Tarjetas */}
      <div className="ct-section-title-wrap">
        <p className="ct-section-title">Tus tarjetas de crédito</p>
        <button className="ct-btn-add" onClick={agregar}>+ Agregar tarjeta</button>
      </div>

      {tarjetas.map(t => (
        <TarjetaInput key={t.id} t={t} onChange={(nueva) => actualizar(t.id, nueva)} onRemove={() => eliminar(t.id)} />
      ))}

      {/* Resumen deudas */}
      <div className="ct-deuda-resumen">
        <div className="ct-deuda-item">
          <p className="ct-deuda-label">Deuda total</p>
          <p className="ct-deuda-value ct-danger">{fmt(deudaTotal)}</p>
        </div>
        <div className="ct-deuda-item">
          <p className="ct-deuda-label">Pago mínimo total</p>
          <p className="ct-deuda-value">{fmt(pagoMinimoTotal)}</p>
        </div>
        <div className="ct-deuda-item">
          <p className="ct-deuda-label">N° tarjetas</p>
          <p className="ct-deuda-value">{tarjetas.filter(t => t.deuda > 0).length}</p>
        </div>
      </div>

      {/* Situación financiera */}
      <div className="ct-card">
        <p className="ct-section-title">Tu situación financiera</p>
        <div className="ct-grid3">
          <div className="ct-field">
            <label>Ingreso mensual líquido ($)</label>
            <div className="ct-pw"><span>$</span><input type="number" value={ingreso} onChange={e => setIngreso(parseFloat(e.target.value) || 0)} step={50000} /></div>
          </div>
          <div className="ct-field">
            <label>Gastos fijos mensuales ($)</label>
            <div className="ct-pw"><span>$</span><input type="number" value={gastos} onChange={e => setGastos(parseFloat(e.target.value) || 0)} step={10000} /></div>
            <span className="ct-hint">Arriendo, alimentación, etc.</span>
          </div>
          <div className="ct-field">
            <label>Abono extra mensual ($)</label>
            <div className="ct-pw"><span>$</span><input type="number" value={pagoExtra} onChange={e => setPagoExtra(parseFloat(e.target.value) || 0)} step={10000} /></div>
            <span className="ct-hint">Adicional al pago mínimo</span>
          </div>
        </div>

        {ingreso > 0 && (
          <div className="ct-disponible">
            <div>
              <p className="ct-disp-label">Disponible para tarjetas</p>
              <p className={`ct-disp-value ${disponible < pagoMinimoTotal ? "ct-danger" : ""}`}>{fmt(Math.max(0, disponible))}</p>
            </div>
            <div>
              <p className="ct-disp-label">Presupuesto total asignado</p>
              <p className="ct-disp-value ct-accent">{fmt(presupuestoTotal + pagoExtra)}</p>
            </div>
            {disponible < pagoMinimoTotal && (
              <div className="ct-alerta">
                ⚠ Tu ingreso disponible ({fmt(disponible)}) es menor al pago mínimo total ({fmt(pagoMinimoTotal)}). El plan usará el mínimo como base.
              </div>
            )}
          </div>
        )}
      </div>

      <button className="ct-btn-calc" onClick={calcular}>Generar plan de pago</button>

      {results && (
        <div>
          <div className="ct-tabs">
            {TABS.map(t => (
              <button key={t.key} className={`ct-tab${activeTab === t.key ? " active" : ""}`} onClick={() => setActiveTab(t.key)}>
                {t.label}
              </button>
            ))}
          </div>

          {activeTab === "resumen" && (
            <div>
              <div className="ct-compare-grid">
                <ResumenCard plan={results.planAv} estrategia="🏔 Avalancha — Mayor tasa primero" color="blue" />
                <ResumenCard plan={results.planBn} estrategia="⛄ Bola de nieve — Menor deuda primero" color="green" />
              </div>
              <div className="ct-card" style={{ marginTop: 14 }}>
                <p className="ct-section-title" style={{ marginBottom: 10 }}>¿Cuál te conviene?</p>
                {results.planAv.totalIntereses <= results.planBn.totalIntereses ? (
                  <p className="ct-consejo">
                    La estrategia <strong>Avalancha</strong> te ahorra {fmt(results.planBn.totalIntereses - results.planAv.totalIntereses)} en intereses
                    {results.planAv.meses !== results.planBn.meses ? ` y terminas ${Math.abs(results.planAv.meses - results.planBn.meses)} meses ${results.planAv.meses < results.planBn.meses ? "antes" : "después"}` : ""}.
                    Es matemáticamente la más eficiente.
                  </p>
                ) : (
                  <p className="ct-consejo">
                    En intereses, la <strong>Avalancha</strong> sigue siendo más barata. Pero la <strong>Bola de nieve</strong> elimina tarjetas más rápido,
                    lo que puede darte más motivación para mantener el plan.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === "avalancha" && (
            <div className="ct-card">
              <div className="ct-plan-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <p className="ct-plan-title">🏔 Estrategia Avalancha</p>
                  <p className="ct-plan-desc">Paga primero la tarjeta con mayor tasa de interés. Minimiza el total de intereses pagados.</p>
                </div>
                <PdfButton
                  label="Descargar plan Avalancha"
                  onGenerate={() => generateTarjetasReport({
                    plan: results.planAv, estrategia: 'avalancha',
                    tarjetasConDeuda: results.tarjetasConDeuda, presupuesto: results.presupuesto,
                    planAlternativo: results.planBn, estrategiaAlternativa: 'bolanieve',
                  })}
                />
              </div>
              <TablaDetalle historial={results.planAv.historial} tarjetas={results.tarjetasConDeuda} />
            </div>
          )}

          {activeTab === "bolanieve" && (
            <div className="ct-card">
              <div className="ct-plan-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <p className="ct-plan-title">⛄ Estrategia Bola de Nieve</p>
                  <p className="ct-plan-desc">Paga primero la tarjeta con menor saldo. Elimina deudas más rápido y genera motivación.</p>
                </div>
                <PdfButton
                  label="Descargar plan Bola de Nieve"
                  onGenerate={() => generateTarjetasReport({
                    plan: results.planBn, estrategia: 'bolanieve',
                    tarjetasConDeuda: results.tarjetasConDeuda, presupuesto: results.presupuesto,
                    planAlternativo: results.planAv, estrategiaAlternativa: 'avalancha',
                  })}
                />
              </div>
              <TablaDetalle historial={results.planBn.historial} tarjetas={results.tarjetasConDeuda} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
