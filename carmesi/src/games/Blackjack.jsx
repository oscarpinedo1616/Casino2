import { useState } from 'react';
import { useApp } from '../store.jsx';
import { ChipSVG } from '../components/ui.jsx';
import { rand } from './Roulette.jsx';
import { sfx } from '../lib/sound.js';
import Truth from '../components/Truth.jsx';

/* Blackjack: zapato de 6 barajas, la banca pide hasta 16 y se planta en todos los 17, el blackjack paga 3 a 2, se puede doblar. */
const SUITS = [['♠', 0], ['♥', 1], ['♦', 1], ['♣', 0]];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const newShoe = () => { const s = []; for (let d = 0; d < 6; d++) for (const [su, red] of SUITS) for (const r of RANKS) s.push({ r, su, red }); for (let i = s.length - 1; i > 0; i--) { const j = rand(i + 1); [s[i], s[j]] = [s[j], s[i]]; } return s; };
const val = (r) => (r === 'A' ? 11 : ['J', 'Q', 'K'].includes(r) ? 10 : +r);
export const score = (hand) => { let t = 0, a = 0; for (const c of hand) { t += val(c.r); if (c.r === 'A') a++; } while (t > 21 && a) { t -= 10; a--; } return t; };
const isBJ = (h) => h.length === 2 && score(h) === 21;
const AMOUNTS = [5, 10, 25, 50, 100];
const soft = (hand) => { let t = 0, a = 0; for (const c of hand) { t += val(c.r); if (c.r === 'A') a++; } while (t > 21 && a) { t -= 10; a--; } return a > 0 && t <= 21; };
/* Estrategia básica sin separar parejas (6 barajas, la banca se planta en 17) */
const up = (c) => (c.r === 'A' ? 11 : val(c.r));
export function basic(hand, dealerUp, canDouble) {
  const t = score(hand), d = up(dealerUp), D = canDouble;
  if (soft(hand)) {
    if (t >= 19) return 'Plantarte';
    if (t === 18) return d >= 3 && d <= 6 && D ? 'Doblar' : d >= 9 ? 'Pedir carta' : 'Plantarte';
    if (t === 17) return d >= 3 && d <= 6 && D ? 'Doblar' : 'Pedir carta';
    if (t >= 15) return d >= 4 && d <= 6 && D ? 'Doblar' : 'Pedir carta';
    return d >= 5 && d <= 6 && D ? 'Doblar' : 'Pedir carta';
  }
  if (t >= 17) return 'Plantarte';
  if (t >= 13) return d <= 6 ? 'Plantarte' : 'Pedir carta';
  if (t === 12) return d >= 4 && d <= 6 ? 'Plantarte' : 'Pedir carta';
  if (t === 11) return d <= 10 && D ? 'Doblar' : 'Pedir carta';
  if (t === 10) return d <= 9 && D ? 'Doblar' : 'Pedir carta';
  if (t === 9) return d >= 3 && d <= 6 && D ? 'Doblar' : 'Pedir carta';
  return 'Pedir carta';
}
/* probabilidad aproximada de que la banca se pase según su carta visible */
const BUST = { 2: 35, 3: 37, 4: 40, 5: 42, 6: 42, 7: 26, 8: 24, 9: 23, 10: 23, 11: 17 };

function Card({ c, hidden, i }) {
  return (
    <div className={`card ${hidden ? 'down' : ''}`} style={{ '--i': i }}>
      <div className="card-in">
        <div className={`card-f ${c.red ? 'red' : ''}`}><span className="tl">{c.r}<br />{c.su}</span><span className="mid">{c.su}</span><span className="br">{c.r}<br />{c.su}</span></div>
        <div className="card-b" />
      </div>
    </div>
  );
}

