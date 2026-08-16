import { useState } from "react";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import './CalculadoraCredito.css';
import PdfButton from './PdfButton';
import { generateCreditoReport } from '../../utils/reports/creditoReport';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, Title, Tooltip, Legend, Filler
);

const fmt = (n) => "$" + Math.round(n).toLocaleString("es-CL");
const fmtP = (n) => n.toFixed(2) + "%";

function calcCuota(cap, r, n) {
  if (r === 0) return cap / n;
  return (cap * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function buildRows(capital, tasaMen, segTot, gastOp, n) {
  const r = tasaMen / 100;
  const cuotaBase = calcCuota(capital, r, n);
  let saldo = capital;
  return Array.from({ length: n }, (_, i) => {
    const int = saldo * r;
    const amort = cuotaBase - int;
    const seg = saldo * (segTot / 100);
    const cuotaTotal = cuotaBase + seg + gastOp;
    const saldoIni = saldo;
    saldo = Math.max(0, saldo - amort);
    return { n: i + 1, saldoIni, amort, int, seg, gastOp, cuotaTotal, saldo };
  });
}

function calcCAE(capital, cuota, n) {
  let lo = 0, hi = 5;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const rm = mid / 100;
    let pv = 0;
    for (let k = 1; k <= n; k++) pv += cuota / Math.pow(1 + rm, k);
    if (pv > capital) lo = mid; else hi = mid;
  }
  return (Math.pow(1 + (lo + hi) / 2 / 100, 12) - 1) * 100;
}

function calcBank(cap, n, tasa, desgrav, ces, comision, gastOp) {
  const segTot = desgrav + ces;
  const rows = buildRows(cap, tasa, segTot, gastOp, n);
  const cuotaTotal = rows[0].cuotaTotal;
  const totalPagado = rows.reduce((s, r) => s + r.cuotaTotal, 0) + comision;
  const totalInt = rows.reduce((s, r) => s + r.int, 0);
  const totalSeg = rows.reduce((s, r) => s + r.seg, 0);
  const totalGop = rows.reduce((s, r) => s + r.gastOp, 0);
  const caeCalc = calcCAE(cap, cuotaTotal, n);
  return { tasa, segTot, comision, gastOp, rows, cuotaTotal, totalPagado, totalInt, totalSeg, totalGop, caeCalc };
}

function exportCSV(rows, banco, n) {
  let csv = "N°;Saldo inicial;Capital;Interés;Seguros;G.Operacional;Cuota total;Saldo final\n";
  rows.forEach((r) => {
    csv += `${r.n};${Math.round(r.saldoIni)};${Math.round(r.amort)};${Math.round(r.int)};${Math.round(r.seg)};${Math.round(r.gastOp)};${Math.round(r.cuotaTotal)};${Math.round(r.saldo)}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `credito_banco${banco.toUpperCase()}_${n}cuotas.csv`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const PLAZOS = [6, 8, 10, 12, 18, 24, 36, 48];
const DEFAULT_BANK = (tasa, desgrav, ces, comision, caeInf) => ({ tasa, desgrav, ces, comision, gastOp: 0, caeInf, cuotaInf: 0 });

// ── Sub-components ────────────────────────────────────────────────────────────

function Badge({ children, variant = "info" }) {
  return <span className={`cc-badge cc-badge-${variant}`}>{children}</span>;
}

function MetricCard({ label, value, sub }) {
  return (
    <div className="cc-metric-card">
      <p className="cc-metric-label">{label}</p>
      <p className="cc-metric-value">{value}</p>
      {sub && <p className="cc-metric-sub">{sub}</p>}
    </div>
  );
}

function RatioBar({ ratio, label }) {
  const color = ratio <= 25 ? "#00ff88" : ratio <= 35 ? "#ffb400" : "#ff5050";
  return (
    <div className="cc-rbar-wrap">
      <div className="cc-rbar-lbl">
        <span>{label}: {ratio.toFixed(1)}%</span>
        <span>límite: 35%</span>
      </div>
      <div className="cc-rbar-track">
        <div className="cc-rbar-fill" style={{ width: `${Math.min(ratio, 100)}%`, background: color }} />
      </div>
    </div>
  );
}

function SujetoBlock({ nombre, nivel, titulo, desc }) {
  const icons = { ok: "✓", warn: "⚠", danger: "✕" };
  return (
    <div className={`cc-sr-block cc-sr-${nivel}`}>
      <div className="cc-sr-icon">{icons[nivel]}</div>
      <div>
        <p className={`cc-sr-title ${nivel}`}>{nombre} — {titulo}</p>
        <p className="cc-sr-desc">{desc}</p>
      </div>
    </div>
  );
}

function NumberInput({ label, value, onChange, prefix, suffix, hint, step = 1, min = 0 }) {
  return (
    <div className="cc-field">
      <label>{label}</label>
      <div className={prefix ? "cc-prefix-wrap" : suffix ? "cc-suffix-wrap" : ""}>
        {prefix && <span>{prefix}</span>}
        <input type="number" value={value} min={min} step={step}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)} />
        {suffix && <span>{suffix}</span>}
      </div>
      {hint && <span className="cc-hint">{hint}</span>}
    </div>
  );
}

function BankInputs({ label, data, onChange }) {
  const f = (key) => (val) => onChange({ ...data, [key]: val });
  return (
    <div>
      <p className="cc-bank-label">{label}</p>
      <div className="cc-g3" style={{ marginBottom: 10 }}>
        <NumberInput label="Tasa mensual (%)" value={data.tasa} onChange={f("tasa")} suffix="%" step={0.01} />
        <NumberInput label="Seg. desgravamen (%)" value={data.desgrav} onChange={f("desgrav")} suffix="%" step={0.01} />
        <NumberInput label="Seg. cesantía (%)" value={data.ces} onChange={f("ces")} suffix="%" step={0.01} />
      </div>
      <div className="cc-g2" style={{ marginBottom: 10 }}>
        <NumberInput label="Comisión inicial ($)" value={data.comision} onChange={f("comision")} prefix="$" step={1000} hint="Cargo único al inicio" />
        <NumberInput label="Gasto operacional ($)" value={data.gastOp} onChange={f("gastOp")} prefix="$" step={1000} hint="Cargo mensual fijo" />
      </div>
      <div className="cc-g2">
        <NumberInput label="CAE informado (%)" value={data.caeInf} onChange={f("caeInf")} suffix="%" step={0.01} />
        <NumberInput label="Cuota informada ($)" value={data.cuotaInf} onChange={f("cuotaInf")} prefix="$" hint="0 = automático" />
      </div>
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

function TabResumen({ results }) {
  const { a, b, cap } = results;
  const diffCuota = a.cuotaTotal - b.cuotaTotal;
  const diffTotal = a.totalPagado - b.totalPagado;
  let msg = "";
  if (Math.abs(diffCuota) < 500) msg = "Ambos bancos tienen condiciones muy similares en cuota mensual.";
  else if (diffCuota > 0) msg = `Banco B tiene una cuota ${fmt(diffCuota)} más barata. En total pagarías ${fmt(Math.abs(diffTotal))} menos. Considera el costo inicial: Banco A cobra ${fmt(a.comision)} vs ${fmt(b.comision)} de Banco B.`;
  else msg = `Banco A tiene una cuota ${fmt(-diffCuota)} más barata. En total pagarías ${fmt(Math.abs(diffTotal))} menos con Banco A durante el plazo completo.`;

  return (
    <div>
      <div className="cc-g2" style={{ marginBottom: 12 }}>
        {[["Banco A", a], ["Banco B", b]].map(([nombre, bk]) => (
          <div key={nombre} className="cc-card" style={{ marginBottom: 0 }}>
            <p className="cc-bank-label">{nombre}</p>
            <div className="cc-g2">
              <MetricCard label="Cuota total" value={fmt(bk.cuotaTotal)} />
              <MetricCard label="Costo total" value={fmt(bk.totalPagado)} />
              <MetricCard label="CAE calculado" value={fmtP(bk.caeCalc)} />
              <MetricCard label="Total intereses" value={fmt(bk.totalInt)} />
            </div>
          </div>
        ))}
      </div>
      <div className="cc-ganador">{msg}</div>
    </div>
  );
}

function TabComparador({ results }) {
  const { a, b, cap } = results;
  const rows = [
    ["Cuota mensual (c/seguros)", fmt(a.cuotaTotal), fmt(b.cuotaTotal), a.cuotaTotal <= b.cuotaTotal],
    ["Comisión inicial", fmt(a.comision), fmt(b.comision), a.comision <= b.comision],
    ["Gasto operacional/mes", fmt(a.gastOp), fmt(b.gastOp), a.gastOp <= b.gastOp],
    ["Total seguros", fmt(a.totalSeg), fmt(b.totalSeg), a.totalSeg <= b.totalSeg],
    ["Total intereses", fmt(a.totalInt), fmt(b.totalInt), a.totalInt <= b.totalInt],
    ["Costo total", fmt(a.totalPagado), fmt(b.totalPagado), a.totalPagado <= b.totalPagado],
    ["CAE informado", fmtP(a.caeInf || 0), fmtP(b.caeInf || 0), (a.caeInf || 0) <= (b.caeInf || 0)],
    ["CAE calculado", fmtP(a.caeCalc), fmtP(b.caeCalc), a.caeCalc <= b.caeCalc],
    ["Sobrecosto vs capital", ((a.totalPagado - cap) / cap * 100).toFixed(1) + "%", ((b.totalPagado - cap) / cap * 100).toFixed(1) + "%", a.totalPagado <= b.totalPagado],
  ];
  const diffCaeA = Math.abs((a.caeInf || 0) - a.caeCalc);
  const diffCaeB = Math.abs((b.caeInf || 0) - b.caeCalc);
  let conclu = "";
  if (diffCaeA > 1) conclu += `CAE de Banco A: diferencia de ${diffCaeA.toFixed(1)} pts entre lo informado y lo calculado. `;
  if (diffCaeB > 1) conclu += `CAE de Banco B: diferencia de ${diffCaeB.toFixed(1)} pts entre lo informado y lo calculado. `;
  if (!conclu) conclu = "Los CAE informados coinciden razonablemente con el cálculo propio.";

  return (
    <div>
      <div className="cc-cmp-row">
        <span className="cc-cmp-lbl" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".05em" }}>Concepto</span>
        <span className="cc-cmp-val" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".05em" }}>Banco A</span>
        <span className="cc-cmp-val" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".05em" }}>Banco B</span>
      </div>
      {rows.map(([label, vA, vB, aMejor]) => (
        <div key={label} className="cc-cmp-row">
          <span className="cc-cmp-lbl">{label}</span>
          <span className="cc-cmp-val">{vA} {aMejor && <Badge variant="ok">mejor</Badge>}</span>
          <span className="cc-cmp-val">{vB} {!aMejor && <Badge variant="ok">mejor</Badge>}</span>
        </div>
      ))}
      <div className="cc-conclu">{conclu}</div>
    </div>
  );
}

function TabTabla({ results }) {
  const { cap, n, a, b } = results;
  const [plazoTab, setPlazoTab] = useState(n);
  const [banco, setBanco] = useState("a");
  const bk = banco === "a" ? a : b;
  const rows = buildRows(cap, bk.tasa, bk.segTot, bk.gastOp, plazoTab);
  const tot = rows.reduce((acc, r) => ({
    amort: acc.amort + r.amort, int: acc.int + r.int,
    seg: acc.seg + r.seg, gop: acc.gop + r.gastOp, cuota: acc.cuota + r.cuotaTotal
  }), { amort: 0, int: 0, seg: 0, gop: 0, cuota: 0 });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <div className="cc-cuota-tabs" style={{ marginBottom: 0 }}>
          {PLAZOS.map((p) => (
            <button key={p} className={`cc-cb${plazoTab === p ? " active" : ""}`} onClick={() => setPlazoTab(p)}>
              {p} cuotas
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <select className="cc-select-sm" value={banco} onChange={(e) => setBanco(e.target.value)}>
            <option value="a">Banco A</option>
            <option value="b">Banco B</option>
          </select>
          <button className="cc-btn-sm" onClick={() => exportCSV(rows, banco, plazoTab)}>↓ CSV</button>
        </div>
      </div>
      <div className="cc-tw">
        <table>
          <thead>
            <tr>
              {["N°", "Saldo inicial", "Capital", "Interés", "Seguros", "G.Op.", "Cuota total", "Saldo final"].map((h, i) => (
                <th key={h} style={{ textAlign: i === 0 ? "left" : "right" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.n}>
                <td>{r.n}</td>
                <td>{fmt(r.saldoIni)}</td>
                <td>{fmt(r.amort)}</td>
                <td>{fmt(r.int)}</td>
                <td>{fmt(r.seg)}</td>
                <td>{fmt(r.gastOp)}</td>
                <td style={{ fontWeight: 600 }}>{fmt(r.cuotaTotal)}</td>
                <td>{fmt(r.saldo)}</td>
              </tr>
            ))}
            <tr className="total-row">
              <td style={{ fontWeight: 600 }}>Total</td>
              <td>—</td>
              <td>{fmt(tot.amort)}</td>
              <td>{fmt(tot.int)}</td>
              <td>{fmt(tot.seg)}</td>
              <td>{fmt(tot.gop)}</td>
              <td style={{ fontWeight: 600 }}>{fmt(tot.cuota)}</td>
              <td>—</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TabGrafico({ results }) {
  const { cap, n, a, b } = results;
  const [tipo, setTipo] = useState("evol");
  const graficos = [["evol", "Evolución deuda"], ["comp", "Cuotas por plazo"], ["composicion", "Composición cuota"]];

  const chartData = (() => {
    if (tipo === "evol") {
      const rowsA = buildRows(cap, a.tasa, a.segTot, a.gastOp, n);
      const rowsB = buildRows(cap, b.tasa, b.segTot, b.gastOp, n);
      return {
        type: "line",
        data: {
          labels: rowsA.map((r) => r.n),
          datasets: [
            { label: "Banco A", data: rowsA.map((r) => Math.round(r.saldo)), borderColor: "#00ff88", backgroundColor: "rgba(0,255,136,0.07)", borderWidth: 2, pointRadius: 2, fill: true },
            { label: "Banco B", data: rowsB.map((r) => Math.round(r.saldo)), borderColor: "#64a0ff", backgroundColor: "rgba(100,160,255,0.07)", borderWidth: 2, pointRadius: 2, borderDash: [4, 3], fill: true },
          ],
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: (v) => "$" + Math.round(v / 1000) + "K", color: "rgba(255,255,255,0.4)" }, grid: { color: "rgba(255,255,255,0.05)" } }, x: { ticks: { color: "rgba(255,255,255,0.4)" }, grid: { color: "rgba(255,255,255,0.05)" }, title: { display: true, text: "Cuota N°", font: { size: 11 }, color: "rgba(255,255,255,0.4)" } } } },
        legend: [{ color: "#00ff88", label: "Banco A — saldo pendiente" }, { color: "#64a0ff", label: "Banco B — saldo pendiente" }],
      };
    }
    if (tipo === "comp") {
      return {
        type: "bar",
        data: {
          labels: PLAZOS.map((p) => p + " cuotas"),
          datasets: [
            { label: "Banco A", data: PLAZOS.map((p) => Math.round(buildRows(cap, a.tasa, a.segTot, a.gastOp, p)[0].cuotaTotal)), backgroundColor: "#00ff88" },
            { label: "Banco B", data: PLAZOS.map((p) => Math.round(buildRows(cap, b.tasa, b.segTot, b.gastOp, p)[0].cuotaTotal)), backgroundColor: "#64a0ff" },
          ],
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: (v) => "$" + Math.round(v / 1000) + "K", color: "rgba(255,255,255,0.4)" }, grid: { color: "rgba(255,255,255,0.05)" } }, x: { ticks: { color: "rgba(255,255,255,0.4)" }, grid: { color: "rgba(255,255,255,0.05)" } } } },
        legend: [{ color: "#00ff88", label: "Banco A" }, { color: "#64a0ff", label: "Banco B" }],
      };
    }
    const row = a.rows[0];
    const colors = ["#00ff88", "#64a0ff", "#ffb400", "#ff5050"];
    const labels = ["Capital", "Interés", "Seguros", "G.Operacional"];
    const data = [Math.round(row.amort), Math.round(row.int), Math.round(row.seg), Math.round(row.gastOp)];
    return {
      type: "doughnut",
      data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => " " + fmt(c.raw) } } } },
      legend: labels.map((l, i) => ({ color: colors[i], label: `${l}: ${fmt(data[i])}` })),
    };
  })();

  const ChartComponent = chartData.type === "line" ? Line : chartData.type === "bar" ? Bar : Doughnut;

  return (
    <div>
      <div className="cc-cuota-tabs">
        {graficos.map(([key, label]) => (
          <button key={key} className={`cc-cb${tipo === key ? " active" : ""}`} onClick={() => setTipo(key)}>{label}</button>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 12 }}>
        {chartData.legend.map((l) => (
          <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: l.color, display: "inline-block" }} />
            {l.label}
          </span>
        ))}
      </div>
      <div style={{ position: "relative", width: "100%", height: 280 }}>
        <ChartComponent data={chartData.data} options={chartData.options} />
      </div>
    </div>
  );
}

function TabSujeto({ results }) {
  const { cap, n, a, b, ingreso, deudas, gastos } = results;

  function evalBanco(bk) {
    const cuotaConDeuda = bk.cuotaTotal + deudas;
    const ratio = ingreso > 0 ? (cuotaConDeuda / ingreso) * 100 : 0;
    const disponible = ingreso - cuotaConDeuda - gastos;
    if (ratio <= 25 && disponible > ingreso * 0.3)
      return { nivel: "ok", titulo: "Buen candidato", desc: `Carga financiera: ${ratio.toFixed(1)}% del ingreso. Quedan ${fmt(disponible)} libres al mes.`, ratio };
    if (ratio <= 35)
      return { nivel: "warn", titulo: "Candidato con condiciones", desc: `Carga financiera: ${ratio.toFixed(1)}%. Cerca del límite del 35%. Ingreso disponible: ${fmt(disponible)}.`, ratio };
    return { nivel: "danger", titulo: "Riesgo alto de rechazo", desc: `Carga financiera: ${ratio.toFixed(1)}%, supera el 35%. Considera un plazo mayor o monto menor.`, ratio };
  }

  const ea = evalBanco(a);
  const eb = evalBanco(b);

  return (
    <div>
      <div className="cc-g2" style={{ marginBottom: 12 }}>
        <SujetoBlock nombre="Banco A" {...ea} />
        <SujetoBlock nombre="Banco B" {...eb} />
      </div>
      <div className="cc-g2">
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#fff" }}>Ratio deuda/ingreso (Banco A)</p>
          <RatioBar ratio={ea.ratio} label="Banco A" />
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#fff" }}>Ratio deuda/ingreso (Banco B)</p>
          <RatioBar ratio={eb.ratio} label="Banco B" />
        </div>
      </div>
      <div className="cc-divider" />
      <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: "#fff" }}>Proyección por plazos (Banco A)</p>
      <div className="cc-g4">
        {[12, 24, 36, 48].map((p) => {
          const r2 = buildRows(cap, a.tasa, a.segTot, a.gastOp, p);
          const c2 = r2[0].cuotaTotal;
          const ratio2 = ingreso > 0 ? ((c2 + deudas) / ingreso) * 100 : 0;
          const ok = ratio2 <= 35;
          return (
            <div key={p} className="cc-metric-card">
              <p className="cc-metric-label">{p} cuotas</p>
              <p className="cc-metric-value">{fmt(c2)}</p>
              <p className="cc-metric-sub">{ratio2.toFixed(1)}% del ingreso <Badge variant={ok ? "ok" : "danger"}>{ok ? "viable" : "riesgoso"}</Badge></p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
const TABS = [
  { key: "resumen", label: "Resumen" },
  { key: "comparador", label: "Banco A vs Banco B" },
  { key: "tabla", label: "Tabla de cuotas" },
  { key: "grafico", label: "Gráfico" },
  { key: "sujeto", label: "Sujeto de crédito" },
];

export default function CalculadoraCredito({ ingreso: ingresoProp = 1200000, deudas: deudasProp = 0, gastos: gastosProp = 400000 }) {
  const [monto, setMonto] = useState(5000000);
  const [plazo, setPlazo] = useState(12);
  const [ingreso, setIngreso] = useState(ingresoProp);
  const [deudas, setDeudas] = useState(deudasProp);
  const [gastos, setGastos] = useState(gastosProp);
  const [bankA, setBankA] = useState(DEFAULT_BANK(1.8, 0.06, 0.04, 50000, 28.5));
  const [bankB, setBankB] = useState(DEFAULT_BANK(1.5, 0.05, 0.03, 80000, 24.0));
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState("resumen");

  function calcular() {
    const a = { ...calcBank(monto, plazo, bankA.tasa, bankA.desgrav, bankA.ces, bankA.comision, bankA.gastOp), caeInf: bankA.caeInf };
    const b = { ...calcBank(monto, plazo, bankB.tasa, bankB.desgrav, bankB.ces, bankB.comision, bankB.gastOp), caeInf: bankB.caeInf };
    setResults({ cap: monto, n: plazo, ingreso, deudas, gastos, a, b });
    setActiveTab("resumen");
  }

  return (
    <div className="cc-page">

      <div className="cc-card">
        <p className="cc-section-title">Monto y plazo</p>
        <div className="cc-g2" style={{ marginBottom: 12 }}>
          <NumberInput label="Monto a solicitar ($)" value={monto} onChange={setMonto} prefix="$" step={100000} />
          <div className="cc-field">
            <label>Plazo base</label>
            <select value={plazo} onChange={(e) => setPlazo(parseInt(e.target.value))}>
              {PLAZOS.map((p) => <option key={p} value={p}>{p} cuotas</option>)}
            </select>
          </div>
        </div>

        <div className="cc-divider" />
        <div className="cc-g2" style={{ marginBottom: 14 }}>
          <BankInputs label="Banco A" data={bankA} onChange={setBankA} />
          <BankInputs label="Banco B" data={bankB} onChange={setBankB} />
        </div>

        <div className="cc-divider" />
        <p className="cc-section-title">Tu situación financiera</p>
        <div className="cc-g3">
          <NumberInput label="Ingreso mensual líquido ($)" value={ingreso} onChange={setIngreso} prefix="$" step={50000} />
          <NumberInput label="Deudas mensuales actuales ($)" value={deudas} onChange={setDeudas} prefix="$" step={10000} hint="Otras cuotas que ya pagas" />
          <NumberInput label="Gastos fijos mensuales ($)" value={gastos} onChange={setGastos} prefix="$" step={10000} hint="Arriendo, servicios, etc." />
        </div>
      </div>

      <button className="cc-btn-calc" onClick={calcular}>Calcular y comparar</button>

      {results && (
        <div>
          <div className="cc-tabs" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {TABS.map((t) => (
                <button key={t.key} className={`cc-tab${activeTab === t.key ? " active" : ""}`} onClick={() => setActiveTab(t.key)}>
                  {t.label}
                </button>
              ))}
            </div>
            <PdfButton
              label="Descargar informe comparativo"
              onGenerate={() => generateCreditoReport(results)}
            />
          </div>
          <div className="cc-card" style={{ marginBottom: 0 }}>
            {activeTab === "resumen"    && <TabResumen results={results} />}
            {activeTab === "comparador" && <TabComparador results={results} />}
            {activeTab === "tabla"      && <TabTabla results={results} />}
            {activeTab === "grafico"    && <TabGrafico results={results} />}
            {activeTab === "sujeto"     && <TabSujeto results={results} />}
          </div>
        </div>
      )}
    </div>
  );
}
