import { useEffect, useRef, useState } from 'react';
import { useApp } from '../store.jsx';
import { rand } from './Roulette.jsx';
import { sfx } from '../lib/sound.js';
import Truth from '../components/Truth.jsx';

/* Carmesí 777: tres rodillos y una línea central. */
const SYM = [
  { s: '7', c: '#ff3c6e', w: 2, pay: 100 }, { s: '◆', c: '#38e1ff', w: 3, pay: 50 }, { s: 'BAR', c: '#f4ead5', w: 4, pay: 25 },
  { s: '★', c: '#ffd36a', w: 5, pay: 15 }, { s: '🔔', c: '#ffd36a', w: 6, pay: 10 }, { s: '🍒', c: '#ff3c6e', w: 7, pay: 5 }, { s: '🍋', c: '#fff06a', w: 8, pay: 4 },
];
const CHERRY = 5;
const STRIP = SYM.flatMap((x, i) => Array(x.w).fill(i));
const pick = () => STRIP[rand(STRIP.length)];
const BETS = [1, 5, 10, 25];
const REEL_LEN = 30;
const DUR = [1500, 1900, 2300];

/* RTP exacto a partir del peso de cada símbolo en el rodillo */
const TOTAL_W = STRIP.length;
const P = SYM.map((x) => x.w / TOTAL_W);
const pc = P[CHERRY];
const THREE_KIND = SYM.reduce((a, x, i) => a + P[i] ** 3 * x.pay, 0);
const TWO_CH = 3 * pc * pc * (1 - pc) * 2, ONE_CH = 3 * pc * (1 - pc) ** 2 * 1;
export const SLOT_RTP = THREE_KIND + TWO_CH + ONE_CH;
const HIT = SYM.reduce((a, x, i) => a + P[i] ** 3, 0) - pc ** 3 + (1 - (1 - pc) ** 3);

export default function Slots() {
  const { chips, bet, pay, paused, limitHit } = useApp();
  const [stake, setStake] = useState(5);
  const [reels, setReels] = useState(() => [0, 1, 2].map(() => Array.from({ length: REEL_LEN }, pick)));
  const [offs, setOffs] = useState([0, 0, 0]);
  const [moving, setMoving] = useState([false, false, false]);
  const [spinning, setSpinning] = useState(false);
  const [win, setWin] = useState(null);
  const [line, setLine] = useState(false);
  const [lever, setLever] = useState(false);
  const spinId = useRef(0), timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (f, ms) => timers.current.push(setTimeout(f, ms));

  const spin = () => {
    if (spinning) return; if (!bet(stake)) return;
    setWin(null); setLine(false); setSpinning(true); setLever(true); later(() => setLever(false), 350);
    const id = ++spinId.current;
    const res = [pick(), pick(), pick()];
    /* 1) rodillos nuevos colocados arriba SIN transición; 2) en el siguiente fotograma, con transición, bajan hasta el resultado */
    const next = reels.map((r, k) => { const cur = r.slice(offs[k], offs[k] + 3); const fill = Array.from({ length: REEL_LEN - 6 }, pick); return [...cur, ...fill, pick(), res[k], pick()]; });
    setMoving([false, false, false]); setReels(next); setOffs([0, 0, 0]);
    requestAnimationFrame(() => requestAnimationFrame(() => { if (id !== spinId.current) return; setMoving([true, true, true]); setOffs([REEL_LEN - 3, REEL_LEN - 3, REEL_LEN - 3]); }));
    /* tic de los rodillos mientras giran y golpe al parar cada uno */
    for (let t = 80; t < DUR[2] - 200; t += 70) later(() => sfx.reelTick(), t);
    DUR.forEach((d, k) => later(() => sfx.reelStop(), d + 30 + k * 0));
    later(() => {
      if (id !== spinId.current) return;
      let mult = 0;
      if (res[0] === res[1] && res[1] === res[2]) mult = SYM[res[0]].pay;
      else { const ch = res.filter((x) => x === CHERRY).length; if (ch === 2) mult = 2; else if (ch === 1) mult = 1; }
      const w = stake * mult; pay(w); setWin(w); setLine(mult > 1); setSpinning(false);
      if (mult > 1) sfx.win(mult >= 15); else if (mult === 0) sfx.lose();
    }, DUR[2] + 120);
  };

  const blocked = paused || limitHit;
  return (
    <div className="game slots">
      <div className="slot-cab">
        <div className="slot-top"><span>CARMESÍ</span><b>777</b><i className="bulbs" aria-hidden="true" /></div>
        <div className={`slot-win ${line ? 'lit' : ''}`}>
          {[0, 1, 2].map((k) => (
            <div className="reel" key={k}>
              <div className="strip" style={{ transform: `translateY(calc(${-offs[k]} * var(--sh)))`, transitionDuration: moving[k] ? `${DUR[k]}ms` : '0ms' }}>
                {reels[k].map((i, j) => <span key={j} style={{ color: SYM[i].c }} className={SYM[i].s === 'BAR' ? 'bar' : ''}>{SYM[i].s}</span>)}
              </div>
            </div>
          ))}
          <i className="payline" aria-hidden="true" />
          <button className={`lever ${lever ? 'pull' : ''}`} onClick={spin} disabled={spinning || stake > chips || blocked} aria-label="Tirar de la palanca"><i /></button>
        </div>
        <div className="slot-msg" aria-live="polite">{win == null ? (spinning ? 'Suerte…' : 'Elige apuesta y tira de la palanca') : win > 0 ? `¡Ganas ${win.toLocaleString('es-ES')} fichas!` : 'Sin premio. Otra vez será.'}</div>
        <div className="slot-bar">
          <div className="seg">{BETS.map((b) => <button key={b} className={stake === b ? 'on' : ''} onClick={() => { setStake(b); sfx.chip(); }} disabled={spinning}>{b}</button>)}</div>
          <button className="btn btn--neon big" onClick={spin} disabled={spinning || stake > chips || blocked}>{spinning ? 'Girando…' : 'Tirar'}</button>
        </div>
      </div>
      <div className="slot-side">
        <div className="paytable">
          <h4>Premios por ficha apostada</h4>
          <ul>{SYM.map((x) => <li key={x.s}><span style={{ color: x.c }}>{x.s} {x.s} {x.s}</span><b>x{x.pay}</b></li>)}<li><span>🍒 🍒 cualquiera</span><b>x2</b></li><li><span>🍒 una</span><b>x1</b></li></ul>
        </div>
        <Truth>
          <div className="truth-row"><span>Retorno al jugador (RTP)</span><b>{(SLOT_RTP * 100).toFixed(1)} %</b></div>
          <div className="truth-row"><span>Probabilidad de algún premio por tirada</span><b>{(HIT * 100).toFixed(1)} %</b></div>
          <div className="truth-row"><span>Probabilidad del 7 7 7</span><b>1 entre {Math.round(1 / P[0] ** 3).toLocaleString('es-ES')}</b></div>
          <div className="truth-row"><span>Si tiras 100 veces a {stake}, pierdes de media</span><b className="neg">{Math.round(stake * 100 * (1 - SLOT_RTP))} fichas</b></div>
          <p>Calculado con el peso real de cada símbolo en los rodillos. La máquina no sabe si llevas una racha buena o mala: cada tirada es independiente.</p>
        </Truth>
      </div>
    </div>
  );
}
