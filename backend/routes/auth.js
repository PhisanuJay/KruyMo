import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createHash, randomInt, timingSafeEqual } from 'crypto';
import { readJSON, addItem, updateById } from '../utils/db.js';
import { generateId, logActivity } from '../utils/helpers.js';
import { JWT_SECRET } from '../middleware/auth.js';
import { sendVerificationOtp, sendPasswordResetOtp } from '../utils/mailer.js';

const router = Router();
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_WAIT_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const generateOtp = () => String(randomInt(0, 1000000)).padStart(6, '0');
const hashOtp = (otp) => createHash('sha256').update(`${otp}:${JWT_SECRET}`).digest('hex');
const signToken = (user) => jwt.sign(
  { id: user.id, email: user.email, role: user.role },
  JWT_SECRET,
  { expiresIn: '7d' },
);
const safeUser = (user) => {
  const {
    password,
    emailOtpHash,
    emailOtpExpiresAt,
    emailOtpLastSentAt,
    emailOtpAttempts,
    passwordResetHash,
    passwordResetExpiresAt,
    passwordResetLastSentAt,
    passwordResetAttempts,
    ...safe
  } = user;
  return safe;
};

const sendOtpForUser = async (user) => {
  const otp = generateOtp();
  await sendVerificationOtp({
    to: user.email,
    name: user.name,
    otp,
  });
  return {
    emailOtpHash: hashOtp(otp),
    emailOtpExpiresAt: new Date(Date.now() + OTP_TTL_MS).toISOString(),
    emailOtpLastSentAt: new Date().toISOString(),
    emailOtpAttempts: 0,
  };
};

const secondsUntilResend = (user, field = 'emailOtpLastSentAt') => {
  if (!user?.[field]) return 0;
  const remaining = OTP_RESEND_WAIT_MS - (Date.now() - new Date(user[field]).getTime());
  return Math.max(0, Math.ceil(remaining / 1000));
};

