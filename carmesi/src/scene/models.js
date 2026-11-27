import * as THREE from 'three';

/* Modelos 3D de los iconos: todo se construye con código, no hay imágenes externas. */
const TH = THREE;
const DISPLAY = 'Outfit, Inter, system-ui, sans-serif';

export const ctex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new TH.CanvasTexture(c); t.encoding = TH.sRGBEncoding; t.anisotropy = 8; return t; };
const gloss = (color, o = {}) => new TH.MeshPhysicalMaterial({ color, roughness: 0.3, metalness: 0.05, clearcoat: 0.6, clearcoatRoughness: 0.2, envMapIntensity: 0.7, ...o });
const metal = (color, o = {}) => new TH.MeshStandardMaterial({ color, roughness: 0.25, metalness: 1, ...o });

/* carta con canto, cara y dorso */
const backT = () => ctex(256, 360, (g, w, h) => { g.fillStyle = '#c4123a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#fff'; g.lineWidth = 10; g.strokeRect(14, 14, w - 28, h - 28); g.globalAlpha = 0.25; g.lineWidth = 4; for (let i = -h; i < w + h; i += 24) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i - h, h); g.stroke(); } });
let BACK = null;
export function card(rank, suit, red) {
  if (!BACK) BACK = backT();
  const face = ctex(256, 360, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    g.fillStyle = red ? '#e0234e' : '#151a24'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `800 66px ${DISPLAY}`; g.fillText(rank, 48, 56); g.font = '52px serif'; g.fillText(suit, 48, 116);
    g.font = '170px serif'; g.fillText(suit, w / 2 + 14, h / 2 + 34);
  });
  const edge = new TH.MeshStandardMaterial({ color: '#e9ecf2', roughness: 0.5 });
  const m = new TH.Mesh(new TH.BoxGeometry(0.72, 1.0, 0.03), [edge, edge, edge, edge, new TH.MeshStandardMaterial({ map: face, roughness: 0.35 }), new TH.MeshStandardMaterial({ map: BACK, roughness: 0.4 })]);
  return m;
}

