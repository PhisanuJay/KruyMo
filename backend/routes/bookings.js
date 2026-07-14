import { Router } from 'express';
import { readJSON, findById, addItem, updateById, deleteById } from '../utils/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { generateId, calculateRentalPrice, logActivity, countBookedUnits } from '../utils/helpers.js';

const router = Router();

const DEGREE_LABELS = {
  bachelor: 'ปริญญาตรี',
  master: 'ปริญญาโท',
  doctoral: 'ปริญญาเอก',
};

const enrichBooking = (booking) => {
  const costumes = readJSON('costumes.json');
  const users = readJSON('users.json');
  const sizes = readJSON('sizes.json');
  const universities = readJSON('universities.json');
  const faculties = readJSON('faculties.json');
  const costume = costumes.find((c) => c.id === booking.costumeId);
  const user = users.find((u) => u.id === booking.userId);
  const size = sizes.find((s) => s.id === booking.sizeId);
  const university = universities.find((u) => u.id === costume?.universityId);
  const faculty = faculties.find((f) => f.id === costume?.facultyId);
  return {
    ...booking,
    costume: costume ? { ...costume, university, faculty } : null,
    size,
    degreeLabel: DEGREE_LABELS[booking.degreeLevel] || booking.degreeLevel,
    user: user ? { id: user.id, name: user.name, email: user.email, phone: user.phone } : null,
  };
};

const createNotification = (userId, type, message) => {
  addItem('notifications.json', {
    id: generateId(),
    userId,
    type,
    message,
    isRead: false,
    createdAt: new Date().toISOString(),
  });
};

router.get('/', authenticate, (req, res) => {
  let bookings = readJSON('bookings.json');
  if (req.user.role === 'customer') {
    bookings = bookings.filter((b) => b.userId === req.user.id);
  }
  const { status } = req.query;
  if (status) bookings = bookings.filter((b) => b.status === status);
  res.json(bookings.map(enrichBooking));
});

router.get('/:id', authenticate, (req, res) => {
  const booking = findById('bookings.json', req.params.id);
  if (!booking) return res.status(404).json({ error: 'ไม่พบการจอง' });
  if (req.user.role === 'customer' && booking.userId !== req.user.id) {
    return res.status(403).json({ error: 'ไม่มีสิทธิ์' });
  }
  res.json(enrichBooking(booking));
});

router.post('/', authenticate, (req, res) => {
  const { costumeId, startDate, endDate, sizeId, degreeLevel } = req.body;
  const costume = findById('costumes.json', costumeId);
  if (!costume) return res.status(404).json({ error: 'ไม่พบชุดครุย' });
  if (!startDate || !endDate) return res.status(400).json({ error: 'กรุณาเลือกวันจอง' });
  if (new Date(endDate) < new Date(startDate)) {
    return res.status(400).json({ error: 'วันคืนชุดต้องไม่ก่อนวันรับชุด' });
  }
  if (!sizeId) return res.status(400).json({ error: 'กรุณาเลือกไซส์' });
  if (!degreeLevel) return res.status(400).json({ error: 'กรุณาเลือกระดับปริญญา' });

  const size = findById('sizes.json', sizeId);
  if (!size) return res.status(400).json({ error: 'ไซส์ไม่ถูกต้อง' });
  if (!['bachelor', 'master', 'doctoral'].includes(degreeLevel)) {
    return res.status(400).json({ error: 'ระดับปริญญาไม่ถูกต้อง' });
  }

  const inventory = readJSON('inventory.json', []);
  const inv = inventory.find((i) => (
    i.costumeId === costumeId
    && i.sizeId === sizeId
    && i.degreeLevel === degreeLevel
  ));
  const totalQty = inv?.quantity || 0;
  const bookings = readJSON('bookings.json', []);
  const booked = countBookedUnits(bookings, {
    costumeId,
    sizeId,
    degreeLevel,
    startDate,
    endDate,
  });
  const available = totalQty - booked;
  if (available <= 0) {
    return res.status(400).json({
      error: `ไซส์ ${size.label} ระดับ${DEGREE_LABELS[degreeLevel]} ในช่วงวันนี้ถูกจองครบแล้ว`,
    });
  }

  const pricing = calculateRentalPrice(costume, startDate, endDate);
  const booking = {
    id: generateId(),
    userId: req.user.id,
    costumeId,
    sizeId,
    degreeLevel,
    startDate,
    endDate,
    status: 'payment_pending',
    rentalPrice: pricing.rentalPrice,
    deposit: pricing.deposit,
    totalPrice: pricing.total,
    days: pricing.days,
    rejectReason: null,
    prepChecklist: { gown: false, cap: false, sash: false, accessories: false },
    pickupConfirmedAt: null,
    returnImages: [],
    penaltyAmount: 0,
    refundAmount: null,
    createdAt: new Date().toISOString(),
  };

  addItem('bookings.json', booking);
  createNotification(req.user.id, 'booking_success', 'การจองของคุณสำเร็จแล้ว กรุณาชำระเงินภายใน 24 ชั่วโมง');
  logActivity('create_booking', `สร้างการจอง ${booking.id}`, req.user.id);
  res.status(201).json(enrichBooking(booking));
});

