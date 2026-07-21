/**
 * ตั้งสต็อกทุกคณะ: แต่ละชั้นปี (ตรี/โท/เอก) มีอย่างละ 10 ชุด
 * กระจายตามไซส์ยอดนิยม (กลางช่วงส่วนสูง)
 * รัน: node backend/scripts/seed-inventory.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');

const QTY_PER_DEGREE = 10;
const sizes = Array.from({ length: 13 }, (_, i) => `size-${38 + i}`);
const degrees = ['bachelor', 'master', 'doctoral'];

/** กระจาย 10 ชุดต่อชั้นปีไปไซส์กลาง (40–49) อย่างละ 1 */
const qtyBySize = Object.fromEntries(sizes.map((id) => [id, 0]));
for (let n = 40; n <= 49; n += 1) {
  qtyBySize[`size-${n}`] = 1;
}

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
        quantity: qtyBySize[sizeId] || 0,
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

const sumPerDegree = Object.values(qtyBySize).reduce((a, b) => a + b, 0);
console.log(`✅ Seeded ${inventory.length} rows (${costumesData.length} คณะ × ${degrees.length} ชั้นปี × ${sizes.length} ไซส์)`);
console.log(`   ต่อคณะ: ตรี/โท/เอก อย่างละ ${sumPerDegree} ชุด · รวม ${sumPerDegree * 3} ชุด/คณะ`);
if (sumPerDegree !== QTY_PER_DEGREE) {
  console.warn(`   ⚠ กระจายได้ ${sumPerDegree} ไม่เท่าเป้า ${QTY_PER_DEGREE}`);
}
