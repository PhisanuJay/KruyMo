import { Link } from 'react-router-dom';
import {
  Building2,
  GraduationCap,
  CalendarRange,
  Ruler,
  MapPin,
  QrCode,
  Truck,
  PackageCheck,
  ArrowRight,
  Search,
  CreditCard,
  RefreshCw,
} from 'lucide-react';
import CustomerLayout from '../../components/CustomerLayout';

const PHASES = [
  {
    id: 'browse',
    label: 'เลือกชุด',
    range: '01–04',
    icon: Search,
    text: 'เลือกคณะ ระดับปริญญา วันเช่า และไซส์',
  },
  {
    id: 'checkout',
    label: 'จองและชำระ',
    range: '05–06',
    icon: CreditCard,
    text: 'กรอกที่อยู่ โอนเงิน ส่งสลิป และบัญชีรับมัดจำ',
  },
  {
    id: 'fulfill',
    label: 'รับและคืน',
    range: '07–08',
    icon: RefreshCw,
    text: 'รอจัดส่ง รับชุด ส่งคืน แล้วรับมัดจำคืน',
  },
];

const STEPS = [
  {
    n: '01',
    phase: 'browse',
    title: 'เลือกคณะและชุดครุย',
    text: 'เปิดแคตตาล็อกแล้วเลือกคณะที่ต้องการ แต่ละคณะมีสายสีของตัวเอง — หนึ่งคณะหนึ่งชุด เลือกระดับปริญญาตอนจอง',
    tip: 'หน้าแรกแสดงคณะละรูป ไม่แยกระดับปริญญา',
    img: '/images/gowns/gown-bachelor-yellow.jpg',
    icon: Building2,
    mock: 'catalog',
  },
  {
    n: '02',
    phase: 'browse',
    title: 'เลือกระดับปริญญา',
    text: 'ในหน้ารายละเอียดชุด เลือกระดับตรี / โท / เอก ก่อน ระบบจะเช็คสต็อกตามระดับที่เลือก',
    tip: 'ระดับชั้นเลือกตอนจองเท่านั้น',
    img: '/images/gowns/gown-bachelor-purple.jpg',
    icon: GraduationCap,
    mock: 'degree',
  },
  {
    n: '03',
    phase: 'browse',
    title: 'เลือกวันเช่าและวันคืน',
    text: 'เลือกวันเริ่มเช่าและวันคืนชุดบนปฏิทิน ระบบแสดงเฉพาะไซส์ที่ว่างในช่วงนั้น',
    tip: 'เลือกวันให้ครบทั้งสองวันก่อนดูตารางไซส์',
    img: '/images/gowns/gown-bachelor-blue.jpg',
    icon: CalendarRange,
    mock: 'dates',
  },
  {
    n: '04',
    phase: 'browse',
    title: 'เลือกไซส์จากตาราง',
    text: 'คลิกแถวไซส์ที่ว่างตามส่วนสูง แล้วจองเลย หรือเพิ่มลงตะกร้าหากต้องการเช่าหลายชุด',
    tip: 'เทียบส่วนสูงกับตารางไซส์ก่อนยืนยัน',
    img: '/images/gowns/gown-bachelor-green.jpg',
    icon: Ruler,
    mock: 'size',
  },
  {
    n: '05',
    phase: 'checkout',
    title: 'กรอกที่อยู่จัดส่ง',
    text: 'หลังยืนยันจอง กรอกที่อยู่รับชุดในกรุงเทพฯ โดยเลือกเขต แขวง และรหัสไปรษณีย์จากรายการ',
    tip: 'จัดส่งเฉพาะกรุงเทพมหานคร',
    img: '/images/gowns/gown-bachelor-orange.jpg',
    icon: MapPin,
    mock: 'address',
  },
  {
    n: '06',
    phase: 'checkout',
    title: 'โอนเงินและส่งสลิป',
    text: 'สแกน QR PromptPay โอนยอดตามระบบ แล้วอัปโหลดสลิปพร้อมบัญชีรับเงินมัดจำคืน (พร้อมเพย์หรือธนาคาร)',
    tip: 'ต้องส่งสลิปก่อนจึงดูสถานะการจองได้',
    img: '/images/promptpay-qr.png',
    icon: QrCode,
    mock: 'pay',
    qr: true,
  },
  {
    n: '07',
    phase: 'fulfill',
    title: 'รออนุมัติและรับชุด',
    text: 'ร้านตรวจสลิป เตรียมชุด แล้วส่งแมสฯ เมื่อได้รับชุด ให้ตรวจสภาพและกดยืนยันรับสินค้าในระบบ',
    tip: 'ติดตามสถานะได้ที่เมนูประวัติการจอง',
    img: '/images/gowns/gown-bachelor-blue.jpg',
    icon: Truck,
    mock: 'ship',
  },
  {
    n: '08',
    phase: 'fulfill',
    title: 'ส่งคืนและรับมัดจำ',
    text: 'ครบกำหนดแล้วแจ้งส่งคืน — บัญชีรับมัดจำที่บันทึกตอนส่งสลิปจะถูกเติมให้อัตโนมัติ ร้านตรวจชุดแล้วคืนมัดจำ',
    tip: 'ถ่ายรูปสภาพชุดตอนส่งคืนไว้เป็นหลักฐาน',
    img: '/images/gowns/gown-bachelor-white.jpg',
    icon: PackageCheck,
    mock: 'return',
  },
];