router.patch('/:id/status', authenticate, authorize('staff', 'admin'), (req, res) => {
  const { status, rejectReason } = req.body;
  const booking = findById('bookings.json', req.params.id);
  if (!booking) return res.status(404).json({ error: 'ไม่พบการจอง' });

  const updates = { status };
  if (rejectReason) updates.rejectReason = rejectReason;

  if (status === 'approved') {
    createNotification(booking.userId, 'booking_approved', 'การจองของคุณได้รับการอนุมัติแล้ว');
  } else if (status === 'rejected') {
    createNotification(booking.userId, 'booking_rejected', `การจองของคุณถูกปฏิเสธ: ${rejectReason || ''}`);
  } else if (status === 'ready_for_pickup') {
    createNotification(booking.userId, 'ready_for_pickup', 'ชุดครุยของคุณพร้อมรับแล้ว');
  }

  const updated = updateById('bookings.json', req.params.id, updates);
  logActivity('update_booking_status', `อัปเดตสถานะ ${booking.id} เป็น ${status}`, req.user.id);
  res.json(enrichBooking(updated));
});

router.patch('/:id/prep', authenticate, authorize('staff', 'admin'), (req, res) => {
  const { prepChecklist } = req.body;
  const updated = updateById('bookings.json', req.params.id, { prepChecklist });
  if (!updated) return res.status(404).json({ error: 'ไม่พบการจอง' });
  res.json(enrichBooking(updated));
});

router.post('/:id/pickup', authenticate, (req, res) => {
  const booking = findById('bookings.json', req.params.id);
  if (!booking) return res.status(404).json({ error: 'ไม่พบการจอง' });
  const updated = updateById('bookings.json', req.params.id, {
    status: 'picked_up',
    pickupConfirmedAt: new Date().toISOString(),
  });
  logActivity('pickup', `รับชุด การจอง ${booking.id}`, req.user.id);
  res.json(enrichBooking(updated));
});

router.post('/:id/return', authenticate, authorize('staff', 'admin', 'customer'), (req, res) => {
  const { returnImages, penaltyAmount } = req.body;
  const booking = findById('bookings.json', req.params.id);
  if (!booking) return res.status(404).json({ error: 'ไม่พบการจอง' });

  const updated = updateById('bookings.json', req.params.id, {
    status: 'returned',
    returnImages: returnImages || [],
    penaltyAmount: penaltyAmount || 0,
    returnedAt: new Date().toISOString(),
  });
  logActivity('return', `คืนชุด การจอง ${booking.id}`, req.user.id);
  res.json(enrichBooking(updated));
});

router.post('/:id/refund', authenticate, authorize('staff', 'admin'), (req, res) => {
  const booking = findById('bookings.json', req.params.id);
  if (!booking) return res.status(404).json({ error: 'ไม่พบการจอง' });
  const refundAmount = Math.max(0, booking.deposit - (booking.penaltyAmount || 0));
  const updated = updateById('bookings.json', req.params.id, {
    status: 'deposit_refunded',
    refundAmount,
    refundedAt: new Date().toISOString(),
  });
  createNotification(booking.userId, 'deposit_refunded', `เงินมัดจำของคุณได้รับการคืนแล้ว จำนวน ${refundAmount} บาท`);
  logActivity('refund', `คืนเงินมัดจำ ${refundAmount} บาท การจอง ${booking.id}`, req.user.id);
  res.json(enrichBooking(updated));
});

router.delete('/:id', authenticate, (req, res) => {
  const booking = findById('bookings.json', req.params.id);
  if (!booking) return res.status(404).json({ error: 'ไม่พบการจอง' });
  if (req.user.role === 'customer' && booking.userId !== req.user.id) {
    return res.status(403).json({ error: 'ไม่มีสิทธิ์' });
  }
  if (!['pending', 'payment_pending'].includes(booking.status)) {
    return res.status(400).json({ error: 'ไม่สามารถยกเลิกการจองในสถานะนี้ได้' });
  }
  updateById('bookings.json', req.params.id, { status: 'cancelled' });
  logActivity('cancel_booking', `ยกเลิกการจอง ${booking.id}`, req.user.id);
  res.json({ message: 'ยกเลิกการจองสำเร็จ' });
});

export default router;
