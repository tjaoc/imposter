/**
 * Genera todos los iconos (favicon, PWA, Apple, maskable) a partir de public/icon_impostor.jpeg
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
const SRC = join(PUBLIC, 'icon_impostor.jpeg');

/** Umbral: píxeles con R,G,B por encima se consideran blanco */
const WHITE_THRESHOLD = 245;

/** Factor de radio de esquinas (0.2 = 20% del lado, esquinas bien redondeadas) */
const ROUND_RADIUS_FACTOR = 0.2;

/** Genera una máscara PNG: opaca en rectángulo redondeado, transparente fuera. */
async function createRoundedRectMask(size) {
  const r = Math.max(4, Math.round(size * ROUND_RADIUS_FACTOR));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <rect x="0" y="0" width="${size}" height="${size}" rx="${r}" ry="${r}" fill="white"/>
</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

/** Aplica esquinas redondeadas al buffer PNG (mismo tamaño que la máscara). */
async function applyRoundedCorners(pngBuffer, size) {
  const mask = await createRoundedRectMask(size);
  return sharp(pngBuffer)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

/** Rellena la zona blanca (fuera del círculo) con el gradiente del fondo (verde oscuro → verde claro). */
async function fillWhiteWithGradient(inputBuffer) {
  const { data, info } = await sharp(inputBuffer)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const ch = info.channels || 3;
  const isWhite = (i) =>
    data[i] >= WHITE_THRESHOLD &&
    data[i + 1] >= WHITE_THRESHOLD &&
    data[i + 2] >= WHITE_THRESHOLD;

  // Muestrear color oscuro (gradiente arriba-izq) y claro (abajo-derecha) desde píxeles no blancos
  let darkR = 0, darkG = 0, darkB = 0, darkN = 0;
  let lightR = 0, lightG = 0, lightB = 0, lightN = 0;
  const margin = Math.min(w, h) * 0.35;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * ch;
      if (isWhite(i)) continue;
      if (x < margin && y < margin) {
        darkR += data[i]; darkG += data[i + 1]; darkB += data[i + 2];
        darkN++;
      } else if (x > w - margin && y > h - margin) {
        lightR += data[i]; lightG += data[i + 1]; lightB += data[i + 2];
        lightN++;
      }
    }
  }
  if (darkN === 0) {
    darkR = 34; darkG = 102; darkB = 51; darkN = 1;
  }
  if (lightN === 0) {
    lightR = 154; lightG = 205; lightB = 50; lightN = 1;
  }
  const dr = Math.round(darkR / darkN);
  const dg = Math.round(darkG / darkN);
  const db = Math.round(darkB / darkN);
  const lr = Math.round(lightR / lightN);
  const lg = Math.round(lightG / lightN);
  const lb = Math.round(lightB / lightN);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * ch;
      if (!isWhite(i)) continue;
      // Gradiente de arriba-izq (oscuro) a abajo-derecha (claro)
      const t = (x / w + y / h) / 2;
      const t2 = Math.max(0, Math.min(1, t));
      data[i] = Math.round(dr + (lr - dr) * t2);
      data[i + 1] = Math.round(dg + (lg - dg) * t2);
      data[i + 2] = Math.round(db + (lb - db) * t2);
    }
  }
  return sharp(data, { raw: { width: w, height: h, channels: ch } })
    .png()
    .toBuffer();
}

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

  // Paso 1: cubrir la parte blanca (si la hay) con el gradiente del fondo
  const filledBuffer = await fillWhiteWithGradient(buffer);
  await sharp(filledBuffer).png().toFile(join(PUBLIC, 'icon_impostor-filled.png'));
  console.log('✓ icon_impostor-filled.png (fondo blanco cubierto con gradiente)');

  // Paso 2: imagen con transparencia donde había blanco (para que contain deje fondo transparente)
  const withTransparency = await removeWhiteAndExport(sharp(filledBuffer));

  // Redimensionar: contain + fondo transparente (si la imagen no llena el tamaño, sin rellenar)
  const resizeSquare = (size) =>
    sharp(withTransparency)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      });

  // Redimensionar: cover = el icono llena todo el cuadrado (para maskable, sin fondos)
  const resizeSquareCover = (size) =>
    sharp(withTransparency)
      .resize(size, size, { fit: 'cover', position: 'center' });

  for (const { name, size: s } of SIZES) {
    const out = join(PUBLIC, name);
    let pngBuffer = await resizeSquare(s).png().toBuffer();
    pngBuffer = await applyRoundedCorners(pngBuffer, s);
    await sharp(pngBuffer).toFile(out);
    console.log('✓', name);
  }

  // Maskable: 512x512 con el icono cubriendo todo el tamaño (sin fondo azul)
  const maskableSize = 512;
  const maskablePath = join(PUBLIC, 'maskable-icon-512x512.png');
  let maskablePng = await resizeSquareCover(maskableSize).png().toBuffer();
  maskablePng = await applyRoundedCorners(maskablePng, maskableSize);
  await sharp(maskablePng).toFile(maskablePath);
  console.log('✓ maskable-icon-512x512.png');

  // Favicon.ico (16, 32, 48) con transparencia y esquinas redondeadas
  const icoBuffers = await Promise.all(
    ICO_SIZES.map(async (s) => {
      let buf = await resizeSquare(s).png().toBuffer();
      return applyRoundedCorners(buf, s);
    })
  );
  const sharpInstances = icoBuffers.map((buf) => sharp(buf));
  await sharpsToIco(sharpInstances, join(PUBLIC, 'favicon.ico'));
  console.log('✓ favicon.ico');

  // Favicon.svg: SVG con PNG 64 embebido en base64 (autocontenido)
  const pwa64Buffer = await readFile(join(PUBLIC, 'pwa-64x64.png'));
  const pwa64Base64 = pwa64Buffer.toString('base64');
  const faviconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="64" height="64" viewBox="0 0 64 64">
  <image href="data:image/png;base64,${pwa64Base64}" width="64" height="64"/>
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
      let maskablePngM = await resizeSquareCover(512).png().toBuffer();
      maskablePngM = await applyRoundedCorners(maskablePngM, 512);
      await sharp(maskablePngM).toFile(out);
    } else {
      let pngBuf = await resizeSquare(s).png().toBuffer();
      pngBuf = await applyRoundedCorners(pngBuf, s);
      await sharp(pngBuf).toFile(out);
    }
    console.log('✓ icons/' + name);
  }

  // SVG en icons/: imagen PNG embebida en base64 (autocontenidos, se ven en cualquier ruta)
  const svgSizes = [
    { name: 'icon-192x192.svg', size: 192 },
    { name: 'icon-512x512.svg', size: 512 },
    { name: 'icon-512x512-maskable.svg', size: 512 },
  ];
  for (const { name, size } of svgSizes) {
    const pngName = name.replace('.svg', '.png');
    const pngPath = join(PUBLIC, 'icons', pngName);
    const pngBuf = await readFile(pngPath);
    const b64 = pngBuf.toString('base64');
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <image href="data:image/png;base64,${b64}" width="${size}" height="${size}"/>
</svg>`;
    await writeFile(join(PUBLIC, 'icons', name), svg.trim());
    console.log('✓ icons/' + name);
  }

  console.log('\nIconos generados desde', SRC);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
