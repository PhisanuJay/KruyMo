import { Router } from 'express';
import { readJSON, findById, addItem, updateById, deleteById } from '../utils/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { generateId, calculateRentalPrice, logActivity, countBookedUnits, createNotification, notifyStaff, canTransitionStatus, formatAddress, normalizeDeliveryAddress, validateDeliveryAddress, EDITABLE_DELIVERY_STATUSES, normalizeRefundAccount, validateRefundAccount, formatRefundAccount } from '../utils/helpers.js';

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
    user: user
      ? {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address || null,
        addressText: formatAddress(user.address) || formatAddress(booking.deliveryAddress),
        refundAccount: user.refundAccount || null,
      }
      : null,
    deliveryAddressText: formatAddress(booking.deliveryAddress) || formatAddress(user?.address),
    refundAccountText: formatRefundAccount(booking.refundAccount),
  };
};

router.get('/', authenticate, (req, res) => {
  let bookings = readJSON('bookings.json');
  if (req.user.role === 'customer') {
    bookings = bookings.filter((b) => b.userId === req.user.id);
  }
  const { status } = req.query;
  if (status) bookings = bookings.filter((b) => b.status === status);
  bookings.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
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
    return res.status(400).json({ error: 'วันคืนชุดต้องไม่ก่อนวันเริ่มเช่า' });
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
  const deliveryAddress = normalizeDeliveryAddress(req.body.deliveryAddress);
  const addrError = validateDeliveryAddress(deliveryAddress);
  if (addrError) {
    return res.status(400).json({ error: addrError });
  }

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
    pickupConfirmedAt: null,
    returnImages: [],
    penaltyAmount: 0,
    penaltyReason: null,
    refundAmount: null,
    refundAccount: null,
    refundSlipImage: null,
    deliveryAddress,
    messenger: null,
    createdAt: new Date().toISOString(),
  };

  addItem('bookings.json', booking);
  // บันทึกที่อยู่ล่าสุดไว้ในโปรไฟล์ สำหรับครั้งถัดไป
  const profileUpdates = {
    address: {
      recipientName: deliveryAddress.recipientName,
      recipientPhone: deliveryAddress.recipientPhone,
      line1: deliveryAddress.line1,
      amphoe: deliveryAddress.amphoe,
      district: deliveryAddress.district,
      province: deliveryAddress.province,
      postalCode: deliveryAddress.postalCode,
    },
  };
  if (deliveryAddress.recipientPhone) profileUpdates.phone = deliveryAddress.recipientPhone;
  updateById('users.json', req.user.id, profileUpdates);
  createNotification(req.user.id, 'booking_success', 'การจองของคุณสำเร็จแล้ว กรุณาชำระเงินภายใน 24 ชั่วโมง');
  const customer = findById('users.json', req.user.id);
  notifyStaff('new_booking', `มีการจองใหม่จาก ${customer?.name || 'ลูกค้า'} — รอชำระเงิน`);
  logActivity('create_booking', `สร้างการจอง ${booking.id}`, req.user.id);
  res.status(201).json(enrichBooking(booking));
});

router.patch('/:id/delivery-address', authenticate, (req, res) => {
  const booking = findById('bookings.json', req.params.id);
  if (!booking) return res.status(404).json({ error: 'ไม่พบการจอง' });
  if (req.user.role === 'customer' && booking.userId !== req.user.id) {
    return res.status(403).json({ error: 'ไม่มีสิทธิ์' });
  }
  if (!EDITABLE_DELIVERY_STATUSES.includes(booking.status)) {
    return res.status(400).json({ error: 'ไม่สามารถแก้ที่อยู่จัดส่งในสถานะนี้ได้ (ชุดออกแมสฯ แล้ว)' });
  }

  const deliveryAddress = normalizeDeliveryAddress(req.body.deliveryAddress);
  const addrError = validateDeliveryAddress(deliveryAddress);
  if (addrError) {
    return res.status(400).json({ error: addrError });
  }

  const updated = updateById('bookings.json', req.params.id, { deliveryAddress });
  const profileUpdates = { address: deliveryAddress };
  if (deliveryAddress.recipientPhone) profileUpdates.phone = deliveryAddress.recipientPhone;
  updateById('users.json', req.user.id, profileUpdates);
  logActivity('update_delivery_address', `แก้ที่อยู่จัดส่ง การจอง ${booking.id}`, req.user.id);
  res.json(enrichBooking(updated));
});

