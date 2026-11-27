import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { VENUE } from './data.js';
import { sfx } from './lib/sound.js';

/* rutas: #/ lobby · #/juego/plinko · #/sala */
const parse = () => { const h = (location.hash || '').replace(/^#\/?/, ''); const [world, game] = h.split('/'); if (world === 'sala') return { world: 'sala', game: null }; if (world === 'juego' && game) return { world: 'juego', game }; return { world: 'home', game: null }; };

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const load = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } };

export const START_CHIPS = 1000;
export const tomorrow = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); };
export const money = (n) => n.toLocaleString('es-ES');
export const waLink = (text) => `https://wa.me/${VENUE.whatsapp}?text=${encodeURIComponent(text)}`;

export function AppProvider({ children }) {
  /* fichas de demostración: no son dinero y no se pueden comprar ni cobrar */
  const [chips, setChips] = useState(() => load('carmesi-chips', START_CHIPS));
  const [limit, setLimit] = useState(() => load('carmesi-limit', 0));
  const [pauseUntil, setPauseUntil] = useState(() => load('carmesi-pause', 0));
  const [sessionLoss, setSessionLoss] = useState(0);
  const [playMs, setPlayMs] = useState(0);
  const [game, setGame] = useState(null);
  const [toast, setToast] = useState(null);
  const [booking, setBookingRaw] = useState({ open: false, table: null, date: tomorrow(), time: '21:00', guests: 2, name: '', phone: '', note: '' });
  const floorRef = useRef(null);
  const [route, setRoute] = useState(parse);
  const [tx, setTx] = useState(null);
  useEffect(() => { const f = () => setRoute(parse()); window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f); }, []);
  useEffect(() => { setGame(route.game); }, [route.game]);
  /* cambiar de mundo con una cortina; dentro del mismo mundo, directo */
  const go = useCallback((path, opts = {}) => {
    const target = path.replace(/^#?\/?/, '');
    const nextWorld = target.split('/')[0] === 'sala' ? 'sala' : 'casino';
    const cur = parse();
    const apply = () => { if (location.hash !== '#/' + target) location.hash = '/' + target; else setRoute(parse()); window.scrollTo(0, 0); };
    const curWorld = cur.world === 'sala' ? 'sala' : 'casino';
    if (opts.instant || nextWorld === curWorld) { apply(); return; }
    sfx.whoosh();
    setTx({ to: nextWorld, id: Date.now() });
    setTimeout(apply, 520);
    setTimeout(() => setTx(null), 1250);
  }, []);

  useEffect(() => save('carmesi-chips', chips), [chips]);
  useEffect(() => save('carmesi-limit', limit), [limit]);
  useEffect(() => save('carmesi-pause', pauseUntil), [pauseUntil]);

  /* tiempo de juego: cuenta solo con un juego abierto */
  useEffect(() => {
    if (!game) return undefined;
    const id = setInterval(() => setPlayMs((t) => t + 1000), 1000);
    return () => clearInterval(id);
  }, [game]);

  const say = useCallback((t) => { setToast({ t, id: Date.now() }); }, []);
  useEffect(() => { if (!toast) return undefined; const id = setTimeout(() => setToast(null), 2600); return () => clearTimeout(id); }, [toast]);

  const paused = pauseUntil > Date.now();
  const limitHit = limit > 0 && sessionLoss >= limit;
  /* apostar: devuelve false si no se puede */
  const bet = useCallback((n) => {
    if (paused) { say('Tienes una pausa activa.'); return false; }
    if (limitHit) { say('Has llegado a tu límite de esta sesión.'); return false; }
    if (n > chips) { say('No tienes fichas suficientes.'); return false; }
    setChips((c) => c - n); setSessionLoss((l) => l + n); return true;
  }, [chips, paused, limitHit, say]);
  const pay = useCallback((n) => { if (n > 0) { setChips((c) => c + n); setSessionLoss((l) => l - n); } }, []);
  const refill = useCallback(() => { setChips(START_CHIPS); say('Tienes 1.000 fichas nuevas de demostración.'); }, [say]);

  const setBooking = useCallback((v) => setBookingRaw((b) => ({ ...b, ...(typeof v === 'function' ? v(b) : v) })), []);
  const openBooking = useCallback((v = {}) => {
    setBookingRaw((b) => ({ ...b, ...v, open: true }));
    if (v.table && floorRef.current) floorRef.current.select(v.table);
  }, []);

  const value = useMemo(() => ({
    chips, bet, pay, refill, limit, setLimit, sessionLoss, playMs, setPlayMs, paused, pauseUntil, setPauseUntil, limitHit,
    game, setGame, toast, say, booking, setBooking, openBooking, floorRef, route, go, tx,
  }), [route, go, tx, chips, bet, pay, refill, limit, sessionLoss, playMs, paused, pauseUntil, limitHit, game, toast, say, booking, setBooking, openBooking]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
