/**
 * Genera todos los iconos (favicon, PWA, Apple, maskable) a partir de public/logo.jpg
 * Ejecutar: npm run generate-icons
 */
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { sharpsToIco } from 'sharp-ico';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC = join(ROOT, 'public');
const SRC = join(PUBLIC, 'logo.jpg');

/** Umbral: píxeles con R,G,B por encima se hacen transparentes (quitar fondo blanco) */
const WHITE_THRESHOLD = 245;

const SIZES = [
  { name: 'pwa-64x64.png', size: 64 },
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'apple-touch-icon-180x180.png', size: 180 },
];

const ICO_SIZES = [16, 32, 48];

/**
 * Devuelve PNG con el fondo blanco/casi blanco hecho transparente.
 * @param {sharp.Sharp} img - Instancia de Sharp (imagen redimensionada)
 * @returns {Promise<Buffer>} - PNG con transparencia
 */
async function removeWhiteAndExport(img) {
  const { data, info } = await img
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r >= WHITE_THRESHOLD && g >= WHITE_THRESHOLD && b >= WHITE_THRESHOLD) {
      data[i + 3] = 0;
    }
  }
  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

async function main() {
  const buffer = await readFile(SRC);

  // Cuadrado: cover para recortar al centro
  const resizeSquare = (w) => sharp(buffer).resize(w, w, { fit: 'cover' });

  for (const { name, size: s } of SIZES) {
    const out = join(PUBLIC, name);
    const resized = resizeSquare(s);
    const pngBuffer = await removeWhiteAndExport(resized);
    await sharp(pngBuffer).toFile(out);
    console.log('✓', name);
  }

  // Maskable: 512x512 con logo al 80% centrado (zona segura PWA), fondo oscuro
  const maskableSize = 512;
  const logoSize = Math.round(maskableSize * 0.8);
  const offset = (maskableSize - logoSize) / 2;
  const maskablePath = join(PUBLIC, 'maskable-icon-512x512.png');
  const maskableLogo = resizeSquare(logoSize);
  const maskablePng = await removeWhiteAndExport(maskableLogo);
  await sharp(maskablePng)
    .extend({
      top: Math.floor(offset),
      bottom: Math.ceil(offset),
      left: Math.floor(offset),
      right: Math.ceil(offset),
      background: { r: 10, g: 14, b: 39, alpha: 1 },
    })
    .png()
    .toFile(maskablePath);
  console.log('✓ maskable-icon-512x512.png');

  // Favicon.ico (16, 32, 48) con transparencia
  const icoBuffers = await Promise.all(
    ICO_SIZES.map(async (s) => removeWhiteAndExport(resizeSquare(s)))
  );
  const sharpInstances = icoBuffers.map((buf) => sharp(buf));
  await sharpsToIco(sharpInstances, join(PUBLIC, 'favicon.ico'));
  console.log('✓ favicon.ico');

  // Favicon.svg: SVG que referencia el PNG 64 (evita duplicar datos)
  const faviconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="64" height="64" viewBox="0 0 64 64">
  <image href="/pwa-64x64.png" width="64" height="64"/>
</svg>`;
  await writeFile(join(PUBLIC, 'favicon.svg'), faviconSvg.trim());
  console.log('✓ favicon.svg');

  // Iconos en public/icons/ para PWA (PNG desde logo, sin fondo blanco)
  await mkdir(join(PUBLIC, 'icons'), { recursive: true });
  for (const [name, s] of [
    ['icon-192x192.png', 192],
    ['icon-512x512.png', 512],
    ['icon-512x512-maskable.png', 512],
  ]) {
    const out = join(PUBLIC, 'icons', name);
    if (name.includes('maskable')) {
      const logoSizeM = Math.round(512 * 0.8);
      const offsetM = (512 - logoSizeM) / 2;
      const maskableLogoM = resizeSquare(logoSizeM);
      const maskablePngM = await removeWhiteAndExport(maskableLogoM);
      await sharp(maskablePngM)
        .extend({
          top: Math.floor(offsetM),
          bottom: Math.ceil(offsetM),
          left: Math.floor(offsetM),
          right: Math.ceil(offsetM),
          background: { r: 10, g: 14, b: 39, alpha: 1 },
        })
        .png()
        .toFile(out);
    } else {
      const pngBuf = await removeWhiteAndExport(resizeSquare(s));
      await sharp(pngBuf).toFile(out);
    }
    console.log('✓ icons/' + name);
  }

  console.log('\nIconos generados desde', SRC);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
