function ProgressBar({ percentage, status }) {
  const width = Math.min(percentage, 100);

  return (
    <div className="progress-wrap">
      <div className="progress-label">
        <span>Carga financiera</span>
        <span>{percentage.toFixed(1)}%</span>
      </div>

      <div className="progress-track">
        <div
          className={`progress-fill ${status}`}
          style={{ width: `${width}%` }}
        ></div>
      </div>
    </div>
  );
}

export default ProgressBar;