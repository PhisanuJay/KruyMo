import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Eye, Clock, CheckCircle2, Shirt, Wallet, CalendarDays, Users, Truck } from 'lucide-react';
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

function notificationIcon(type) {
  if (type?.includes('approve') || type?.includes('success') || type?.includes('refund')) {
    return { Icon: CheckCircle2, color: '#16A34A', bg: '#DCFCE7' };
  }
  if (type?.includes('ready') || type?.includes('pickup')) {
    return { Icon: Shirt, color: '#2563EB', bg: '#DBEAFE' };
  }
  if (type?.includes('reject') || type?.includes('fail')) {
    return { Icon: AlertTriangle, color: '#DC2626', bg: '#FEE2E2' };
  }
  return { Icon: Clock, color: '#D97706', bg: '#FEF3C7' };
}

function MetricCard({ icon: Icon, iconColor, iconBg, label, value, unit }) {
  return (
    <div className="metric-card">
      <div className="metric-card-icon" style={{ color: iconColor, background: iconBg }}>
        <Icon size={20} />
      </div>
      <div className="metric-card-body">
        <div className="metric-card-label">{label}</div>
        <div className="metric-card-value">{value}</div>
        <div className="metric-card-unit">{unit}</div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    reportAPI.dashboard().then((r) => setData(r.data)).catch(() => setData(null));
  }, []);

  if (!data) {
    return (
      <DashboardLayout role="admin">
        <div className="loading">กำลังโหลด...</div>
      </DashboardLayout>
    );
  }

  const yearBe = new Date().getFullYear() + 543;

  return (
    <DashboardLayout role="admin">
      <h1 className="page-title">ภาพรวมระบบ</h1>
      <p className="page-subtitle">สถิติและข้อมูลสำคัญของ KruyMo</p>

      {data.opsQueue && (
        data.opsQueue.readyToShip + data.opsQueue.outForDelivery + data.opsQueue.returnSubmitted + data.opsQueue.awaitingRefund > 0
      ) && (
        <div className="alert alert-info" style={{ marginBottom: '1.25rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem 1.25rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
            <Truck size={16} />
            คิวงานปฏิบัติการ
          </span>
          {data.opsQueue.readyToShip > 0 && <span>พร้อมส่ง {data.opsQueue.readyToShip}</span>}
          {data.opsQueue.outForDelivery > 0 && <span>กำลังส่ง {data.opsQueue.outForDelivery}</span>}
          {data.opsQueue.returnSubmitted > 0 && <span>รอรับคืน {data.opsQueue.returnSubmitted}</span>}
          {data.opsQueue.awaitingRefund > 0 && <span>รอคืนมัดจำ {data.opsQueue.awaitingRefund}</span>}
          {(data.opsQueue.readyToShip + data.opsQueue.outForDelivery + data.opsQueue.returnSubmitted) > 0 && (
            <Link to="/admin/dispatch" className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }}>
              ไปคิวส่งแมสฯ / รับคืน
            </Link>
          )}
          {data.opsQueue.awaitingRefund > 0 && (
            <Link to="/admin/refund" className="btn btn-outline btn-sm" style={data.opsQueue.readyToShip + data.opsQueue.outForDelivery + data.opsQueue.returnSubmitted === 0 ? { marginLeft: 'auto' } : undefined}>
              ดูคิวคืนมัดจำ
            </Link>
          )}
        </div>
      )}

      <div className="dash-stats-grid" style={{ marginBottom: '1.25rem' }}>
        <MetricCard
          icon={Wallet}
          iconColor="#E63946"
          iconBg="#FFE4E6"
          label="รายได้วันนี้"
          value={formatBaht(data.todayRevenue ?? 0)}
          unit={`จาก ${data.todayPaidCount ?? 0} รายการ`}
        />
        <MetricCard
          icon={CalendarDays}
          iconColor="#16A34A"
          iconBg="#DCFCE7"
          label="การเช่าวันนี้"
          value={data.todayRentals ?? 0}
          unit="รายการ"
        />
        <MetricCard
          icon={Shirt}
          iconColor="#2563EB"
          iconBg="#DBEAFE"
          label="ชุดคงเหลือ"
          value={data.totalStock ?? 0}
          unit="ชุด"
        />
        <MetricCard
          icon={Clock}
          iconColor="#D97706"
          iconBg="#FEF3C7"
          label="รออนุมัติ"
          value={data.pendingApproval ?? 0}
          unit="รายการ"
        />
        <MetricCard
          icon={Users}
          iconColor="#7C3AED"
          iconBg="#EDE9FE"
          label="สมาชิกทั้งหมด"
          value={data.totalMembers ?? 0}
          unit="คน"
        />
        <MetricCard
          icon={AlertTriangle}
          iconColor="#E63946"
          iconBg="#FFE4E6"
          label="ใกล้ครบกำหนดคืน"
          value={data.nearReturnDeadline ?? 0}
          unit="รายการ"
        />
      </div>

      <div className="dash-main-grid">
        <section className="dash-panel">
          <div className="dash-panel-head">
            <h3>รายได้รายเดือน (ปี {yearBe})</h3>
            <Link to="/admin/reports" className="dash-link">ดูทั้งหมด &gt;</Link>
          </div>
          <MonthlyRevenueChart data={data.monthlyRevenue} />
        </section>

        <section className="dash-panel">
          <div className="dash-panel-head">
            <h3>สถานะชุดครุย</h3>
            <Link to="/admin/costumes" className="dash-link">ดูทั้งหมด &gt;</Link>
          </div>
          <GownStatusDonut items={data.gownStatus || []} total={data.gownTotal || 0} />
        </section>

        <section className="dash-panel dash-notif-panel">
          <div className="dash-panel-head">
            <h3>การแจ้งเตือนล่าสุด</h3>
            <Link to="/admin/notifications" className="dash-link">ดูทั้งหมด &gt;</Link>
          </div>
          <ul className="dash-notif-list">
            {(data.recentNotifications || []).length === 0 && (
              <li className="dash-empty">ยังไม่มีการแจ้งเตือน</li>
            )}
            {data.recentNotifications?.map((n) => {
              const { Icon, color, bg } = notificationIcon(n.type);
              return (
                <li key={n.id} className={!n.isRead ? 'unread' : ''}>
                  <div className="dash-notif-icon" style={{ color, background: bg }}>
                    <Icon size={16} />
                  </div>
                  <p className="dash-notif-msg">{n.message}</p>
                  <div className="dash-notif-meta">
                    <span>{n.timeLabel} น.</span>
                    {!n.isRead && <span className="dash-unread-dot" />}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <section className="dash-panel" style={{ marginTop: '1.25rem' }}>
        <div className="dash-panel-head">
          <h3>การจองล่าสุด</h3>
          <Link to="/admin/bookings" className="dash-link">ดูทั้งหมด &gt;</Link>
        </div>
        <div className="table-wrapper">
          <table className="dash-bookings-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>ลูกค้า</th>
                <th>มหาวิทยาลัย</th>
                <th>ชุดครุย</th>
                <th>สถานะ</th>
                <th>กำหนดคืน</th>
                <th>ยอดรวม</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {(data.recentBookings || []).length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: '#6B7280' }}>ยังไม่มีการจอง</td>
                </tr>
              )}
              {data.recentBookings?.map((b) => (
                <tr key={b.id}>
                  <td className="dash-order-id">{b.orderId}</td>
                  <td>{b.customerName}</td>
                  <td>{b.universityName}</td>
                  <td>{b.degreeShort}</td>
                  <td><StatusBadge status={b.status} size="sm" /></td>
                  <td>{formatThaiDate(b.endDate)}</td>
                  <td>{formatBaht(b.totalPrice)}</td>
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
      </section>
    </DashboardLayout>
  );
}
