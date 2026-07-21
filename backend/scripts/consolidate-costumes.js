/**
 * รวมชุดครุยให้คณะละ 1 รายการ (เก็บแถว bachelor เป็นตัวแทน)
 * - ย้าย booking / cart / favorites ไปที่ costume ที่เก็บไว้
 * - ลบ inventory ของชุดที่ลบ (ชุดตัวแทนมี inventory ครบ 3 ระดับอยู่แล้ว)
 * - ปรับชื่อชุดให้ไม่ระบุระดับชั้น
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');

const read = (f) => JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf8'));
const write = (f, data) => fs.writeFileSync(path.join(dataDir, f), `${JSON.stringify(data, null, 2)}\n`);

const DEGREE_RANK = { bachelor: 0, master: 1, doctoral: 2 };
const costumes = read('costumes.json');
const faculties = read('faculties.json');
const universities = Object.fromEntries(read('universities.json').map((u) => [u.id, u]));
const facById = Object.fromEntries(faculties.map((f) => [f.id, f]));

const keepByFaculty = new Map();
for (const c of costumes) {
  const key = `${c.universityId}:${c.facultyId}`;
  const prev = keepByFaculty.get(key);
  const rank = DEGREE_RANK[c.degreeLevel] ?? 9;
  const prevRank = prev ? (DEGREE_RANK[prev.degreeLevel] ?? 9) : 99;
  if (!prev || rank < prevRank) keepByFaculty.set(key, c);
}

const keepIds = new Set([...keepByFaculty.values()].map((c) => c.id));
const remap = {};
for (const c of costumes) {
  if (keepIds.has(c.id)) continue;
  const keep = keepByFaculty.get(`${c.universityId}:${c.facultyId}`);
  if (keep) remap[c.id] = keep.id;
}

const catalogName = (c) => {
  const fac = facById[c.facultyId];
  const uni = universities[c.universityId];
  const uniShort = uni?.shortName || uni?.name || 'ศรีปทุม';
  const facName = fac?.name || '';
  return `ชุดครุย${uniShort} ${facName}`.trim();
};

const nextCostumes = [...keepByFaculty.values()].map((c) => {
  const fac = facById[c.facultyId];
  const sash = fac?.sashColor;
  const image = sash
    ? `/images/gowns/gown-bachelor-${sash}.jpg`
    : (c.images?.[0] || null);
  return {
    ...c,
    name: catalogName(c),
    degreeLevel: undefined,
    sizeId: undefined,
    description: `ชุดครุยบัณฑิต มหาวิทยาลัยศรีปทุม ${fac?.name || ''} ${fac?.sashLabel || ''} — เลือกระดับตรี/โท/เอกตอนจอง`.replace(/\s+/g, ' ').trim(),
    images: image ? [image] : (c.images || []),
  };
});

// strip undefined
for (const c of nextCostumes) {
  delete c.degreeLevel;
  delete c.sizeId;
}

let inventory = read('inventory.json');
inventory = inventory.filter((row) => keepIds.has(row.costumeId));

const bookings = read('bookings.json').map((b) => (
  remap[b.costumeId] ? { ...b, costumeId: remap[b.costumeId] } : b
));

const cartPath = path.join(dataDir, 'cart.json');
let cart = fs.existsSync(cartPath) ? read('cart.json') : [];
if (Array.isArray(cart)) {
  cart = cart.map((item) => (remap[item.costumeId] ? { ...item, costumeId: remap[item.costumeId] } : item));
}

const favPath = path.join(dataDir, 'favorites.json');
let favorites = fs.existsSync(favPath) ? read('favorites.json') : [];
if (Array.isArray(favorites)) {
  favorites = favorites
    .map((f) => (remap[f.costumeId] ? { ...f, costumeId: remap[f.costumeId] } : f))
    .filter((f, i, arr) => arr.findIndex((x) => x.userId === f.userId && x.costumeId === f.costumeId) === i);
}

for (const c of nextCostumes) {
  c.stock = inventory
    .filter((i) => i.costumeId === c.id)
    .reduce((s, i) => s + (i.quantity || 0), 0);
}

write('costumes.json', nextCostumes);
write('inventory.json', inventory);
write('bookings.json', bookings);
if (fs.existsSync(cartPath)) write('cart.json', cart);
if (fs.existsSync(favPath)) write('favorites.json', favorites);

console.log(`Kept ${nextCostumes.length} costumes (1 per faculty)`);
console.log(`Remapped ${Object.keys(remap).length} costume ids:`, remap);
console.log(`Inventory rows: ${inventory.length}`);