router.patch('/:id/status', authenticate, authorize('staff', 'admin'), (req, res) => {
  const { status, rejectReason, messenger } = req.body;
  const booking = findById('bookings.json', req.params.id);
  if (!booking) return res.status(404).json({ error: 'ไม่พบการจอง' });
  if (!canTransitionStatus(booking.status, status)) {
    return res.status(400).json({
      error: `ไม่สามารถเปลี่ยนจาก "${booking.status}" เป็น "${status}" ได้`,
    });
  }

  // อนุมัติ / จัดเตรียม ได้เฉพาะหลังยืนยันสลิปแล้ว
  if (status === 'approved' || status === 'preparing') {
    const payment = readJSON('payments.json').find((p) => p.bookingId === booking.id);
    if (!payment?.slipImage || payment.status !== 'verified') {
      return res.status(400).json({ error: 'ต้องมีสลิปและยืนยันการชำระเงินก่อนจัดเตรียมชุด' });
    }
  }

  // ยืนยันชำระเงินผ่านสถานะจองโดยตรงไม่อนุญาต — ต้องผ่าน /payments verify
  if (status === 'payment_verified') {
    const payment = readJSON('payments.json').find((p) => p.bookingId === booking.id);
    if (!payment?.slipImage || payment.status !== 'verified') {
      return res.status(400).json({
        error: 'กรุณายืนยันสลิปผ่านระบบตรวจสอบการชำระเงินก่อน',
      });
    }
  }

  const updates = { status };
  if (rejectReason) updates.rejectReason = rejectReason;
  if (messenger && typeof messenger === 'object') {
    updates.messenger = {
      ...(booking.messenger || {}),
      ...messenger,
    };
  }

  if (status === 'approved' || status === 'preparing') {
    createNotification(booking.userId, 'booking_approved', 'การชำระเงินได้รับการยืนยันแล้ว ร้านกำลังจัดเตรียมชุดของคุณ');
  } else if (status === 'rejected') {
    createNotification(
      booking.userId,
      'booking_rejected',
      `การจองของคุณถูกปฏิเสธ: ${rejectReason || ''}`,
      { reason: rejectReason || '-' },
    );
  } else if (status === 'ready_to_ship' || status === 'ready_for_pickup') {
    createNotification(booking.userId, 'ready_to_ship', 'ชุดครุยของคุณพร้อมจัดส่งแมสเซนเจอร์ภายในวันนี้');
  } else if (status === 'out_for_delivery') {
    const who = updates.messenger?.name || booking.messenger?.name || 'แมสเซนเจอร์';
    createNotification(
      booking.userId,
      'out_for_delivery',
      `${who} กำลังนำส่งชุดครุยให้คุณภายในวันนี้`,
      { messenger: who },
    );
  } else if (status === 'delivered') {
    updates.messenger = {
      ...(booking.messenger || {}),
      ...(updates.messenger || {}),
      deliveredAt: new Date().toISOString(),
    };
    createNotification(booking.userId, 'delivered', 'ชุดครุยถูกส่งถึงแล้ว เมื่อใช้งานเสร็จกรุณาส่งคืนด้วยตนเอง');
  }

  const updated = updateById('bookings.json', req.params.id, updates);
  logActivity('update_booking_status', `อัปเดตสถานะ ${booking.id} เป็น ${status}`, req.user.id);
  res.json(enrichBooking(updated));
});

