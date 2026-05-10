function MoneyInput({ id, label, value, onChange }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>

      <div className="input-wrap">
        <span>$</span>
        <input
          id={id}
          type="number"
          placeholder="0"
          min="0"
          value={value || ''}
          onChange={(event) => onChange(id, event.target.value)}
        />
      </div>
    </div>
  );
}

export default MoneyInput;