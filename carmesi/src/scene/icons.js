import * as THREE from 'three';
import { MODELS } from './models.js';

/* Renderiza cada modelo una sola vez a una imagen PNG con un único contexto WebGL y lo libera.
   Así las tarjetas llevan iconos 3D de verdad sin tener veinte escenas abiertas. */
const cache = {};
/* Three r128 trata los colores hexadecimales como lineales: se pasan de sRGB para que salgan intensos */
export const linearize = (root) => root.traverse((o) => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; ms.forEach((m) => { if (m.userData.lin) return; m.userData.lin = 1; if (m.color) m.color.convertSRGBToLinear(); if (m.emissive) m.emissive.convertSRGBToLinear(); }); if (o.isLight && !o.userData.lin) { o.userData.lin = 1; o.color.convertSRGBToLinear(); } });
let pending = null;

export function renderIcons(ids, size = 420) {
  const need = ids.filter((id) => !cache[id] && MODELS[id]);
  if (!need.length) return Promise.resolve({ ...cache });
  if (pending) return pending.then(() => renderIcons(ids, size));
  pending = new Promise((resolve) => {
    let R;
    try {
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
      R = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
      R.setPixelRatio(1); R.setSize(size, size, false); R.outputEncoding = THREE.sRGBEncoding;
      R.toneMapping = THREE.NoToneMapping; R.setClearColor(0x000000, 0);
      const scene = new THREE.Scene();
      const pm = new THREE.PMREMGenerator(R), env = new THREE.Scene();
      env.add(new THREE.Mesh(new THREE.BoxGeometry(20, 10, 20), new THREE.MeshBasicMaterial({ color: '#1b2233', side: THREE.BackSide })));
      [['#ffffff', 2.2, 0, 4.9, 2, 10, 0.1, 6], ['#9ad7ff', 1, -9.9, 1, 0, 0.1, 4, 10], ['#ffd6f0', 1, 9.9, 1, 0, 0.1, 4, 10]].forEach(([c, i, x, y, z, a, b, d]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(i) })); m.position.set(x, y, z); m.scale.set(a, b, d); env.add(m); });
      scene.environment = pm.fromScene(env, 0.04).texture; pm.dispose();
      const key = new THREE.DirectionalLight('#ffffff', 1.6); key.position.set(2, 4, 5); scene.add(key);
      const rim = new THREE.DirectionalLight('#9ad7ff', 1.2); rim.position.set(-4, 2, -3); scene.add(rim);
      scene.add(new THREE.AmbientLight('#ffffff', 0.15));
      const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 50); cam.position.set(0, 0.4, 6.2); cam.lookAt(0, 0, 0);
      const box = new THREE.Box3(), v = new THREE.Vector3();
      let i = 0;
      const step = () => {
        if (i >= need.length) { R.dispose(); try { R.forceContextLoss(); } catch (e) { /* nada */ } pending = null; resolve({ ...cache }); return; }
        const id = need[i++];
        const obj = MODELS[id](); const holder = new THREE.Group(); holder.add(obj); scene.add(holder);
        linearize(holder);
        box.setFromObject(holder); box.getSize(v); const k = 2.6 / Math.max(v.x, v.y, v.z * 0.8); holder.scale.setScalar(k);
        box.setFromObject(holder); box.getCenter(v); holder.position.sub(v);
        R.render(scene, cam); cache[id] = canvas.toDataURL('image/png');
        scene.remove(holder); holder.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    } catch (e) { if (R) R.dispose(); pending = null; resolve({ ...cache }); }
  });
  return pending;
}
