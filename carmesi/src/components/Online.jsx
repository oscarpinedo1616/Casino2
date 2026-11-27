import { useEffect, useState } from 'react';
import { useApp } from '../store.jsx';
import { GAMES } from '../data.js';
import { Reveal, Count, ChipSVG, Icon } from './ui.jsx';
import Roulette from '../games/Roulette.jsx';
import Blackjack from '../games/Blackjack.jsx';
import Slots, { SLOT_RTP } from '../games/Slots.jsx';
import Plinko from '../games/Plinko.jsx';
import Mines from '../games/Mines.jsx';
import Crash from '../games/Crash.jsx';
import Dice from '../games/Dice.jsx';
import HiLo from '../games/HiLo.jsx';
import { Tile, useIcons } from './Home.jsx';

const COMP = { ruleta: Roulette, blackjack: Blackjack, slots: Slots, plinko: Plinko, mines: Mines, crash: Crash, dice: Dice, hilo: HiLo };
export const fmtT = (ms) => { const m = Math.floor(ms / 60000), s = Math.floor((ms % 60000) / 1000); return `${m}:${String(s).padStart(2, '0')}`; };
const REALITY = 10 * 60 * 1000;

/* Aprende: cuánto se queda la casa en cada juego */
const EDGES = [
  { n: 'Blackjack con estrategia básica', e: 0.5, ours: true },
  { n: 'Ruleta europea', e: 2.7, ours: true },
  { n: 'Dice, Mines, Crash e Hi-Lo', e: 1, ours: true },
  { n: 'Carmesí 777', e: +(100 - SLOT_RTP * 100).toFixed(1), ours: true },
  { n: 'Ruleta americana (doble cero)', e: 5.26 },
  { n: 'Lotería de Navidad', e: 30 },
];
export function Learn() {
  const [n, setN] = useState(100);
  const stake = 10, max = Math.max(...EDGES.map((x) => x.e));
  return (
    <section className="learn sec" id="aprende">
      <div className="container learn-grid">
        <Reveal><p className="kicker neon"><span className="dot" />Aprende</p><h2>La casa siempre gana.<br /><em>Esto es lo que gana.</em></h2>
          <p className="lead">La ventaja de la casa es la parte de cada apuesta que, a la larga, se queda el juego. Mueve la barra y mira qué perderías de media apostando {stake} fichas por jugada.</p>
          <label className="learn-n">Jugadas: <b>{n.toLocaleString('es-ES')}</b><input type="range" min="10" max="1000" step="10" value={n} onChange={(e) => setN(+e.target.value)} /></label>
          <p className="learn-note">A corto plazo puede pasar cualquier cosa; cuanto más juegas, más se parece tu resultado a estos números.</p>
        </Reveal>
        <Reveal delay={120} className="edges">
          {EDGES.map((x) => (
            <div key={x.n} className={`edge ${x.ours ? 'ours' : ''}`}>
              <div className="edge-t"><span>{x.n}</span><b>{x.e.toLocaleString('es-ES')} %</b></div>
              <div className="edge-bar"><i style={{ width: `${Math.max(1.5, (Math.sqrt(x.e) / Math.sqrt(max)) * 100)}%` }} /></div>
              <div className="edge-l">Pierdes de media <b>{Math.round((n * stake * x.e) / 100).toLocaleString('es-ES')}</b> de {(n * stake).toLocaleString('es-ES')} fichas</div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

export function Responsible() {
  const { paused, pauseUntil, setPauseUntil, limit, setLimit, sessionLoss, playMs, limitHit } = useApp();
  return (
    <section className="rg-sec" id="responsable">
      <div className="container">
        <Reveal as="div" className="rg">
          <div className="rg-l"><span className="rg-ic">{Icon.shield}</span><div><h3>Juego responsable</h3><p>Pon tus propios límites. Aquí jugamos con fichas de mentira, pero las herramientas son las mismas que debe tener un casino online de verdad.</p></div></div>
          <div className="rg-tools">
            <div className="rg-box"><small>Tiempo jugando hoy</small><b>{fmtT(playMs)}</b><span>Te avisamos cada 10 minutos.</span></div>
            <div className="rg-box"><small>Balance de la sesión</small><b className={sessionLoss > 0 ? 'neg' : 'pos'}>{sessionLoss > 0 ? '−' : '+'}{Math.abs(sessionLoss).toLocaleString('es-ES')}</b><span>{limitHit ? 'Límite alcanzado: no puedes apostar más hoy.' : 'Fichas ganadas o perdidas.'}</span></div>
            <label className="rg-box"><small>Límite de pérdida por sesión</small>
              <select value={limit} onChange={(e) => setLimit(+e.target.value)}><option value={0}>Sin límite</option><option value={100}>100 fichas</option><option value={250}>250 fichas</option><option value={500}>500 fichas</option></select>
              <span>Al llegar, se bloquean las apuestas.</span></label>
            <div className="rg-box">{paused ? <>
              <small>Pausa activa hasta</small><b>{new Date(pauseUntil).toLocaleString('es-ES', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</b>
              <button className="link" onClick={() => setPauseUntil(0)}>Quitar pausa (solo en esta demo)</button></> : <>
              <small>Tomarte un descanso</small><button className="btn btn--line sm" onClick={() => setPauseUntil(Date.now() + 24 * 3600e3)}>Pausa de 24 horas</button><span>No podrás jugar hasta mañana.</span></>}</div>
          </div>
          <p className="rg-foot">Solo para mayores de 18 años. Si el juego deja de ser un entretenimiento, pide ayuda en <a href="https://www.jugarbien.es" target="_blank" rel="noopener">jugarbien.es</a>. En España, el juego online con dinero real solo pueden ofrecerlo operadores con licencia de la Dirección General de Ordenación del Juego.</p>
        </Reveal>
      </div>
    </section>
  );
}

function More({ id }) {
  const { go } = useApp(); const icons = useIcons();
  return (
    <div className="more container"><h2>Más juegos</h2>
      <div className="row2-track">{GAMES.filter((g) => g.id !== id).map((g) => <Tile key={g.id} g={g} icon={icons[g.icon]} badge={`RTP ${g.rtp}`} onClick={() => go(`juego/${g.id}`)} />)}</div>
    </div>
  );
}

export function GamePage({ id }) {
  const { go, chips, playMs, refill, paused, limitHit } = useApp();
  const [check, setCheck] = useState(false);
  const [next, setNext] = useState(REALITY);
  useEffect(() => { if (playMs >= next) { setCheck(true); setNext((n) => n + REALITY); } }, [playMs, next]);
  useEffect(() => { const k = (e) => { if (e.key === 'Escape') go(''); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [go]);
  const G = COMP[id]; const meta = GAMES.find((x) => x.id === id);
  if (!G) return null;
  return (
    <section className={`room room-${id}`} aria-label={meta.n}>
      <header className="room-top">
        <button className="btn btn--line sm" onClick={() => go('')}>← Lobby</button>
        <h1>{meta.n}</h1>
        <span className="room-rtp">RTP {meta.rtp}</span>
        <div className="room-stat"><span className="t" title="Tiempo jugando">{Icon.clock}{fmtT(playMs)}</span></div>
      </header>
      {(paused || limitHit) && <div className="room-block">{paused ? 'Tienes una pausa activa: no puedes apostar.' : 'Has llegado a tu límite de pérdida de esta sesión.'}</div>}
      {chips < 5 && !paused && <div className="room-block">Te has quedado sin fichas. <button className="link" onClick={refill}>Recargar 1.000 fichas de demostración</button></div>}
      <div className="room-body"><G key={id} /></div>
      <More id={id} />
      {check && (
        <div className="reality" role="alertdialog" aria-labelledby="rc-t">
          <div className="reality-card"><h3 id="rc-t">Llevas {Math.floor(playMs / 60000)} minutos jugando</h3><p>¿Quieres seguir o hacer una pausa?</p>
            <div className="row"><button className="btn btn--gold" onClick={() => setCheck(false)}>Seguir jugando</button><button className="btn btn--line" onClick={() => { setCheck(false); go(''); }}>Salir al lobby</button></div></div>
        </div>
      )}
    </section>
  );
}