router.post('/register', async (req, res) => {
  const { name, email, password, phone } = req.body;
  const normalizedEmail = normalizeEmail(email);
  if (!name?.trim() || !normalizedEmail || !password) {
    return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบ' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ error: 'รูปแบบอีเมลไม่ถูกต้อง' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
  }

  const users = readJSON('users.json');
  const existing = users.find((u) => normalizeEmail(u.email) === normalizedEmail);
  if (existing && existing.emailVerified !== false) {
    return res.status(400).json({ error: 'อีเมลนี้ถูกใช้งานแล้ว' });
  }

  if (existing) {
    const waitSeconds = secondsUntilResend(existing);
    if (waitSeconds > 0) {
      return res.status(429).json({
        error: `กรุณารอ ${waitSeconds} วินาทีก่อนขอรหัสใหม่`,
        retryAfter: waitSeconds,
      });
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const pendingUser = {
    id: existing?.id || generateId(),
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    phone: String(phone || '').trim(),
    role: 'customer',
    avatar: existing?.avatar || null,
    emailVerified: false,
    createdAt: existing?.createdAt || new Date().toISOString(),
  };

  try {
    const otpFields = await sendOtpForUser(pendingUser);
    const user = existing
      ? updateById('users.json', existing.id, { ...pendingUser, ...otpFields })
      : addItem('users.json', { ...pendingUser, ...otpFields });

    logActivity('register_pending', `ผู้ใช้ ${normalizedEmail} สมัครและรอยืนยันอีเมล`, user.id);
    return res.status(existing ? 200 : 201).json({
      message: 'ส่งรหัสยืนยัน 6 หลักไปยังอีเมลแล้ว',
      email: normalizedEmail,
      requiresVerification: true,
      expiresIn: OTP_TTL_MS / 1000,
      resendAfter: OTP_RESEND_WAIT_MS / 1000,
    });
  } catch (error) {
    console.error('Send verification email failed:', error.message);
    return res.status(503).json({
      error: 'ส่งอีเมลยืนยันไม่สำเร็จ กรุณาตรวจสอบการตั้งค่าอีเมลของระบบ',
    });
  }
});

router.post('/verify-email', (req, res) => {
  const email = normalizeEmail(req.body.email);
  const otp = String(req.body.otp || '').trim();
  const user = readJSON('users.json').find((u) => normalizeEmail(u.email) === email);

  if (!user || user.emailVerified !== false) {
    return res.status(400).json({ error: 'ไม่พบบัญชีที่รอยืนยันอีเมล' });
  }
  if (!/^\d{6}$/.test(otp)) {
    return res.status(400).json({ error: 'กรุณากรอกรหัสยืนยัน 6 หลัก' });
  }
  if (!user.emailOtpExpiresAt || new Date(user.emailOtpExpiresAt).getTime() < Date.now()) {
    return res.status(400).json({ error: 'รหัสยืนยันหมดอายุแล้ว กรุณาขอรหัสใหม่', code: 'OTP_EXPIRED' });
  }
  if ((user.emailOtpAttempts || 0) >= OTP_MAX_ATTEMPTS) {
    return res.status(429).json({ error: 'กรอกรหัสผิดเกินจำนวนครั้งที่กำหนด กรุณาขอรหัสใหม่' });
  }

  const actual = Buffer.from(hashOtp(otp), 'hex');
  const expected = Buffer.from(user.emailOtpHash || '', 'hex');
  const valid = actual.length === expected.length && timingSafeEqual(actual, expected);
  if (!valid) {
    const attempts = (user.emailOtpAttempts || 0) + 1;
    updateById('users.json', user.id, { emailOtpAttempts: attempts });
    return res.status(400).json({
      error: `รหัสยืนยันไม่ถูกต้อง (เหลือ ${Math.max(0, OTP_MAX_ATTEMPTS - attempts)} ครั้ง)`,
    });
  }

  const verified = updateById('users.json', user.id, {
    emailVerified: true,
    emailVerifiedAt: new Date().toISOString(),
    emailOtpHash: null,
    emailOtpExpiresAt: null,
    emailOtpLastSentAt: null,
    emailOtpAttempts: 0,
  });
  logActivity('verify_email', `ผู้ใช้ ${verified.email} ยืนยันอีเมลสำเร็จ`, verified.id);
  return res.json({
    message: 'ยืนยันอีเมลสำเร็จ',
    user: safeUser(verified),
    token: signToken(verified),
  });
});

router.post('/resend-verification', async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const user = readJSON('users.json').find((u) => normalizeEmail(u.email) === email);

  if (!user || user.emailVerified !== false) {
    return res.status(400).json({ error: 'ไม่พบบัญชีที่รอยืนยันอีเมล' });
  }
  const waitSeconds = secondsUntilResend(user);
  if (waitSeconds > 0) {
    return res.status(429).json({
      error: `กรุณารอ ${waitSeconds} วินาทีก่อนขอรหัสใหม่`,
      retryAfter: waitSeconds,
    });
  }

  try {
    const otpFields = await sendOtpForUser(user);
    updateById('users.json', user.id, otpFields);
    return res.json({
      message: 'ส่งรหัสยืนยันใหม่แล้ว',
      resendAfter: OTP_RESEND_WAIT_MS / 1000,
    });
  } catch (error) {
    console.error('Resend verification email failed:', error.message);
    return res.status(503).json({
      error: 'ส่งอีเมลยืนยันไม่สำเร็จ กรุณาตรวจสอบการตั้งค่าอีเมลของระบบ',
    });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = normalizeEmail(email);
  const user = readJSON('users.json').find((u) => normalizeEmail(u.email) === normalizedEmail);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
  }
  if (user.emailVerified === false) {
    return res.status(403).json({
      error: 'กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ',
      code: 'EMAIL_NOT_VERIFIED',
      email: user.email,
    });
  }
  res.json({ user: safeUser(user), token: signToken(user) });
});

router.post('/forgot-password', async (req, res) => {
  const email = normalizeEmail(req.body.email);
  if (!email) return res.status(400).json({ error: 'กรุณากรอกอีเมล' });

  const user = readJSON('users.json').find((u) => normalizeEmail(u.email) === email);
  // ตอบแบบเดียวกันเพื่อไม่เปิดเผยว่ามีอีเมลในระบบหรือไม่
  if (!user || user.emailVerified === false) {
    return res.json({
      message: 'หากอีเมลนี้มีในระบบ เราได้ส่งรหัสรีเซ็ตไปแล้ว',
      email,
      resendAfter: OTP_RESEND_WAIT_MS / 1000,
    });
  }

  const waitSeconds = secondsUntilResend(user, 'passwordResetLastSentAt');
  if (waitSeconds > 0) {
    return res.status(429).json({
      error: `กรุณารอ ${waitSeconds} วินาทีก่อนขอรหัสใหม่`,
      retryAfter: waitSeconds,
    });
  }

  try {
    const otp = generateOtp();
    await sendPasswordResetOtp({ to: user.email, name: user.name, otp });
    updateById('users.json', user.id, {
      passwordResetHash: hashOtp(otp),
      passwordResetExpiresAt: new Date(Date.now() + OTP_TTL_MS).toISOString(),
      passwordResetLastSentAt: new Date().toISOString(),
      passwordResetAttempts: 0,
    });
    logActivity('forgot_password', `ขอรีเซ็ตรหัสผ่าน ${user.email}`, user.id);
    return res.json({
      message: 'ส่งรหัสรีเซ็ต 6 หลักไปยังอีเมลแล้ว',
      email: user.email,
      resendAfter: OTP_RESEND_WAIT_MS / 1000,
    });
  } catch (error) {
    console.error('Send password reset email failed:', error.message);
    return res.status(503).json({
      error: 'ส่งอีเมลรีเซ็ตรหัสผ่านไม่สำเร็จ กรุณาตรวจสอบการตั้งค่าอีเมลของระบบ',
    });
  }
});

router.post('/reset-password', async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const otp = String(req.body.otp || '').trim();
  const newPassword = String(req.body.newPassword || '');

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ error: 'กรุณากรอกอีเมล รหัสยืนยัน และรหัสผ่านใหม่' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
  }
  if (!/^\d{6}$/.test(otp)) {
    return res.status(400).json({ error: 'กรุณากรอกรหัสยืนยัน 6 หลัก' });
  }

  const user = readJSON('users.json').find((u) => normalizeEmail(u.email) === email);
  if (!user || !user.passwordResetHash) {
    return res.status(400).json({ error: 'ไม่พบคำขอรีเซ็ตรหัสผ่าน หรือรหัสหมดอายุแล้ว' });
  }
  if (!user.passwordResetExpiresAt || new Date(user.passwordResetExpiresAt).getTime() < Date.now()) {
    return res.status(400).json({ error: 'รหัสรีเซ็ตหมดอายุแล้ว กรุณาขอรหัสใหม่', code: 'OTP_EXPIRED' });
  }
  if ((user.passwordResetAttempts || 0) >= OTP_MAX_ATTEMPTS) {
    return res.status(429).json({ error: 'กรอกรหัสผิดเกินจำนวนครั้งที่กำหนด กรุณาขอรหัสใหม่' });
  }

  const actual = Buffer.from(hashOtp(otp), 'hex');
  const expected = Buffer.from(user.passwordResetHash || '', 'hex');
  const valid = actual.length === expected.length && timingSafeEqual(actual, expected);
  if (!valid) {
    const attempts = (user.passwordResetAttempts || 0) + 1;
    updateById('users.json', user.id, { passwordResetAttempts: attempts });
    return res.status(400).json({
      error: `รหัสยืนยันไม่ถูกต้อง (เหลือ ${Math.max(0, OTP_MAX_ATTEMPTS - attempts)} ครั้ง)`,
    });
  }

  const updated = updateById('users.json', user.id, {
    password: await bcrypt.hash(newPassword, 10),
    passwordResetHash: null,
    passwordResetExpiresAt: null,
    passwordResetLastSentAt: null,
    passwordResetAttempts: 0,
  });
  logActivity('reset_password', `รีเซ็ตรหัสผ่านสำเร็จ ${updated.email}`, updated.id);
  return res.json({ message: 'ตั้งรหัสผ่านใหม่สำเร็จ สามารถเข้าสู่ระบบได้ทันที' });
});

export default router;
