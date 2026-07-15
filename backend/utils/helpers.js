import { v4 as uuidv4 } from 'uuid';
import { addItem, readJSON } from './db.js';

export const generateId = () => uuidv4();

export const createNotification = (userId, type, message) => {
  addItem('notifications.json', {
    id: generateId(),
    userId,
    type,
    message,
    isRead: false,
    createdAt: new Date().toISOString(),
  });
};

/** แจ้งเตือนพนักงาน / แอดมินทุกคน */
export const notifyStaff = (type, message) => {
  const users = readJSON('users.json', []);
  users
    .filter((u) => u.role === 'staff' || u.role === 'admin')
    .forEach((u) => createNotification(u.id, type, message));
};

export const logActivity = (action, details, userId = null) => {
  addItem('activityLog.json', {
    id: generateId(),
    action,
    details,
    userId,
    createdAt: new Date().toISOString(),
  });
};

export const calculateRentalPrice = (costume, startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
  const rentalPrice = costume.pricePerDay * days;
  return {
    days,
    rentalPrice,
    deposit: costume.deposit,
    total: rentalPrice + costume.deposit,
  };
};

export const BOOKING_STATUSES = [
  'pending',
  'payment_pending',
  'payment_verified',
  'approved',
  'rejected',
  'preparing',
  'ready_to_ship',
  'out_for_delivery',
  'delivered',
  'return_submitted',
  'ready_for_pickup',
  'picked_up',
  'returned',
  'deposit_refunded',
  'cancelled',
];

export const STATUS_LABELS = {
  pending: 'รออนุมัติ',
  payment_pending: 'รอชำระเงิน',
  payment_verified: 'ตรวจสอบการชำระแล้ว',
  approved: 'อนุมัติแล้ว',
  rejected: 'ปฏิเสธ',
  preparing: 'กำลังเตรียมชุด',
  ready_to_ship: 'พร้อมส่งแมสฯ',
  out_for_delivery: 'แมสฯ กำลังนำส่ง',
  delivered: 'ส่งถึงแล้ว',
  return_submitted: 'ลูกค้าส่งคืนแล้ว',
  ready_for_pickup: 'พร้อมส่งแมสฯ',
  picked_up: 'ส่งถึงแล้ว',
  returned: 'รับคืนแล้ว',
  deposit_refunded: 'คืนเงินมัดจำแล้ว',
  cancelled: 'ยกเลิก',
};

/** ลำดับสถานะที่อนุญาต (รวม legacy) */
export const STATUS_TRANSITIONS = {
  payment_pending: ['pending', 'cancelled'],
  pending: ['payment_verified', 'approved', 'rejected', 'payment_pending', 'cancelled'],
  payment_verified: ['approved', 'rejected'],
  approved: ['preparing', 'rejected'],
  preparing: ['ready_to_ship', 'ready_for_pickup'],
  ready_to_ship: ['out_for_delivery'],
  ready_for_pickup: ['out_for_delivery', 'picked_up'],
  out_for_delivery: ['delivered', 'picked_up'],
  delivered: ['return_submitted'],
  picked_up: ['return_submitted', 'returned'],
  return_submitted: ['returned'],
  returned: ['deposit_refunded'],
  deposit_refunded: [],
  rejected: [],
  cancelled: [],
};

export const canTransitionStatus = (from, to) => {
  if (!from || !to) return false;
  if (from === to) return true;
  const allowed = STATUS_TRANSITIONS[from];
  return Array.isArray(allowed) && allowed.includes(to);
};

export const formatAddress = (address) => {
  if (!address) return '';
  if (typeof address === 'string') return address;
  return [address.line1, address.district, address.province, address.postalCode]
    .filter(Boolean)
    .join(' ');
};

export const ACTIVE_BOOKING_STATUSES = [
  'pending',
  'payment_pending',
  'payment_verified',
  'approved',
  'preparing',
  'ready_to_ship',
  'out_for_delivery',
  'delivered',
  'return_submitted',
  'ready_for_pickup',
  'picked_up',
];

export const datesOverlap = (startA, endA, startB, endB) => {
  const aStart = new Date(startA);
  const aEnd = new Date(endA);
  const bStart = new Date(startB);
  const bEnd = new Date(endB);
  return aStart <= bEnd && bStart <= aEnd;
};

export const countBookedUnits = (bookings, { costumeId, sizeId, degreeLevel, startDate, endDate }) => (
  bookings.filter((b) => (
    b.costumeId === costumeId
    && b.sizeId === sizeId
    && b.degreeLevel === degreeLevel
    && ACTIVE_BOOKING_STATUSES.includes(b.status)
    && datesOverlap(b.startDate, b.endDate, startDate, endDate)
  )).length
);
