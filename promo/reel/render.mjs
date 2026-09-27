// promo/reel/index.html 애니메이션을 한 컷씩 찍어 16:9 mp4로 만든다.
// 사용: node render.mjs [fps] [출력파일]
//   시험: node render.mjs 1 out/test.mp4  → %TEMP%\hub-reel-frames 에 1초 1컷
//   본편: node render.mjs 30 ../../public/slides/ai-hub-2026.mp4
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const FPS = +(process.argv[2] || 30);
const OUT = process.argv[3] || join(here, 'out', 'reel.mp4');
const W = 1920, H = 1080;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FFMPEG = execFileSync('python', ['-c', 'import imageio_ffmpeg as f;print(f.get_ffmpeg_exe())']).toString().trim();
const FRAMES = join(process.env.TEMP || here, 'hub-reel-frames');
const PORT = 9334;

rmSync(FRAMES, { recursive: true, force: true });
mkdirSync(FRAMES, { recursive: true });
mkdirSync(dirname(OUT), { recursive: true });

const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${PORT}`, '--no-first-run', '--no-default-browser-check',
  `--window-size=${W},${H}`, '--hide-scrollbars', '--force-device-scale-factor=1',
  '--allow-file-access-from-files', // 로컬 woff2 글꼴을 file:// 에서 읽기 위해
  '--user-data-dir=' + join(process.env.TEMP || here, 'hub-reel-chrome-profile'),
  'about:blank',
], { stdio: 'ignore' });

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function getWs() {
  for (let i = 0; i < 50; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
      const page = list.find(t => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(200);
  }
  throw new Error('chrome not ready');
}

const ws = new WebSocket(await getWs());
await new Promise(r => ws.onopen = r);
let id = 0; const pending = new Map();
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const cdp = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });

await cdp('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
await cdp('Page.enable');
const url = pathToFileURL(join(here, 'index.html')).href + '?render=1';
const loaded = new Promise(res => { const h = e => { const m = JSON.parse(e.data); if (m.method === 'Page.loadEventFired') { ws.removeEventListener('message', h); res(); } }; ws.addEventListener('message', h); });
await cdp('Page.navigate', { url });
await Promise.race([loaded, sleep(8000)]);
await sleep(300);
await cdp('Runtime.evaluate', { expression: 'document.fonts.ready.then(()=>1)', awaitPromise: true });
await sleep(500);
const fonts = await cdp('Runtime.evaluate', { expression: '[...document.fonts].filter(f=>f.status==="loaded").map(f=>f.family).join(",")' });
console.log('글꼴:', fonts.result && fonts.result.result && fonts.result.result.value);
const ev = await cdp('Runtime.evaluate', { expression: 'window.TOTAL' });
const TOTAL = ev.result && ev.result.result && ev.result.result.value;
if (!TOTAL) { console.error('페이지를 못 읽음:', JSON.stringify(ev)); ws.close(); chrome.kill(); process.exit(1); }
const N = Math.ceil(TOTAL * FPS);
console.log(`총 ${TOTAL.toFixed(1)}초, ${N}컷 (${FPS}fps)`);

const t0 = Date.now();
for (let i = 0; i < N; i++) {
  await cdp('Runtime.evaluate', { expression: `seek(${i / FPS})` });
  const shot = await cdp('Page.captureScreenshot', { format: 'jpeg', quality: 92, clip: { x: 0, y: 0, width: W, height: H, scale: 1 } });
  writeFileSync(join(FRAMES, `f${String(i).padStart(5, '0')}.jpg`), Buffer.from(shot.result.data, 'base64'));
  if (i % 100 === 0) console.log(`${i}/${N} 컷 (${((Date.now() - t0) / 1000).toFixed(0)}초 경과)`);
}
ws.close(); chrome.kill();

console.log('mp4로 합치는 중…');
execFileSync(FFMPEG, [
  '-y', '-hide_banner', '-loglevel', 'error',
  '-framerate', String(FPS), '-i', join(FRAMES, 'f%05d.jpg'),
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '22', '-preset', 'slow', '-movflags', '+faststart',
  OUT,
], { stdio: 'inherit' });
console.log('완료:', OUT, `(${readdirSync(FRAMES).length}컷)`);
