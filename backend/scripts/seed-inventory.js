/**
 * ตั้งสต็อกทุกคณะ: ทุกไซส์ × ทุกชั้นปี (ตรี/โท/เอก) = อย่างละ 10 ชุด
 * รัน: node backend/scripts/seed-inventory.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');

const QTY = 10;
const sizes = Array.from({ length: 13 }, (_, i) => `size-${38 + i}`);
const degrees = ['bachelor', 'master', 'doctoral'];
const costumesPath = path.join(dataDir, 'costumes.json');
const costumesData = JSON.parse(fs.readFileSync(costumesPath, 'utf8'));

const inventory = [];
for (const costume of costumesData) {
  for (const degreeLevel of degrees) {
    for (const sizeId of sizes) {
      inventory.push({
        costumeId: costume.id,
        sizeId,
        degreeLevel,
        quantity: QTY,
      });
    }
  }
}

fs.writeFileSync(path.join(dataDir, 'inventory.json'), `${JSON.stringify(inventory, null, 2)}\n`);

for (const costume of costumesData) {
  costume.stock = inventory
    .filter((i) => i.costumeId === costume.id)
    .reduce((sum, i) => sum + i.quantity, 0);
  delete costume.degreeLevel;
  delete costume.sizeId;
}
fs.writeFileSync(costumesPath, `${JSON.stringify(costumesData, null, 2)}\n`);

const perDegree = sizes.length * QTY;
console.log(`✅ Seeded ${inventory.length} rows (${costumesData.length} คณะ × ${degrees.length} ชั้นปี × ${sizes.length} ไซส์)`);
console.log(`   ไซส์ละ ${QTY} · ต่อชั้นปี ${perDegree} ชุด · รวม ${perDegree * 3} ชุด/คณะ`);
