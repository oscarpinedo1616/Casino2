import { useEffect, useRef, useState } from 'react';
import { useApp } from '../store.jsx';
import { ChipSVG } from '../components/ui.jsx';
import { createRoulette3D } from '../scene/roulette3d.js';
import { sfx } from '../lib/sound.js';
import Truth from '../components/Truth.jsx';

/* Ruleta europea: un solo cero. Pagos: pleno 35:1, docena y columna 2:1, sencillas 1:1. */
const ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const colorOf = (n) => (n === 0 ? 'green' : RED.has(n) ? 'red' : 'black');
const CHIPS = [[1, '#e9e2d0', '#1a1a1a'], [5, '#b3122e', '#f4ead5'], [25, '#0e3b2e', '#f4ead5'], [100, '#101012', '#d8b26a']];
export const rand = (n) => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; };

const BETS = {
  n: (k) => ({ win: (r) => r === k, pay: 35 }),
  col: (c) => ({ win: (r) => r > 0 && r % 3 === [0, 2, 1][c], pay: 2 }), /* 0 fila de arriba (3, 6, 9…), 1 la del medio, 2 la de abajo */
  doz: (d) => ({ win: (r) => r > (d - 1) * 12 && r <= d * 12, pay: 2 }),
  low: () => ({ win: (r) => r >= 1 && r <= 18, pay: 1 }), high: () => ({ win: (r) => r >= 19, pay: 1 }),
  even: () => ({ win: (r) => r > 0 && r % 2 === 0, pay: 1 }), odd: () => ({ win: (r) => r % 2 === 1, pay: 1 }),
  red: () => ({ win: (r) => RED.has(r), pay: 1 }), black: () => ({ win: (r) => r > 0 && !RED.has(r), pay: 1 }),
};
const rule = (key) => { const [t, v] = key.split(':'); return BETS[t](+v); };

