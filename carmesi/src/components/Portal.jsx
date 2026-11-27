import { useEffect, useRef, useState } from 'react';
import { createChip } from '../scene/chip.js';
import { useApp } from '../store.jsx';
import { Icon } from './ui.jsx';
import { sfx } from '../lib/sound.js';

/* La puerta de entrada: una ficha, dos mundos. Pasa por encima de una opción y la ficha se gira hacia ella;
   elige y la ficha se lanza contra la pantalla para llevarte dentro. */
export default function Portal() {
  const { go } = useApp();
  const stageRef = useRef(null), canvasRef = useRef(null), apiRef = useRef(null), down = useRef(null);
  const [face, setFace] = useState('A');
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [leaving, setLeaving] = useState(null);

  useEffect(() => {
    let api;
    try {
      api = createChip({ canvas: canvasRef.current, stage: stageRef.current, onFace: setFace, onReady: () => setReady(true) });
      apiRef.current = api;
      if (document.fonts) document.fonts.ready.then(() => api.redraw());
    } catch (e) { setFailed(true); }
    return () => api && api.dispose();
  }, []);

  const show = (f) => { if (!leaving && apiRef.current) apiRef.current.flipTo(f); };
  const enter = (f) => {
    if (leaving) return; setLeaving(f); sfx.click();
    const world = f === 'A' ? 'sala' : 'online';
    const api = apiRef.current;
    if (api) { api.flipTo(f); setTimeout(() => api.dive(() => go(world)), 260); } else go(world);
  };
  /* un toque en la ficha (sin arrastrar) entra en la cara que se ve */
  const onDown = (e) => { down.current = [e.clientX, e.clientY]; };
  const onUp = (e) => { const d = down.current; down.current = null; if (d && Math.hypot(e.clientX - d[0], e.clientY - d[1]) < 6) enter(face); };

  return (
    <section className={`portal face-${face} ${ready ? 'ready' : ''} ${leaving ? 'leaving' : ''}`} aria-label="Elige tu noche">
      <div className="portal-word" aria-hidden="true">CARMESÍ</div>
      <div className="portal-stage" ref={stageRef} onPointerDown={onDown} onPointerUp={onUp}>
        <canvas ref={canvasRef} aria-label="Ficha de casino en 3D. Arrástrala para girarla; tócala para entrar." role="img" />
        {failed && <div className="hero-fallback" aria-hidden="true" />}
      </div>
      <div className="portal-copy">
        <p className="kicker"><span className="dot" />Casino Carmesí · Valencia · desde 1962</p>
        <h1>Una ficha.<br /><em>Dos noches.</em></h1>
        <p className="lead">Elige por qué cara quieres entrar.</p>
        <div className="doors">
          <button className={`door door-A ${face === 'A' ? 'on' : ''}`} onMouseEnter={() => show('A')} onFocus={() => show('A')} onClick={() => enter('A')}>
            <span className="door-k">Cara A</span>
            <b>La Sala</b>
            <span>El casino de verdad: recórrelo en 3D, elige mesa y resérvala.</span>
            <span className="door-go">Entrar {Icon.arrow}</span>
          </button>
          <button className={`door door-B ${face === 'B' ? 'on' : ''}`} onMouseEnter={() => show('B')} onFocus={() => show('B')} onClick={() => enter('B')}>
            <span className="door-k">Cara B</span>
            <b>Online</b>
            <span>Ruleta 3D, blackjack y tragaperras con fichas gratis.</span>
            <span className="door-go">Jugar {Icon.arrow}</span>
          </button>
        </div>
      </div>
      <p className="portal-foot"><span className="age18">+18</span>Arrastra la ficha para girarla · Juega con responsabilidad</p>
    </section>
  );
}
