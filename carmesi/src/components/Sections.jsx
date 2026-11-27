import { useEffect, useState } from 'react';
import { useApp, waLink, money } from '../store.jsx';
import { BAR, EVENTS, VENUE, TABLES, TIMES, PHOTOS } from '../data.js';
import { Reveal, Count, ChipSVG, Icon } from './ui.jsx';
import { sound, sfx } from '../lib/sound.js';
import { isBusy } from './Sala.jsx';

const go_ = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

function SoundBtn() {
  const [on, setOn] = useState(sound.on);
  useEffect(() => sound.sub(setOn), []);
  return <button className="snd" onClick={() => { sound.set(!on); if (!on) setTimeout(() => sfx.chip(), 30); }} aria-pressed={on} aria-label={on ? 'Silenciar sonidos' : 'Activar sonidos'} title={on ? 'Sonido activado' : 'Sonido apagado'}>
    <span className={`eq ${on ? 'on' : ''}`} aria-hidden="true"><i /><i /><i /><i /></span></button>;
}

/* el otro mundo, a un clic: una ficha que se gira */
function Switch({ to }) {
  const { go } = useApp();
  const sala = to === 'sala';
  return <button className={`switch to-${to}`} onClick={() => go(to)} aria-label={sala ? 'Ir a la Sala' : 'Ir a Carmesí Online'}>
    <span className="sw-chip" aria-hidden="true"><ChipSVG c={sala ? '#b3122e' : '#1c1240'} s={sala ? '#f4ead5' : '#38e1ff'} size={22} /></span>{sala ? 'La Sala' : 'Online'}</button>;
}

export function Nav() {
  const { go, route, chips, openBooking } = useApp();
  const [solid, setSolid] = useState(false);
  const [menu, setMenu] = useState(false);
  useEffect(() => { const f = () => setSolid(window.scrollY > 10); f(); window.addEventListener('scroll', f, { passive: true }); return () => window.removeEventListener('scroll', f); }, []);
  const sala = route.world === 'sala';
  const toSec = (id) => () => { setMenu(false); if (route.world !== 'home') { go(''); setTimeout(() => go_(id), 650); } else go_(id); };
  const links = sala
    ? [['La sala 3D', () => go_('sala')], ['Barra', () => go_('barra')], ['Eventos', () => go_('eventos')], ['Regalar', () => go_('regalo')], ['Visítanos', () => go_('visita')]]
    : [['Originales', toSec('originales')], ['Casino', toSec('casino')], ['La Sala', () => go('sala')], ['Aprende', toSec('aprende')], ['Juego responsable', toSec('responsable')]];
  return (
    <header className={`nav2 ${solid ? 'solid' : ''} ${menu ? 'open' : ''}`}>
      <a href="#/" className="logo2" onClick={(e) => { e.preventDefault(); setMenu(false); go(''); }} aria-label="Casino Carmesí, inicio"><ChipSVG size={28} c="#e0234e" s="#fff" /><span>Carmesí</span></a>
      <nav aria-label="Secciones">{links.map(([n, fn]) => <a key={n} href="#" onClick={(e) => { e.preventDefault(); setMenu(false); fn(); }}>{n}</a>)}</nav>
      <div className="nav2-r">
        <SoundBtn />
        <button className="wal2" onClick={toSec('originales')} aria-label="Tus fichas de demostración"><ChipSVG size={18} c="#ffcf3a" s="#7a3e00" /><b><Count value={chips} /></b></button>
        {sala ? <button className="btn btn--go sm" onClick={() => openBooking({})}>Reservar</button>
          : <button className="btn btn--dark sm" onClick={() => go('sala')}>La Sala 3D</button>}
        <button className="burger" aria-label="Menú" aria-expanded={menu} onClick={() => setMenu(!menu)}><i /><i /></button>
      </div>
    </header>
  );
}

export function Curtain() {
  const { tx } = useApp();
  if (!tx) return null;
  const sala = tx.to === 'sala';
  return <div key={tx.id} className={`curtain to-${tx.to}`} aria-hidden="true"><div className="curtain-chip"><ChipSVG size={120} c={sala ? '#e0234e' : '#1fe07a'} s={sala ? '#fff' : '#0b1a12'} /></div><p>{sala ? 'La Sala · Valencia' : 'Casino Carmesí'}</p></div>;
}

