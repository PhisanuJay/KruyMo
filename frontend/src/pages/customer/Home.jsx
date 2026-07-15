import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CustomerLayout from '../../components/CustomerLayout';
import CostumeCard from '../../components/CostumeCard';
import { costumeAPI } from '../../services/api';

const CATEGORIES = [
  {
    name: 'นิเทศศาสตร์',
    desc: 'สายสีเหลือง',
    to: '/catalog?facultyId=fac-comm',
    bg: '#E63946',
    img: '/images/gown-yellow.png',
    wide: true,
  },
  {
    name: 'บัญชี',
    desc: 'สายสีเขียว',
    to: '/catalog?facultyId=fac-acc',
    bg: '#F4C430',
    text: '#111',
    img: '/images/gown-green.png',
  },
  {
    name: 'นิติศาสตร์',
    desc: 'สายสีขาว',
    to: '/catalog?facultyId=fac-law',
    bg: '#111111',
    img: '/images/gown-white.png',
  },
  {
    name: 'ศิลปศาสตร์',
    desc: 'สายสีส้ม',
    to: '/catalog?facultyId=fac-lib',
    bg: '#2ECC71',
    img: '/images/gown-orange.png',
  },
  {
    name: 'บริหารธุรกิจ',
    desc: 'สายสีฟ้า',
    to: '/catalog?facultyId=fac-bus',
    bg: '#4CC9F0',
    text: '#111',
    img: '/images/gown-cyan.png',
  },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    costumeAPI.getAll().then((r) => setFeatured(r.data.slice(0, 4))).catch(() => {});
  }, []);

  return (
    <CustomerLayout>
      <div className="container">
        <section className="hero-shop">
          <div className="hero-copy">
            <p className="hero-kicker">Sripatum University</p>
            <h1 className="hero-title">
              <span className="ghost">GOWN</span>
              KruyMo
            </h1>
            <p className="hero-desc">
              เช่าชุดครุยบัณฑิต มหาวิทยาลัยศรีปทุม ครบทุกคณะ พู่สายพายขาว พร้อมตราประจำมหาวิทยาลัย
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/catalog" className="btn btn-primary">เลือกชุดครุย</Link>
              <Link to="/register" className="btn btn-outline">สมัครสมาชิก</Link>
            </div>
          </div>
          <div className="hero-visual">
            <img src="/images/hero-gown.png" alt="ชุดครุยศรีปทุม" />
          </div>
        </section>

        <div className="section-head">
          <div>
            <h2>คณะศรีปทุม</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>ทุกชุดใช้ตรา มหาวิทยาลัยศรีปทุม</p>
          </div>
          <Link to="/catalog" className="section-link">ดูทั้งหมด →</Link>
        </div>

        <div className="category-bento">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              to={cat.to}
              className={`cat-tile${cat.wide ? ' wide' : ''}`}
              style={{ background: cat.bg, color: cat.text || '#fff' }}
            >
              <div>
                <h3>{cat.name}</h3>
                <p style={{ opacity: 0.85, marginTop: 6, fontSize: '0.9rem' }}>{cat.desc}</p>
              </div>
              <span className="browse">Browse</span>
              <img src={cat.img} alt={cat.name} />
            </Link>
          ))}
        </div>

        <div className="trust-bar">
          {[
            { icon: '🎓', title: 'เฉพาะศรีปทุม', sub: 'ครบทุกคณะ' },
            { icon: '🛡️', title: 'มัดจำปลอดภัย', sub: 'คืนเมื่อส่งชุด' },
            { icon: '💬', title: 'ซัพพอร์ตตลอด', sub: 'แอดมินช่วยเหลือ' },
            { icon: '🔒', title: 'ชำระเงินปลอดภัย', sub: 'อัปโหลดสลิปได้' },
          ].map((item) => (
            <div key={item.title} className="trust-item">
              <div className="trust-icon">{item.icon}</div>
              <div>
                <strong>{item.title}</strong>
                <span>{item.sub}</span>
              </div>
            </div>
          ))}
        </div>

        <section className="promo-banner">
          <div>
            <h2>Sripatum<br />Graduation</h2>
            <p>จองชุดครุยศรีปทุมล่วงหน้า เลือกคณะ ไซส์ และช่วงวันเช่าได้ทันที — ส่งถึงบ้านด้วยแมสฯ</p>
          </div>
          <img src="/images/gown-orange.png" alt="ชุดครุยศรีปทุม" />
          <Link to="/catalog" className="btn">Shop Now</Link>
        </section>

        <div className="section-head">
          <h2>ชุดครุยยอดนิยม</h2>
          <Link to="/catalog" className="section-link">ดูแคตตาล็อก →</Link>
        </div>

        <div className="grid-4" style={{ marginBottom: '3rem' }}>
          {featured.map((c) => (
            <CostumeCard key={c.id} costume={c} />
          ))}
        </div>
      </div>
    </CustomerLayout>
  );
}
