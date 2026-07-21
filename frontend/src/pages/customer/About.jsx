import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Instagram,
  Facebook,
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageCircle,
  Send,
  ExternalLink,
} from 'lucide-react';
import CustomerLayout from '../../components/CustomerLayout';
import { ABOUT_CONTACT } from '../../constants/store';
import { feedbackAPI } from '../../services/api';

const emptyFeedback = () => ({
  name: '',
  email: '',
  topic: 'ทั่วไป',
  message: '',
});

export default function About() {
  const c = ABOUT_CONTACT;
  const [form, setForm] = useState(emptyFeedback);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
    setDone(false);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('กรุณากรอกชื่อ');
      return;
    }
    if (!form.email.trim()) {
      setError('กรุณากรอกอีเมล');
      return;
    }
    if (!form.message.trim() || form.message.trim().length < 10) {
      setError('กรุณาระบุข้อความอย่างน้อย 10 ตัวอักษร');
      return;
    }

    setSending(true);
    setError('');
    try {
      await feedbackAPI.submit({
        name: form.name.trim(),
        email: form.email.trim(),
        topic: form.topic,
        message: form.message.trim(),
      });
      setDone(true);
      setForm(emptyFeedback());
    } catch (err) {
      setError(err.response?.data?.error || 'ส่งไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setSending(false);
    }
  };

  return (
    <CustomerLayout>
      <div className="about-page">
        <section className="about-hero">
          <div className="container">
            <p className="about-kicker">KruyMo · Sripatum University</p>
            <h1>เกี่ยวกับเรา</h1>
            <p className="about-lead">{c.blurb}</p>
          </div>
        </section>

        <div className="container about-body">
          <section className="about-contact" aria-labelledby="about-contact-title">
            <h2 id="about-contact-title">ช่องทางติดต่อ</h2>
            <p className="about-section-desc">สอบถามการเช่า สถานะจอง หรือนัดรับ–คืนชุดได้ที่ช่องทางด้านล่าง</p>

            <ul className="about-channel-list">
              <li>
                <span className="about-channel-icon" aria-hidden><Instagram size={20} /></span>
                <div>
                  <p className="about-channel-label">Instagram</p>
                  <a href={c.instagram.url} target="_blank" rel="noreferrer">{c.instagram.handle}</a>
                </div>
              </li>
              <li>
                <span className="about-channel-icon" aria-hidden><MessageCircle size={20} /></span>
                <div>
                  <p className="about-channel-label">LINE</p>
                  <a href={c.line.url} target="_blank" rel="noreferrer">{c.line.id}</a>
                </div>
              </li>
              <li>
                <span className="about-channel-icon" aria-hidden><Facebook size={20} /></span>
                <div>
                  <p className="about-channel-label">Facebook</p>
                  <a href={c.facebook.url} target="_blank" rel="noreferrer">{c.facebook.name}</a>
                </div>
              </li>
              <li>
                <span className="about-channel-icon" aria-hidden><Phone size={20} /></span>
                <div>
                  <p className="about-channel-label">เบอร์โทร</p>
                  <a href={`tel:${c.phone.replace(/\D/g, '')}`}>{c.phone}</a>
                </div>
              </li>
              <li>
                <span className="about-channel-icon" aria-hidden><Mail size={20} /></span>
                <div>
                  <p className="about-channel-label">อีเมล</p>
                  <a href={`mailto:${c.email}`}>{c.email}</a>
                </div>
              </li>
              <li>
                <span className="about-channel-icon" aria-hidden><Clock size={20} /></span>
                <div>
                  <p className="about-channel-label">เวลาทำการ</p>
                  <p>{c.hours}</p>
                </div>
              </li>
            </ul>
          </section>

          <section className="about-feedback" aria-labelledby="about-feedback-title">
            <h2 id="about-feedback-title">ส่ง Feedback</h2>
            <p className="about-section-desc">
              บอกข้อเสนอแนะหรือปัญหาการใช้งาน — ข้อความจะถูกบันทึกในระบบ
              {c.email ? ` และส่งแจ้งเตือนไปที่ ${c.email} เมื่อตั้งค่าอีเมลแล้ว` : ''}
            </p>

            <form className="about-feedback-form" onSubmit={onSubmit} noValidate>
              <div className="about-form-row">
                <div className="form-group">
                  <label htmlFor="about-name">ชื่อ *</label>
                  <input
                    id="about-name"
                    name="name"
                    className="form-input"
                    value={form.name}
                    onChange={onChange}
                    placeholder="ชื่อของคุณ"
                    autoComplete="name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="about-email">อีเมล *</label>
                  <input
                    id="about-email"
                    name="email"
                    type="email"
                    className="form-input"
                    value={form.email}
                    onChange={onChange}
                    placeholder="you@email.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="about-topic">หัวข้อ</label>
                <select
                  id="about-topic"
                  name="topic"
                  className="form-input"
                  value={form.topic}
                  onChange={onChange}
                >
                  <option value="ทั่วไป">ทั่วไป</option>
                  <option value="การจอง">การจอง / ชำระเงิน</option>
                  <option value="การจัดส่ง">การจัดส่ง / แมสฯ</option>
                  <option value="เว็บไซต์">เว็บไซต์ / บั๊ก</option>
                  <option value="อื่น ๆ">อื่น ๆ</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="about-message">ข้อความ *</label>
                <textarea
                  id="about-message"
                  name="message"
                  className="form-input about-textarea"
                  rows={5}
                  value={form.message}
                  onChange={onChange}
                  placeholder="เล่าความคิดเห็นของคุณ..."
                />
              </div>

              {error && <p className="about-form-error" role="alert">{error}</p>}
              {done && (
                <p className="about-form-success" role="status">
                  ได้รับข้อความแล้ว ขอบคุณสำหรับ feedback!
                </p>
              )}

              <button type="submit" className="btn btn-primary" disabled={sending}>
                <Send size={18} />
                {sending ? 'กำลังส่ง...' : 'ส่ง Feedback'}
              </button>
            </form>
          </section>

          <section className="about-map" aria-labelledby="about-map-title">
            <div className="about-map-head">
              <div>
                <h2 id="about-map-title">พิกัดร้าน</h2>
                <p className="about-section-desc">
                  <MapPin size={16} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                  {c.address}
                </p>
              </div>
              <a
                className="btn btn-outline btn-sm"
                href={c.mapExternalUrl}
                target="_blank"
                rel="noreferrer"
              >
                เปิดใน Google Maps
                <ExternalLink size={16} />
              </a>
            </div>
            <div className="about-map-frame">
              <iframe
                title="แผนที่ มหาวิทยาลัยศรีปทุม บางเขน"
                src={c.mapEmbedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
            <p className="about-map-note">
              หมุดแผนที่ชี้ไปที่ มหาวิทยาลัยศรีปทุม บางเขน — จุดอ้างอิงบริเวณร้าน
            </p>
          </section>

          <p className="about-footnote">
            ดูวิธีเช่าแบบละเอียดที่ <Link to="/how-to-rent">ขั้นตอนการเช่า</Link>
            {' · '}
            <Link to="/catalog">เลือกชุดครุย</Link>
          </p>
        </div>
      </div>
    </CustomerLayout>
  );
}
