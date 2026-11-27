import * as THREE from 'three';

/* Portada: una ficha de casino gigante. Cara A, la Sala (oro y carmesí). Cara B, Online (neón).
   El scroll la voltea, el ratón la inclina y se puede arrastrar para girarla. */
export function createChip({ canvas, stage, onFace = () => {}, onReady = () => {} }) {
  const TH = THREE;
  const coarse = matchMedia('(pointer:coarse)').matches;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const R = new TH.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  R.setPixelRatio(Math.min(devicePixelRatio, coarse ? 1.5 : 2));
  R.outputEncoding = TH.sRGBEncoding; R.toneMapping = TH.ACESFilmicToneMapping; R.toneMappingExposure = 1.1;
  const scene = new TH.Scene();
  const cam = new TH.PerspectiveCamera(32, 1, 0.1, 100); cam.position.set(0, 0, 11);

  /* reflejos: una sala imaginaria con luces cálidas y una franja fría */
  const pm = new TH.PMREMGenerator(R), env = new TH.Scene(), eg = new TH.BoxGeometry(1, 1, 1);
  env.add(new TH.Mesh(new TH.BoxGeometry(20, 10, 20), new TH.MeshBasicMaterial({ color: '#120a0c', side: TH.BackSide })));
  [['#ffd9a0', 6, 0, 4.9, 0, 8, 0.1, 3], ['#ff5070', 3, -9.9, 1, 0, 0.1, 3, 8], ['#60e0ff', 3, 9.9, 1, 0, 0.1, 3, 8], ['#fff1d8', 4, 0, 1, 9.9, 6, 2, 0.1]].forEach(([c, i, x, y, z, a, b, d]) => {
    const m = new TH.Mesh(eg, new TH.MeshBasicMaterial({ color: new TH.Color(c).multiplyScalar(i) })); m.position.set(x, y, z); m.scale.set(a, b, d); env.add(m);
  });
  scene.environment = pm.fromScene(env, 0.04).texture; pm.dispose();

  const tex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new TH.CanvasTexture(c); t.encoding = TH.sRGBEncoding; t.anisotropy = 8; return t; };
  const DISPLAY = '"Bodoni Moda", "Crimson Text", Georgia, serif', BODY = 'Manrope, Inter, sans-serif';
  const ringText = (g, txt, r, size, color, font = BODY, weight = 700) => {
    g.save(); g.font = `${weight} ${size}px ${font}`; g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle';
    const chars = [...txt]; const step = (Math.PI * 2) / chars.length;
    chars.forEach((ch, i) => { g.save(); g.rotate(i * step); g.translate(0, -r); g.fillText(ch, 0, 0); g.restore(); });
    g.restore();
  };
  const sunburst = (g, r0, r1, n, color) => { g.save(); g.strokeStyle = color; g.lineWidth = 3; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; g.beginPath(); g.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); g.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); g.stroke(); } g.restore(); };

  const faceA = (g, s) => {
    const c = s / 2; g.translate(c, c);
    let gr = g.createRadialGradient(0, 0, 0, 0, 0, c); gr.addColorStop(0, '#9e1630'); gr.addColorStop(0.7, '#6a0b1d'); gr.addColorStop(1, '#3a0510');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, c, 0, Math.PI * 2); g.fill();
    /* muescas de la ficha */
    for (let i = 0; i < 8; i++) { g.save(); g.rotate((i / 8) * Math.PI * 2); g.fillStyle = '#f4ead5'; g.fillRect(-c * 0.07, -c, c * 0.14, c * 0.16); g.restore(); }
    g.strokeStyle = '#d8b26a'; g.lineWidth = 10; g.beginPath(); g.arc(0, 0, c * 0.8, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 3; g.beginPath(); g.arc(0, 0, c * 0.74, 0, Math.PI * 2); g.stroke();
    ringText(g, '  CASINO CARMESÍ · LA SALA · VALENCIA · DESDE 1962 ·', c * 0.67, 34, '#f4ead5');
    g.lineWidth = 3; g.beginPath(); g.arc(0, 0, c * 0.6, 0, Math.PI * 2); g.stroke();
    gr = g.createRadialGradient(0, -c * 0.2, 0, 0, 0, c * 0.58); gr.addColorStop(0, '#24070d'); gr.addColorStop(1, '#14040a');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, c * 0.58, 0, Math.PI * 2); g.fill();
    sunburst(g, c * 0.3, c * 0.56, 48, 'rgba(216,178,106,.35)');
    g.fillStyle = '#d8b26a'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `600 ${c * 0.28}px ${DISPLAY}`; g.fillText('Sala', 0, -c * 0.02);
    g.font = `700 ${c * 0.055}px ${BODY}`; g.fillText('C A S I N O   F Í S I C O', 0, c * 0.2);
    g.beginPath(); g.moveTo(-c * 0.18, c * 0.3); g.lineTo(c * 0.18, c * 0.3); g.lineWidth = 3; g.strokeStyle = '#d8b26a'; g.stroke();
    g.fillText('◆', 0, -c * 0.25);
  };
  const faceB = (g, s) => {
    const c = s / 2; g.translate(c, c);
    let gr = g.createRadialGradient(0, 0, 0, 0, 0, c); gr.addColorStop(0, '#1c1240'); gr.addColorStop(0.75, '#0c0820'); gr.addColorStop(1, '#05040e');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, c, 0, Math.PI * 2); g.fill();
    for (let i = 0; i < 8; i++) { g.save(); g.rotate((i / 8) * Math.PI * 2 + Math.PI / 8); g.fillStyle = i % 2 ? '#38e1ff' : '#ff3cac'; g.fillRect(-c * 0.07, -c, c * 0.14, c * 0.16); g.restore(); }
    g.shadowColor = '#38e1ff'; g.shadowBlur = 24; g.strokeStyle = '#38e1ff'; g.lineWidth = 8; g.beginPath(); g.arc(0, 0, c * 0.8, 0, Math.PI * 2); g.stroke();
    g.shadowColor = '#ff3cac'; g.strokeStyle = '#ff3cac'; g.lineWidth = 4; g.beginPath(); g.arc(0, 0, c * 0.74, 0, Math.PI * 2); g.stroke();
    g.shadowBlur = 0;
    ringText(g, '  CARMESÍ ONLINE · JUEGA DESDE CASA · FICHAS DEMO ·', c * 0.67, 34, '#cfe9ff');
    g.strokeStyle = '#38e1ff'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, c * 0.6, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#07051a'; g.beginPath(); g.arc(0, 0, c * 0.58, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(56,225,255,.18)'; g.lineWidth = 2; for (let i = -6; i <= 6; i++) { g.beginPath(); g.moveTo(i * c * 0.09, -c * 0.56); g.lineTo(i * c * 0.09, c * 0.56); g.stroke(); g.beginPath(); g.moveTo(-c * 0.56, i * c * 0.09); g.lineTo(c * 0.56, i * c * 0.09); g.stroke(); }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = '#ff3cac'; g.shadowBlur = 30; g.fillStyle = '#ffd6ef';
    g.font = `600 ${c * 0.24}px ${DISPLAY}`; g.fillText('Online', 0, -c * 0.02);
    g.shadowColor = '#38e1ff'; g.shadowBlur = 16; g.fillStyle = '#bff4ff';
    g.font = `700 ${c * 0.055}px ${BODY}`; g.fillText('J U E G A   G R A T I S', 0, c * 0.2);
    g.fillText('▶', 0, -c * 0.26);
  };
  const edge = (g, w, h) => { const n = 24; for (let i = 0; i < n; i++) { g.fillStyle = i % 3 === 0 ? '#f4ead5' : i % 3 === 1 ? '#8a0f24' : '#1c1240'; g.fillRect((i / n) * w, 0, w / n + 1, h); } g.fillStyle = 'rgba(216,178,106,.9)'; g.fillRect(0, 0, w, h * 0.12); g.fillRect(0, h * 0.88, w, h * 0.12); };

  const size = 1024;
  const tA = tex(size, size, faceA), tB = tex(size, size, faceB), tE = tex(1024, 64, edge);
  tE.wrapS = TH.RepeatWrapping;
  /* las tapas del cilindro llevan la textura girada un cuarto de vuelta: se endereza */
  [tA, tB].forEach((t) => { t.center.set(0.5, 0.5); t.rotation = Math.PI / 2; });
  const matA = new TH.MeshStandardMaterial({ map: tA, roughness: 0.38, metalness: 0.25, envMapIntensity: 1.1 });
  const matB = new TH.MeshStandardMaterial({ map: tB, emissive: '#ffffff', emissiveMap: tB, emissiveIntensity: 0.55, roughness: 0.32, metalness: 0.2 });
  const matE = new TH.MeshStandardMaterial({ map: tE, roughness: 0.4, metalness: 0.3 });
  const geo = new TH.CylinderGeometry(1.7, 1.7, 0.26, 128, 1);
  /* el orden de grupos del cilindro: lado, tapa superior, tapa inferior */
  const chip = new TH.Mesh(geo, [matE, matA, matB]);
  chip.rotation.x = Math.PI / 2;
  const pivot = new TH.Group(); pivot.add(chip); scene.add(pivot);
  /* aro dorado biselado en el canto */
  const rim = new TH.Mesh(new TH.TorusGeometry(1.7, 0.025, 12, 128), new TH.MeshStandardMaterial({ color: '#d8b26a', metalness: 1, roughness: 0.25 }));
  pivot.add(rim);

  /* alrededor: fichas pequeñas y cartas que flotan */
  const satellites = [];
  const miniMats = [['#b3122e', '#f4ead5'], ['#101012', '#d8b26a'], ['#0e3b2e', '#f4ead5'], ['#1c1240', '#38e1ff']].map(([a, b]) => {
    const t = tex(256, 256, (g, s) => { const c = s / 2; g.translate(c, c); g.fillStyle = a; g.beginPath(); g.arc(0, 0, c, 0, Math.PI * 2); g.fill(); for (let i = 0; i < 6; i++) { g.save(); g.rotate((i / 6) * Math.PI * 2); g.fillStyle = b; g.fillRect(-c * 0.1, -c, c * 0.2, c * 0.22); g.restore(); } g.strokeStyle = b; g.lineWidth = 6; g.beginPath(); g.arc(0, 0, c * 0.62, 0, Math.PI * 2); g.stroke(); });
    return new TH.MeshStandardMaterial({ map: t, roughness: 0.4, metalness: 0.2 });
  });
  const miniEdge = new TH.MeshStandardMaterial({ color: '#2a1a1c', roughness: 0.5 });
  const cardFace = (rank, suit, red) => tex(256, 360, (g, w, h) => {
    g.fillStyle = '#fbf6ea'; g.fillRect(0, 0, w, h); g.strokeStyle = '#d8b26a'; g.lineWidth = 6; g.strokeRect(10, 10, w - 20, h - 20);
    g.fillStyle = red ? '#b3122e' : '#111'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `700 54px ${DISPLAY}`; g.fillText(rank, 44, 52); g.font = '44px serif'; g.fillText(suit, 44, 104);
    g.font = '150px serif'; g.fillText(suit, w / 2, h / 2 + 10);
  });
  const cardBack = tex(256, 360, (g, w, h) => { g.fillStyle = '#6a0b1d'; g.fillRect(0, 0, w, h); g.strokeStyle = '#d8b26a'; g.lineWidth = 6; g.strokeRect(12, 12, w - 24, h - 24); g.lineWidth = 2; for (let i = -h; i < w + h; i += 18) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i - h, h); g.stroke(); g.beginPath(); g.moveTo(i - h, 0); g.lineTo(i, h); g.stroke(); } });
  const cards = [['A', '♠', 0], ['K', '♥', 1], ['Q', '♦', 1], ['J', '♣', 0], ['7', '♥', 1]];
  let sd = 7; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 14; i++) {
    const isCard = i < cards.length;
    let o;
    if (isCard) {
      const [r, s, red] = cards[i];
      const g = new TH.Group();
      const f = new TH.Mesh(new TH.PlaneGeometry(0.62, 0.87), new TH.MeshStandardMaterial({ map: cardFace(r, s, red), roughness: 0.5 })); g.add(f);
      const b = new TH.Mesh(new TH.PlaneGeometry(0.62, 0.87), new TH.MeshStandardMaterial({ map: cardBack, roughness: 0.5 })); b.rotation.y = Math.PI; g.add(b);
      o = g;
    } else {
      const m = miniMats[i % miniMats.length];
      o = new TH.Mesh(new TH.CylinderGeometry(0.28, 0.28, 0.06, 40), [miniEdge, m, m]);
    }
    const a = (i / 14) * Math.PI * 2 + rnd() * 0.3;
    const rad = 2.5 + rnd() * 1.6;
    o.userData = { a, rad, y: (rnd() - 0.5) * 3.6, z: -1.5 - rnd() * 3, sp: 0.05 + rnd() * 0.08, spin: new TH.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(1.2) };
    o.rotation.set(rnd() * 6, rnd() * 6, rnd() * 6);
    scene.add(o); satellites.push(o);
  }
  /* polvo dorado */
  const dustG = new TH.BufferGeometry(), dp = [];
  for (let i = 0; i < 500; i++) dp.push((rnd() - 0.5) * 16, (rnd() - 0.5) * 10, -2 - rnd() * 8);
  dustG.setAttribute('position', new TH.Float32BufferAttribute(dp, 3));
  const glowT = tex(64, 64, (g, s) => { const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s); });
  const dustM = new TH.PointsMaterial({ size: 0.06, map: glowT, color: '#e8c27a', transparent: true, opacity: 0.8, depthWrite: false, blending: TH.AdditiveBlending });
  const dust = new TH.Points(dustG, dustM); scene.add(dust);

  const key = new TH.SpotLight('#ffe2b0', 2.2, 30, 0.5, 0.6, 1); key.position.set(-4, 5, 8); scene.add(key, key.target);
  const rimL = new TH.PointLight('#ff3c6e', 1.4, 14, 2); rimL.position.set(4, -2, 2); scene.add(rimL);
  const rimR = new TH.PointLight('#38e1ff', 0, 14, 2); rimR.position.set(-4, 2, 2); scene.add(rimR);
  scene.add(new TH.AmbientLight('#ffffff', 0.25));

  /* estado */
  const st = { p: 0, ang: 0, drag: 0, mx: 0, my: 0, pmx: 0, pmy: 0, down: false, lx: 0, face: 'A', vel: 0 };
  let W = 1, H = 1;
  const resize = () => { W = stage.clientWidth || 1; H = stage.clientHeight || 1; R.setSize(W, H, false); cam.aspect = W / H; cam.updateProjectionMatrix(); };
  new ResizeObserver(resize).observe(stage); resize();

  const pd = (e) => { st.down = true; st.lx = e.clientX; st.vel = 0; try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* nada */ } canvas.classList.add('grab'); };
  const pmv = (e) => {
    const r = canvas.getBoundingClientRect(); st.mx = ((e.clientX - r.left) / r.width) * 2 - 1; st.my = ((e.clientY - r.top) / r.height) * 2 - 1;
    if (st.down) { const dx = e.clientX - st.lx; st.lx = e.clientX; st.drag += dx * 0.01; st.vel = dx * 0.01; }
  };
  const pu = () => { st.down = false; canvas.classList.remove('grab'); };
  canvas.addEventListener('pointerdown', pd); canvas.addEventListener('pointermove', pmv);
  canvas.addEventListener('pointerup', pu); canvas.addEventListener('pointercancel', pu);
  canvas.addEventListener('pointerleave', () => { st.mx = 0; st.my = 0; });

  let prev = performance.now(), stopped = false, first = true, visible = true;
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(stage);
  const loop = (now) => {
    if (stopped) return; requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
    if (!visible && !first) return;
    const k = Math.min(1, dt * 4); st.pmx += (st.mx - st.pmx) * k; st.pmy += (st.my - st.pmy) * k;
    /* al soltar, la ficha cae en la cara más cercana */
    if (!st.down) {
      const base = st.p * Math.PI; const tot = base + st.drag; const snap = Math.round(tot / Math.PI) * Math.PI;
      st.drag += st.vel; st.vel *= 0.9; st.drag += (snap - base - st.drag) * Math.min(1, dt * 3);
    }
    const target = st.p * Math.PI + st.drag;
    st.ang += (target - st.ang) * Math.min(1, dt * 6);
    pivot.rotation.y = st.ang + st.pmx * 0.25;
    pivot.rotation.x = -st.pmy * 0.18 + (reduce ? 0 : Math.sin(now * 0.0007) * 0.04);
    pivot.position.y = reduce ? 0 : Math.sin(now * 0.0009) * 0.08;
    pivot.position.x = W > 960 ? 1.9 : 0;
    pivot.position.z = W > 960 ? 0 : -1.4;
    /* zambullida: la ficha viene hacia la cámara girando sobre sí misma */
    if (st.dive) {
      const d = Math.min(1, (now - st.dive.t0) / 900), e = d * d * d;
      pivot.position.x *= 1 - e; pivot.position.z += e * 9.5; chip.rotation.y = e * Math.PI * 2;
      if (d >= 1 && !st.dive.fired) { st.dive.fired = true; st.dive.cb && st.dive.cb(); }
    }
    const cosA = Math.cos(st.ang); const showB = cosA < 0;
    const face = showB ? 'B' : 'A';
    if (face !== st.face) { st.face = face; onFace(face); }
    const b = (1 - cosA) / 2; /* 0 cara A, 1 cara B */
    rimL.intensity = 1.4 * (1 - b); rimR.intensity = 1.6 * b;
    dustM.color.setRGB(0.91 - b * 0.6, 0.76 + b * 0.1, 0.48 + b * 0.5);
    key.color.setRGB(1, 0.89 - b * 0.1, 0.69 + b * 0.3);
    if (!reduce) {
      for (const o of satellites) { const u = o.userData; u.a += dt * u.sp; o.position.set(Math.cos(u.a) * u.rad + pivot.position.x, u.y + Math.sin(now * 0.0006 + u.a) * 0.3, u.z + Math.sin(u.a) * 1.2); o.rotation.x += u.spin.x * dt; o.rotation.y += u.spin.y * dt; o.rotation.z += u.spin.z * dt; }
      dust.rotation.y = now * 0.00003; dust.position.y = Math.sin(now * 0.0003) * 0.2;
    }
    cam.position.x = st.pmx * 0.4; cam.position.y = -st.pmy * 0.25; cam.lookAt(pivot.position.x * 0.5, 0, 0);
    R.render(scene, cam);
    if (first) { first = false; onReady(); }
  };
  requestAnimationFrame(loop);

  return {
    setProgress: (p) => { st.p = Math.min(Math.max(p, 0), 1); },
    flipTo: (face) => { st.drag = 0; st.p = face === 'B' ? 1 : 0; },
    dive: (cb) => { st.dive = { t0: performance.now(), cb }; },
    redraw: () => { [tA, tB].forEach((t, i) => { const g = t.image.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, size, size); (i ? faceB : faceA)(g, size); t.needsUpdate = true; }); },
    dispose: () => { stopped = true; R.dispose(); try { R.forceContextLoss(); } catch (_) { /* nada */ } },
  };
}
