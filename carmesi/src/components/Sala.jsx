import { useEffect, useMemo, useRef, useState } from 'react';
import { createRestaurant } from '../scene/floor.js';
import { STOPS, TABLES, ZONES, ZONE_LABELS, FRAMES, PHOTOS, BAR, VENUE } from '../data.js';
import { useApp } from '../store.jsx';
import { Reveal, Icon, ChipSVG } from './ui.jsx';

const tcam = (t) => ({ t: [t.x, 0.7, t.z], r: t.g === 'restaurante' ? 4 : 5, th: 0.35, ph: 0.98 });
const wide = () => window.innerWidth > 960;
const hash = (s) => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
export const isBusy = (t, date, time) => hash(t.id + date + time) % 4 === 0;
const CHIP_COLORS = [['#b3122e', '#f4ead5'], ['#0e3b2e', '#f4ead5'], ['#101012', '#d8b26a'], ['#1f4fb8', '#f4ead5'], ['#5a1f7a', '#f4ead5'], ['#d8b26a', '#1a0d0a'], ['#7a2a1a', '#f4ead5'], ['#f4ead5', '#b3122e']];

export default function Sala() {
  const { booking, openBooking, floorRef } = useApp();
  const stageRef = useRef(null), canvasRef = useRef(null), pinsRef = useRef(null), cardRef = useRef(null), apiRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [stop, setStop] = useState('todo');
  const [table, setTable] = useState(null);
  const [seat, setSeat] = useState(false);
  const [walk, setWalk] = useState(false);
  const [hour, setHour] = useState(22);
  const [hov, setHov] = useState(null);
  const [served, setServed] = useState(null);
  const t = table && TABLES.find((x) => x.id === table);
  const side = () => (wide() ? 'r' : null);

  const config = useMemo(() => ({
    name: VENUE.full, tables: TABLES, frames: FRAMES, hour: 22, zoneLabels: ZONE_LABELS,
    photos: Object.fromEntries(Object.entries(PHOTOS).map(([k, v]) => [k, v.src])),
  }), []);

  useEffect(() => {
    let api;
    try {
      api = createRestaurant({
        canvas: canvasRef.current, stage: stageRef.current, pinsEl: pinsRef.current, config,
        getPanelWidth: () => (cardRef.current ? cardRef.current.offsetWidth : 380),
        onPickTable: (id) => pickTable(id),
        onPickZone: (go) => goStop(go === 'mesas' ? 'maquinas' : 'barra'),
        onReady: () => { setReady(true); api.setMode('explore'); api.fly(STOPS[0].cam, side(), 0); },
        onInteract: () => {},
        onHover: (info, x, y) => setHov(info ? { ...info, x, y } : null),
      });
      api.setHour(22, true);
      apiRef.current = api;
    } catch (e) { setFailed(true); }
    return () => { api && api.dispose(); apiRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  /* estado de los marcadores según la fecha y hora de la reserva */
  useEffect(() => {
    const api = apiRef.current; if (!api || !ready) return;
    api.setPinStates((id) => { const x = TABLES.find((q) => q.id === id); return (x && isBusy(x, booking.date, booking.time) ? ' busy' : '') + (id === table ? ' sel' : ''); });
  }, [ready, table, booking.date, booking.time]);

  function goStop(id) {
    const api = apiRef.current; const s = STOPS.find((x) => x.id === id); if (!api || !s) return;
    setStop(id); setTable(null); setSeat(false); setServed(null); setWalk(false);
    api.sel(null); api.clearDish(); api.setMode('explore'); api.fly(s.cam, side());
  }
  function pickTable(id) {
    const api = apiRef.current; const x = TABLES.find((q) => q.id === id); if (!api || !x) return;
    setTable(id); setSeat(false); setServed(null); setWalk(false);
    api.clearDish(); api.setMode('explore'); api.sel(id); api.fly(tcam(x), side());
  }
  floorRef.current = { pick: (id) => { document.getElementById('sala')?.scrollIntoView({ behavior: 'smooth' }); pickTable(id); }, select: (id) => pickTable(id) };

  const toggleSeat = () => {
    const api = apiRef.current; if (!api || !t) return;
    if (seat) { setSeat(false); api.setMode('explore'); api.fly(tcam(t), side()); } else { setSeat(true); api.seatView(t.id); }
  };
  const serve = (k) => { const api = apiRef.current; if (!api || !t) return; setServed(k); api.serveDish(t.id, k); };
  const startWalk = () => { const api = apiRef.current; if (!api) return; setWalk(true); setTable(null); setSeat(false); api.sel(null); api.clearDish(); api.startWalk(); stageRef.current?.classList.add('active'); };
  const endWalk = () => goStop('todo');
  const onHour = (h) => { setHour(h); apiRef.current && apiRef.current.setHour(h); };
  const hold = (x, y) => () => apiRef.current && apiRef.current.setMove(x, y);
  const release = () => apiRef.current && apiRef.current.setMove(0, 0);

  const s = STOPS.find((x) => x.id === stop);
  const busy = t && isBusy(t, booking.date, booking.time);
  const hovT = hov && hov.type === 'table' && TABLES.find((q) => q.id === hov.id);

  return (
    <section id="sala" className="sala sec">
      <div className="container sala-head">
        <Reveal><p className="kicker"><span className="dot" />La Sala · Valencia</p><h1 className="sala-h1">Once mesas, catorce máquinas<br /><em>y un escenario.</em></h1></Reveal>
        <Reveal delay={100}><p className="lead">Muévete por el casino antes de venir. Toca una ficha para ir a cada zona, o una mesa para ver si está libre, sentarte en ella y reservarla.</p></Reveal>
      </div>
      <div className="stops" role="toolbar" aria-label="Zonas de la sala">
        {STOPS.map((x, i) => (
          <button key={x.id} className={`stop ${stop === x.id && !table && !walk ? 'on' : ''}`} onClick={() => goStop(x.id)}>
            <ChipSVG c={CHIP_COLORS[i][0]} s={CHIP_COLORS[i][1]} size={46} /><span>{x.n}</span>
          </button>
        ))}
        <button className={`stop ${walk ? 'on' : ''}`} onClick={startWalk}><span className="stop-ic">{Icon.walk}</span><span>Pasear</span></button>
      </div>
      <div className={`sala-frame ${walk ? 'walking' : ''}`}>
        <i className="deco tl" /><i className="deco tr" /><i className="deco bl" /><i className="deco br" />
        <div className={`floor ${ready ? 'ready' : ''}`} ref={stageRef}
          onPointerDown={() => stageRef.current.classList.add('active')} onPointerLeave={() => !walk && stageRef.current.classList.remove('active')}>
          <canvas ref={canvasRef} aria-label="Casino en 3D. Toca una mesa para elegirla." />
          <div className="pins" ref={pinsRef} />
          {!ready && !failed && <div className="floor-load"><ChipSVG size={54} /><span>Abriendo la sala</span></div>}
          {failed && <div className="floor-load"><span>Tu navegador no ha podido abrir la vista 3D.</span></div>}
          {hovT && !walk && <div className="floor-tip" style={{ left: hov.x, top: hov.y }}><b>Mesa {hovT.id} · {hovT.zn}</b><span>{isBusy(hovT, booking.date, booking.time) ? 'Ocupada a esa hora' : 'Libre · toca para elegirla'}</span></div>}
          <div className="floor-hour">
            {Icon.moon}<input type="range" min="17" max="24" step="0.25" value={hour} onChange={(e) => onHour(+e.target.value)} aria-label="Luz de la sala según la hora" />
            <span>{String(Math.floor(hour) % 24).padStart(2, '0')}:{String(Math.round((hour % 1) * 60)).padStart(2, '0')}</span>
          </div>
          {walk && <>
            <div className="walk-hud"><span>W A S D o flechas para andar · arrastra para mirar</span><button className="btn btn--line sm" onClick={endWalk}>Salir del paseo</button></div>
            <div className="walk-pad" aria-hidden="true">
              <button onPointerDown={hold(0, -1)} onPointerUp={release} onPointerLeave={release}>▲</button>
              <button onPointerDown={hold(-1, 0)} onPointerUp={release} onPointerLeave={release}>◀</button>
              <button onPointerDown={hold(0, 1)} onPointerUp={release} onPointerLeave={release}>▼</button>
              <button onPointerDown={hold(1, 0)} onPointerUp={release} onPointerLeave={release}>▶</button>
            </div>
          </>}
          {!walk && (
            <aside className="floor-card" ref={cardRef} aria-live="polite">
              {t ? <>
                <p className="kicker">{t.zn}</p>
                <h3>Mesa {t.id}</h3>
                <p>{ZONES[t.zn]}</p>
                <dl className="facts"><div><dt>Plazas</dt><dd>{t.n}</dd></div><div><dt>{booking.time}</dt><dd className={busy ? 'no' : 'yes'}>{busy ? 'Ocupada' : 'Libre'}</dd></div></dl>
                <div className="col">
                  <button className="btn btn--gold" onClick={() => openBooking({ table: t.id })}>{Icon.cal}Reservar esta mesa</button>
                  <button className={`btn btn--line ${seat ? 'on' : ''}`} onClick={toggleSeat}>{Icon.chair}{seat ? 'Levantarme' : 'Sentarme y mirar'}</button>
                </div>
                <p className="card-sub">Pide algo a la mesa</p>
                <div className="serve">
                  {BAR.map((b) => <button key={b.k} className={served === b.k ? 'on' : ''} onClick={() => serve(b.k)} title={b.n}><i style={{ background: `linear-gradient(160deg, ${b.c[0]}, ${b.c[1]})` }} />{b.n}</button>)}
                </div>
              </> : <>
                <p className="kicker">Zona</p>
                <h3>{s.n}</h3>
                <p>{s.d}</p>
                <p className="card-sub">Toca un número en el plano para elegir mesa.</p>
                <div className="mini-list">
                  {TABLES.filter((x) => stop === 'todo' || x.zn.toLowerCase().includes(s.n.toLowerCase().slice(0, 4)) || (stop === 'vip' && x.vip)).slice(0, 6).map((x) => (
                    <button key={x.id} onClick={() => pickTable(x.id)}><b>{x.id}</b><span>{x.zn} · {x.n} plazas</span><em className={isBusy(x, booking.date, booking.time) ? 'no' : 'yes'}>{isBusy(x, booking.date, booking.time) ? 'Ocupada' : 'Libre'}</em></button>
                  ))}
                </div>
              </>}
            </aside>
          )}
        </div>
      </div>
    </section>
  );
}
