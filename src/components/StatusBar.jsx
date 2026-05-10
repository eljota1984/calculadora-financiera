function StatusBar({ status, message }) {
  return (
    <div className={`status-bar ${status}`}>
      <div className="status-dot"></div>
      <div className="status-text">{message}</div>
    </div>
  );
}

export default StatusBar;