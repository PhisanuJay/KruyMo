import { Router } from 'express';
import { readJSON, writeJSON, findById, addItem, updateById, deleteById } from '../utils/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  generateId,
  logActivity,
  countBookedUnits,
  ACTIVE_BOOKING_STATUSES,
} from '../utils/helpers.js';

const router = Router();

const DEGREES = [
  { value: 'bachelor', label: 'ปริญญาตรี' },
  { value: 'master', label: 'ปริญญาโท' },
  { value: 'doctoral', label: 'ปริญญาเอก' },
];

const enrichCostume = (costume) => {
  const universities = readJSON('universities.json');
  const faculties = readJSON('faculties.json');
  const inventory = readJSON('inventory.json', []);
  const bookings = readJSON('bookings.json', []);
  const rows = inventory.filter((i) => i.costumeId === costume.id);
  const inventoryQty = rows.reduce((s, i) => s + (i.quantity || 0), 0);
  const bookedQty = bookings.filter((b) => (
    b.costumeId === costume.id && ACTIVE_BOOKING_STATUSES.includes(b.status)
  )).length;
  return {
    ...costume,
    stock: inventoryQty,
    inventoryQty,
    bookedQty,
    availableQty: Math.max(0, inventoryQty - bookedQty),
    university: universities.find((u) => u.id === costume.universityId),
    faculty: faculties.find((f) => f.id === costume.facultyId),
  };
};

const seedInventoryForCostume = (costumeId, defaultQty = 0) => {
  const sizes = readJSON('sizes.json');
  const inventory = readJSON('inventory.json', []);
  const existing = new Set(
    inventory
      .filter((i) => i.costumeId === costumeId)
      .map((i) => `${i.sizeId}:${i.degreeLevel}`),
  );
  for (const degree of DEGREES) {
    for (const size of sizes) {
      const key = `${size.id}:${degree.value}`;
      if (existing.has(key)) continue;
      inventory.push({
        costumeId,
        sizeId: size.id,
        degreeLevel: degree.value,
        quantity: defaultQty,
      });
    }
  }
  writeJSON('inventory.json', inventory);
};

const buildInventoryMatrix = (costumeId) => {
  const sizes = readJSON('sizes.json');
  const inventory = readJSON('inventory.json', []);
  const bookings = readJSON('bookings.json', []);
  const cells = [];
  let total = 0;
  let booked = 0;

  for (const size of sizes) {
    for (const degree of DEGREES) {
      const inv = inventory.find((i) => (
        i.costumeId === costumeId
        && i.sizeId === size.id
        && i.degreeLevel === degree.value
      ));
      const quantity = inv?.quantity || 0;
      const bookedCount = bookings.filter((b) => (
        b.costumeId === costumeId
        && b.sizeId === size.id
        && b.degreeLevel === degree.value
        && ACTIVE_BOOKING_STATUSES.includes(b.status)
      )).length;
      const available = Math.max(0, quantity - bookedCount);
      total += quantity;
      booked += bookedCount;
      cells.push({
        sizeId: size.id,
        sizeLabel: size.label,
        heightMin: size.heightMin,
        heightMax: size.heightMax,
        degreeLevel: degree.value,
        degreeLabel: degree.label,
        quantity,
        booked: bookedCount,
        available,
      });
    }
  }

  return {
    costumeId,
    degrees: DEGREES,
    sizes: sizes.map((s) => ({
      id: s.id,
      label: s.label,
      heightMin: s.heightMin,
      heightMax: s.heightMax,
    })),
    cells,
    totals: {
      total,
      booked,
      available: Math.max(0, total - booked),
    },
  };
};

router.get('/', (req, res) => {
  let costumes = readJSON('costumes.json');
  const { universityId, facultyId } = req.query;
  if (universityId) costumes = costumes.filter((c) => c.universityId === universityId);
  if (facultyId) costumes = costumes.filter((c) => c.facultyId === facultyId);
  res.json(costumes.map(enrichCostume));
});

router.get('/:id/availability', (req, res) => {
  const { startDate, endDate, degreeLevel } = req.query;
  const costume = findById('costumes.json', req.params.id);
  if (!costume) return res.status(404).json({ error: 'ไม่พบชุดครุย' });
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'กรุณาเลือกวันเริ่มเช่าและวันคืนชุด' });
  }
  if (new Date(endDate) < new Date(startDate)) {
    return res.status(400).json({ error: 'วันคืนชุดต้องไม่ก่อนวันเริ่มเช่า' });
  }

  const degree = degreeLevel;
  if (!degree || !['bachelor', 'master', 'doctoral'].includes(degree)) {
    return res.status(400).json({ error: 'กรุณาเลือกระดับปริญญา' });
  }

  const inventory = readJSON('inventory.json', []);
  const bookings = readJSON('bookings.json', []);
  const sizes = readJSON('sizes.json');

  const options = sizes.map((size) => {
    const inv = inventory.find((i) => (
      i.costumeId === costume.id
      && i.sizeId === size.id
      && i.degreeLevel === degree
    ));
    const total = inv?.quantity || 0;
    const bookedUnits = countBookedUnits(bookings, {
      costumeId: costume.id,
      sizeId: size.id,
      degreeLevel: degree,
      startDate,
      endDate,
    });
    const available = Math.max(0, total - bookedUnits);
    return {
      sizeId: size.id,
      label: size.label,
      description: size.description,
      heightMin: size.heightMin,
      heightMax: size.heightMax,
      total,
      booked: bookedUnits,
      available,
      inStock: available > 0,
    };
  });

  res.json({
    costumeId: costume.id,
    startDate,
    endDate,
    degreeLevel: degree,
    options,
    availableCount: options.filter((o) => o.inStock).length,
  });
});

