import { useState } from 'react';
import { useApp } from '../store.jsx';
import { rand } from './Roulette.jsx';
import { sfx } from '../lib/sound.js';
import Truth from '../components/Truth.jsx';
import { BetInput } from './common.jsx';

/* Hi-Lo: ¿la siguiente carta será más alta o más baja? Baraja infinita, el empate pierde. Ventaja de la casa 1 %. */
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS = [['♠', 0], ['♥', 1], ['♦', 1], ['♣', 0]];
const EDGE = 0.01;
const draw = () => { const [s, red] = SUITS[rand(4)]; return { v: rand(13), s, red }; };
const pHi = (v) => (12 - v) / 13, pLo = (v) => v / 13;
const mOf = (p) => (p > 0 ? (1 - EDGE) / p : 0);

function Card({ c, i }) {
  return <div className={`hl-card ${c.red ? 'red' : ''}`} style={{ '--i': i }}><span className="tl">{RANKS[c.v]}<br />{c.s}</span><span className="mid">{c.s}</span><span className="br">{RANKS[c.v]}<br />{c.s}</span></div>;
}

export default function HiLo() {
  const { bet, pay, paused, limitHit } = useApp();
  const [stake, setStake] = useState(10);
  const [cards, setCards] = useState(() => [draw()]);
  const [mult, setMult] = useState(1);
  const [state, setState] = useState('idle'); /* idle · play · lost · cashed */
  const [msg, setMsg] = useState('Apuesta y adivina si la siguiente carta será más alta o más baja.');
  const cur = cards[cards.length - 1];

  const start = () => { if (!bet(stake)) return; setCards([draw()]); setMult(1); setState('play'); setMsg('¿Más alta o más baja?'); sfx.card(); };
  const guess = (hi) => {
    if (state !== 'play') return;
    const p = hi ? pHi(cur.v) : pLo(cur.v); if (p === 0) return;
    const n = draw(); const ok = hi ? n.v > cur.v : n.v < cur.v;
    setCards((cs) => [...cs, n].slice(-6)); sfx.card();
    if (ok) { const nm = mult * mOf(p); setMult(nm); setMsg(`¡Bien! Llevas x${nm.toFixed(2)}`); sfx.chip(); }
    else { setState('lost'); setMsg(n.v === cur.v ? 'Empate: pierde la mano.' : 'Fallaste. Se acabó la racha.'); sfx.lose(); }
  };
  const skip = () => { if (state !== 'play') return; setCards((cs) => [...cs, draw()].slice(-6)); sfx.card(); };
  const cash = () => { if (state !== 'play' || mult <= 1) return; const w = Math.floor(stake * mult); pay(w); setState('cashed'); setMsg(`¡Retiras ${w.toLocaleString('es-ES')} fichas!`); sfx.win(mult >= 5); };

  const blocked = paused || limitHit;
  return (
    <div className="game og hilo">
      <aside className="og-panel">
        <BetInput value={stake} onChange={setStake} disabled={state === 'play'} />
        <div className="og-stats"><div><small>Racha</small><b>x{mult.toFixed(2)}</b></div><div><small>Si retiras</small><b>{Math.floor(stake * mult).toLocaleString('es-ES')}</b></div></div>
        {state === 'play'
          ? <button className="btn btn--go big" onClick={cash} disabled={mult <= 1}>Retirar</button>
          : <button className="btn btn--go big" onClick={start} disabled={blocked}>{state === 'idle' ? 'Empezar' : 'Otra mano'}</button>}
      </aside>
      <div className="og-stage">
        <div className="hl-row">{cards.map((c, i) => <Card key={cards.length - cards.length + i + '-' + c.v + c.s + i} c={c} i={i} />)}</div>
        <p className="og-msg" aria-live="polite">{msg}</p>
        <div className="hl-btns">
          <button className="hl-b hi" onClick={() => guess(true)} disabled={state !== 'play' || cur.v === 12}><b>▲ Más alta</b><span>{(pHi(cur.v) * 100).toFixed(1)} % · x{mOf(pHi(cur.v)).toFixed(2)}</span></button>
          <button className="hl-b skip" onClick={skip} disabled={state !== 'play'}><b>Saltar</b><span>Sin coste</span></button>
          <button className="hl-b lo" onClick={() => guess(false)} disabled={state !== 'play' || cur.v === 0}><b>▼ Más baja</b><span>{(pLo(cur.v) * 100).toFixed(1)} % · x{mOf(pLo(cur.v)).toFixed(2)}</span></button>
        </div>
        <Truth>
          <div className="truth-row"><span>Con un {RANKS[cur.v]}, más alta</span><b>{(pHi(cur.v) * 100).toFixed(1)} %</b></div>
          <div className="truth-row"><span>Con un {RANKS[cur.v]}, más baja</span><b>{(pLo(cur.v) * 100).toFixed(1)} %</b></div>
          <div className="truth-row"><span>Empate (pierdes)</span><b className="neg">7,7 %</b></div>
          <p>El As es la carta más baja y la K la más alta. Cada acierto multiplica por 0,99 ÷ probabilidad: la casa se queda un 1 % en cada paso.</p>
        </Truth>
      </div>
    </div>
  );
}
