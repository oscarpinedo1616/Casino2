import { useRef, useState } from 'react';
import { useApp } from '../store.jsx';
import { rand } from './Roulette.jsx';
import { sfx } from '../lib/sound.js';
import Truth from '../components/Truth.jsx';
import { BetInput } from './common.jsx';

/* Dice: sale un número de 0,00 a 99,99. Eliges por encima o por debajo de un objetivo. Ventaja de la casa: 1 %. */
const EDGE = 0.01;
export default function Dice() {
  const { bet, pay, paused, limitHit } = useApp();
  const [stake, setStake] = useState(10);
  const [target, setTarget] = useState(50);
  const [over, setOver] = useState(true);
  const [roll, setRoll] = useState(null);
  const [shown, setShown] = useState(null);
  const [busy, setBusy] = useState(false);
  const [hist, setHist] = useState([]);
  const raf = useRef(0);
  const chance = over ? 100 - target : target;
  const mult = +(((1 - EDGE) * 100) / chance).toFixed(4);

  const play = () => {
    if (busy || !bet(stake)) return;
    setBusy(true); sfx.click();
    const r = rand(10000) / 100;
    const t0 = performance.now(), from = shown ?? 50;
    const step = (t) => {
      const p = Math.min(1, (t - t0) / 650), e = 1 - Math.pow(1 - p, 3);
      setShown(from + (r - from) * e); if (Math.random() < 0.3) sfx.reelTick();
      if (p < 1) { raf.current = requestAnimationFrame(step); return; }
      const win = over ? r > target : r < target;
      const back = win ? Math.floor(stake * mult) : 0;
      pay(back); setRoll({ r, win, back }); setHist((h) => [{ r, win }, ...h].slice(0, 12)); setBusy(false);
      if (win) sfx.win(mult >= 10); else sfx.lose();
    };
    raf.current = requestAnimationFrame(step);
  };

  const blocked = paused || limitHit;
  const pos = shown ?? 50;
  return (
    <div className="game og dice">
      <aside className="og-panel">
        <BetInput value={stake} onChange={setStake} disabled={busy} />
        <div className="seg2"><button className={over ? 'on' : ''} onClick={() => setOver(true)} disabled={busy}>Por encima</button><button className={!over ? 'on' : ''} onClick={() => setOver(false)} disabled={busy}>Por debajo</button></div>
        <div className="og-stats"><div><small>Multiplicador</small><b>x{mult.toFixed(2)}</b></div><div><small>Probabilidad</small><b>{chance.toFixed(2)} %</b></div><div><small>Ganancia</small><b>{Math.floor(stake * mult) - stake}</b></div></div>
        <button className="btn btn--go big" onClick={play} disabled={busy || blocked}>{busy ? 'Tirando…' : 'Tirar'}</button>
      </aside>
      <div className="og-stage">
        <div className="hist-row">{hist.map((h, i) => <span key={i} className={h.win ? 'w' : 'l'}>{h.r.toFixed(2)}</span>)}</div>
        <div className={`dice-big ${roll && !busy ? (roll.win ? 'win' : 'lose') : ''}`}>{pos.toFixed(2)}</div>
        <div className="dice-track">
          <div className="dt-bar" style={{ '--t': `${target}%` }} data-over={over} />
          <input type="range" min="2" max="98" step="1" value={target} onChange={(e) => setTarget(+e.target.value)} disabled={busy} aria-label="Objetivo" />
          <i className="dt-marker" style={{ left: `${pos}%` }}><b>{pos.toFixed(2)}</b></i>
          <div className="dt-scale"><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div>
        </div>
        <p className="og-msg" aria-live="polite">{roll && !busy ? (roll.win ? `¡Ganas ${roll.back.toLocaleString('es-ES')} fichas!` : 'Esta vez no') : `Gana si sale ${over ? 'más de' : 'menos de'} ${target}`}</p>
        <Truth>
          <div className="truth-row"><span>Probabilidad de ganar</span><b>{chance.toFixed(2)} %</b></div>
          <div className="truth-row"><span>Retorno al jugador (RTP)</span><b>99 %</b></div>
          <div className="truth-row"><span>Si juegas 100 veces a {stake}, pierdes de media</span><b className="neg">{Math.round(stake * 100 * EDGE)} fichas</b></div>
          <p>El multiplicador es 99 ÷ probabilidad: la casa se queda siempre el 1 %, elijas el objetivo que elijas.</p>
        </Truth>
      </div>
    </div>
  );
}
