import * as THREE from 'three';

/* Ruleta europea en 3D. La rueda gira en un sentido y la bola en el contrario; al final la cámara
   se acerca a la bola y la sigue hasta el bolsillo. */
export const ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

export function createRoulette3D({ canvas, onTick = () => {} }) {
  const TH = THREE;
  const N = 37, STEP = (Math.PI * 2) / N;
  const R = new TH.WebGLRenderer({ canvas, antialias: true, alpha: true });
  R.setPixelRatio(Math.min(devicePixelRatio, 2)); R.outputEncoding = TH.sRGBEncoding;
  R.toneMapping = TH.ACESFilmicToneMapping; R.toneMappingExposure = 0.95;
  R.shadowMap.enabled = true; R.shadowMap.type = TH.PCFSoftShadowMap;
  const scene = new TH.Scene();
  const cam = new TH.PerspectiveCamera(36, 1, 0.05, 60);

  /* reflejos */
  const pm = new TH.PMREMGenerator(R), env = new TH.Scene();
  env.add(new TH.Mesh(new TH.BoxGeometry(20, 10, 20), new TH.MeshBasicMaterial({ color: '#160c12', side: TH.BackSide })));
  [['#ffe0b0', 5, 0, 4.9, 0, 9, 0.1, 4], ['#ff3cac', 2.5, -9.9, 1, 0, 0.1, 3, 10], ['#38e1ff', 2.5, 9.9, 1, 0, 0.1, 3, 10]].forEach(([c, i, x, y, z, a, b, d]) => {
    const m = new TH.Mesh(new TH.BoxGeometry(1, 1, 1), new TH.MeshBasicMaterial({ color: new TH.Color(c).multiplyScalar(i) })); m.position.set(x, y, z); m.scale.set(a, b, d); env.add(m);
  });
  scene.environment = pm.fromScene(env, 0.04).texture; pm.dispose();

  const ctex = (s, draw) => { const c = document.createElement('canvas'); c.width = c.height = s; draw(c.getContext('2d'), s); const t = new TH.CanvasTexture(c); t.encoding = TH.sRGBEncoding; t.anisotropy = 8; return t; };
  const woodT = ctex(512, (g, s) => { g.fillStyle = '#4a240f'; g.fillRect(0, 0, s, s); for (let i = 0; i < 220; i++) { g.strokeStyle = `rgba(${Math.random() < 0.5 ? '20,8,2' : '120,62,28'},${Math.random() * 0.25})`; g.lineWidth = 1 + Math.random() * 3; g.beginPath(); const y = Math.random() * s; g.moveTo(0, y); g.bezierCurveTo(s * 0.3, y + 10, s * 0.6, y - 10, s, y + 4); g.stroke(); } });
  const mat = {
    wood: new TH.MeshStandardMaterial({ map: woodT, roughness: 0.32, metalness: 0.05 }),
    gold: new TH.MeshStandardMaterial({ color: '#e0b864', metalness: 1, roughness: 0.22 }),
    track: new TH.MeshStandardMaterial({ color: '#2b160b', roughness: 0.25, metalness: 0.1 }),
    ball: new TH.MeshStandardMaterial({ color: '#ffffff', roughness: 0.08, metalness: 0.05 }),
  };

  /* cuenco fijo: borde, pista de la bola y pendiente hacia el rotor */
  const bowlProfile = [[2.35, 0.05], [2.4, 0.3], [2.3, 0.42], [2.2, 0.42], [2.05, 0.36], [1.92, 0.3], [1.78, 0.2], [1.68, 0.12], [1.62, 0.06]].map(([x, y]) => new TH.Vector2(x, y));
  const bowl = new TH.Mesh(new TH.LatheGeometry(bowlProfile, 128), mat.wood); bowl.receiveShadow = true; scene.add(bowl);
  const lip = new TH.Mesh(new TH.TorusGeometry(2.3, 0.025, 10, 128), mat.gold); lip.rotation.x = Math.PI / 2; lip.position.y = 0.43; scene.add(lip);
  const base = new TH.Mesh(new TH.CylinderGeometry(2.36, 2.5, 0.4, 96), mat.wood); base.position.y = -0.215; /* su tapa queda por debajo del disco de números */ base.receiveShadow = true; scene.add(base);
  /* rombos de la pista */
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + 0.2; const d = new TH.Mesh(new TH.OctahedronGeometry(0.05, 0), mat.gold); d.scale.set(1.6, 0.5, 0.8); d.position.set(Math.cos(a) * 1.86, 0.3, Math.sin(a) * 1.86); d.rotation.y = -a; scene.add(d); }

  /* rotor */
  const rotor = new TH.Group(); scene.add(rotor);
  const numsT = ctex(1024, (g, s) => {
    const c = s / 2, rr = (x) => (x / 1.6) * c; g.translate(c, c);
    g.fillStyle = '#2a140a'; g.beginPath(); g.arc(0, 0, c, 0, Math.PI * 2); g.fill();
    for (let i = 0; i < N; i++) {
      const n = ORDER[i], a0 = i * STEP - STEP / 2, a1 = a0 + STEP;
      const col = n === 0 ? '#0a6a3e' : RED.has(n) ? '#9a0a20' : '#0e0e0e';
      g.beginPath(); g.arc(0, 0, rr(1.6), a0, a1); g.arc(0, 0, rr(1.12), a1, a0, true); g.closePath(); g.fillStyle = col; g.fill();
      g.save(); g.rotate(i * STEP); g.translate(rr(1.5), 0); g.rotate(Math.PI / 2); g.fillStyle = '#f4ead5'; g.font = `700 ${s * 0.036}px Manrope, Inter, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n), 0, 0); g.restore();
    }
    g.strokeStyle = '#e0b864'; g.lineWidth = 4; [1.6, 1.42, 1.12].forEach((r) => { g.beginPath(); g.arc(0, 0, rr(r), 0, Math.PI * 2); g.stroke(); });
  });
  const disk = new TH.Mesh(new TH.CircleGeometry(1.6, 128), new TH.MeshStandardMaterial({ map: numsT, roughness: 0.55, metalness: 0, envMapIntensity: 0.5 }));
  disk.rotation.x = -Math.PI / 2; disk.position.y = 0.02; disk.receiveShadow = true; rotor.add(disk);
  /* separadores entre bolsillos */
  const fretG = new TH.BoxGeometry(0.3, 0.07, 0.016);
  for (let i = 0; i < N; i++) { const a = i * STEP - STEP / 2; const f = new TH.Mesh(fretG, mat.gold); f.position.set(Math.cos(a) * 1.27, 0.055, Math.sin(a) * 1.27); f.rotation.y = -a; f.castShadow = true; rotor.add(f); }
  /* cono central y torreta */
  const cone = new TH.Mesh(new TH.LatheGeometry([[1.13, 0.02], [0.9, 0.16], [0.5, 0.3], [0.25, 0.34], [0, 0.35]].map(([x, y]) => new TH.Vector2(x, y)), 96), mat.wood); cone.castShadow = cone.receiveShadow = true; rotor.add(cone);
  const turret = new TH.Group(); turret.position.y = 0.35; rotor.add(turret);
  turret.add(new TH.Mesh(new TH.CylinderGeometry(0.1, 0.16, 0.18, 32), mat.gold)).position.y = 0.09;
  const cap = new TH.Mesh(new TH.SphereGeometry(0.07, 24, 16), mat.gold); cap.position.y = 0.22; turret.add(cap);
  for (let k = 0; k < 4; k++) { const arm = new TH.Mesh(new TH.CylinderGeometry(0.022, 0.022, 0.5, 12), mat.gold); arm.rotation.z = Math.PI / 2; arm.position.set(0.25, 0.12, 0); const knob = new TH.Mesh(new TH.SphereGeometry(0.05, 16, 12), mat.gold); knob.position.set(0.5, 0.12, 0); const g = new TH.Group(); g.add(arm, knob); g.rotation.y = (k * Math.PI) / 2; turret.add(g); }

  const ball = new TH.Mesh(new TH.SphereGeometry(0.065, 32, 24), mat.ball); ball.castShadow = true; scene.add(ball);

  const key = new TH.SpotLight('#fff0d6', 2.4, 20, 0.55, 0.5, 1); key.position.set(1.5, 7, 2.5); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.bias = -0.0004; scene.add(key, key.target);
  scene.add(new TH.HemisphereLight('#ffe9d0', '#1a0a14', 0.3));
  const rim = new TH.PointLight('#ff3cac', 1.2, 10, 2); rim.position.set(-3, 1.5, -2); scene.add(rim);

  /* estado */
  const st = { phi: 0, A: -Math.PI / 2, br: 1.95, by: 0.33, anim: null, settled: null, lastRel: 0, cam: 0, follow: 0 };
  const CAM0 = new TH.Vector3(0, 4.7, 4.3), LOOK0 = new TH.Vector3(0, 0, 0.25);
  const camPos = CAM0.clone(), look = LOOK0.clone();
  let W = 1, H = 1;
  const resize = () => { W = canvas.clientWidth || 1; H = canvas.clientHeight || 1; R.setSize(W, H, false); cam.aspect = W / H; cam.updateProjectionMatrix(); };
  const ro = new ResizeObserver(resize); ro.observe(canvas); resize();

  let prev = performance.now(), stopped = false;
  const ballPos = new TH.Vector3();
  const loop = (now) => {
    if (stopped) return; requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
    const a = st.anim;
    if (a) {
      const p = Math.min(1, (now - a.t0) / a.dur), e = 1 - Math.pow(1 - p, 3);
      st.phi = a.p0 + (a.p1 - a.p0) * e;
      const pb = Math.min(1, (now - a.t0) / (a.dur * 0.9)), eb = 1 - Math.pow(1 - pb, 2.4);
      let A = a.A0 + (a.A1 - a.A0) * eb, r = 1.95, y = 0.33;
      if (pb > 0.58) {
        const q = (pb - 0.58) / 0.42;
        r = 1.95 - (1.95 - 1.3) * Math.min(1, q * 1.5);
        y = 0.33 - 0.27 * Math.min(1, q * 1.5) + Math.abs(Math.sin(q * 14)) * 0.09 * Math.pow(1 - q, 1.5);
        /* tic al pasar por cada separador */
        const rel = A + st.phi; const k = Math.floor(rel / STEP + 0.5);
        if (k !== st.lastRel) { st.lastRel = k; onTick(1 - q * 0.7); }
      }
      if (pb >= 1) { A = a.pocket - st.phi; r = 1.3; y = 0.06; }
      st.A = A; st.br = r; st.by = y;
      st.follow += ((pb > 0.55 ? 1 : 0) - st.follow) * Math.min(1, dt * 1.6);
      if (p >= 1) { st.anim = null; st.settled = a.pocket; a.done(); a.hold = now; st.holdUntil = now + 2600; }
    } else {
      st.phi += dt * 0.35;
      if (st.settled != null) { st.A = st.settled - st.phi; st.br = 1.3; st.by = 0.06; }
      if (st.holdUntil && now > st.holdUntil) { st.follow += (0 - st.follow) * Math.min(1, dt * 1.2); }
    }
    rotor.rotation.y = st.phi;
    ballPos.set(Math.cos(st.A) * st.br, st.by + 0.065, Math.sin(st.A) * st.br); ball.position.copy(ballPos);
    /* cámara: vista general o persiguiendo la bola */
    const f = st.follow;
    const dir = new TH.Vector3(ballPos.x, 0, ballPos.z).normalize();
    const near = new TH.Vector3(dir.x * 3.4, 2.3, dir.z * 3.4);
    camPos.lerpVectors(CAM0, near, f);
    look.lerpVectors(LOOK0, ballPos, f * 0.9);
    cam.position.copy(camPos); cam.lookAt(look);
    R.render(scene, cam);
  };
  requestAnimationFrame(loop);

  return {
    /* idx: posición en ORDER del número ganador */
    spin(idx, dur, done) {
      const p0 = st.phi, p1 = p0 + Math.PI * 2 * (1.5 + Math.random());
      const pocket = idx * STEP; /* ángulo del bolsillo en el rotor */
      const A0 = st.A; let A1 = pocket - p1; while (A1 < A0 + Math.PI * 2 * 4) A1 += Math.PI * 2; /* la bola va al revés que la rueda */
      st.settled = null; st.holdUntil = 0; st.lastRel = 0;
      st.anim = { t0: performance.now(), dur, p0, p1, A0, A1, pocket, done };
    },
    dispose() { stopped = true; ro.disconnect(); R.dispose(); try { R.forceContextLoss(); } catch (_) { /* nada */ } },
  };
}
