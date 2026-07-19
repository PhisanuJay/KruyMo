import { readJSON, updateById } from './db.js';
import { createNotification, logActivity, notifyStaff } from './helpers.js';

const PAYMENT_TIMEOUT_MS = 24 * 60 * 60 * 1000;
const RETURN_REMINDER_DAYS = 1; // แจ้งล่วงหน้า 1 วันก่อนวันคืน

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const cancelExpiredUnpaidBookings = () => {
  const bookings = readJSON('bookings.json', []);
  const now = Date.now();
  let cancelled = 0;

  bookings.forEach((booking) => {
    if (booking.status !== 'payment_pending') return;
    const created = new Date(booking.createdAt || 0).getTime();
    if (!created || now - created < PAYMENT_TIMEOUT_MS) return;

    updateById('bookings.json', booking.id, {
      status: 'cancelled',
      cancelReason: 'หมดเวลาชำระเงินภายใน 24 ชั่วโมง',
      cancelledAt: new Date().toISOString(),
    });
    createNotification(
      booking.userId,
      'booking_cancelled',
      'การจองถูกยกเลิกเนื่องจากไม่ได้ชำระเงินภายใน 24 ชั่วโมง',
    );
    logActivity('auto_cancel', `ยกเลิกการจองอัตโนมัติ ${booking.id} (ค้างชำระเกิน 24 ชม.)`, null);
    cancelled += 1;
  });

  return cancelled;
};

export const sendReturnReminders = () => {
  const bookings = readJSON('bookings.json', []);
  const today = startOfDay(new Date());
  const target = new Date(today);
  target.setDate(target.getDate() + RETURN_REMINDER_DAYS);
  let sent = 0;

  bookings.forEach((booking) => {
    if (!['delivered', 'picked_up'].includes(booking.status)) return;
    if (booking.returnReminderSentAt) return;
    if (!booking.endDate) return;

    const end = startOfDay(booking.endDate);
    if (end.getTime() !== target.getTime()) return;

    const dateLabel = new Date(booking.endDate).toLocaleDateString('th-TH');
    createNotification(
      booking.userId,
      'return_reminder',
      `ใกล้ถึงกำหนดคืนชุดแล้ว กรุณาคืนภายใน ${dateLabel}`,
      { date: dateLabel },
    );
    updateById('bookings.json', booking.id, {
      returnReminderSentAt: new Date().toISOString(),
    });
    sent += 1;
  });

  if (sent > 0) {
    notifyStaff('return_reminder', `มี ${sent} รายการใกล้ครบกำหนดคืนชุด`);
  }

  return sent;
};

export const runMaintenanceJobs = () => {
  const cancelled = cancelExpiredUnpaidBookings();
  const reminded = sendReturnReminders();
  if (cancelled || reminded) {
    console.log(`🧹 Jobs: cancelled=${cancelled}, returnReminders=${reminded}`);
  }
};

export const startMaintenanceJobs = (intervalMs = 5 * 60 * 1000) => {
  runMaintenanceJobs();
  return setInterval(runMaintenanceJobs, intervalMs);
};
