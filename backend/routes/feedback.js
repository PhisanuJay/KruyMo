import { Router } from 'express';
import { readJSON, writeJSON } from '../utils/db.js';
import { generateId } from '../utils/helpers.js';
import { sendFeedbackMessage } from '../utils/mailer.js';

const router = Router();

const TOPICS = new Set(['ทั่วไป', 'การจอง', 'การจัดส่ง', 'เว็บไซต์', 'อื่น ๆ']);

router.post('/', async (req, res) => {
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim();
  const topic = String(req.body?.topic || 'ทั่วไป').trim();
  const message = String(req.body?.message || '').trim();

  if (!name) return res.status(400).json({ error: 'กรุณากรอกชื่อ' });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'กรุณากรอกอีเมลให้ถูกต้อง' });
  }
  if (!message || message.length < 10) {
    return res.status(400).json({ error: 'กรุณาระบุข้อความอย่างน้อย 10 ตัวอักษร' });
  }
  if (!TOPICS.has(topic)) {
    return res.status(400).json({ error: 'หัวข้อไม่ถูกต้อง' });
  }

  const entry = {
    id: generateId(),
    name,
    email,
    topic,
    message,
    createdAt: new Date().toISOString(),
  };

  const list = readJSON('feedback.json', []);
  list.unshift(entry);
  writeJSON('feedback.json', list);

  let emailed = false;
  try {
    await sendFeedbackMessage(entry);
    emailed = true;
  } catch (err) {
    console.warn('[feedback] save ok, email skipped:', err.message);
  }

  res.status(201).json({ ok: true, id: entry.id, emailed });
});

export default router;
