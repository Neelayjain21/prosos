export function Loader({ text = 'LOADING' }) {
  return (
    <div className="loading-screen">
      <div className="loading-spinner" />
      <div className="loading-text">{text}</div>
    </div>
  );
}
