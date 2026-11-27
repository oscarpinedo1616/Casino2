import * as THREE from 'three';
import { chip, dice, gem, card, cardsFan } from './models.js';
import { linearize } from './icons.js';

/* Banner principal: la ficha Carmesí gigante girando, con dados, cartas y gemas flotando alrededor. */
export function createHero3D({ canvas, stage }) {
  const TH = THREE;
  const R = new TH.WebGLRenderer({ canvas, antialias: true, alpha: true });
  R.setPixelRatio(Math.min(devicePixelRatio, 2)); R.outputEncoding = TH.sRGBEncoding; R.setClearColor(0x000000, 0);
  const scene = new TH.Scene();
  const cam = new TH.PerspectiveCamera(30, 1, 0.1, 60); cam.position.set(0, 0, 9);
  const pm = new TH.PMREMGenerator(R), env = new TH.Scene();
  env.add(new TH.Mesh(new TH.BoxGeometry(20, 10, 20), new TH.MeshBasicMaterial({ color: '#16202c', side: TH.BackSide })));
  [['#ffffff', 2.2, 0, 4.9, 2, 10, 0.1, 6], ['#7dffb8', 1.2, -9.9, 1, 0, 0.1, 4, 10], ['#ff7aa8', 1, 9.9, 1, 0, 0.1, 4, 10]].forEach(([c, i, x, y, z, a, b, d]) => { const m = new TH.Mesh(new TH.BoxGeometry(1, 1, 1), new TH.MeshBasicMaterial({ color: new TH.Color(c).multiplyScalar(i) })); m.position.set(x, y, z); m.scale.set(a, b, d); env.add(m); });
  scene.environment = pm.fromScene(env, 0.04).texture; pm.dispose();
  scene.add(new TH.AmbientLight('#ffffff', 0.2));
  const key = new TH.DirectionalLight('#ffffff', 1.5); key.position.set(3, 5, 6); scene.add(key);
  const rim = new TH.PointLight('#5dffa8', 3, 12, 2); rim.position.set(-3, 2, 1); scene.add(rim);

  const root = new TH.Group(); scene.add(root);
  const hero = new TH.Group(); root.add(hero);
  const big = chip('#e0234e', '#ffffff', 1.55); big.rotation.x = Math.PI / 2; hero.add(big);
  const ring = new TH.Mesh(new TH.TorusGeometry(1.56, 0.05, 16, 96), new TH.MeshStandardMaterial({ color: '#ffd36a', metalness: 1, roughness: 0.2 })); hero.add(ring);
  const sat = [];
  const add = (o, x, y, z, s, sp) => { const g = new TH.Group(); g.add(o); g.position.set(x, y, z); g.scale.setScalar(s); g.userData = { base: new TH.Vector3(x, y, z), sp, ph: Math.random() * 6, rot: new TH.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5) }; root.add(g); sat.push(g); };
  add(dice(), 2.3, 1.3, 0.6, 0.55, 0.9);
  add(gem('#1fe07a'), -1.9, 1.5, -0.4, 0.42, 1.2);
  add(card('A', '♠', 0), -1.8, -1.35, 0.2, 0.75, 0.8);
  add(chip('#151a24', '#1fe07a', 0.45), 2.4, -1.2, 0.9, 1, 1.1);
  add(gem('#ff3c9a'), 0.4, -1.9, 1.2, 0.32, 1.4);
  add(cardsFan(['K', '♥', 1], ['Q', '♦', 1]), 1.0, 2.0, -0.6, 0.6, 0.7);
  linearize(scene);

  let W = 1, H = 1, mx = 0, my = 0, pmx = 0, pmy = 0;
  const resize = () => { W = stage.clientWidth || 1; H = stage.clientHeight || 1; R.setSize(W, H, false); cam.aspect = W / H; cam.updateProjectionMatrix(); const wide = W / H >= 1.2; cam.position.z = wide ? 9 : 10.5; root.scale.setScalar(wide ? 0.78 : 0.72);
    if (wide) cam.setViewOffset(W, H, -W * 0.27, 0, W, H); else cam.setViewOffset(W, H, 0, H * 0.3, W, H); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  const mv = (e) => { const r = stage.getBoundingClientRect(); mx = ((e.clientX - r.left) / r.width) * 2 - 1; my = ((e.clientY - r.top) / r.height) * 2 - 1; };
  stage.addEventListener('pointermove', mv); stage.addEventListener('pointerleave', () => { mx = 0; my = 0; });
  let visible = true; const io = new IntersectionObserver((es) => { visible = es[0].isIntersecting; }); io.observe(stage);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let prev = performance.now(), stop = false, first = true;
  const loop = (now) => {
    if (stop) return; requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - prev) / 1000); prev = now; if (!visible && !first) return; first = false;
    pmx += (mx - pmx) * Math.min(1, dt * 4); pmy += (my - pmy) * Math.min(1, dt * 4);
    const t = reduce ? 0 : now / 1000;
    hero.rotation.y = Math.sin(t * 0.6) * 0.5 + pmx * 0.5; hero.rotation.x = -0.15 + pmy * 0.25; hero.position.y = Math.sin(t * 1.2) * 0.1;
    big.rotation.y = t * 0.4;
    for (const g of sat) { const u = g.userData; g.position.set(u.base.x + Math.sin(t * u.sp + u.ph) * 0.15 + pmx * 0.3, u.base.y + Math.cos(t * u.sp * 1.1 + u.ph) * 0.18 - pmy * 0.2, u.base.z); g.rotation.x += u.rot.x * dt; g.rotation.y += u.rot.y * dt; g.rotation.z += u.rot.z * dt * 0.5; }
    R.render(scene, cam);
  };
  requestAnimationFrame(loop);
  return { dispose: () => { stop = true; ro.disconnect(); io.disconnect(); R.dispose(); try { R.forceContextLoss(); } catch (e) { /* nada */ } } };
}
