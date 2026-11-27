import { useState } from 'react';
import { useApp } from '../store.jsx';
import { rand } from './Roulette.jsx';
import { sfx } from '../lib/sound.js';
import Truth from '../components/Truth.jsx';
import { BetInput } from './common.jsx';

/* Mines: 25 casillas con minas escondidas. Cada gema sube el multiplicador; una mina lo pierde todo. */
const N = 25, EDGE = 0.01;
export const minesMult = (m, k) => { let x = 1 - EDGE; for (let i = 0; i < k; i++) x *= (N - i) / (N - m - i); return x; };

export default function Mines() {
  const { bet, pay, paused, limitHit } = useApp();
  const [stake, setStake] = useState(10);
  const [mines, setMines] = useState(3);
  const [board, setBoard] = useState(null); /* posiciones de las minas */
  const [open, setOpen] = useState([]);
  const [state, setState] = useState('idle'); /* idle · play · boom · cashed */
  const [won, setWon] = useState(0);
  const k = open.length, mult = minesMult(mines, k), next = minesMult(mines, k + 1);

  const start = () => {
    if (!bet(stake)) return;
    const s = new Set(); while (s.size < mines) s.add(rand(N));
    setBoard(s); setOpen([]); setState('play'); setWon(0); sfx.chip();
  };
  const reveal = (i) => {
    if (state !== 'play' || open.includes(i)) return;
    if (board.has(i)) { setOpen((o) => [...o, i]); setState('boom'); sfx.lose(); return; }
    const o = [...open, i]; setOpen(o); sfx.tick(1); sfx.chip();
    if (o.length === N - mines) cash(o.length);
  };
  const cash = (n = k) => { if (state !== 'play' || n === 0) return; const w = Math.floor(stake * minesMult(mines, n)); pay(w); setWon(w); setState('cashed'); sfx.win(minesMult(mines, n) >= 5); };

  const ended = state === 'boom' || state === 'cashed';
  const blocked = paused || limitHit;
  const pSafe = (N - mines - k) / (N - k);
  return (
    <div className="game og mines">
      <aside className="og-panel">
        <BetInput value={stake} onChange={setStake} disabled={state === 'play'} />
        <label className="bet-in"><span>Minas</span><select value={mines} onChange={(e) => setMines(+e.target.value)} disabled={state === 'play'}>{[1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 24].map((m) => <option key={m} value={m}>{m}</option>)}</select></label>
        <div className="og-stats"><div><small>Multiplicador</small><b>x{mult.toFixed(2)}</b></div><div><small>Siguiente gema</small><b>x{next.toFixed(2)}</b></div><div><small>Gemas</small><b>{k}/{N - mines}</b></div></div>
        {state === 'play'
          ? <button className="btn btn--go big" onClick={() => cash()} disabled={k === 0}>Retirar {Math.floor(stake * mult).toLocaleString('es-ES')}</button>
          : <button className="btn btn--go big" onClick={start} disabled={blocked}>{ended ? 'Otra partida' : 'Empezar'}</button>}
      </aside>
      <div className="og-stage">
        <div className={`mgrid ${state}`}>
          {Array.from({ length: N }, (_, i) => {
            const isOpen = open.includes(i) || (ended && board);
            const mine = board && board.has(i);
            return <button key={i} className={`mc ${isOpen ? (mine ? 'mine' : 'gem') : ''} ${open.includes(i) ? 'picked' : ''}`} onClick={() => reveal(i)} disabled={state !== 'play'} aria-label={`Casilla ${i + 1}`}>{isOpen ? (mine ? '💣' : '💎') : ''}</button>;
          })}
        </div>
        <p className="og-msg" aria-live="polite">{state === 'boom' ? '¡Boom! Esta vez ha salido mina.' : state === 'cashed' ? `¡Retiras ${won.toLocaleString('es-ES')} fichas! (x${(won / stake).toFixed(2)})` : state === 'play' ? 'Elige una casilla o retira lo ganado' : 'Elige apuesta y número de minas'}</p>
        <Truth>
          <div className="truth-row"><span>Probabilidad de que la próxima sea gema</span><b>{(pSafe * 100).toFixed(1)} %</b></div>
          <div className="truth-row"><span>Probabilidad de llegar a 5 gemas</span><b>{(((1 - EDGE) / minesMult(mines, Math.min(5, N - mines))) * 100).toFixed(2)} %</b></div>
          <div className="truth-row"><span>Retorno al jugador (RTP)</span><b>99 %</b></div>
          <p>Cada multiplicador es justo menos un 1 %: da igual cuándo retires, a la larga la casa se queda ese 1 %.</p>
        </Truth>
      </div>
    </div>
  );
}
