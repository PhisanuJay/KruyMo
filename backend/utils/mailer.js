import nodemailer from 'nodemailer';

const escapeHtml = (value) => String(value).replace(
  /[&<>"']/g,
  (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
);

const createTransporter = () => {
  const user = process.env.EMAIL_USER?.trim();
  const pass = process.env.EMAIL_APP_PASSWORD?.replace(/\s/g, '');

  if (!user || !pass) {
    throw new Error('ยังไม่ได้ตั้งค่า EMAIL_USER และ EMAIL_APP_PASSWORD ใน backend/.env');
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
  });
};

export const sendVerificationOtp = async ({ to, name, otp }) => {
  const transporter = createTransporter();
  const sender = process.env.EMAIL_FROM_NAME?.trim() || 'KruyMo';
  const safeName = escapeHtml(name);

  await transporter.sendMail({
    from: `"${sender}" <${process.env.EMAIL_USER.trim()}>`,
    to,
    subject: `${otp} คือรหัสยืนยันอีเมล KruyMo`,
    text: `สวัสดี ${name}\n\nรหัสยืนยันอีเมลของคุณคือ ${otp}\nรหัสนี้มีอายุ 10 นาที\n\nหากคุณไม่ได้สมัครสมาชิก กรุณาเพิกเฉยต่ออีเมลนี้`,
    html: `
      <div style="max-width:520px;margin:auto;padding:32px;font-family:Arial,sans-serif;color:#222">
        <h1 style="color:#e63946;margin:0 0 20px">KruyMo</h1>
        <p>สวัสดี ${safeName}</p>
        <p>กรอกรหัสนี้เพื่อยืนยันอีเมลและเปิดใช้งานบัญชี</p>
        <div style="font-size:36px;font-weight:800;letter-spacing:10px;text-align:center;
          background:#fff1f2;border-radius:14px;padding:20px;margin:24px 0">${otp}</div>
        <p style="color:#666">รหัสมีอายุ 10 นาที และใช้ได้เพียงครั้งเดียว</p>
        <p style="color:#999;font-size:13px">หากคุณไม่ได้สมัครสมาชิก KruyMo กรุณาเพิกเฉยต่ออีเมลนี้</p>
      </div>
    `,
  });
};

export const sendPasswordResetOtp = async ({ to, name, otp }) => {
  const transporter = createTransporter();
  const sender = process.env.EMAIL_FROM_NAME?.trim() || 'KruyMo';
  const safeName = escapeHtml(name);

  await transporter.sendMail({
    from: `"${sender}" <${process.env.EMAIL_USER.trim()}>`,
    to,
    subject: `${otp} คือรหัสรีเซ็ตรหัสผ่าน KruyMo`,
    text: `สวัสดี ${name}\n\nรหัสรีเซ็ตรหัสผ่านของคุณคือ ${otp}\nรหัสนี้มีอายุ 10 นาที\n\nหากคุณไม่ได้ร้องขอ กรุณาเพิกเฉยต่ออีเมลนี้`,
    html: `
      <div style="max-width:520px;margin:auto;padding:32px;font-family:Arial,sans-serif;color:#222">
        <h1 style="color:#e63946;margin:0 0 20px">KruyMo</h1>
        <p>สวัสดี ${safeName}</p>
        <p>กรอกรหัสนี้เพื่อตั้งรหัสผ่านใหม่</p>
        <div style="font-size:36px;font-weight:800;letter-spacing:10px;text-align:center;
          background:#fff1f2;border-radius:14px;padding:20px;margin:24px 0">${otp}</div>
        <p style="color:#666">รหัสมีอายุ 10 นาที และใช้ได้เพียงครั้งเดียว</p>
        <p style="color:#999;font-size:13px">หากคุณไม่ได้ร้องขอรีเซ็ตรหัสผ่าน กรุณาเพิกเฉยต่ออีเมลนี้</p>
      </div>
    `,
  });
};

export const sendFeedbackMessage = async ({ name, email, topic, message }) => {
  const transporter = createTransporter();
  const sender = process.env.EMAIL_FROM_NAME?.trim() || 'KruyMo';
  const to = process.env.FEEDBACK_TO?.trim() || process.env.EMAIL_USER.trim();
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeTopic = escapeHtml(topic);
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');

  await transporter.sendMail({
    from: `"${sender}" <${process.env.EMAIL_USER.trim()}>`,
    to,
    replyTo: email,
    subject: `[KruyMo Feedback] ${topic} — ${name}`,
    text: `ชื่อ: ${name}\nอีเมล: ${email}\nหัวข้อ: ${topic}\n\n${message}`,
    html: `
      <div style="max-width:560px;margin:auto;padding:28px;font-family:Arial,sans-serif;color:#222">
        <h1 style="color:#e63946;margin:0 0 16px">KruyMo Feedback</h1>
        <p><strong>ชื่อ:</strong> ${safeName}</p>
        <p><strong>อีเมล:</strong> ${safeEmail}</p>
        <p><strong>หัวข้อ:</strong> ${safeTopic}</p>
        <div style="margin-top:20px;padding:16px;background:#f8fafc;border-radius:12px;line-height:1.6">
          ${safeMessage}
        </div>
      </div>
    `,
  });
};