function StepMock({ type }) {
  if (type === 'catalog') {
    return (
      <div className="howto-mock" aria-hidden>
        <div className="howto-mock-label">แคตตาล็อก</div>
        <div className="howto-mock-grid">
          <div className="howto-mock-tile" style={{ background: '#F4C430' }}>นิเทศฯ</div>
          <div className="howto-mock-tile" style={{ background: '#2ECC71' }}>บัญชี</div>
          <div className="howto-mock-tile" style={{ background: '#9B59B6' }}>ไอที</div>
          <div className="howto-mock-tile" style={{ background: '#4CC9F0' }}>บริหาร</div>
        </div>
      </div>
    );
  }
  if (type === 'degree') {
    return (
      <div className="howto-mock" aria-hidden>
        <div className="howto-mock-label">ระดับปริญญา</div>
        <div className="howto-mock-stack">
          <div className="howto-mock-chip is-on">ปริญญาตรี</div>
          <div className="howto-mock-chip">ปริญญาโท</div>
          <div className="howto-mock-chip">ปริญญาเอก</div>
        </div>
      </div>
    );
  }
  if (type === 'dates') {
    return (
      <div className="howto-mock" aria-hidden>
        <div className="howto-mock-label">ช่วงวันเช่า</div>
        <div className="howto-mock-cal">
          {Array.from({ length: 14 }).map((_, i) => (
            <span key={i} className={i === 4 || i === 9 ? 'is-range' : i > 4 && i < 9 ? 'is-mid' : ''}>
              {i + 1}
            </span>
          ))}
        </div>
      </div>
    );
  }
  if (type === 'size') {
    return (
      <div className="howto-mock" aria-hidden>
        <div className="howto-mock-label">ตารางไซส์</div>
        <table className="howto-mock-table">
          <thead>
            <tr>
              <th>Size</th>
              <th>สูง</th>
              <th>คงเหลือ</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>S</td>
              <td>155–160</td>
              <td>2</td>
            </tr>
            <tr className="is-on">
              <td>M</td>
              <td>160–165</td>
              <td>3</td>
            </tr>
            <tr>
              <td>L</td>
              <td>165–170</td>
              <td>เต็ม</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
  if (type === 'address') {
    return (
      <div className="howto-mock" aria-hidden>
        <div className="howto-mock-label">ที่อยู่จัดส่ง</div>
        <div className="howto-mock-stack">
          <div className="howto-mock-field">กรุงเทพมหานคร</div>
          <div className="howto-mock-field">เขตบางรัก</div>
          <div className="howto-mock-field">แขวงสีลม</div>
          <div className="howto-mock-field">10500</div>
        </div>
      </div>
    );
  }
  if (type === 'pay') {
    return (
      <div className="howto-mock howto-mock-pay" aria-hidden>
        <div className="howto-mock-label">ชำระเงิน</div>
        <div className="howto-mock-qr-box">
          <img src="/images/promptpay-qr.png" alt="" />
        </div>
        <div className="howto-mock-btn">อัปโหลดสลิป + บัญชีรับมัดจำ</div>
      </div>
    );
  }
  if (type === 'ship') {
    return (
      <div className="howto-mock" aria-hidden>
        <div className="howto-mock-label">สถานะจัดส่ง</div>
        <div className="howto-mock-timeline">
          <span className="is-done">ชำระแล้ว</span>
          <span className="is-done">เตรียมชุด</span>
          <span className="is-on">กำลังจัดส่ง</span>
          <span>ส่งถึงแล้ว</span>
        </div>
      </div>
    );
  }
  return (
    <div className="howto-mock" aria-hidden>
      <div className="howto-mock-label">ส่งคืนชุด</div>
      <div className="howto-mock-stack">
        <div className="howto-mock-field">แจ้งส่งคืนชุด</div>
        <div className="howto-mock-field">บัญชีรับมัดจำ (เติมอัตโนมัติ)</div>
        <div className="howto-mock-btn soft">ส่งคำขอคืนชุด</div>
      </div>
    </div>
  );
}

export default function HowToRent() {
  return (
    <CustomerLayout>
      <div className="howto-page">
        <section className="howto-hero">
          <div className="howto-hero-bg" aria-hidden>
            <span className="howto-hero-mark">08</span>
            <span className="howto-hero-rule" />
          </div>
          <div className="container howto-hero-inner">
            <div className="howto-hero-copy">
              <p className="howto-brand">KruyMo</p>
              <h1>เช่าชุดครุยใน 8 ขั้นตอน</h1>
              <p>
                จากเลือกคณะจนถึงรับมัดจำคืน — ชัดเจน ติดตามได้ทุกสถานะ
                และจัดส่งแมสฯ ในกรุงเทพฯ
              </p>
              <div className="howto-hero-actions">
                <Link to="/catalog" className="btn btn-primary">
                  เริ่มเลือกชุดครุย
                  <ArrowRight size={18} />
                </Link>
                <a href="#howto-process" className="btn howto-hero-secondary">
                  ดูรายละเอียดขั้นตอน
                </a>
              </div>
            </div>
            <aside className="howto-hero-aside" aria-hidden>
              <p className="howto-hero-aside-label">Process</p>
              <ol className="howto-hero-rail">
                <li><span>01–04</span>เลือกชุด</li>
                <li><span>05–06</span>จองและชำระ</li>
                <li><span>07–08</span>รับและคืน</li>
              </ol>
            </aside>
          </div>
        </section>

        <section className="howto-phases" aria-label="ภาพรวม 3 ช่วง">
          <div className="container">
            <div className="howto-phases-head">
              <h2>ภาพรวมการเช่า</h2>
              <p>แบ่งเป็น 3 ช่วง ทำตามลำดับได้ทันที</p>
            </div>
            <div className="howto-phases-grid">
              {PHASES.map((phase, i) => {
                const Icon = phase.icon;
                return (
                  <a key={phase.id} href={`#phase-${phase.id}`} className="howto-phase">
                    <span className="howto-phase-index">{String(i + 1).padStart(2, '0')}</span>
                    <div className="howto-phase-icon">
                      <Icon size={22} strokeWidth={2} />
                    </div>
                    <div className="howto-phase-body">
                      <p className="howto-phase-range">ขั้น {phase.range}</p>
                      <h3>{phase.label}</h3>
                      <p>{phase.text}</p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        <section id="howto-process" className="howto-process">
          <div className="container">
            <div className="howto-process-head">
              <h2>รายละเอียดทีละขั้น</h2>
              <p>ทำตามลำดับนี้ ระบบจะพาคุณจนถึงส่งคืนและรับมัดจำ</p>
            </div>

            <ol className="howto-timeline">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                const showPhase =
                  index === 0 || STEPS[index - 1].phase !== step.phase;
                const phase = PHASES.find((p) => p.id === step.phase);
                const reverse = index % 2 === 1;

                return (
                  <li
                    key={step.n}
                    id={showPhase ? `phase-${step.phase}` : undefined}
                    className={`howto-step${reverse ? ' is-reverse' : ''}`}
                  >
                    {showPhase && phase && (
                      <div className="howto-phase-marker">
                        <span>{phase.label}</span>
                        <span>ขั้น {phase.range}</span>
                      </div>
                    )}

                    <div className="howto-step-rail" aria-hidden>
                      <span className="howto-step-dot">{step.n}</span>
                    </div>

                    <div className="howto-step-panel">
                      <div className="howto-step-visual">
                        <div className={`howto-step-photo${step.qr ? ' is-qr-wrap' : ''}`}>
                          <img
                            src={step.img}
                            alt=""
                            className={step.qr ? 'is-qr' : ''}
                          />
                        </div>
                        <StepMock type={step.mock} />
                      </div>

                      <div className="howto-step-copy">
                        <div className="howto-step-icon" aria-hidden>
                          <Icon size={20} strokeWidth={2} />
                        </div>
                        <p className="howto-step-label">ขั้นตอนที่ {step.n}</p>
                        <h3>{step.title}</h3>
                        <p>{step.text}</p>
                        <p className="howto-tip">
                          <span>หมายเหตุ</span>
                          {step.tip}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
      </div>
    </CustomerLayout>
  );
}
