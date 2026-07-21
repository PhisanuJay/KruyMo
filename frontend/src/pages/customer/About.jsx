import { Link } from 'react-router-dom';
import {
  Instagram,
  Facebook,
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';
import CustomerLayout from '../../components/CustomerLayout';
import { ABOUT_CONTACT } from '../../constants/store';

export default function About() {
  const c = ABOUT_CONTACT;

  const channels = [
    {
      key: 'line',
      label: 'LINE',
      value: c.line.id,
      href: c.line.url,
      icon: MessageCircle,
      preferred: true,
    },
    {
      key: 'phone',
      label: 'โทร',
      value: c.phone,
      href: `tel:${c.phone.replace(/\D/g, '')}`,
      icon: Phone,
    },
    {
      key: 'ig',
      label: 'Instagram',
      value: c.instagram.handle,
      href: c.instagram.url,
      icon: Instagram,
    },
    {
      key: 'fb',
      label: 'Facebook',
      value: c.facebook.name,
      href: c.facebook.url,
      icon: Facebook,
    },
    {
      key: 'email',
      label: 'อีเมล',
      value: c.email,
      href: `mailto:${c.email}`,
      icon: Mail,
    },
  ];

  return (
    <CustomerLayout>
      <div className="about-page">
        <section className="about-story-hero">
          <img
            className="about-story-hero-img"
            src="/images/gowns/gown-bachelor-yellow.jpg"
            alt=""
          />
          <div className="about-story-hero-veil" aria-hidden />
          <div className="container about-story-hero-copy">
            <p className="about-story-kicker">เรื่องของเรา</p>
            <h1>
              <span className="about-story-mark">K</span>ruyMo
            </h1>
            <p className="about-story-hero-text">
              ร้านเช่าชุดครุยสำหรับนักศึกษา มหาวิทยาลัยศรีปทุม
              — ให้วันรับปริญญาของคุณง่ายขึ้นตั้งแต่ก้าวแรก
            </p>
          </div>
        </section>

        <section className="about-story-block">
          <div className="container about-story-row">
            <div className="about-story-text">
              <p className="about-story-label">เราเป็นใคร</p>
              <h2>เช่าชุดครุยศรีปทุมแบบครบวงจร</h2>
              <p>
                KruyMo เกิดจากความอยากให้การเช่าชุดครุยไม่ยุ่งยากอีกต่อไป
                เลือกคณะตามสีสาย เลือกระดับตรี โท หรือเอก เลือกไซส์และวันเช่าได้จากมือถือ
                แล้วปล่อยให้เราดูแลการจัดส่งจนถึงคืนมัดจำ
              </p>
            </div>
            <figure className="about-story-photo">
              <img src="/images/gowns/gown-bachelor-blue.jpg" alt="ชุดครุยคณะบริหารธุรกิจ" />
            </figure>
          </div>
        </section>

        <section className="about-story-block about-story-block-alt">
          <div className="container about-story-row is-reverse">
            <div className="about-story-text">
              <p className="about-story-label">ทำไมต้อง KruyMo</p>
              <h2>จองออนไลน์ ส่งถึงบ้าน คืนมัดจำผ่านระบบ</h2>
              <p>
                ไม่ต้องวิ่งไปหน้าร้านหลายรอบเพื่อจองคิวหรือเช็คไซส์
                คุณเลือกชุด ชำระผ่านพร้อมเพย์ อัปโหลดสลิป แล้วติดตามสถานะได้ตลอดทาง
                เมื่อใช้งานเสร็จ ส่งคืนแล้วรอรับมัดจำคืนตามบัญชีที่แจ้งไว้
              </p>
              <Link to="/how-to-rent" className="about-story-link">
                ดูขั้นตอนการเช่า <ExternalLink size={14} />
              </Link>
            </div>
            <figure className="about-story-photo">
              <img src="/images/gowns/gown-bachelor-maroon.jpg" alt="ชุดครุยคณะวิศวกรรมศาสตร์" />
            </figure>
          </div>
        </section>

        <section className="about-story-block">
          <div className="container about-story-row">
            <div className="about-story-text">
              <p className="about-story-label">ที่ตั้ง</p>
              <h2>ใกล้ มหาวิทยาลัยศรีปทุม บางเขน</h2>
              <p>
                ร้านอ้างอิงบริเวณ ม.ศรีปทุม บางเขน ถนนพหลโยธิน
                สะดวกทั้งรับ–คืนชุดและนัดหมายสอบถามในเวลาทำการ
                {c.hours ? ` (${c.hours})` : ''}
              </p>
              <p className="about-story-address">
                <MapPin size={16} aria-hidden />
                {c.address}
              </p>
            </div>
            <figure className="about-story-photo about-story-photo-duo">
              <img src="/images/gowns/gown-bachelor-purple.jpg" alt="ชุดครุยคณะไอที" />
              <img src="/images/gowns/gown-bachelor-green.jpg" alt="ชุดครุยคณะบัญชี" />
            </figure>
          </div>
        </section>

        <section className="about-story-strip" aria-hidden>
          <div className="about-story-strip-track">
            {[
              '/images/gowns/gown-bachelor-yellow.jpg',
              '/images/gowns/gown-bachelor-orange.jpg',
              '/images/gowns/gown-bachelor-white.jpg',
              '/images/gowns/gown-bachelor-blue.jpg',
              '/images/gowns/gown-bachelor-maroon.jpg',
              '/images/gowns/gown-bachelor-purple.jpg',
              '/images/gowns/gown-bachelor-green.jpg',
            ].concat([
              '/images/gowns/gown-bachelor-yellow.jpg',
              '/images/gowns/gown-bachelor-orange.jpg',
              '/images/gowns/gown-bachelor-white.jpg',
              '/images/gowns/gown-bachelor-blue.jpg',
              '/images/gowns/gown-bachelor-maroon.jpg',
              '/images/gowns/gown-bachelor-purple.jpg',
              '/images/gowns/gown-bachelor-green.jpg',
            ]).map((src, i) => (
              <img key={`${src}-${i}`} src={src} alt="" />
            ))}
          </div>
        </section>

        <div className="container about-body">
          <section className="about-contact-wrap" aria-labelledby="about-contact-title">
            <div className="about-contact-head">
              <p className="about-story-label">ติดต่อร้าน</p>
              <h2 id="about-contact-title">ช่องทางพูดคุยกับเรา</h2>
              <p>แนะนำเริ่มจาก LINE หรือโทร — ตอบเรื่องจอง ไซส์ และสถานะได้เร็วที่สุด</p>
            </div>

            <div className="about-channels">
              {channels.map((ch) => {
                const Icon = ch.icon;
                return (
                  <a
                    key={ch.key}
                    className={`about-channel${ch.preferred ? ' is-preferred' : ''}`}
                    href={ch.href}
                    target={ch.href.startsWith('http') ? '_blank' : undefined}
                    rel={ch.href.startsWith('http') ? 'noreferrer' : undefined}
                  >
                    <span className="about-channel-icon" aria-hidden>
                      <Icon size={20} />
                    </span>
                    <span className="about-channel-copy">
                      <span className="about-channel-top">
                        <strong>{ch.label}</strong>
                        {ch.preferred && <em>แนะนำ</em>}
                      </span>
                      <span className="about-channel-value">{ch.value}</span>
                    </span>
                  </a>
                );
              })}
            </div>

            <div className="about-meta">
              <div className="about-meta-item">
                <Clock size={18} aria-hidden />
                <div>
                  <strong>เวลาทำการ</strong>
                  <p>{c.hours}</p>
                </div>
              </div>
              <div className="about-meta-item">
                <MapPin size={18} aria-hidden />
                <div>
                  <strong>ที่ตั้ง</strong>
                  <p>{c.address}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="about-map" aria-labelledby="about-map-title">
            <div className="about-map-head">
              <h2 id="about-map-title">แผนที่</h2>
              <a className="about-map-link" href={c.mapExternalUrl} target="_blank" rel="noreferrer">
                เปิดใน Google Maps <ExternalLink size={14} />
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
          </section>

          <p className="about-footnote">
            <Link to="/catalog">เลือกชุดครุย</Link>
            {' · '}
            <Link to="/how-to-rent">ขั้นตอนการเช่า</Link>
          </p>
        </div>
      </div>
    </CustomerLayout>
  );
}