function drawWheel(g, s, rot, ball) {
  const c = s / 2; g.clearRect(0, 0, s, s); g.save(); g.translate(c, c);
  /* aro de madera y oro */
  let gr = g.createRadialGradient(0, 0, c * 0.6, 0, 0, c); gr.addColorStop(0, '#3a1a0c'); gr.addColorStop(0.85, '#5a2e14'); gr.addColorStop(1, '#22100a');
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, c, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#d8b26a'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, c * 0.93, 0, Math.PI * 2); g.stroke();
  /* pista de la bola */
  g.fillStyle = '#2a140a'; g.beginPath(); g.arc(0, 0, c * 0.9, 0, Math.PI * 2); g.fill();
  g.rotate(rot);
  const N = 37, step = (Math.PI * 2) / N;
  for (let i = 0; i < N; i++) {
    const n = ORDER[i], a0 = i * step - step / 2 - Math.PI / 2, a1 = a0 + step;
    g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, c * 0.78, a0, a1); g.closePath();
    g.fillStyle = n === 0 ? '#0e7a4a' : RED.has(n) ? '#b3122e' : '#141414'; g.fill();
    g.strokeStyle = 'rgba(216,178,106,.85)'; g.lineWidth = 1.5; g.stroke();
    g.save(); g.rotate(i * step); g.fillStyle = '#f4ead5'; g.font = `700 ${s * 0.032}px Manrope, Inter, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n), 0, -c * 0.71); g.restore();
  }
  /* bolsillos */
  g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.arc(0, 0, c * 0.64, 0, Math.PI * 2); g.fill();
  for (let i = 0; i < N; i++) { g.save(); g.rotate(i * step - step / 2); g.strokeStyle = '#d8b26a'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -c * 0.52); g.lineTo(0, -c * 0.64); g.stroke(); g.restore(); }
  gr = g.createRadialGradient(0, -c * 0.1, 0, 0, 0, c * 0.52); gr.addColorStop(0, '#8a5a2a'); gr.addColorStop(1, '#3a1d0c');
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, c * 0.52, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#d8b26a'; g.lineWidth = 6; g.lineCap = 'round';
  for (let i = 0; i < 4; i++) { g.save(); g.rotate((i * Math.PI) / 2); g.beginPath(); g.moveTo(0, -c * 0.12); g.lineTo(0, -c * 0.44); g.stroke(); g.beginPath(); g.arc(0, -c * 0.44, c * 0.035, 0, Math.PI * 2); g.fillStyle = '#e8c88a'; g.fill(); g.restore(); }
  gr = g.createRadialGradient(-c * 0.03, -c * 0.03, 0, 0, 0, c * 0.13); gr.addColorStop(0, '#fff1c8'); gr.addColorStop(1, '#a8823a');
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, c * 0.12, 0, Math.PI * 2); g.fill();
  g.restore();
  /* la bola, en coordenadas absolutas */
  if (ball) {
    const bx = c + Math.cos(ball.a) * ball.r * c, by = c + Math.sin(ball.a) * ball.r * c;
    g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.arc(bx + 2, by + 3, s * 0.017, 0, Math.PI * 2); g.fill();
    gr = g.createRadialGradient(bx - 3, by - 3, 0, bx, by, s * 0.018); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#cfc8bc');
    g.fillStyle = gr; g.beginPath(); g.arc(bx, by, s * 0.017, 0, Math.PI * 2); g.fill();
  }
}

export default function Roulette() {
  const { chips, bet, pay, say, paused, limitHit } = useApp();
  const cvRef = useRef(null), cv3Ref = useRef(null);
  const st = useRef({ rot: 0, ball: { a: -Math.PI / 2, r: 0.86 }, anim: null });
  const [val, setVal] = useState(5);
  const [bets, setBets] = useState({});
  const [last, setLast] = useState({});
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [hist, setHist] = useState([]);
  const [won, setWon] = useState(null);
  const total = Object.values(bets).reduce((a, b) => a + b, 0);

  const r3 = useRef(null);
  const [mode3d, setMode3d] = useState(true);
  useEffect(() => {
    if (!mode3d) return undefined;
    try { r3.current = createRoulette3D({ canvas: cv3Ref.current, onTick: (v) => sfx.tick(v) }); } catch (e) { setMode3d(false); }
    return () => { r3.current && r3.current.dispose(); r3.current = null; };
  }, [mode3d]);
  useEffect(() => {
    if (mode3d) return undefined;
    const cv = cvRef.current, g = cv.getContext('2d'); let raf, stop = false;
    const dpr = Math.min(devicePixelRatio, 2);
    const fit = () => { const s = cv.clientWidth * dpr; cv.width = cv.height = s; };
    fit(); const ro = new ResizeObserver(fit); ro.observe(cv);
    let prev = performance.now();
    const loop = (now) => {
      if (stop) return; raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - prev) / 1000); prev = now; const S = st.current;
      if (S.anim) {
        const A = S.anim, p = Math.min(1, (now - A.t0) / A.dur), e = 1 - Math.pow(1 - p, 3);
        S.rot = A.r0 + (A.r1 - A.r0) * e;
        const pb = Math.min(1, (now - A.t0) / (A.dur * 0.92)), eb = 1 - Math.pow(1 - pb, 2.6);
        let a = A.b0 + (A.b1 - A.b0) * eb;
        /* cae de la pista al bolsillo con un par de botes */
        let r = 0.86;
        if (pb > 0.62) { const q = (pb - 0.62) / 0.38; r = 0.86 - (0.86 - 0.58) * Math.min(1, q * 1.4) + Math.abs(Math.sin(q * 9)) * 0.05 * (1 - q); }
        if (pb >= 1) { a = S.rot + A.pocket; r = 0.58; }
        S.ball = { a, r };
        if (p >= 1) { S.anim = null; A.done(); }
      } else { S.rot += dt * 0.25; if (S.settled) S.ball = { a: S.rot + S.settled, r: 0.58 }; }
      drawWheel(g, cv.width, S.rot, S.ball);
    };
    raf = requestAnimationFrame(loop);
    return () => { stop = true; cancelAnimationFrame(raf); ro.disconnect(); };
  }, [mode3d]);

  const place = (key) => {
    if (spinning) return;
    if (val > chips - total) { say('No tienes fichas suficientes.'); return; }
    sfx.chip(); setWon(null); setBets((b) => ({ ...b, [key]: (b[key] || 0) + val }));
  };
  const clear = () => !spinning && setBets({});
  const repeat = () => { if (spinning) return; const t = Object.values(last).reduce((a, b) => a + b, 0); if (!t) return; if (t > chips) { say('No tienes fichas suficientes.'); return; } setBets(last); };

  const spin = () => {
    if (spinning || !total) return;
    if (!bet(total)) return;
    const placed = bets; setLast(placed); setSpinning(true); setWon(null); setResult(null);
    const idx = rand(37), n = ORDER[idx], S = st.current; S.settled = null;
    const finish = () => {
      let win = 0; for (const [k, v] of Object.entries(placed)) { const R = rule(k); if (R.win(n)) win += v * (R.pay + 1); }
      const staked = Object.values(placed).reduce((a, b) => a + b, 0);
      pay(win); setResult(n); setHist((h) => [n, ...h].slice(0, 14)); setWon(win - staked); setBets({}); setSpinning(false);
      if (win > staked) sfx.win(win >= staked * 10); else if (win === 0) sfx.lose();
    };
    sfx.roll(4.2);
    if (r3.current) { r3.current.spin(idx, 6200, finish); return; }
    const step = (Math.PI * 2) / 37;
    const pocket = idx * step - Math.PI / 2; /* ángulo del bolsillo respecto a la rueda */
    const r0 = S.rot, r1 = r0 + Math.PI * 2 * (2 + Math.random());
    const b0 = S.ball.a; let b1 = r1 + pocket; while (b1 > b0 - Math.PI * 2 * 5) b1 -= Math.PI * 2;
    S.anim = {
      t0: performance.now(), dur: 5200, r0, r1, b0, b1, pocket,
      done: () => { S.settled = pocket; finish(); },
    };
  };

  const cell = (key, label, cls = '') => {
    const R = rule(key); const hit = result != null && !spinning && R.win(result);
    return (
      <button key={key} className={`rc ${cls} ${hit ? 'hit' : ''}`} onClick={() => place(key)} aria-label={`Apostar a ${label}`}>
        <span>{label}</span>{bets[key] ? <b className="stake"><ChipSVG size={26} c="#b3122e" /><i>{bets[key]}</i></b> : null}
      </button>
    );
  };
  const blocked = paused || limitHit;

  return (
    <div className="game roulette">
      <div className="rl-left">
        <div className={`wheel-wrap ${mode3d ? 'w3d' : ''}`}>{mode3d ? <canvas ref={cv3Ref} className="wheel3d" aria-label="Ruleta en 3D" role="img" /> : <canvas ref={cvRef} className="wheel" aria-label="Rueda de ruleta" role="img" />}</div>
        <div className="rl-result" aria-live="polite">
          {result != null && !spinning ? <><span className={`ball-n ${colorOf(result)}`}>{result}</span><span>{won > 0 ? `Ganas ${won.toLocaleString('es-ES')} fichas` : won === 0 ? 'Recuperas tu apuesta' : 'Esta vez no'}</span></> : <span className="muted">{spinning ? 'No va más…' : 'Haz tu apuesta y gira'}</span>}
        </div>
        <div className="hist" aria-label="Últimos números">{hist.map((n, i) => <span key={i} className={colorOf(n)}>{n}</span>)}</div>
      </div>
      <div className="rl-right">
        <div className="board-scroll"><div className="board" role="group" aria-label="Tapete de apuestas">
          {cell('n:0', '0', 'zero green')}
          <div className="nums">
            {[3, 2, 1].map((row) => Array.from({ length: 12 }, (_, c) => { const n = c * 3 + row; return cell(`n:${n}`, String(n), colorOf(n)); }))}
          </div>
          <div className="cols">{[0, 1, 2].map((c) => cell(`col:${c}`, '2:1'))}</div>
          <div className="dozens">{cell('doz:1', '1.ª docena')}{cell('doz:2', '2.ª docena')}{cell('doz:3', '3.ª docena')}</div>
          <div className="outs">{cell('low:0', '1–18')}{cell('even:0', 'Par')}{cell('red:0', '◆', 'red')}{cell('black:0', '◆', 'black')}{cell('odd:0', 'Impar')}{cell('high:0', '19–36')}</div>
        </div></div>
        <p className="swipe-hint">Desliza el tapete para ver todos los números →</p>
        <div className="rl-bar">
          <div className="chip-pick" role="radiogroup" aria-label="Valor de la ficha">
            {CHIPS.map(([v, c, s]) => <button key={v} role="radio" aria-checked={val === v} className={val === v ? 'on' : ''} onClick={() => setVal(v)}><ChipSVG c={c} s={s} size={44} /><i>{v}</i></button>)}
          </div>
          <div className="rl-act">
            <span className="tot">Apuesta <b>{total.toLocaleString('es-ES')}</b></span>
            <button className="btn btn--line sm" onClick={clear} disabled={spinning || !total}>Borrar</button>
            <button className="btn btn--line sm" onClick={repeat} disabled={spinning || !Object.keys(last).length}>Repetir</button>
            <button className="btn btn--gold" onClick={spin} disabled={spinning || !total || blocked}>{spinning ? 'Girando…' : 'Girar'}</button>
          </div>
        </div>
        <Truth>{(() => {
          if (!total) return <p>Pon fichas en el tapete y aquí verás tus posibilidades reales.</p>;
          let hits = 0, ret = 0;
          for (let r = 0; r <= 36; r++) { let w = 0; for (const [k, v] of Object.entries(bets)) { const R = rule(k); if (R.win(r)) w += v * (R.pay + 1); } if (w > 0) hits++; ret += w; }
          const ev = ret / 37 - total;
          return <>
            <div className="truth-row"><span>Probabilidad de que gane alguna apuesta</span><b>{((hits / 37) * 100).toFixed(1)} %</b></div>
            <div className="truth-row"><span>Lo que te devuelve de media por tirada</span><b>{(ret / 37).toFixed(2)} de {total}</b></div>
            <div className="truth-row"><span>Si repites esta jugada 100 veces, pierdes de media</span><b className="neg">{Math.abs(ev * 100).toFixed(0)} fichas</b></div>
            <p>La ventaja de la casa en la ruleta europea es siempre 1/37 = 2,7 %, apuestes a lo que apuestes. Ningún sistema la cambia.</p>
          </>;
        })()}</Truth>
        <p className="game-note">Pleno 35 a 1 · docenas y columnas 2 a 1 · rojo, negro, par, impar, 1–18 y 19–36, 1 a 1. Si sale el 0, pierden las apuestas sencillas.</p>
      </div>
    </div>
  );
}