/** ลูกค้าแจ้งว่าส่งคืนชุดเองแล้ว — รอ staff รับเข้าคลัง */
router.post('/:id/submit-return', authenticate, (req, res) => {
  const booking = findById('bookings.json', req.params.id);
  if (!booking) return res.status(404).json({ error: 'ไม่พบการจอง' });
  if (req.user.role === 'customer' && booking.userId !== req.user.id) {
    return res.status(403).json({ error: 'ไม่มีสิทธิ์' });
  }
  if (!['delivered', 'picked_up'].includes(booking.status)) {
    return res.status(400).json({ error: 'สถานะนี้ยังไม่สามารถแจ้งส่งคืนได้' });
  }

  const { returnImages, note, refundAccount } = req.body;
  const refundSource = refundAccount || booking.refundAccount;
  const accountError = validateRefundAccount(refundSource);
  if (accountError) return res.status(400).json({ error: accountError });

  const normalizedRefund = normalizeRefundAccount(refundSource);
  const updated = updateById('bookings.json', req.params.id, {
    status: 'return_submitted',
    returnImages: returnImages || booking.returnImages || [],
    returnNote: note || null,
    refundAccount: normalizedRefund,
    returnSubmittedAt: new Date().toISOString(),
  });
  // บันทึกบัญชีรับเงินคืนไว้ในโปรไฟล์ลูกค้าด้วย เพื่อใช้ครั้งถัดไป
  if (booking.userId && normalizedRefund) {
    updateById('users.json', booking.userId, { refundAccount: normalizedRefund });
  }
  createNotification(
    booking.userId,
    'return_submitted',
    'เราได้รับการแจ้งส่งคืนชุดแล้ว รอพนักงานตรวจรับเข้าคลัง'
  );
  notifyStaff('return_submitted', `ลูกค้าแจ้งส่งคืนแล้ว — เลขจอง ${booking.id.slice(0, 8)}…`);
  logActivity('submit_return', `ลูกค้าแจ้งส่งคืน การจอง ${booking.id}`, req.user.id);
  res.json(enrichBooking(updated));
});

router.post('/:id/pickup', authenticate, (req, res) => {
  const booking = findById('bookings.json', req.params.id);
  if (!booking) return res.status(404).json({ error: 'ไม่พบการจอง' });
  if (!canTransitionStatus(booking.status, 'picked_up') && !canTransitionStatus(booking.status, 'delivered')) {
    return res.status(400).json({ error: 'สถานะนี้ยังยืนยันรับของไม่ได้' });
  }
  const nextStatus = booking.status === 'out_for_delivery' ? 'delivered' : 'picked_up';
  if (!canTransitionStatus(booking.status, nextStatus)) {
    return res.status(400).json({ error: 'สถานะนี้ยังยืนยันรับของไม่ได้' });
  }
  const updated = updateById('bookings.json', req.params.id, {
    status: nextStatus,
    pickupConfirmedAt: new Date().toISOString(),
    messenger: {
      ...(booking.messenger || {}),
      deliveredAt: new Date().toISOString(),
    },
  });
  logActivity('pickup', `ยืนยันได้รับชุด การจอง ${booking.id}`, req.user.id);
  res.json(enrichBooking(updated));
});

router.post('/:id/return', authenticate, authorize('staff', 'admin', 'customer'), (req, res) => {
  const { returnImages, penaltyAmount, penaltyReason } = req.body;
  const booking = findById('bookings.json', req.params.id);
  if (!booking) return res.status(404).json({ error: 'ไม่พบการจอง' });

  if (req.user.role === 'customer') {
    if (!['delivered', 'picked_up'].includes(booking.status)) {
      return res.status(400).json({ error: 'กรุณาใช้การแจ้งส่งคืน' });
    }
    const submitted = updateById('bookings.json', req.params.id, {
      status: 'return_submitted',
      returnImages: returnImages || booking.returnImages || [],
      returnSubmittedAt: new Date().toISOString(),
    });
    createNotification(booking.userId, 'return_submitted', 'เราได้รับการแจ้งส่งคืนชุดแล้ว รอพนักงานตรวจรับ');
    notifyStaff('return_submitted', `ลูกค้าแจ้งส่งคืนแล้ว — เลขจอง ${booking.id.slice(0, 8)}…`);
    return res.json(enrichBooking(submitted));
  }

  if (!canTransitionStatus(booking.status, 'returned')) {
    return res.status(400).json({ error: 'สถานะนี้ยังรับคืนเข้าคลังไม่ได้' });
  }

  const updated = updateById('bookings.json', req.params.id, {
    status: 'returned',
    returnImages: returnImages || booking.returnImages || [],
    penaltyAmount: Number(penaltyAmount) || 0,
    penaltyReason: penaltyReason || booking.penaltyReason || null,
    returnedAt: new Date().toISOString(),
  });
  createNotification(booking.userId, 'returned', 'พนักงานได้รับชุดคืนแล้ว กำลังดำเนินการคืนมัดจำ');
  logActivity('return', `รับคืนชุดเข้าคลัง การจอง ${booking.id}`, req.user.id);
  res.json(enrichBooking(updated));
});