router.get('/:id/inventory', authenticate, authorize('admin'), (req, res) => {
  const costume = findById('costumes.json', req.params.id);
  if (!costume) return res.status(404).json({ error: 'ไม่พบชุดครุย' });
  seedInventoryForCostume(costume.id, 0);
  res.json(buildInventoryMatrix(costume.id));
});

router.put('/:id/inventory', authenticate, authorize('admin'), (req, res) => {
  const costume = findById('costumes.json', req.params.id);
  if (!costume) return res.status(404).json({ error: 'ไม่พบชุดครุย' });

  const items = Array.isArray(req.body?.items) ? req.body.items : null;
  if (!items) return res.status(400).json({ error: 'กรุณาส่งรายการสต็อก' });

  const sizes = new Set(readJSON('sizes.json').map((s) => s.id));
  const degreeSet = new Set(DEGREES.map((d) => d.value));
  const inventory = readJSON('inventory.json', []);
  const other = inventory.filter((i) => i.costumeId !== costume.id);
  const nextRows = [];

  for (const item of items) {
    const sizeId = item.sizeId;
    const degreeLevel = item.degreeLevel;
    if (!sizes.has(sizeId) || !degreeSet.has(degreeLevel)) {
      return res.status(400).json({ error: 'ไซส์หรือระดับปริญญาไม่ถูกต้อง' });
    }
    const quantity = Math.max(0, Math.min(999, Number(item.quantity) || 0));
    nextRows.push({ costumeId: costume.id, sizeId, degreeLevel, quantity });
  }

  // ensure full matrix exists
  for (const sizeId of sizes) {
    for (const degree of DEGREES) {
      if (!nextRows.find((r) => r.sizeId === sizeId && r.degreeLevel === degree.value)) {
        const prev = inventory.find((i) => (
          i.costumeId === costume.id && i.sizeId === sizeId && i.degreeLevel === degree.value
        ));
        nextRows.push({
          costumeId: costume.id,
          sizeId,
          degreeLevel: degree.value,
          quantity: prev?.quantity || 0,
        });
      }
    }
  }

  writeJSON('inventory.json', [...other, ...nextRows]);
  const stock = nextRows.reduce((s, i) => s + (i.quantity || 0), 0);
  updateById('costumes.json', costume.id, { stock });
  logActivity('update_inventory', `อัปเดตสต็อกชุด ${costume.name}`, req.user.id);
  res.json(buildInventoryMatrix(costume.id));
});

router.get('/:id', (req, res) => {
  const costume = findById('costumes.json', req.params.id);
  if (!costume) return res.status(404).json({ error: 'ไม่พบชุดครุย' });
  res.json(enrichCostume(costume));
});

router.post('/', authenticate, authorize('admin'), (req, res) => {
  const { name, universityId, facultyId, pricePerDay, deposit, description, images } = req.body;
  if (!name?.trim() || !universityId || !facultyId) {
    return res.status(400).json({ error: 'กรุณากรอกชื่อ มหาวิทยาลัย และคณะ' });
  }
  const existing = readJSON('costumes.json').find((c) => (
    c.universityId === universityId && c.facultyId === facultyId
  ));
  if (existing) {
    return res.status(400).json({ error: 'คณะนี้มีชุดครุยในระบบแล้ว (คณะละ 1 ชุด)' });
  }

  const costume = {
    id: generateId(),
    name: name.trim(),
    universityId,
    facultyId,
    pricePerDay: Number(pricePerDay) || 0,
    deposit: Number(deposit) || 0,
    description: description || '',
    images: images || [],
    stock: 0,
    createdAt: new Date().toISOString(),
  };
  addItem('costumes.json', costume);
  seedInventoryForCostume(costume.id, 0);
  logActivity('create_costume', `เพิ่มชุดครุย ${costume.name}`, req.user.id);
  res.status(201).json(enrichCostume(costume));
});

router.put('/:id', authenticate, authorize('admin'), (req, res) => {
  const current = findById('costumes.json', req.params.id);
  if (!current) return res.status(404).json({ error: 'ไม่พบชุดครุย' });

  const {
    stock, inventoryQty, bookedQty, availableQty, university, faculty, size, qty,
    ...rest
  } = req.body;

  if (rest.universityId && rest.facultyId) {
    const clash = readJSON('costumes.json').find((c) => (
      c.id !== current.id
      && c.universityId === rest.universityId
      && c.facultyId === rest.facultyId
    ));
    if (clash) {
      return res.status(400).json({ error: 'คณะนี้มีชุดครุยในระบบแล้ว (คณะละ 1 ชุด)' });
    }
  }

  const updated = updateById('costumes.json', req.params.id, rest);
  logActivity('update_costume', `แก้ไขชุดครุย ${updated.name}`, req.user.id);
  res.json(enrichCostume(updated));
});

router.delete('/:id', authenticate, authorize('admin'), (req, res) => {
  const costume = findById('costumes.json', req.params.id);
  if (!costume) return res.status(404).json({ error: 'ไม่พบชุดครุย' });
  deleteById('costumes.json', req.params.id);
  const inventory = readJSON('inventory.json', []).filter((i) => i.costumeId !== costume.id);
  writeJSON('inventory.json', inventory);
  logActivity('delete_costume', `ลบชุดครุย ${costume.name}`, req.user.id);
  res.json({ message: 'ลบสำเร็จ' });
});

export default router;
