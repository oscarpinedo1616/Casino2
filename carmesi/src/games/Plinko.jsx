import { useEffect, useRef, useState } from 'react';
import { useApp } from '../store.jsx';
import { rand } from './Roulette.jsx';
import { sfx } from '../lib/sound.js';
import Truth from '../components/Truth.jsx';
import { BetInput } from './common.jsx';

/* Plinko: la bola baja 12 filas de clavos; en cada uno va a izquierda o derecha al 50 %. */
const ROWS = 12;
export const PLINKO = [25, 8, 3.5, 1.8, 1.1, 0.6, 0.5, 0.6, 1.1, 1.8, 3.5, 8, 25];
const C = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return r; };
const PROB = PLINKO.map((_, k) => C(ROWS, k) / 2 ** ROWS);
export const PLINKO_RTP = PLINKO.reduce((a, m, k) => a + m * PROB[k], 0);
const colorFor = (m) => (m >= 8 ? '#ff2d6e' : m >= 3 ? '#ff7a2a' : m >= 1.5 ? '#ffb020' : m >= 1 ? '#ffd84a' : '#ffe98a');

export default function Plinko() {
  const { bet, pay, paused, limitHit } = useApp();
  const cvRef = useRef(null);
  const balls = useRef([]), hits = useRef({});
  const [stake, setStake] = useState(5);
  const [last, setLast] = useState([]);
  const [live, setLive] = useState(0);

  useEffect(() => {
    const cv = cvRef.current, g = cv.getContext('2d'); let raf, stop = false;
    const dpr = Math.min(devicePixelRatio, 2);
    const fit = () => { cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr; };
    fit(); const ro = new ResizeObserver(fit); ro.observe(cv);
    const geo = () => { const W = cv.width, H = cv.height, top = H * 0.08, gapY = (H * 0.8) / (ROWS + 1), gapX = Math.min(W / (ROWS + 3), gapY * 1.15); return { W, H, top, gapY, gapX }; };
    const loop = (now) => {
      if (stop) return; raf = requestAnimationFrame(loop);
      const G = geo(); g.clearRect(0, 0, G.W, G.H);
      /* clavos */
      g.fillStyle = '#d9e1f2';
      for (let r = 0; r < ROWS; r++) for (let i = 0; i <= r + 2; i++) { const x = G.W / 2 + (i - (r + 2) / 2) * G.gapX, y = G.top + r * G.gapY + 11 * dpr; g.beginPath(); g.arc(x, y, 3.2 * dpr, 0, Math.PI * 2); g.fill(); }
      /* cajas */
      const by = G.top + (ROWS + 1) * G.gapY - G.gapY * 0.6;
      PLINKO.forEach((m, k) => {
        const x = G.W / 2 + (k - ROWS / 2) * G.gapX, w = G.gapX * 0.9, h = G.gapY * 0.75;
        const hit = hits.current[k] && now - hits.current[k] < 300 ? 1 - (now - hits.current[k]) / 300 : 0;
        g.fillStyle = colorFor(m); g.beginPath(); g.roundRect ? g.roundRect(x - w / 2, by + hit * 8 * dpr, w, h, 6 * dpr) : g.rect(x - w / 2, by, w, h); g.fill();
        g.fillStyle = '#1a1205'; g.font = `800 ${Math.min(12 * dpr, w * 0.3)}px Outfit, Inter, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(`${m}×`, x, by + h / 2 + hit * 8 * dpr);
      });
      /* bolas */
      const done = [];
      for (const b of balls.current) {
        const t = (now - b.t0) / b.per; const step = Math.floor(t), f = t - step;
        let x, y;
        if (step >= ROWS) { const k = b.k; x = G.W / 2 + (k - ROWS / 2) * G.gapX; y = by - 4 * dpr; if (!b.landed) { b.landed = true; done.push(b); } }
        else {
          const pos = (s) => { let c = 0; for (let i = 0; i < s; i++) c += b.path[i]; return [G.W / 2 + (c - s / 2) * G.gapX, G.top + s * G.gapY]; };
          const [x0, y0] = pos(step), [x1, y1] = pos(step + 1);
          x = x0 + (x1 - x0) * f; y = y0 + (y1 - y0) * f - Math.sin(f * Math.PI) * G.gapY * 0.45;
          if (step !== b.ls) { b.ls = step; if (step > 0) sfx.reelTick(); }
        }
        const gr = g.createRadialGradient(x - 3 * dpr, y - 3 * dpr, 0, x, y, 9 * dpr); gr.addColorStop(0, '#ffd1e6'); gr.addColorStop(1, '#ff2d8a');
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, 8 * dpr, 0, Math.PI * 2); g.fill();
      }
      if (done.length) {
        done.forEach((b) => { hits.current[b.k] = now; const w = Math.floor(b.stake * PLINKO[b.k] * 100) / 100; pay(Math.floor(w)); setLast((l) => [{ m: PLINKO[b.k] }, ...l].slice(0, 10)); if (PLINKO[b.k] >= 3) sfx.win(PLINKO[b.k] >= 8); else sfx.chip(); });
        balls.current = balls.current.filter((b) => !(b.landed && now - b.t0 > b.per * ROWS + 600));
        setLive(balls.current.filter((b) => !b.landed).length);
      }
      balls.current = balls.current.filter((b) => !(b.landed && now - b.t0 > b.per * ROWS + 600));
    };
    raf = requestAnimationFrame(loop);
    return () => { stop = true; cancelAnimationFrame(raf); ro.disconnect(); };
  }, [pay]);

  const drop = () => {
    if (!bet(stake)) return;
    const path = Array.from({ length: ROWS }, () => rand(2));
    balls.current.push({ path, k: path.reduce((a, b) => a + b, 0), t0: performance.now(), per: 190, stake, ls: -1 });
    setLive((n) => n + 1); sfx.chip();
  };
  const blocked = paused || limitHit;
  return (
    <div className="game og plinko">
      <aside className="og-panel">
        <BetInput value={stake} onChange={setStake} />
        <div className="og-stats"><div><small>Filas</small><b>{ROWS}</b></div><div><small>Premio máximo</small><b>x25</b></div><div><small>En juego</small><b>{live}</b></div></div>
        <button className="btn btn--go big" onClick={drop} disabled={blocked}>Soltar bola</button>
        <p className="og-tip">Puedes soltar varias bolas a la vez.</p>
      </aside>
      <div className="og-stage">
        <div className="hist-row">{last.map((x, i) => <span key={i} style={{ background: colorFor(x.m), color: '#1a1205' }}>{x.m}×</span>)}</div>
        <canvas ref={cvRef} className="plinko-cv" aria-label="Tablero de Plinko" role="img" />
        <Truth>
          <div className="truth-row"><span>Retorno al jugador (RTP)</span><b>{(PLINKO_RTP * 100).toFixed(1)} %</b></div>
          <div className="truth-row"><span>Probabilidad de caer en x25</span><b>1 entre {Math.round(1 / (PROB[0] * 2)).toLocaleString('es-ES')}</b></div>
          <div className="truth-row"><span>Probabilidad de recuperar al menos lo apostado</span><b>{(PLINKO.reduce((a, m, k) => a + (m >= 1 ? PROB[k] : 0), 0) * 100).toFixed(1)} %</b></div>
          <p>Cada clavo es una moneda al aire: por eso casi todas las bolas caen en el centro, donde los premios son menores.</p>
        </Truth>
      </div>
    </div>
  );
}
