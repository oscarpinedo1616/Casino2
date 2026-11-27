import { useEffect, useRef, useState } from 'react';
import { PHOTOS } from '../data.js';

export function Reveal({ as: Tag = 'div', className = '', delay = 0, children, ...rest }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return undefined;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { rootMargin: '0px 0px -10% 0px' });
    io.observe(el); return () => io.disconnect();
  }, []);
  return <Tag ref={ref} className={`reveal ${on ? 'in' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }} {...rest}>{children}</Tag>;
}

export function Photo({ k, className = '' }) {
  const p = PHOTOS[k]; const [bad, setBad] = useState(false);
  if (!p) return null;
  return <div className={`ph ${className} ${bad ? 'bad' : ''}`}>{!bad && <img src={p.src} alt={p.alt} loading="lazy" onError={() => setBad(true)} />}</div>;
}

/* número que cuenta hasta su valor */
export function Count({ value }) {
  const [v, setV] = useState(value); const from = useRef(value);
  useEffect(() => {
    const a = from.current, b = value; if (a === b) return undefined;
    let raf; const t0 = performance.now();
    const f = (t) => { const p = Math.min(1, (t - t0) / 600); const e = 1 - Math.pow(1 - p, 3); setV(Math.round(a + (b - a) * e)); if (p < 1) raf = requestAnimationFrame(f); else from.current = b; };
    raf = requestAnimationFrame(f); return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{v.toLocaleString('es-ES')}</>;
}

export const ChipSVG = ({ c = '#b3122e', s = '#f4ead5', size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className="chip-svg">
    <circle cx="20" cy="20" r="19" fill={c} />
    {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x="17" y="1" width="6" height="7" rx="1" fill={s} transform={`rotate(${i * 60} 20 20)`} />)}
    <circle cx="20" cy="20" r="12" fill="none" stroke={s} strokeWidth="1.6" strokeDasharray="3 2" />
    <circle cx="20" cy="20" r="9.5" fill={c} />
  </svg>
);

const I = (d, extra) => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}{extra}</svg>;
export const Icon = {
  close: I(<path d="M6 6l12 12M18 6L6 18" />),
  wa: I(<path d="M4 20l1.3-3.8A8 8 0 1 1 8 19z" />, <path d="M9 9.5c.5 2 2.5 4 4.5 4.5l1-1 2 1c-.3 1-1.3 1.8-2.5 1.5A8 8 0 0 1 8.5 10c-.3-1.2.5-2.2 1.5-2.5l1 2z" />),
  walk: I(<><circle cx="13" cy="4.5" r="1.8" /><path d="M10 21l2-6 3 3v3M9 13l1.5-5 3.5 1 2 3 2 .5M10.5 8L7 10v3" /></>),
  chair: I(<path d="M7 3v9h10V3M6 12h12M7 12l-1 9M17 12l1 9M8 17h8" />),
  cal: I(<><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4" /></>),
  pin: I(<><path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z" /><circle cx="12" cy="9" r="2.5" /></>),
  clock: I(<><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></>),
  shield: I(<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />),
  gift: I(<><rect x="4" y="9" width="16" height="11" rx="1.5" /><path d="M4 13h16M12 9v11M12 9c-2-4-6-3-5-1s5 1 5 1zM12 9c2-4 6-3 5-1s-5 1-5 1z" /></>),
  play: I(<path d="M8 5v14l11-7z" />),
  arrow: I(<path d="M5 12h14M13 6l6 6-6 6" />),
  plus: I(<path d="M12 5v14M5 12h14" />),
  minus: I(<path d="M5 12h14" />),
  sun: I(<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5" /></>),
  moon: I(<path d="M20 14A8 8 0 1 1 10 4a6.5 6.5 0 0 0 10 10z" />),
};
