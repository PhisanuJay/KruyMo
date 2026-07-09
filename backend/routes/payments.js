import { Router } from 'express';
import { readJSON, findById, addItem, updateById } from '../utils/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { generateId, logActivity } from '../utils/helpers.js';

const router = Router();

router.get('/', authenticate, (req, res) => {
  let payments = readJSON('payments.json');
  if (req.user.role === 'customer') {
    const bookings = readJSON('bookings.json').filter((b) => b.userId === req.user.id);
    const bookingIds = bookings.map((b) => b.id);
    payments = payments.filter((p) => bookingIds.includes(p.bookingId));
  }
  res.json(payments);
});

router.get('/booking/:bookingId', authenticate, (req, res) => {
  const payment = readJSON('payments.json').find((p) => p.bookingId === req.params.bookingId);
  if (!payment) return res.status(404).json({ error: 'ไม่พบข้อมูลการชำระเงิน' });
  res.json(payment);
});

router.post('/:bookingId/slip', authenticate, (req, res) => {
  const { slipImage } = req.body;
  const booking = findById('bookings.json', req.params.bookingId);
  if (!booking) return res.status(404).json({ error: 'ไม่พบการจอง' });
  if (booking.userId !== req.user.id) return res.status(403).json({ error: 'ไม่มีสิทธิ์' });

  const existing = readJSON('payments.json').find((p) => p.bookingId === req.params.bookingId);
  if (existing) {
    const updated = updateById('payments.json', existing.id, {
      slipImage,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    });
    return res.json(updated);
  }

  const payment = {
    id: generateId(),
    bookingId: req.params.bookingId,
    slipImage,
    status: 'pending',
    submittedAt: new Date().toISOString(),
    verifiedAt: null,
    verifiedBy: null,
  };
  addItem('payments.json', payment);
  updateById('bookings.json', req.params.bookingId, { status: 'payment_pending' });
  logActivity('upload_slip', `อัปโหลดสลิป การจอง ${req.params.bookingId}`, req.user.id);
  res.status(201).json(payment);
});

router.patch('/:id/verify', authenticate, authorize('staff', 'admin'), (req, res) => {
  const { status } = req.body;
  const payment = findById('payments.json', req.params.id);
  if (!payment) return res.status(404).json({ error: 'ไม่พบข้อมูลการชำระเงิน' });

  const updated = updateById('payments.json', req.params.id, {
    status,
    verifiedAt: new Date().toISOString(),
    verifiedBy: req.user.id,
  });

  if (status === 'verified') {
    updateById('bookings.json', payment.bookingId, { status: 'payment_verified' });
    const booking = findById('bookings.json', payment.bookingId);
    if (booking) {
      addItem('notifications.json', {
        id: generateId(),
        userId: booking.userId,
        type: 'payment_verified',
        message: 'การชำระเงินได้รับการยืนยันแล้ว',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }
  }

  logActivity('verify_payment', `ตรวจสอบการชำระเงิน ${payment.id} -> ${status}`, req.user.id);
  res.json(updated);
});

export default router;
