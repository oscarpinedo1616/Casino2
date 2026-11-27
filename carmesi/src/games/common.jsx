import { useApp } from '../store.jsx';
import { sfx } from '../lib/sound.js';
import { ChipSVG } from '../components/ui.jsx';

/* campo de apuesta con mitad / doble */
export function BetInput({ value, onChange, disabled }) {
  const { chips } = useApp();
  const set = (v) => { onChange(Math.max(1, Math.min(chips || 1, Math.floor(v)))); sfx.chip(); };
  return (
    <label className="bet-in">
      <span>Apuesta</span>
      <div className="bet-row">
        <ChipSVG c="#1fe07a" s="#0b1a12" size={20} />
        <input type="number" min="1" value={value} onChange={(e) => onChange(Math.max(1, +e.target.value || 1))} disabled={disabled} />
        <button type="button" onClick={() => set(value / 2)} disabled={disabled}>½</button>
        <button type="button" onClick={() => set(value * 2)} disabled={disabled}>2×</button>
      </div>
    </label>
  );
}
