/* Sonido sintetizado con WebAudio: no hay archivos de audio, todo se genera al momento. */
let ctx = null, master = null, noiseBuf = null;
let on = (() => { try { return localStorage.getItem('carmesi-sound') !== '0'; } catch (e) { return true; } })();
const listeners = new Set();

const ac = () => {
  if (!on) return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.55; master.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
};
const env = (g, t, a, peak, dec) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); };
const tone = (f, type, peak, dec, delay = 0, a = 0.004) => {
  const c = ac(); if (!c) return; const t = c.currentTime + delay;
  const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
  env(g, t, a, peak, dec); o.connect(g); g.connect(master); o.start(t); o.stop(t + a + dec + 0.05);
};
const noise = (peak, dec, freq, q = 1, type = 'bandpass', delay = 0, sweep) => {
  const c = ac(); if (!c) return; const t = c.currentTime + delay;
  const s = c.createBufferSource(); s.buffer = noiseBuf; const f = c.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
  if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, t + dec);
  const g = c.createGain(); env(g, t, 0.002, peak, dec); s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dec + 0.05);
};

export const sfx = {
  /* ficha de cerámica sobre el tapete */
  chip: () => { tone(3100, 'sine', 0.18, 0.05); tone(4300, 'sine', 0.1, 0.035, 0.012); noise(0.12, 0.03, 5000, 2); },
  /* la bola chocando con los separadores */
  tick: (v = 1) => { noise(0.22 * v, 0.018, 3800, 6); tone(2200 + Math.random() * 400, 'triangle', 0.05 * v, 0.02); },
  /* bola rodando por la pista */
  roll: (dur = 3) => { noise(0.05, dur, 900, 0.7, 'bandpass', 0, 400); },
  /* carta deslizándose */
  card: () => noise(0.25, 0.09, 2400, 0.8, 'bandpass', 0, 6000),
  /* rodillo que se detiene */
  reelStop: () => { tone(160, 'square', 0.12, 0.08); noise(0.2, 0.04, 1500, 1); },
  reelTick: () => noise(0.06, 0.012, 2600, 4),
  /* premio: arpegio */
  win: (big = false) => { const n = big ? [523, 659, 784, 1047, 1319, 1568] : [523, 659, 784, 1047]; n.forEach((f, i) => { tone(f, 'triangle', 0.16, 0.35, i * 0.08); tone(f * 2, 'sine', 0.05, 0.25, i * 0.08); }); },
  lose: () => { tone(220, 'sine', 0.08, 0.3); tone(185, 'sine', 0.06, 0.4, 0.12); },
  /* paso entre mundos */
  whoosh: () => noise(0.35, 0.7, 300, 0.8, 'bandpass', 0, 4000),
  click: () => tone(1800, 'sine', 0.06, 0.03),
};

export const sound = {
  get on() { return on; },
  set(v) { on = v; try { localStorage.setItem('carmesi-sound', v ? '1' : '0'); } catch (e) { /* nada */ } if (!v && ctx) ctx.suspend(); listeners.forEach((f) => f(v)); },
  sub(f) { listeners.add(f); return () => listeners.delete(f); },
};
