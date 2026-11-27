// Genera dist-single/index.html: un único archivo con todo dentro (menos Three.js y las fuentes, que van por CDN).
const esbuild = require('/opt/npm-tools/node_modules/esbuild');
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
(async () => {
  const r = await esbuild.build({
    entryPoints: [path.join(root, 'src/main.jsx')], bundle: true, write: false, format: 'iife', minify: true, target: 'es2020',
    jsx: 'automatic', loader: { '.js': 'jsx' }, outdir: 'out', define: { 'process.env.NODE_ENV': '"production"' },
    alias: { three: path.join(__dirname, 'three-shim.cjs') }, nodePaths: ['/opt/npm-tools/node_modules'], logLevel: 'warning',
  });
  const js = r.outputFiles.find((f) => f.path.endsWith('.js')).text.replace(/<\//g, '<\\/').replace(/<!--/g, '<\\!--');
  const css = r.outputFiles.find((f) => f.path.endsWith('.css')).text.replace(/<\//g, '<\\/');
  let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  html = html.replace('<script type="module" src="/src/main.jsx"></script>', '');
  html = html.replace('</head>', () => `<style>${css}</style>\n</head>`);
  html = html.replace('</body>', () => `<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>\n<script>${js}</script>\n</body>`);
  fs.mkdirSync(path.join(root, 'dist-single'), { recursive: true });
  fs.writeFileSync(path.join(root, 'dist-single/index.html'), html);
  console.log('ok', (html.length / 1024).toFixed(0) + ' KB');
})().catch((e) => { console.error(e.message); process.exit(1); });
