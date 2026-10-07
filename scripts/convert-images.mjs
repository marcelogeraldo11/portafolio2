// Convierte los JPG de "fotos portafolio ags bhp/" a WebP.
// Fusiona las 4 partes de la descarga de Drive en un solo árbol lógico y genera:
//   public/images/<ruta-lógica>/<nombre>.webp        (lado mayor máx. 2400 px)
//   public/images/<ruta-lógica>/<nombre>-thumb.webp  (ancho 800 px, para la cuadrícula)
//   src/data/images.json                              (manifiesto que lee la página)
import { readdir, mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const SRC = 'fotos portafolio ags bhp';
const OUT = 'public/images';
const MANIFEST = 'src/data/images.json';
const FULL_MAX = 2400;
const THUMB_WIDTH = 800;

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((e) => {
      const p = path.join(dir, e.name);
      return e.isDirectory() ? walk(p) : p;
    }),
  );
  return files.flat();
}

const slug = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/^\d+\.\s*/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

// "1. Proyectos/Open Aster 26_/Premiación" -> "Open Aster 26"
const cleanName = (s) => s.replace(/^\d+\.\s*/, '').replace(/_+$/, '').trim();

const num = (n) => Number(n.match(/\d+/)?.[0] ?? 0);

const exists = async (p) => !!(await stat(p).catch(() => null));

const jpgs = (await walk(SRC)).filter((f) => /\.jpe?g$/i.test(f));
const images = [];
let converted = 0;

for (const file of jpgs) {
  // Quita "fotos portafolio ags bhp/drive-download-*/" para obtener la ruta lógica.
  const logical = path.relative(SRC, file).split(path.sep).slice(1);
  const [section, group, ...rest] = logical;
  const name = path.basename(file).replace(/\.jpe?g$/i, '');
  const subdirs = rest.slice(0, -1);

  const outDir = path.join(OUT, ...[section, group, ...subdirs].map(slug));
  const full = path.join(outDir, `${slug(name)}.webp`);
  const thumb = path.join(outDir, `${slug(name)}-thumb.webp`);
  await mkdir(outDir, { recursive: true });

  if (!(await exists(full)) || !(await exists(thumb))) {
    const img = sharp(file).rotate();
    await img
      .clone()
      .resize({ width: FULL_MAX, height: FULL_MAX, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(full);
    await img.clone().resize({ width: THUMB_WIDTH, withoutEnlargement: true }).webp({ quality: 75 }).toFile(thumb);
    converted++;
  }

  const meta = await sharp(thumb).metadata();
  images.push({
    order: num(section),
    section: cleanName(section),
    group: cleanName(group),
    category: subdirs.map(cleanName).join(' / '),
    name,
    src: '/' + path.relative('public', full).split(path.sep).join('/'),
    thumb: '/' + path.relative('public', thumb).split(path.sep).join('/'),
    width: meta.width,
    height: meta.height,
  });
}

images.sort(
  (a, b) =>
    a.order - b.order ||
    a.section.localeCompare(b.section) ||
    a.group.localeCompare(b.group) ||
    a.category.localeCompare(b.category) ||
    num(a.name) - num(b.name),
);

await mkdir(path.dirname(MANIFEST), { recursive: true });
await writeFile(MANIFEST, JSON.stringify(images, null, 2));
console.log(`${images.length} imágenes en el manifiesto (${converted} convertidas ahora).`);