/* ficha de casino */
export function chip(color = '#e0234e', stripe = '#ffffff', r = 0.55) {
  const top = ctex(256, 256, (g, s) => {
    const c = s / 2; g.translate(c, c); g.fillStyle = color; g.beginPath(); g.arc(0, 0, c, 0, Math.PI * 2); g.fill();
    for (let i = 0; i < 6; i++) { g.save(); g.rotate((i / 6) * Math.PI * 2); g.fillStyle = stripe; g.fillRect(-c * 0.12, -c, c * 0.24, c * 0.26); g.restore(); }
    g.strokeStyle = stripe; g.lineWidth = 8; g.setLineDash([14, 10]); g.beginPath(); g.arc(0, 0, c * 0.66, 0, Math.PI * 2); g.stroke();
    g.setLineDash([]); g.fillStyle = color; g.beginPath(); g.arc(0, 0, c * 0.55, 0, Math.PI * 2); g.fill();
    g.fillStyle = stripe; g.font = `800 ${c * 0.5}px ${DISPLAY}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('C', 0, 4);
  });
  const side = ctex(512, 32, (g, w, h) => { for (let i = 0; i < 12; i++) { g.fillStyle = i % 2 ? stripe : color; g.fillRect((i / 12) * w, 0, w / 12 + 1, h); } });
  const fm = gloss('#ffffff', { map: top, roughness: 0.3 });
  return new TH.Mesh(new TH.CylinderGeometry(r, r, r * 0.2, 64), [new TH.MeshStandardMaterial({ map: side, roughness: 0.35 }), fm, fm]);
}

export function chipStack() {
  const g = new TH.Group(); const cols = [['#e0234e', '#fff'], ['#151a24', '#1fe07a'], ['#1fe07a', '#0b1a12'], ['#3b6cff', '#fff'], ['#ffb020', '#3a1a00']];
  for (let s = 0; s < 3; s++) { const n = 4 - s; for (let i = 0; i < n; i++) { const [a, b] = cols[(s * 2 + i) % cols.length]; const c = chip(a, b, 0.5); c.position.set((s - 1) * 0.95, i * 0.105 + 0.05, (s % 2) * 0.3); c.rotation.y = i * 0.6; g.add(c); } }
  return g;
}

/* rueda de ruleta en miniatura */
export function wheel() {
  const ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
  const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
  const g = new TH.Group();
  const disk = ctex(512, 512, (x, s) => { const c = s / 2; x.translate(c, c); const st = (Math.PI * 2) / 37;
    for (let i = 0; i < 37; i++) { const n = ORDER[i]; x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, c, i * st, (i + 1) * st); x.closePath(); x.fillStyle = n === 0 ? '#12b35e' : RED.has(n) ? '#e0234e' : '#151a24'; x.fill(); }
    x.fillStyle = '#7a3e16'; x.beginPath(); x.arc(0, 0, c * 0.62, 0, Math.PI * 2); x.fill(); x.strokeStyle = '#ffd36a'; x.lineWidth = 5; x.beginPath(); x.arc(0, 0, c * 0.62, 0, Math.PI * 2); x.stroke(); });
  const rim = new TH.Mesh(new TH.CylinderGeometry(1.25, 1.15, 0.32, 64), new TH.MeshStandardMaterial({ color: '#8a4a1c', roughness: 0.3 })); g.add(rim);
  const top = new TH.Mesh(new TH.CylinderGeometry(1.05, 1.05, 0.02, 64), [new TH.MeshStandardMaterial({ color: '#5a2a0c' }), gloss('#ffffff', { map: disk, roughness: 0.3 }), new TH.MeshStandardMaterial()]); top.position.y = 0.17; g.add(top);
  const ring = new TH.Mesh(new TH.TorusGeometry(1.2, 0.05, 12, 64), metal('#ffcf5a')); ring.rotation.x = Math.PI / 2; ring.position.y = 0.17; g.add(ring);
  const cone = new TH.Mesh(new TH.ConeGeometry(0.42, 0.25, 32), new TH.MeshStandardMaterial({ color: '#7a3e16', roughness: 0.3 })); cone.position.y = 0.3; g.add(cone);
  for (let k = 0; k < 4; k++) { const arm = new TH.Mesh(new TH.CylinderGeometry(0.035, 0.035, 0.7, 12), metal('#ffcf5a')); arm.rotation.z = Math.PI / 2; arm.position.y = 0.46; const a = new TH.Group(); a.add(arm); a.rotation.y = (k * Math.PI) / 4; g.add(a); }
  const ball = new TH.Mesh(new TH.SphereGeometry(0.08, 24, 16), gloss('#ffffff')); ball.position.set(0.85, 0.25, 0.1); g.add(ball);
  return g;
}

/* dado con puntos */
function die() {
  const pips = { 1: [[0.5, 0.5]], 2: [[0.28, 0.28], [0.72, 0.72]], 3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]], 4: [[0.28, 0.28], [0.72, 0.28], [0.28, 0.72], [0.72, 0.72]], 5: [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]], 6: [[0.28, 0.22], [0.72, 0.22], [0.28, 0.5], [0.72, 0.5], [0.28, 0.78], [0.72, 0.78]] };
  const mats = [1, 6, 2, 5, 3, 4].map((n) => gloss('#ffffff', { map: ctex(256, 256, (g, s) => { g.fillStyle = '#f6f7fb'; g.fillRect(0, 0, s, s); g.fillStyle = n === 1 ? '#e0234e' : '#151a24'; pips[n].forEach(([x, y]) => { g.beginPath(); g.arc(x * s, y * s, s * 0.09, 0, Math.PI * 2); g.fill(); }); }) }));
  return new TH.Mesh(new TH.BoxGeometry(0.9, 0.9, 0.9, 1, 1, 1), mats);
}
export function dice() { const g = new TH.Group(); const a = die(); a.position.set(-0.5, 0, 0); a.rotation.set(0.5, 0.6, 0.1); const b = die(); b.position.set(0.55, -0.2, 0.3); b.rotation.set(-0.3, 1.1, 0.4); g.add(a, b); return g; }

export function bomb() {
  const g = new TH.Group();
  const body = new TH.Mesh(new TH.SphereGeometry(0.75, 48, 32), gloss('#1b1f2a', { metalness: 0.3, roughness: 0.25 })); g.add(body);
  const cap = new TH.Mesh(new TH.CylinderGeometry(0.22, 0.26, 0.2, 24), metal('#8a93a6')); cap.position.set(0.3, 0.68, 0); cap.rotation.z = -0.4; g.add(cap);
  const curve = new TH.CatmullRomCurve3([new TH.Vector3(0.36, 0.78, 0), new TH.Vector3(0.5, 1.0, 0.05), new TH.Vector3(0.72, 1.05, 0), new TH.Vector3(0.85, 0.95, -0.05)]);
  g.add(new TH.Mesh(new TH.TubeGeometry(curve, 20, 0.035, 8), new TH.MeshStandardMaterial({ color: '#c9a36a', roughness: 0.8 })));
  const spark = new TH.Mesh(new TH.SphereGeometry(0.11, 16, 12), new TH.MeshBasicMaterial({ color: '#ffd36a' })); spark.position.set(0.88, 0.95, -0.05); g.add(spark);
  const glow = new TH.PointLight('#ff9a3a', 2.5, 3, 2); glow.position.copy(spark.position); g.add(glow);
  const shine = new TH.Mesh(new TH.SphereGeometry(0.18, 16, 12), new TH.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.25 })); shine.position.set(-0.32, 0.32, 0.6); shine.scale.set(1, 0.6, 0.3); g.add(shine);
  return g;
}

export function gem(color = '#1fe07a') {
  const g = new TH.Group();
  const m = new TH.MeshPhysicalMaterial({ color, roughness: 0.05, metalness: 0.1, clearcoat: 1, flatShading: true, emissive: color, emissiveIntensity: 0.25, envMapIntensity: 1 });
  const top = new TH.Mesh(new TH.CylinderGeometry(0.5, 0.85, 0.35, 8), m); top.position.y = 0.18; g.add(top);
  const bot = new TH.Mesh(new TH.ConeGeometry(0.85, 0.9, 8), m); bot.rotation.x = Math.PI; bot.position.y = -0.45; g.add(bot);
  return g;
}

export function plinko() {
  const g = new TH.Group(); const peg = gloss('#e8ecf5', { roughness: 0.3 });
  for (let r = 0; r < 5; r++) for (let i = 0; i <= r; i++) { const p = new TH.Mesh(new TH.SphereGeometry(0.07, 16, 12), peg); p.position.set((i - r / 2) * 0.42, 0.9 - r * 0.38, -0.3); g.add(p); }
  const ball = new TH.Mesh(new TH.SphereGeometry(0.42, 48, 32), gloss('#ff3c9a', { emissive: '#ff3c9a', emissiveIntensity: 0.15 })); ball.position.set(0.15, 0.25, 0.4); g.add(ball);
  return g;
}

export function rocket() {
  const g = new TH.Group(); const body = gloss('#f4f6fb'), red = gloss('#e0234e');
  const b = new TH.Mesh(new TH.CylinderGeometry(0.32, 0.36, 1.2, 40), body); g.add(b);
  const nose = new TH.Mesh(new TH.ConeGeometry(0.32, 0.55, 40), red); nose.position.y = 0.87; g.add(nose);
  const win = new TH.Mesh(new TH.CylinderGeometry(0.15, 0.15, 0.06, 32), gloss('#3bc9ff', { emissive: '#3bc9ff', emissiveIntensity: 0.4 })); win.rotation.x = Math.PI / 2; win.position.set(0, 0.25, 0.33); g.add(win);
  for (let k = 0; k < 3; k++) { const f = new TH.Mesh(new TH.BoxGeometry(0.06, 0.45, 0.35), red); const a = new TH.Group(); f.position.set(0, -0.5, 0.38); a.add(f); a.rotation.y = (k / 3) * Math.PI * 2; g.add(a); }
  const fl = new TH.Mesh(new TH.ConeGeometry(0.24, 0.7, 24), new TH.MeshBasicMaterial({ color: '#ffb020' })); fl.rotation.x = Math.PI; fl.position.y = -0.95; g.add(fl);
  const fl2 = new TH.Mesh(new TH.ConeGeometry(0.13, 0.45, 24), new TH.MeshBasicMaterial({ color: '#fff4c2' })); fl2.rotation.x = Math.PI; fl2.position.y = -0.85; g.add(fl2);
  const light = new TH.PointLight('#ff8a2a', 2, 3, 2); light.position.y = -1.1; g.add(light);
  g.rotation.z = -0.6;
  return g;
}

export function slotMachine() {
  const g = new TH.Group();
  const screen = ctex(512, 256, (x, w, h) => { x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); for (let i = 0; i < 3; i++) { x.fillStyle = '#e9ecf4'; x.fillRect(i * w / 3 + 8, 8, w / 3 - 16, h - 16); x.fillStyle = '#e0234e'; x.font = `900 150px ${DISPLAY}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('7', i * w / 3 + w / 6, h / 2 + 8); } });
  const cab = new TH.Mesh(new TH.BoxGeometry(1.7, 1.25, 0.7), gloss('#7a2cff')); g.add(cab);
  const top = new TH.Mesh(new TH.BoxGeometry(1.5, 0.3, 0.6), gloss('#ffcf3a', { emissive: '#ffb020', emissiveIntensity: 0.3 })); top.position.y = 0.78; g.add(top);
  const scr = new TH.Mesh(new TH.PlaneGeometry(1.4, 0.7), new TH.MeshStandardMaterial({ map: screen, roughness: 0.3 })); scr.position.set(0, 0.05, 0.36); g.add(scr);
  const frame = new TH.Mesh(new TH.TorusGeometry(0.01, 0.01, 2, 4), metal('#fff')); g.add(frame);
  const lever = new TH.Mesh(new TH.CylinderGeometry(0.04, 0.04, 0.9, 12), metal('#d6dbe6')); lever.position.set(1.0, 0.3, 0); g.add(lever);
  const knob = new TH.Mesh(new TH.SphereGeometry(0.14, 24, 16), gloss('#e0234e')); knob.position.set(1.0, 0.78, 0); g.add(knob);
  return g;
}