export default function Blackjack() {
  const { chips, bet, pay, paused, limitHit } = useApp();
  const [shoe, setShoe] = useState(newShoe);
  const [stake, setStake] = useState(10);
  const [phase, setPhase] = useState('bet'); /* bet · play · done */
  const [player, setPlayer] = useState([]);
  const [dealer, setDealer] = useState([]);
  const [wager, setWager] = useState(0);
  const [msg, setMsg] = useState('Elige tu apuesta y reparte.');

  const draw = (s) => { let sh = s; if (sh.length < 60) sh = newShoe(); const c = sh[sh.length - 1]; return [c, sh.slice(0, -1)]; };

  const settle = (p, d, w) => {
    const ps = score(p), ds = score(d);
    let back = 0, m;
    if (ps > 21) m = 'Te pasas. Gana la banca.';
    else if (isBJ(p) && !isBJ(d)) { back = w + w * 1.5; m = '¡Blackjack! Pagado 3 a 2.'; }
    else if (isBJ(d) && !isBJ(p)) m = 'Blackjack de la banca.';
    else if (ds > 21) { back = w * 2; m = 'La banca se pasa. ¡Ganas!'; }
    else if (ps > ds) { back = w * 2; m = `Ganas con ${ps} contra ${ds}.`; }
    else if (ps === ds) { back = w; m = `Empate a ${ps}. Recuperas tu apuesta.`; }
    else m = `La banca gana con ${ds} contra ${ps}.`;
    pay(Math.round(back)); setMsg(m); setPhase('done');
    if (back > w) sfx.win(isBJ(p)); else if (back === 0) sfx.lose();
  };

  const dealerPlays = (p, d0, sh0, w) => {
    let d = d0, sh = sh0;
    if (score(p) <= 21 && !isBJ(p)) { while (score(d) < 17) { const [c, s2] = draw(sh); d = [...d, c]; sh = s2; } }
    setDealer(d); setShoe(sh); settle(p, d, w);
  };

  const deal = () => {
    if (!bet(stake)) return;
    let sh = shoe; const cs = []; for (let i = 0; i < 4; i++) { const [c, s2] = draw(sh); cs.push(c); sh = s2; }
    const p = [cs[0], cs[2]], d = [cs[1], cs[3]];
    [0, 120, 240, 360].forEach((t) => setTimeout(() => sfx.card(), t));
    setPlayer(p); setDealer(d); setShoe(sh); setWager(stake); setMsg('¿Pides carta o te plantas?'); setPhase('play');
    if (isBJ(p) || isBJ(d)) setTimeout(() => { setDealer(d); settle(p, d, stake); }, 700);
  };
  const hit = () => {
    const [c, sh] = draw(shoe); const p = [...player, c]; setPlayer(p); setShoe(sh); sfx.card();
    if (score(p) > 21) setTimeout(() => settle(p, dealer, wager), 450);
    else if (score(p) === 21) setTimeout(() => dealerPlays(p, dealer, sh, wager), 450);
  };
  const stand = () => dealerPlays(player, dealer, shoe, wager);
  const double = () => {
    if (!bet(wager)) return; const w = wager * 2; setWager(w); sfx.chip(); sfx.card();
    const [c, sh] = draw(shoe); const p = [...player, c]; setPlayer(p); setShoe(sh);
    setTimeout(() => (score(p) > 21 ? settle(p, dealer, w) : dealerPlays(p, dealer, sh, w)), 500);
  };

  const hideHole = phase === 'play';
  const blocked = paused || limitHit;
  return (
    <div className="game blackjack">
      <div className="felt">
        <p className="felt-rule">La banca pide hasta 16 y se planta en 17 · Blackjack paga 3 a 2</p>
        <div className="hand dealer">
          <span className="hand-l">Banca {dealer.length ? <b>{hideHole ? score([dealer[0]]) : score(dealer)}</b> : null}</span>
          <div className="cards">{dealer.map((c, i) => <Card key={i + c.r + c.su} c={c} i={i} hidden={hideHole && i === 1} />)}</div>
        </div>
        <div className="bj-msg" aria-live="polite">{msg}</div>
        <div className="hand player">
          <div className="cards">{player.map((c, i) => <Card key={i + c.r + c.su} c={c} i={i} />)}</div>
          <span className="hand-l">Tú {player.length ? <b>{score(player)}</b> : null}{wager && phase !== 'bet' ? <em> · apuesta {wager}</em> : null}</span>
        </div>
      </div>
      <Truth>
        {phase === 'play' && player.length ? <>
          <div className="truth-row hl"><span>La estrategia básica dice</span><b>{basic(player, dealer[0], player.length === 2 && wager <= chips)}</b></div>
          <div className="truth-row"><span>La banca enseña {dealer[0].r}: se pasa aprox.</span><b>{BUST[up(dealer[0])]} % de las veces</b></div>
          <p>La estrategia básica es la jugada matemáticamente mejor para cada mano. Siguiéndola, la ventaja de la casa baja a menos del 1 %.</p>
        </> : <>
          <div className="truth-row"><span>Ventaja de la casa con estrategia básica</span><b>≈ 0,5 %</b></div>
          <div className="truth-row"><span>Ventaja de la casa jugando «a ojo»</span><b className="neg">2–4 %</b></div>
          <p>Reparte y te diremos, en cada mano, qué jugada recomiendan las matemáticas. Así aprendes mientras juegas.</p>
        </>}
      </Truth>
      <div className="bj-bar">
        {phase === 'play' ? <>
          <button className="btn btn--gold" onClick={hit}>Pedir carta</button>
          <button className="btn btn--line" onClick={stand}>Plantarme</button>
          <button className="btn btn--line" onClick={double} disabled={player.length !== 2 || wager > chips}>Doblar</button>
        </> : <>
          <div className="chip-pick" role="radiogroup" aria-label="Apuesta">
            {AMOUNTS.map((v, i) => <button key={v} role="radio" aria-checked={stake === v} className={stake === v ? 'on' : ''} onClick={() => { setStake(v); sfx.chip(); }}><ChipSVG c={['#e9e2d0', '#b3122e', '#0e3b2e', '#1f4fb8', '#101012'][i]} s={i ? '#f4ead5' : '#1a1a1a'} size={44} /><i>{v}</i></button>)}
          </div>
          <button className="btn btn--gold" onClick={deal} disabled={stake > chips || blocked}>{phase === 'done' ? 'Otra mano' : 'Repartir'}</button>
        </>}
      </div>
    </div>
  );
}
