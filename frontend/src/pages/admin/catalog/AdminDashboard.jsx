import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, Eye, Clock, Shirt, Wallet, CalendarDays, Users,
  Truck, Receipt, ArrowRight, Package,
} from 'lucide-react';
import { reportAPI } from '../../../services/api';
import DashboardLayout from '../../../components/DashboardLayout';
import StatusBadge from '../../../components/StatusBadge';

function formatThaiDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear() + 543}`;
}

function formatBaht(n) {
  return `฿${(n || 0).toLocaleString('th-TH')}`;
}

function MonthlyRevenueChart({ data }) {
  const [hover, setHover] = useState(null);
  const width = 520;
  const height = 220;
  const pad = { top: 20, right: 20, bottom: 36, left: 44 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const maxVal = Math.max(...(data?.map((d) => d.amount) || [0]), 10000);
  const step = Math.ceil(maxVal / 5 / 10000) * 10000 || 10000;
  const yMax = step * 5;

  if (!data?.length) {
    return <div className="dash-empty">ยังไม่มีข้อมูลรายได้</div>;
  }

  const points = data.map((d, i) => {
    const x = pad.left + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
    const y = pad.top + innerH - (d.amount / yMax) * innerH;
    return { ...d, x, y };
  });

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const yTicks = [0, 1, 2, 3, 4, 5].map((i) => i * step);

  return (
    <div className="dash-chart-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} className="dash-line-chart" role="img" aria-label="กราฟรายได้รายเดือน">
        {yTicks.map((val) => {
          const y = pad.top + innerH - (val / yMax) * innerH;
          return (
            <g key={val}>
              <line x1={pad.left} y1={y} x2={width - pad.right} y2={y} stroke="#EEE" strokeWidth="1" />
              <text x={pad.left - 8} y={y + 4} textAnchor="end" className="dash-axis-label">
                {val === 0 ? '0' : `${val / 1000}K`}
              </text>
            </g>
          );
        })}
        <path d={path} fill="none" stroke="#E63946" strokeWidth="2.5" strokeLinejoin="round" />
        {points.map((p) => (
          <g key={p.key}>
            <circle
              cx={p.x}
              cy={p.y}
              r={hover?.key === p.key ? 6 : 4.5}
              fill="#fff"
              stroke="#E63946"
              strokeWidth="2.5"
              onMouseEnter={() => setHover(p)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: 'pointer' }}
            />
            <text x={p.x} y={height - 10} textAnchor="middle" className="dash-axis-label">{p.label}</text>
          </g>
        ))}
      </svg>
      {hover && (
        <div
          className="dash-chart-tooltip"
          style={{
            left: `${(hover.x / width) * 100}%`,
            top: `${(hover.y / height) * 100}%`,
          }}
        >
          {hover.label} {hover.buddhistYear} {formatBaht(hover.amount)}
        </div>
      )}
    </div>
  );
}

function GownStatusDonut({ items, total }) {
  const size = 160;
  const stroke = 28;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="dash-donut-row">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="dash-donut">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F1F5F9" strokeWidth={stroke} />
        {items.map((item) => {
          const len = total ? (item.count / total) * c : 0;
          const el = (
            <circle
              key={item.key}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={item.color}
              strokeWidth={stroke}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <ul className="dash-donut-legend">
        {items.map((item) => (
          <li key={item.key}>
            <span className="dash-legend-dot" style={{ background: item.color }} />
            <span>
              {item.label} <strong>{item.count}</strong> ชุด ({item.percent}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    setLoadError(false);
    reportAPI.dashboard()
      .then((r) => setData(r.data || null))
      .catch(() => {
        setData(null);
        setLoadError(true);
      });
  }, []);

  const todayLabel = useMemo(() => new Date().toLocaleDateString('th-TH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }), []);

  if (!data) {
    return (
      <DashboardLayout role="admin">
        <div className="admin-desk">
          <div className="admin-empty">
            {loadError ? 'โหลดภาพรวมไม่สำเร็จ — ลองรีเฟรชหน้า' : 'กำลังโหลดภาพรวมระบบ...'}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const yearBe = new Date().getFullYear() + 543;
  const ops = data.opsQueue || {};
  const shipCount = (ops.readyToShip || 0) + (ops.outForDelivery || 0) + (ops.returnSubmitted || 0);
  const pendingSlip = data.pendingApproval || 0;
  const awaitRefund = ops.awaitingRefund || 0;
  const focusCount = pendingSlip + shipCount + awaitRefund + (data.nearReturnDeadline || 0);

  const actionCards = [
    {
      key: 'slip',
      label: 'รอตรวจสลิป',
      value: pendingSlip,
      hint: pendingSlip > 0 ? 'ต้องตรวจยืนยันการชำระเงิน' : 'ไม่มีคิวรอตรวจ',
      icon: Receipt,
      to: '/admin/dispatch?queue=approve',
      tone: 'red',
    },
    {
      key: 'ship',
      label: 'จัดส่งและรับคืน',
      value: shipCount,
      hint: [
        ops.readyToShip ? `พร้อมส่ง ${ops.readyToShip}` : null,
        ops.outForDelivery ? `กำลังส่ง ${ops.outForDelivery}` : null,
        ops.returnSubmitted ? `รอรับคืน ${ops.returnSubmitted}` : null,
      ].filter(Boolean).join(' · ') || 'ไม่มีคิวปฏิบัติการ',
      icon: Truck,
      to: '/admin/dispatch',
      tone: 'dark',
    },
    {
      key: 'refund',
      label: 'รอคืนมัดจำ',
      value: awaitRefund,
      hint: awaitRefund > 0 ? 'ติดตามคิวคืนเงินมัดจำ' : 'ยังไม่มีคิวคืนมัดจำ',
      icon: Wallet,
      to: '/admin/refund',
      tone: 'green',
    },
  ];

  const kpis = [
    {
      label: 'รายได้วันนี้',
      value: formatBaht(data.todayRevenue ?? 0),
      unit: `จาก ${data.todayPaidCount ?? 0} รายการ`,
      icon: Wallet,
      tone: 'red',
    },
    {
      label: 'การเช่าวันนี้',
      value: data.todayRentals ?? 0,
      unit: 'รายการ',
      icon: CalendarDays,
      tone: 'dark',
    },
    {
      label: 'ว่างในคลัง',
      value: data.totalStock ?? 0,
      unit: 'หน่วยว่างจาก inventory',
      icon: Shirt,
      tone: 'muted',
    },
    {
      label: 'สมาชิกทั้งหมด',
      value: data.totalMembers ?? 0,
      unit: 'บัญชีลูกค้า',
      icon: Users,
      tone: 'muted',
    },
  ];

  return (
    <DashboardLayout role="admin">
      <div className="admin-desk">
        <header className="admin-hero">
          <div className="admin-hero-copy">
            <p className="admin-hero-kicker">วันนี้ · {todayLabel}</p>
            <h1>ภาพรวมระบบ</h1>
            <p>ดูงานที่ต้องติดตามก่อน แล้วค่อยดูตัวเลขสรุปและรายงาน</p>
          </div>
          <div className="admin-hero-aside">
            <span>งานที่ต้องโฟกัส</span>
            <strong>{focusCount}</strong>
            <small>สลิป · จัดส่ง · คืนมัดจำ · ใกล้ครบกำหนด</small>
          </div>
        </header>

        {(data.nearReturnDeadline || 0) > 0 && (
          <Link to="/admin/bookings?group=renting" className="admin-alert">
            <AlertTriangle size={18} />
            <div>
              <strong>ใกล้ครบกำหนดคืน {data.nearReturnDeadline} รายการ</strong>
              <span>ตรวจคำสั่งที่กำลังเช่า เพื่อติดตามการส่งคืน</span>
            </div>
            <ArrowRight size={18} />
          </Link>
        )}

        <section className="admin-section">
          <div className="admin-section-head">
            <h2>ต้องทำวันนี้</h2>
            <p>งานปฏิบัติการที่ควรรีบติดตาม</p>
          </div>
          <div className="admin-action-grid">
            {actionCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link key={card.key} to={card.to} className={`admin-action-card tone-${card.tone}`}>
                  <div className="admin-action-top">
                    <span className="admin-action-icon"><Icon size={18} /></span>
                    <ArrowRight size={16} className="admin-action-arrow" />
                  </div>
                  <span className="admin-action-label">{card.label}</span>
                  <strong className="admin-action-value">{card.value}</strong>
                  <span className="admin-action-hint">{card.hint}</span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="admin-section">
          <div className="admin-section-head">
            <h2>ตัวเลขสรุป</h2>
            <p>ภาพรวมธุรกิจวันนี้</p>
          </div>
          <div className="admin-kpi-grid">
            {kpis.map((k) => {
              const Icon = k.icon;
              return (
                <article key={k.label} className={`admin-kpi tone-${k.tone}`}>
                  <span className="admin-kpi-icon"><Icon size={18} /></span>
                  <div>
                    <span className="admin-kpi-label">{k.label}</span>
                    <strong className="admin-kpi-value">{k.value}</strong>
                    <span className="admin-kpi-unit">{k.unit}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <div className="admin-split-grid">
          <section className="admin-panel">
            <div className="admin-panel-head">
              <h3>รายได้รายเดือน (ปี {yearBe})</h3>
              <Link to="/admin/reports" className="admin-link">ดูรายงาน</Link>
            </div>
            <MonthlyRevenueChart data={data.monthlyRevenue} />
          </section>

          <section className="admin-panel">
            <div className="admin-panel-head">
              <h3>สถานะชุดครุย</h3>
              <Link to="/admin/costumes" className="admin-link">จัดการชุด</Link>
            </div>
            <GownStatusDonut items={data.gownStatus || []} total={data.gownTotal || 0} />
          </section>
        </div>

        <section className="admin-panel" style={{ marginTop: '1.15rem' }}>
          <div className="admin-panel-head">
            <div>
              <h3>คำสั่งล่าสุด</h3>
              <p className="admin-panel-sub">รายการจองล่าสุดในระบบ</p>
            </div>
            <Link to="/admin/bookings" className="admin-link">ดูทั้งหมด</Link>
          </div>
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>เลขจอง</th>
                  <th>ลูกค้า</th>
                  <th>ชุดครุย</th>
                  <th>ยอดรวม</th>
                  <th>สถานะ</th>
                  <th>ดู</th>
                </tr>
              </thead>
              <tbody>
                {(data.recentBookings || []).length === 0 && (
                  <tr>
                    <td colSpan={6} className="admin-table-empty">
                      <Package size={20} />
                      ยังไม่มีการจอง
                    </td>
                  </tr>
                )}
                {data.recentBookings?.map((b) => (
                  <tr key={b.id}>
                    <td className="admin-order-id">{b.orderId}</td>
                    <td>
                      <div className="admin-cell-main">{b.customerName}</div>
                      <div className="admin-cell-sub">{b.universityName || '—'}</div>
                    </td>
                    <td>{b.degreeShort || b.costumeName || '—'}</td>
                    <td className="admin-cell-money">{formatBaht(b.totalPrice)}</td>
                    <td><StatusBadge status={b.status} size="sm" /></td>
                    <td>
                      <Link to={`/admin/bookings/${b.id}`} className="dash-view-btn" title="ดูรายละเอียด">
                        <Eye size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-panel-foot">
            <Link to="/admin/notifications" className="admin-foot-link">
              <Clock size={14} />
              จัดการเทมเพลตแจ้งเตือน
            </Link>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