function Glass({ g, c }) {
  const liq = `linear-gradient(180deg, ${c[0]}, ${c[1]})`;
  if (g === 'martini') return <div className="gl gl-m"><i className="bowl"><i style={{ background: liq }} /></i><i className="stem" /><i className="foot" /><i className="olive" /></div>;
  if (g === 'flute') return <div className="gl gl-f"><i className="bowl"><i style={{ background: liq }} /><b className="bub" /><b className="bub b2" /><b className="bub b3" /></i><i className="stem" /><i className="foot" /></div>;
  if (g === 'plate') return <div className="gl gl-p"><i className="plate" /><i className="food" style={{ background: liq }} /></div>;
  return <div className="gl gl-r"><i className="bowl"><i style={{ background: liq }} /><b className="ice" /></i></div>;
}

export function Bar() {
  return (
    <section id="barra" className="barra sec">
      <div className="container">
        <Reveal className="sec-head"><p className="kicker"><span className="dot" />La barra</p><h2>Una copa antes<br /><em>de la partida.</em></h2><p className="lead">Coctelería clásica, champán y una cena corta. Te lo llevamos a la mesa de juego: pruébalo en la sala 3D.</p></Reveal>
        <div className="drinks">
          {BAR.map((b, i) => (
            <Reveal key={b.n} delay={i * 70} className="drink">
              <div className="drink-art" style={{ '--c': b.c[0] }}><Glass g={b.g} c={b.c} /></div>
              <div className="drink-t"><h3>{b.n}</h3><p>{b.d}</p></div>
              <span className="price">{b.p} €</span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Events() {
  const { openBooking } = useApp();
  return (
    <section id="eventos" className="events sec">
      <div className="container">
        <Reveal className="sec-head"><p className="kicker"><span className="dot" />Esta semana</p><h2>Cada noche,<br /><em>una mesa distinta.</em></h2></Reveal>
        <ol className="ev-list">
          {EVENTS.map((e, i) => (
            <Reveal as="li" key={e.t} delay={i * 80} className="ev">
              <span className="ev-day">{e.day}</span>
              <div className="ev-t"><h3>{e.t}</h3><p>{e.d}</p></div>
              <span className="ev-time">{e.time}</span>
              <button className="btn btn--line sm" onClick={() => openBooking({ table: e.table, guests: e.guests, time: e.time })}>Reservar plaza</button>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Gift() {
  const [amt, setAmt] = useState(100);
  const [to, setTo] = useState('');
  const [from, setFrom] = useState('');
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const txt = `Hola, quiero una invitación regalo de ${amt} € para ${to || '…'}, de parte de ${from || '…'}.`;
  return (
    <section id="regalo" className="gift sec">
      <div className="container gift-grid">
        <Reveal><p className="kicker"><span className="dot" />Regalar</p><h2>Una noche en Carmesí,<br /><em>en un sobre.</em></h2>
          <p className="lead">Una invitación con importe para cena, copas o la mesa VIP. Vale para un año. No se puede canjear por fichas de juego.</p>
          <div className="amts">{[50, 100, 150, 250].map((a) => <button key={a} className={amt === a ? 'on' : ''} onClick={() => setAmt(a)}>{a} €</button>)}</div>
          <div className="gift-f"><label>Para<input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Nombre" /></label><label>De parte de<input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Tu nombre" /></label></div>
          <a className="btn btn--gold" href={waLink(txt)} target="_blank" rel="noopener">{Icon.wa}Pedirla por WhatsApp</a>
        </Reveal>
        <Reveal delay={120} className="ticket-wrap" onPointerMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setTilt({ x: ((e.clientX - r.left) / r.width - 0.5) * 16, y: ((e.clientY - r.top) / r.height - 0.5) * -12 }); }} onPointerLeave={() => setTilt({ x: 0, y: 0 })}>
          <div className="ticket" style={{ transform: `rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)` }}>
            <div className="tk-l"><small>Invitación</small><b>Casino Carmesí</b><span>Para <em>{to || 'alguien especial'}</em></span><span>De parte de <em>{from || 'ti'}</em></span></div>
            <div className="tk-r"><span className="tk-amt">{amt}<small>€</small></span><ChipSVG size={54} /></div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function Visit() {
  return (
    <section id="visita" className="visit sec">
      <div className="container visit-grid">
        <Reveal><p className="kicker"><span className="dot" />Visítanos</p><h2>{VENUE.address}<br /><em>{VENUE.city}</em></h2>
          <table className="hours"><tbody>{VENUE.hours.map(([d, h]) => <tr key={d}><td>{d}</td><td>{h}</td></tr>)}</tbody></table>
          <ul className="rules"><li><span className="age18">+18</span>Entrada con DNI, pasaporte o carné de conducir.</li><li>{Icon.shield}Prohibida la entrada a personas inscritas en el registro de autoexclusión del juego.</li><li>{Icon.chair}Vestimenta cuidada; en la sala VIP, sin bermudas.</li></ul>
          <div className="row"><a className="btn btn--line" href={VENUE.maps} target="_blank" rel="noopener">{Icon.pin}Cómo llegar</a><a className="btn btn--line" href={`tel:+34${VENUE.phone.replace(/\s/g, '')}`}>{VENUE.phone}</a></div>
        </Reveal>
        <Reveal delay={120} className="map-deco" aria-hidden="true">
          <svg viewBox="0 0 400 400"><defs><pattern id="mg" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="rgba(216,178,106,.12)" /></pattern></defs>
            <rect width="400" height="400" fill="url(#mg)" /><path d="M0 250 Q200 210 400 260" stroke="rgba(216,178,106,.5)" strokeWidth="14" fill="none" /><path d="M150 0 L190 400" stroke="rgba(216,178,106,.35)" strokeWidth="9" /><path d="M0 90 L400 120" stroke="rgba(216,178,106,.25)" strokeWidth="6" />
            <circle cx="182" cy="232" r="46" fill="rgba(179,18,46,.2)" /><circle cx="182" cy="232" r="14" fill="#b3122e" stroke="#d8b26a" strokeWidth="3" /><text x="210" y="205" fill="#f4ead5" fontSize="15" fontFamily="Manrope, sans-serif">Carmesí</text></svg>
        </Reveal>
      </div>
    </section>
  );
}

export function Footer({ world = 'sala' }) {
  const credited = Object.entries(PHOTOS).filter(([, p]) => p.author);
  return (
    <footer className={`foot foot-${world}`}>
      <div className="container">
        <p className="foot-big">Carmesí</p>
        <div className="foot-rg"><span className="age18">+18</span><p>Juega con responsabilidad. Si necesitas ayuda: <a href="https://www.jugarbien.es" target="_blank" rel="noopener">jugarbien.es</a>. Prohibida la entrada a menores y a personas inscritas en el Registro General de Interdicciones de Acceso al Juego. El casino online de esta web usa fichas de demostración sin valor económico.</p></div>
        <p className="credits">Casino ficticio creado como demostración: datos, precios, horarios y disponibilidad de ejemplo. Fotografías de Wikimedia Commons: {credited.map(([k, p], i) => <span key={k}><a href={p.page} target="_blank" rel="noopener">{p.author}</a> ({p.license}){i < credited.length - 1 ? ', ' : '.'}</span>)}</p>
      </div>
    </footer>
  );
}

export function AgeGate() {
  const [st, setSt] = useState(() => { try { return localStorage.getItem('carmesi-18') === '1' ? 'ok' : 'ask'; } catch (e) { return 'ask'; } });
  useEffect(() => { document.documentElement.classList.toggle('gate', st !== 'ok'); }, [st]);
  if (st === 'ok') return null;
  return (
    <div className="agegate" role="dialog" aria-modal="true" aria-labelledby="age-t">
      <div className="agegate-card">
        <span className="age18 big">+18</span>
        {st === 'ask' ? <>
          <h2 id="age-t">Casino Carmesí</h2><p>Esta web es solo para mayores de 18 años. ¿Tienes 18 años o más?</p>
          <div className="row"><button className="btn btn--gold" autoFocus onClick={() => { try { localStorage.setItem('carmesi-18', '1'); } catch (e) { /* nada */ } setSt('ok'); }}>Sí, tengo 18 o más</button><button className="btn btn--line" onClick={() => setSt('no')}>No</button></div>
        </> : <><h2 id="age-t">Lo sentimos</h2><p>No puedes acceder a esta web si eres menor de edad.</p></>}
        <small>Juega con responsabilidad: <a href="https://www.jugarbien.es" target="_blank" rel="noopener">jugarbien.es</a></small>
      </div>
    </div>
  );
}

export function Toast() {
  const { toast } = useApp();
  return <div className={`toast ${toast ? 'on' : ''}`} role="status" aria-live="polite">{toast && toast.t}</div>;
}

export function Booking() {
  const { booking: b, setBooking, floorRef } = useApp();
  useEffect(() => { if (!b.open) return undefined; const k = (e) => e.key === 'Escape' && setBooking({ open: false }); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [b.open, setBooking]);
  const t = TABLES.find((x) => x.id === b.table);
  const ok = b.name.trim().length > 1 && b.phone.replace(/\D/g, '').length >= 9 && t && !isBusy(t, b.date, b.time) && b.guests <= t.n;
  const d = new Date(b.date + 'T12:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  const txt = `Hola, soy ${b.name}. Quiero reservar la mesa ${t ? `${t.id} (${t.zn})` : ''} el ${d} a las ${b.time}, para ${b.guests}.${b.note ? ` ${b.note}` : ''} Mi teléfono: ${b.phone}.`;
  return (
    <>
      <div className={`scrim ${b.open ? 'on' : ''}`} onClick={() => setBooking({ open: false })} />
      <aside className={`drawer ${b.open ? 'on' : ''}`} aria-hidden={!b.open} aria-label="Reservar mesa">
        <header><h2>Reservar mesa</h2><button className="icon-btn" onClick={() => setBooking({ open: false })} aria-label="Cerrar">{Icon.close}</button></header>
        <div className="drawer-body">
          <div className="f2"><label>Día<input type="date" value={b.date} onChange={(e) => setBooking({ date: e.target.value })} /></label>
            <label>Hora<select value={b.time} onChange={(e) => setBooking({ time: e.target.value })}>{TIMES.map((x) => <option key={x}>{x}</option>)}</select></label></div>
          <label>Personas<div className="stepper"><button onClick={() => setBooking((q) => ({ guests: Math.max(1, q.guests - 1) }))} aria-label="Menos">{Icon.minus}</button><b>{b.guests}</b><button onClick={() => setBooking((q) => ({ guests: Math.min(8, q.guests + 1) }))} aria-label="Más">{Icon.plus}</button></div></label>
          <p className="lbl">Mesa</p>
          <div className="tpick">
            {TABLES.map((x) => { const busy = isBusy(x, b.date, b.time), small = b.guests > x.n; return (
              <button key={x.id} disabled={busy || small} className={b.table === x.id ? 'on' : ''} onClick={() => setBooking({ table: x.id })}><b>{x.id}</b><span>{x.zn}</span><em>{busy ? 'Ocupada' : small ? `${x.n} plazas` : 'Libre'}</em></button>
            ); })}
          </div>
          {t && <button className="link" onClick={() => { setBooking({ open: false }); floorRef.current && floorRef.current.pick(t.id); }}>{Icon.chair}Ver la mesa {t.id} en la sala 3D</button>}
          <div className="f2"><label>Nombre<input value={b.name} onChange={(e) => setBooking({ name: e.target.value })} autoComplete="name" /></label>
            <label>Teléfono<input type="tel" value={b.phone} onChange={(e) => setBooking({ phone: e.target.value })} autoComplete="tel" /></label></div>
          <label>Algo que debamos saber<textarea rows="2" value={b.note} onChange={(e) => setBooking({ note: e.target.value })} placeholder="Cumpleaños, primera vez en un casino…" /></label>
        </div>
        <footer>
          <a className={`btn btn--gold ${ok ? '' : 'off'}`} href={ok ? waLink(txt) : undefined} target="_blank" rel="noopener" aria-disabled={!ok}>{Icon.wa}Confirmar por WhatsApp</a>
          <p className="note">{ok ? `Mesa ${t.id} · ${d} · ${b.time} · ${b.guests} ${b.guests === 1 ? 'persona' : 'personas'}` : 'Elige una mesa libre y deja tu nombre y teléfono.'} Entrada solo para mayores de 18 años.</p>
        </footer>
      </aside>
    </>
  );
}

export { money };