router.post('/:id/refund', authenticate, authorize('staff', 'admin'), (req, res) => {
  const booking = findById('bookings.json', req.params.id);
  if (!booking) return res.status(404).json({ error: 'ไม่พบการจอง' });
  if (!canTransitionStatus(booking.status, 'deposit_refunded')) {
    return res.status(400).json({ error: 'ต้องรับคืนชุดเข้าคลังก่อนคืนมัดจำ' });
  }

  const { refundSlipImage } = req.body;
  if (!refundSlipImage || typeof refundSlipImage !== 'string' || !refundSlipImage.trim()) {
    return res.status(400).json({ error: 'กรุณาแนบสลิปการโอนคืนมัดจำ' });
  }

  const penaltyAmount = req.body.penaltyAmount != null
    ? Number(req.body.penaltyAmount)
    : (booking.penaltyAmount || 0);
  const penaltyReason = req.body.penaltyReason != null
    ? req.body.penaltyReason
    : booking.penaltyReason;

  const refundAmount = Math.max(0, booking.deposit - (penaltyAmount || 0));
  const updated = updateById('bookings.json', req.params.id, {
    status: 'deposit_refunded',
    penaltyAmount: penaltyAmount || 0,
    penaltyReason: penaltyReason || null,
    refundAmount,
    refundSlipImage: refundSlipImage.trim(),
    refundedAt: new Date().toISOString(),
  });
  createNotification(booking.userId, 'deposit_refunded', `เงินมัดจำของคุณได้รับการคืนแล้ว จำนวน ${refundAmount} บาท`, {
    amount: refundAmount.toLocaleString(),
  });
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

  /** คืนรายการกลับตะกร้า (ยกเลิกก่อนชำระจากตะกร้า) */
  const restoreCartItem = (b) => {
    if (b.source !== 'cart') return;
    const cart = readJSON('cart.json', []);
    const duplicate = cart.find((c) => (
      c.userId === b.userId
      && c.costumeId === b.costumeId
      && c.sizeId === b.sizeId
      && c.degreeLevel === b.degreeLevel
      && c.startDate === b.startDate
      && c.endDate === b.endDate
    ));
    if (duplicate) return;
    addItem('cart.json', {
      id: generateId(),
      userId: b.userId,
      costumeId: b.costumeId,
      sizeId: b.sizeId,
      degreeLevel: b.degreeLevel,
      startDate: b.startDate,
      endDate: b.endDate,
      addedAt: new Date().toISOString(),
    });
  };

  let restoredToCart = false;
  const unpaidFromCart = booking.status === 'payment_pending' && booking.source === 'cart';

  if (unpaidFromCart && booking.checkoutBatchId) {
    // ยกเลิกทั้งชุดที่จองจากตะกร้าพร้อมกัน แล้วคืนทุกรายการกลับตะกร้า
    const all = readJSON('bookings.json', []);
    const siblings = all.filter((b) => (
      b.checkoutBatchId === booking.checkoutBatchId
      && b.userId === booking.userId
      && b.status === 'payment_pending'
      && b.source === 'cart'
    ));
    for (const sibling of siblings) {
      updateById('bookings.json', sibling.id, { status: 'cancelled' });
      restoreCartItem(sibling);
      logActivity('cancel_booking', `ยกเลิกการจอง ${sibling.id} (คืนตะกร้า)`, req.user.id);
    }
    restoredToCart = siblings.length > 0;
  } else {
    updateById('bookings.json', req.params.id, { status: 'cancelled' });
    if (unpaidFromCart) {
      restoreCartItem(booking);
      restoredToCart = true;
    }
    logActivity('cancel_booking', `ยกเลิกการจอง ${booking.id}${restoredToCart ? ' (คืนตะกร้า)' : ''}`, req.user.id);
  }

  res.json({
    message: restoredToCart
      ? 'ยกเลิกการจองแล้ว และคืนรายการกลับตะกร้าแล้ว'
      : 'ยกเลิกการจองสำเร็จ',
    restoredToCart,
  });
});

export default router;
