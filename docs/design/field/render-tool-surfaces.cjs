// Render the Ithaca, Troy, and Delphi background loops from the offline WebGL
// scene. FIELD_PLAYWRIGHT and FIELD_FFMPEG point at the local render tools.
const { chromium } = require(process.env.FIELD_PLAYWRIGHT || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { spawn } = require('node:child_process');
const { once } = require('node:events');

const root = path.resolve(__dirname, '../../..');
const output = path.join(root, 'apps/web/public/media/field');
const previews = path.join(__dirname, 'tool-backgrounds');
const html = pathToFileURL(path.join(__dirname, 'render-tool-surfaces.html')).href;
const tools = ['ithaca', 'troy', 'delphi'];
const selected = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
const targets = selected.length ? selected : tools;
const posterOnly = process.argv.includes('--poster-only');
const previewOnly = process.argv.includes('--preview-only');

for (const tool of targets) {
  if (!tools.includes(tool)) throw new Error(`Unknown tool "${tool}". Choose: ${tools.join(', ')}`);
}

fs.mkdirSync(output, { recursive: true });
fs.mkdirSync(previews, { recursive: true });

async function renderTool(page, tool) {
  await page.goto(`${html}?tool=${tool}`);
  await page.waitForFunction(() => typeof window.renderFrame === 'function');
  const seamMatches = await page.evaluate(() => {
    renderFrame(0);
    const first = document.querySelector('canvas').toDataURL();
    renderFrame(10);
    const last = document.querySelector('canvas').toDataURL();
    renderFrame(0);
    return first === last;
  });
  if (!seamMatches) throw new Error(`${tool}: first and last loop frames differ`);
  console.log(`${tool}: first and last frames match`);
  await page.screenshot({ path: path.join(previews, `${tool}-preview.png`) });

  const poster = await page.evaluate(() => document.querySelector('canvas').toDataURL('image/webp', 0.88));
  const data = poster.slice(poster.indexOf(',') + 1);
  fs.writeFileSync(path.join(output, `${tool}-poster.webp`), Buffer.from(data, 'base64'));
  console.log(`${tool}: poster ${fs.statSync(path.join(output, `${tool}-poster.webp`)).size} bytes`);

  if (posterOnly || previewOnly) return;
  if (!process.env.FIELD_FFMPEG) throw new Error('Set FIELD_FFMPEG to the encoder executable');

  const destination = path.join(output, `${tool}-loop.mp4`);
  const encoder = spawn(process.env.FIELD_FFMPEG, [
    '-y', '-f', 'image2pipe', '-vcodec', 'png', '-framerate', '24', '-i', 'pipe:0',
    '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', destination,
  ], { stdio: ['pipe', 'ignore', 'pipe'] });
  let log = '';
  encoder.stderr.on('data', (chunk) => { log += chunk; });
  encoder.stdin.on('error', () => {});
  const done = once(encoder, 'close');

  for (let frame = 0; frame < 240; frame++) {
    await page.evaluate((seconds) => renderFrame(seconds), frame / 24);
    const png = await page.screenshot();
    if (!encoder.stdin.write(png)) await once(encoder.stdin, 'drain');
    if (frame % 48 === 0) console.log(`${tool}: rendered ${frame}/240 frames`);
  }
  encoder.stdin.end();
  const [code] = await done;
  if (code !== 0) throw new Error(`${tool} ffmpeg failed (${code}):\n${log.slice(-2400)}`);
  console.log(`${tool}: loop ${fs.statSync(destination).size} bytes`);
}

(async () => {
  const browser = await chromium.launch({
    channel: process.env.FIELD_BROWSER_CHANNEL || 'msedge',
    headless: true,
    args: ['--enable-unsafe-swiftshader'],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    page.on('pageerror', (error) => { throw error; });
    for (const tool of targets) await renderTool(page, tool);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
