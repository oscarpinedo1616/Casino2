import { useEffect, useRef, useState } from 'react';
import { useApp } from '../store.jsx';
import { rand } from './Roulette.jsx';
import { sfx } from '../lib/sound.js';
import Truth from '../components/Truth.jsx';
import { BetInput } from './common.jsx';

/* Crash: el multiplicador sube hasta que el cohete explota. Retira antes. Punto de explosión con un 1 % para la casa. */
const EDGE = 0.01;
const crashPoint = () => { const u = rand(1e6) / 1e6; return Math.max(1, Math.floor(((1 - EDGE) / (1 - u)) * 100) / 100); };
const multAt = (ms) => Math.pow(Math.E, 0.00012 * ms);

export default function Crash() {
  const { bet, pay, paused, limitHit } = useApp();
  const cvRef = useRef(null);
  const st = useRef({ phase: 'idle', t0: 0, cp: 1, m: 1, auto: 0, out: null, pts: [] });
  const [stake, setStake] = useState(10);
  const [auto, setAuto] = useState(2);
  const [phase, setPhase] = useState('idle');
  const [m, setM] = useState(1);
  const [out, setOut] = useState(null);
  const [hist, setHist] = useState([]);

  const cashOut = () => {
    const S = st.current; if (S.phase !== 'fly' || S.out) return;
    S.out = S.m; const w = Math.floor(stake * S.m); pay(w); setOut({ m: S.m, w }); sfx.win(S.m >= 5);
  };

  useEffect(() => {
    const cv = cvRef.current, g = cv.getContext('2d'); let raf, stop = false;
    const dpr = Math.min(devicePixelRatio, 2);
    const fit = () => { cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr; };
    fit(); const ro = new ResizeObserver(fit); ro.observe(cv);
    let lastBeep = 1;
    const loop = (now) => {
      if (stop) return; raf = requestAnimationFrame(loop);
      const S = st.current, W = cv.width, H = cv.height;
      if (S.phase === 'fly') {
        const ms = now - S.t0; S.m = Math.min(S.cp, multAt(ms)); setM(S.m);
        if (S.m >= lastBeep + 0.5) { lastBeep = Math.floor(S.m * 2) / 2; sfx.tick(0.5); }
        if (!S.out && S.auto > 1 && S.m >= S.auto) { S.out = S.auto; const w = Math.floor(S.stake * S.auto); pay(w); setOut({ m: S.auto, w }); sfx.win(S.auto >= 5); }
        if (S.m >= S.cp) { S.tEnd = ms; S.phase = 'boom'; setPhase('boom'); setHist((h) => [S.cp, ...h].slice(0, 12)); if (!S.out) sfx.lose(); lastBeep = 1; }
      }
      /* gráfico */
      g.clearRect(0, 0, W, H);
      const pad = 40 * dpr, maxT = Math.max(8000, (S.phase === 'idle' ? 0 : now - S.t0) * 1.15), maxM = Math.max(2, S.m * 1.25);
      g.strokeStyle = 'rgba(255,255,255,.06)'; g.lineWidth = 1;
      for (let i = 1; i <= 4; i++) { const y = H - pad - ((H - 2 * pad) * i) / 4; g.beginPath(); g.moveTo(pad, y); g.lineTo(W - pad, y); g.stroke(); g.fillStyle = 'rgba(255,255,255,.35)'; g.font = `${11 * dpr}px Outfit, Inter, sans-serif`; g.fillText(`${(1 + ((maxM - 1) * i) / 4).toFixed(1)}×`, 6 * dpr, y + 4 * dpr); }
      if (S.phase !== 'idle') {
        const tEnd = S.phase === 'fly' ? now - S.t0 : S.tEnd;
        const X = (t) => pad + ((W - 2 * pad) * t) / maxT, Y = (mm) => H - pad - ((H - 2 * pad) * (mm - 1)) / (maxM - 1);
        g.beginPath(); g.moveTo(X(0), Y(1)); for (let t = 0; t <= tEnd; t += 60) g.lineTo(X(t), Y(Math.min(S.cp, multAt(t))));
        const ex = X(tEnd), ey = Y(S.m);
        g.lineTo(ex, ey); g.strokeStyle = S.phase === 'boom' ? '#ff3c6e' : '#1fe07a'; g.lineWidth = 4 * dpr; g.stroke();
        g.lineTo(ex, H - pad); g.lineTo(X(0), H - pad); g.closePath();
        const gr = g.createLinearGradient(0, ey, 0, H - pad); gr.addColorStop(0, S.phase === 'boom' ? 'rgba(255,60,110,.35)' : 'rgba(31,224,122,.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fill();
        /* cohete */
        g.save(); g.translate(ex, ey); const ang = Math.atan2(Y(S.m) - Y(Math.min(S.cp, multAt(Math.max(0, tEnd - 200)))), X(tEnd) - X(tEnd - 200)); g.rotate(ang);
        if (S.phase === 'boom') { for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; g.fillStyle = i % 2 ? '#ffb020' : '#ff3c6e'; g.beginPath(); g.arc(Math.cos(a) * 18 * dpr, Math.sin(a) * 18 * dpr, 5 * dpr, 0, Math.PI * 2); g.fill(); } }
        else { g.fillStyle = '#ffb020'; g.beginPath(); g.moveTo(-18 * dpr, -5 * dpr); g.lineTo(-34 * dpr - Math.random() * 8 * dpr, 0); g.lineTo(-18 * dpr, 5 * dpr); g.fill(); g.fillStyle = '#f4f6fb'; g.beginPath(); g.ellipse(0, 0, 18 * dpr, 7 * dpr, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#e0234e'; g.beginPath(); g.moveTo(14 * dpr, -6 * dpr); g.lineTo(26 * dpr, 0); g.lineTo(14 * dpr, 6 * dpr); g.fill(); }
        g.restore();
      }
    };
    raf = requestAnimationFrame(loop);
    return () => { stop = true; cancelAnimationFrame(raf); ro.disconnect(); };
  }, [pay]);


  const launch = () => {
    if (phase === 'fly' || !bet(stake)) return;
    Object.assign(st.current, { phase: 'fly', t0: performance.now(), cp: crashPoint(), m: 1, auto, out: null, stake });
    setPhase('fly'); setOut(null); setM(1); sfx.whoosh();
  };
  const blocked = paused || limitHit;
  const pReach = (x) => ((1 - EDGE) / x) * 100;
  return (
    <div className="game og crash">
      <aside className="og-panel">
        <BetInput value={stake} onChange={setStake} disabled={phase === 'fly'} />
        <label className="bet-in"><span>Retirar solo en</span><div className="bet-row"><input type="number" min="1.01" step="0.1" value={auto} onChange={(e) => setAuto(Math.max(1.01, +e.target.value || 2))} disabled={phase === 'fly'} /><em>×</em></div></label>
        {phase === 'fly' && !out
          ? <button className="btn btn--go big" onClick={cashOut}>Retirar {Math.floor(stake * m).toLocaleString('es-ES')}</button>
          : <button className="btn btn--go big" onClick={launch} disabled={phase === 'fly' || blocked}>{phase === 'fly' ? 'En vuelo…' : 'Despegar'}</button>}
      </aside>
      <div className="og-stage">
        <div className="hist-row">{hist.map((x, i) => <span key={i} className={x >= 2 ? 'w' : 'l'}>{x.toFixed(2)}×</span>)}</div>
        <div className="crash-box">
          <canvas ref={cvRef} className="crash-cv" aria-label="Gráfico del multiplicador" role="img" />
          <div className={`crash-m ${phase}`}>{m.toFixed(2)}×{phase === 'boom' && <small>¡Ha explotado!</small>}{out && <small className="ok">Retirado en {out.m.toFixed(2)}× · +{out.w.toLocaleString('es-ES')}</small>}</div>
        </div>
        <Truth>
          <div className="truth-row"><span>Probabilidad de llegar a {auto}×</span><b>{pReach(auto).toFixed(1)} %</b></div>
          <div className="truth-row"><span>Probabilidad de llegar a 10×</span><b>{pReach(10).toFixed(1)} %</b></div>
          <div className="truth-row"><span>Explota nada más salir (1,00×)</span><b>1 %</b></div>
          <p>Retires cuando retires, el valor esperado es el 99 % de lo apostado. Esperar más paga más, pero ocurre menos.</p>
        </Truth>
      </div>
    </div>
  );
}
