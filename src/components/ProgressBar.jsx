/**
 * ProgressBar — reusable across Dashboard, Subjects, Analytics.
 * @param {number}  pct        0–100
 * @param {string}  colorClass CSS class like 'prog-signal', 'prog-amber'
 * @param {boolean} thick      uses thicker track
 */
export function ProgressBar({ pct, colorClass = 'prog-signal', thick = false }) {
  const safeP = Math.min(100, Math.max(0, pct));
  return (
    <div className={thick ? 'prog-track-thick' : 'prog-track'}>
      <div
        className={`prog-fill ${colorClass}`}
        style={{ width: `${safeP}%` }}
      />
    </div>
  );
}
