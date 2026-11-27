import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../store.jsx';
import { GAMES, SALA_TILES } from '../data.js';
import { renderIcons } from '../scene/icons.js';
import { createHero3D } from '../scene/hero3d.js';
import { Count, ChipSVG, Icon } from './ui.jsx';
import { SLOT_RTP } from '../games/Slots.jsx';
import { PLINKO_RTP } from '../games/Plinko.jsx';

const ALL_ICONS = ['plinko', 'mines', 'crash', 'dice', 'hilo', 'ruleta', 'blackjack', 'slots', 'casino', 'sala'];
const RTP = { slots: SLOT_RTP, plinko: PLINKO_RTP };
const rtpOf = (g) => (RTP[g.id] ? `${(RTP[g.id] * 100).toFixed(1).replace('.', ',')} %` : g.rtp);

/* iconos 3D: se dibujan una vez y se reutilizan en toda la web */
export function useIcons() {
  const [icons, setIcons] = useState({});
  useEffect(() => { let on = true; renderIcons(ALL_ICONS).then((m) => on && setIcons(m)); return () => { on = false; }; }, []);
  return icons;
}

export function Tile({ g, icon, onClick, sub = 'Carmesí', badge }) {
  return (
    <button className="tile2" style={{ '--a': g.g[0], '--b': g.g[1] }} onClick={onClick} aria-label={`${g.n}: ${g.d}`}>
      <span className="t2-glow" aria-hidden="true" />
      {icon ? <img className="t2-ic" src={icon} alt="" draggable="false" /> : <span className="t2-ic ph" aria-hidden="true" />}
      {badge && <span className="t2-badge">{badge}</span>}
      <span className="t2-name">{g.n}</span>
      <span className="t2-sub">{sub}</span>
    </button>
  );
}

function Row({ id, title, emoji, children, count }) {
  const ref = useRef(null);
  const [all, setAll] = useState(false);
  const by = (d) => ref.current && ref.current.scrollBy({ left: d * ref.current.clientWidth * 0.8, behavior: 'smooth' });
  return (
    <section className="row2" id={id} aria-label={title}>
      <header className="row2-h">
        <h2><span className="row2-ic" aria-hidden="true">{emoji}</span>{title}{count != null && <em>{count}</em>}</h2>
        <div className="row2-ctl">
          <button className="pill" onClick={() => setAll(!all)}>{all ? 'Ver menos' : 'Ver todo'}</button>
          {!all && <><button className="sq" onClick={() => by(-1)} aria-label="Anteriores">‹</button><button className="sq" onClick={() => by(1)} aria-label="Siguientes">›</button></>}
        </div>
      </header>
      <div className={`row2-track ${all ? 'grid' : ''}`} ref={ref}>{children}</div>
    </section>
  );
}

export default function Home() {
  const { go, chips } = useApp();
  const icons = useIcons();
  const [q, setQ] = useState('');
  const stageRef = useRef(null), cvRef = useRef(null);
  const [heroOk, setHeroOk] = useState(true);
  useEffect(() => { let api; try { api = createHero3D({ canvas: cvRef.current, stage: stageRef.current }); } catch (e) { setHeroOk(false); } return () => api && api.dispose(); }, []);

  const found = useMemo(() => { const s = q.trim().toLowerCase(); return s ? GAMES.filter((g) => (g.n + ' ' + g.d).toLowerCase().includes(s)) : null; }, [q]);
  const orig = GAMES.filter((g) => g.cat === 'originales'), casino = GAMES.filter((g) => g.cat === 'casino');
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="home container">
      <div className="top2">
        <div className="banner" ref={stageRef}>
          <canvas ref={cvRef} className="banner-cv" aria-hidden="true" />
          {!heroOk && <div className="banner-fallback" aria-hidden="true"><ChipSVG size={220} c="#e0234e" s="#fff" /></div>}
          <div className="banner-txt">
            <span className="pill-coin"><ChipSVG size={18} c="#ffcf3a" s="#7a3e00" /><Count value={chips} /> fichas de regalo</span>
            <h1>Tu noche<br />empieza aquí</h1>
            <p>Ocho juegos con fichas gratis y un casino de verdad que puedes recorrer en 3D.</p>
            <div className="banner-cta">
              <button className="btn btn--go" onClick={() => scrollTo('originales')}>Jugar gratis</button>
              <span className="or">o</span>
              <button className="sq big" onClick={() => go('sala')} aria-label="Ver la Sala en 3D" title="La Sala 3D">{Icon.pin}</button>
              <button className="sq big" onClick={() => scrollTo('aprende')} aria-label="Aprende cómo funcionan" title="Aprende">{Icon.shield}</button>
            </div>
          </div>
        </div>
        <div className="cats">
          <button className="cat cat-casino" onClick={() => scrollTo('casino')}>
            <small>{GAMES.length} juegos gratis</small><b>Casino online</b>
            {icons.casino && <img src={icons.casino} alt="" />}
          </button>
          <button className="cat cat-sala" onClick={() => go('sala')}>
            <small>Valencia · en 3D</small><b>La Sala</b>
            {icons.sala && <img src={icons.sala} alt="" />}
          </button>
        </div>
      </div>

      <label className="search">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Busca entre ${GAMES.length} juegos`} aria-label="Buscar juegos" />
      </label>

      {found ? (
        <Row id="resultados" title={found.length ? 'Resultados' : 'Nada por aquí'} emoji="🔎" count={found.length}>
          {found.map((g) => <Tile key={g.id} g={g} icon={icons[g.icon]} badge={`RTP ${rtpOf(g)}`} onClick={() => go(`juego/${g.id}`)} />)}
        </Row>
      ) : <>
        <Row id="originales" title="Originales Carmesí" emoji="💎" count={orig.length}>
          {orig.map((g) => <Tile key={g.id} g={g} icon={icons[g.icon]} badge={`RTP ${rtpOf(g)}`} onClick={() => go(`juego/${g.id}`)} />)}
        </Row>
        <Row id="casino" title="Juegos de casino" emoji="🔥" count={casino.length}>
          {casino.map((g) => <Tile key={g.id} g={g} icon={icons[g.icon]} badge={`RTP ${rtpOf(g)}`} onClick={() => go(`juego/${g.id}`)} />)}
          <div className="tile2 soon" aria-hidden="true"><span className="t2-name">Póker</span><span className="t2-sub">Muy pronto</span></div>
        </Row>
        <Row id="ensala" title="En la Sala · Valencia" emoji="📍">
          {SALA_TILES.map((t) => <Tile key={t.id} g={t} icon={icons[t.icon]} sub={t.d} badge="Reservar" onClick={() => go('sala')} />)}
        </Row>
        <div className="truth-band">
          <span className="tb-eye" aria-hidden="true"><i /></span>
          <div><b>Modo transparente</b><p>En cada juego verás tu probabilidad real de ganar, lo que se queda la casa y la mejor jugada. Ningún casino te lo enseña; nosotros sí.</p></div>
          <button className="btn btn--line sm" onClick={() => scrollTo('aprende')}>Cómo funciona</button>
        </div>
      </>}
    </div>
  );
}
