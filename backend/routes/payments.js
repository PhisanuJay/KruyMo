import { Router } from 'express';
import { readJSON, findById, addItem, updateById } from '../utils/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  generateId,
  logActivity,
  createNotification,
  notifyStaff,
  normalizeRefundAccount,
  validateRefundAccount,
} from '../utils/helpers.js';

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
  const { slipImage, refundAccount } = req.body;
  if (!slipImage || typeof slipImage !== 'string' || !slipImage.trim()) {
    return res.status(400).json({ error: 'กรุณาอัปโหลดสลิปการโอนก่อน' });
  }
  const accountError = validateRefundAccount(refundAccount);
  if (accountError) return res.status(400).json({ error: accountError });
  const normalizedRefund = normalizeRefundAccount(refundAccount);

  const booking = findById('bookings.json', req.params.bookingId);
  if (!booking) return res.status(404).json({ error: 'ไม่พบการจอง' });
  if (booking.userId !== req.user.id) return res.status(403).json({ error: 'ไม่มีสิทธิ์' });
  if (booking.status !== 'payment_pending') {
    return res.status(400).json({ error: 'สถานะนี้ไม่สามารถส่งสลิปได้' });
  }

  const saveRefundOnBookingAndUser = () => {
    updateById('bookings.json', req.params.bookingId, {
      status: 'pending',
      refundAccount: normalizedRefund,
    });
    if (booking.userId) {
      updateById('users.json', booking.userId, { refundAccount: normalizedRefund });
    }
  };

  const existing = readJSON('payments.json').find((p) => p.bookingId === req.params.bookingId);
  if (existing) {
    if (existing.status === 'pending') {
      return res.status(400).json({ error: 'สลิปอยู่ระหว่างรอตรวจสอบแล้ว ไม่สามารถส่งซ้ำได้' });
    }
    if (existing.status === 'verified') {
      return res.status(400).json({ error: 'การชำระเงินได้รับการยืนยันแล้ว' });
    }
    const updated = updateById('payments.json', existing.id, {
      slipImage: slipImage.trim(),
      status: 'pending',
      submittedAt: new Date().toISOString(),
      verifiedAt: null,
      verifiedBy: null,
      rejectReason: null,
    });
    // เก็บสลิปที่เคยถูกปฏิเสธไว้ตรวจย้อนหลัง
    if (existing.status === 'rejected' && existing.slipImage) {
      updateById('bookings.json', req.params.bookingId, {
        rejectedSlipImage: existing.slipImage,
        slipRejectReason: existing.rejectReason || booking.slipRejectReason || null,
      });
    }
    saveRefundOnBookingAndUser();
    createNotification(
      req.user.id,
      'payment_submitted',
      'ได้รับสลิปของคุณแล้ว การจองอยู่ระหว่างรออนุมัติ'
    );
    notifyStaff('slip_pending', `มีสลิปใหม่รอตรวจ — เลขจอง ${req.params.bookingId.slice(0, 8)}…`);
    logActivity('upload_slip', `อัปโหลดสลิปใหม่ การจอง ${req.params.bookingId}`, req.user.id);
    return res.json(updated);
  }

  const payment = {
    id: generateId(),
    bookingId: req.params.bookingId,
    slipImage: slipImage.trim(),
    status: 'pending',
    submittedAt: new Date().toISOString(),
    verifiedAt: null,
    verifiedBy: null,
  };
  addItem('payments.json', payment);
  saveRefundOnBookingAndUser();
  createNotification(
    req.user.id,
    'payment_submitted',
    'ได้รับสลิปของคุณแล้ว การจองอยู่ระหว่างรออนุมัติ'
  );
  notifyStaff('slip_pending', `มีสลิปใหม่รอตรวจ — เลขจอง ${req.params.bookingId.slice(0, 8)}…`);
  logActivity('upload_slip', `อัปโหลดสลิป การจอง ${req.params.bookingId}`, req.user.id);
  res.status(201).json(payment);
});

router.patch('/:id/verify', authenticate, authorize('staff', 'admin'), (req, res) => {
  const { status, reason } = req.body;
  if (!['verified', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'สถานะไม่ถูกต้อง' });
  }

  const payment = findById('payments.json', req.params.id);
  if (!payment) return res.status(404).json({ error: 'ไม่พบข้อมูลการชำระเงิน' });
  if (!payment.slipImage) {
    return res.status(400).json({ error: 'ยังไม่มีสลิปการโอน — ไม่สามารถตรวจสอบได้' });
  }
  if (payment.status !== 'pending') {
    return res.status(400).json({ error: 'สลิปนี้ไม่ได้อยู่ในสถานะรอตรวจสอบ' });
  }

  if (status === 'rejected') {
    const rejectReason = String(reason || '').trim();
    if (!rejectReason) {
      return res.status(400).json({ error: 'กรุณาระบุเหตุผลในการปฏิเสธสลิป' });
    }
  }

  const rejectReason = status === 'rejected' ? String(reason || '').trim() : null;

  const updated = updateById('payments.json', req.params.id, {
    status,
    verifiedAt: new Date().toISOString(),
    verifiedBy: req.user.id,
    rejectReason,
  });

  const booking = findById('bookings.json', payment.bookingId);
  if (status === 'verified') {
    // ยืนยันสลิปแล้ว → เข้าคิวจัดเตรียมชุดทันที
    updateById('bookings.json', payment.bookingId, { status: 'preparing' });
    if (booking) {
      createNotification(
        booking.userId,
        'payment_verified',
        'การชำระเงินได้รับการยืนยันแล้ว ร้านกำลังจัดเตรียมชุดของคุณ'
      );
      notifyStaff('preparing', `ยืนยันสลิปแล้ว — จัดเตรียมชุด เลขจอง ${payment.bookingId.slice(0, 8)}…`);
    }
  } else if (status === 'rejected') {
    updateById('bookings.json', payment.bookingId, {
      status: 'payment_pending',
      slipRejectReason: rejectReason,
      rejectedSlipImage: payment.slipImage,
    });
    if (booking) {
      createNotification(
        booking.userId,
        'payment_rejected',
        `สลิปการชำระเงินไม่ผ่าน: ${rejectReason} — กรุณาอัปโหลดสลิปใหม่อีกครั้ง`,
        { reason: rejectReason },
      );
    }
  }

  logActivity('verify_payment', `ตรวจสอบการชำระเงิน ${payment.id} -> ${status}${rejectReason ? ` (${rejectReason})` : ''}`, req.user.id);
  res.json(updated);
});

export default router;