export function cardsFan(a, b) { const g = new TH.Group(); const c1 = card(...a); c1.position.set(-0.3, 0, 0); c1.rotation.set(0.1, 0.2, 0.25); const c2 = card(...b); c2.position.set(0.32, -0.05, 0.12); c2.rotation.set(0.05, -0.15, -0.18); g.add(c1, c2); return g; }

export function arrows() {
  const g = new TH.Group();
  const up = new TH.Mesh(new TH.ConeGeometry(0.28, 0.42, 3), gloss('#1fe07a', { emissive: '#1fe07a', emissiveIntensity: 0.2 })); up.position.set(0.75, 0.55, 0.4); g.add(up);
  const dn = new TH.Mesh(new TH.ConeGeometry(0.28, 0.42, 3), gloss('#e0234e', { emissive: '#e0234e', emissiveIntensity: 0.2 })); dn.rotation.z = Math.PI; dn.position.set(0.75, -0.35, 0.4); g.add(dn);
  return g;
}

/* catálogo: qué modelo y en qué postura sale cada icono */
export const MODELS = {
  blackjack: () => cardsFan(['A', '♠', 0], ['K', '♥', 1]),
  hilo: () => { const g = cardsFan(['A', '♥', 1], ['2', '♣', 0]); g.add(arrows()); return g; },
  ruleta: () => { const g = wheel(); g.rotation.x = 0.55; return g; },
  slots: () => { const g = slotMachine(); g.rotation.set(0.15, -0.35, 0); return g; },
  dice: () => dice(),
  mines: () => { const g = new TH.Group(); const b = bomb(); b.position.set(-0.35, -0.1, 0); const d = gem(); d.scale.setScalar(0.6); d.position.set(0.85, 0.55, 0.4); d.rotation.set(0.3, 0.5, 0); g.add(b, d); return g; },
  plinko: () => plinko(),
  crash: () => rocket(),
  sala: () => { const g = chipStack(); g.rotation.set(0.75, 0.25, 0); return g; },
  casino: () => { const g = wheel(); g.rotation.set(0.75, 0, -0.2); return g; },
};
