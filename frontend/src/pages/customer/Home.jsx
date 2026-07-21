import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CustomerLayout from '../../components/CustomerLayout';
import CostumeCard from '../../components/CostumeCard';
import { costumeAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { uniqueCostumesByFaculty } from '../../utils/costumes';

/** ก้อนใหญ่ = สโลแกน · คณะเท่ากันตามสีสายปัจจุบัน */
const SLOGAN = {
  name: 'เช่าชุดครุย SPU ได้ง่ายกับ KruyMo',
  desc: 'มหาวิทยาลัยศรีปทุม · จองออนไลน์ ส่งถึงบ้าน',
  bg: '#F9A8D4',
  full: true,
  decorative: true,
};

/** โชว์รูปปริญญาตรีเป็นตัวอย่าง — เลือกระดับตอนจอง */
const CATEGORIES = [
  {
    name: 'นิเทศศาสตร์',
    desc: 'สายสีเหลือง',
    to: '/catalog?facultyId=fac-comm',
    bg: '#CA8A04',
    img: '/images/gowns/gown-bachelor-yellow.jpg',
  },
  {
    name: 'บริหารธุรกิจ',
    desc: 'สายสีฟ้า',
    to: '/catalog?facultyId=fac-bus',
    bg: '#0284C7',
    img: '/images/gowns/gown-bachelor-blue.jpg',
  },
  {
    name: 'วิศวกรรมศาสตร์',
    desc: 'สายสีแดงเลือดหมู',
    to: '/catalog?facultyId=fac-eng',
    bg: '#7F1D1D',
    img: '/images/gowns/gown-bachelor-maroon.jpg',
  },
  {
    name: 'เทคโนโลยีสารสนเทศ',
    desc: 'สายสีม่วง',
    to: '/catalog?facultyId=fac-it',
    bg: '#7C3AED',
    img: '/images/gowns/gown-bachelor-purple.jpg',
  },
  {
    name: 'ศิลปศาสตร์',
    desc: 'สายสีส้ม',
    to: '/catalog?facultyId=fac-lib',
    bg: '#EA580C',
    img: '/images/gowns/gown-bachelor-orange.jpg',
  },
  {
    name: 'บัญชี',
    desc: 'สายสีเขียว',
    to: '/catalog?facultyId=fac-acc',
    bg: '#059669',
    img: '/images/gowns/gown-bachelor-green.jpg',
  },
  {
    name: 'นิติศาสตร์',
    desc: 'สายสีขาว',
    to: '/catalog?facultyId=fac-law',
    bg: '#111111',
    img: '/images/gowns/gown-bachelor-white.jpg',
  },
];

const TILES = [SLOGAN, ...CATEGORIES];

/** ชุดปัจจุบัน (ตรี) — สลับโชว์ใน Hero แบบเฟด */
const HERO_GOWNS = [
  '/images/gowns/gown-bachelor-yellow.jpg',
  '/images/gowns/gown-bachelor-blue.jpg',
  '/images/gowns/gown-bachelor-maroon.jpg',
  '/images/gowns/gown-bachelor-purple.jpg',
  '/images/gowns/gown-bachelor-orange.jpg',
  '/images/gowns/gown-bachelor-green.jpg',
  '/images/gowns/gown-bachelor-white.jpg',
];

const HERO_FADE_MS = 2200;
const HERO_HOLD_MS = 3800;

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    costumeAPI.getAll({ universityId: 'uni-spu' })
      .then((r) => setFeatured(uniqueCostumesByFaculty(Array.isArray(r.data) ? r.data : [])))
      .catch(() => setFeatured([]));
  }, []);

  useEffect(() => {
    HERO_GOWNS.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setHeroIndex((i) => (i + 1) % HERO_GOWNS.length);
    }, HERO_HOLD_MS + HERO_FADE_MS);
    return () => window.clearInterval(id);
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
              {!user && <Link to="/register" className="btn btn-outline">สมัครสมาชิก</Link>}
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-slideshow" style={{ '--hero-fade-ms': `${HERO_FADE_MS}ms` }}>
              {HERO_GOWNS.map((src, i) => (
                <img
                  key={src}
                  src={src}
                  alt=""
                  className={`hero-slide${i === heroIndex ? ' is-active' : ''}`}
                  decoding="async"
                />
              ))}
            </div>
          </div>
        </section>

        <div className="section-head">
          <div>
            <h2>คณะศรีปทุม</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
              คณะละรูปตามสีสาย — เลือกระดับตรี / โท / เอก ตอนจอง
            </p>
          </div>
          <Link to="/catalog" className="section-link">ดูทั้งหมด →</Link>
        </div>

        <div className="category-bento">
          {TILES.map((cat) => {
            const className = `cat-tile${cat.full ? ' full slogan' : ''}${cat.wide ? ' wide' : ''}${cat.decorative ? ' decorative' : ''}`;
            const style = { background: cat.bg, color: '#fff' };
            const inner = (
              <>
                <div className="cat-tile-copy">
                  <h3>{cat.name}</h3>
                  <p>{cat.desc}</p>
                </div>
                {!cat.decorative && <span className="browse">Browse</span>}
                {cat.img && <img src={cat.img} alt={cat.name} />}
              </>
            );

            if (cat.decorative) {
              return (
                <div key={cat.name} className={className} style={style} aria-hidden="true">
                  {inner}
                </div>
              );
            }

            return (
              <Link key={cat.name} to={cat.to} className={className} style={style}>
                {inner}
              </Link>
            );
          })}
        </div>

        <section className="promo-banner">
          <div>
            <h2>Sripatum<br />Graduation</h2>
            <p>จองชุดครุยศรีปทุมล่วงหน้า เลือกคณะ ไซส์ และช่วงวันเช่าได้ทันที — ส่งถึงบ้านด้วยแมสฯ</p>
          </div>
          <img src="/images/gowns/gown-bachelor-orange.jpg" alt="ชุดครุยศรีปทุม" />
          <Link to="/catalog" className="btn">Shop Now</Link>
        </section>

        <div className="section-head">
          <h2>ชุดครุยตามคณะ</h2>
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
