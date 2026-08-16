import { useState } from 'react';

export default function PdfButton({ onGenerate, label = 'Descargar informe PDF', className = '', disabled = false }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (loading || disabled) return;
    setLoading(true);
    try {
      await onGenerate();
    } catch (err) {
      console.error('Error generando el PDF:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      className={`pdf-btn ${className}`}
      onClick={handleClick}
      disabled={disabled || loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 18px',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.15)',
        background: disabled ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#2563eb,#1d4ed8)',
        color: '#fff',
        fontSize: 13,
        fontWeight: 600,
        cursor: disabled || loading ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {loading ? 'Generando…' : `📄 ${label}`}
    </button>
  );
}
