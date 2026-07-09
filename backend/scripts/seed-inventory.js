import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');

const sizes = Array.from({ length: 13 }, (_, i) => `size-${38 + i}`);
const degrees = ['bachelor', 'master', 'doctoral'];
const costumes = [
  'costume-001',
  'costume-002',
  'costume-003',
  'costume-004',
  'costume-005',
  'costume-006',
];

const inventory = [];
for (const costumeId of costumes) {
  for (const sizeId of sizes) {
    for (const degreeLevel of degrees) {
      const n = Number(sizeId.replace('size-', ''));
      const quantity = n <= 40 || n >= 49 ? 1 : 2;
      inventory.push({ costumeId, sizeId, degreeLevel, quantity });
    }
  }
}

fs.writeFileSync(path.join(dataDir, 'inventory.json'), JSON.stringify(inventory, null, 2));

const costumesPath = path.join(dataDir, 'costumes.json');
const costumesData = JSON.parse(fs.readFileSync(costumesPath, 'utf8'));
for (const costume of costumesData) {
  costume.stock = inventory
    .filter((i) => i.costumeId === costume.id && i.degreeLevel === 'bachelor')
    .reduce((sum, i) => sum + i.quantity, 0);
}
fs.writeFileSync(costumesPath, JSON.stringify(costumesData, null, 2));

console.log(`Seeded ${inventory.length} inventory rows`);
