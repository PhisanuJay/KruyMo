import { useState, useEffect } from 'react';
import { reportAPI } from '../../../services/api';
import DashboardLayout from '../../../components/DashboardLayout';
import UniversityTag from '../../../components/UniversityTag';

export default function Reports() {
  const [revenue, setRevenue] = useState(null);
  const [stock, setStock] = useState(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const loadRevenue = () => {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to + 'T23:59:59';
    reportAPI.revenue(params).then((r) => setRevenue(r.data));
  };

  useEffect(() => {
    loadRevenue();
    reportAPI.stock().then((r) => setStock(r.data));
  }, []);

  const exportCSV = () => {
    if (!revenue) return;
    const rows = Object.entries(revenue.byMonth || {}).map(([month, amount]) => `${month},${amount}`);
    const csv = 'เดือน,รายได้\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kruymo-revenue.csv';
    a.click();
  };

  return (
    <DashboardLayout role="admin">
      <h1 className="page-title">รายงาน</h1>
      <p className="page-subtitle">รายได้และสต็อกชุดครุย</p>

      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>รายงานรายได้</h3>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <input className="form-input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ maxWidth: 180 }} />
          <input className="form-input" type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ maxWidth: 180 }} />
          <button className="btn btn-primary btn-sm" onClick={loadRevenue}>กรอง</button>
          <button className="btn btn-outline btn-sm" onClick={exportCSV}>Export CSV</button>
        </div>
        {revenue && (
          <div className="grid-3">
            <div className="stat-card">
              <div className="stat-value">฿{revenue.totalRevenue?.toLocaleString()}</div>
              <div className="stat-label">รายได้รวม ({revenue.count} รายการ)</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#4ECDC4' }}>฿{revenue.totalDeposits?.toLocaleString()}</div>
              <div className="stat-label">มัดจำรวม</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#E17055' }}>฿{revenue.totalPenalties?.toLocaleString()}</div>
              <div className="stat-label">ค่าปรับรวม</div>
            </div>
          </div>
        )}
        {revenue?.byMonth && (
          <div style={{ marginTop: '1.5rem' }}>
            <h4 style={{ fontWeight: 600, marginBottom: '8px' }}>รายได้รายเดือน</h4>
            {Object.entries(revenue.byMonth).map(([month, amount]) => (
              <div key={month} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                <span>{month}</span>
                <strong>฿{amount.toLocaleString()}</strong>
              </div>
            ))}
          </div>
        )}
      </div>

      {stock && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>
            ความจุคลัง (รวม {stock.totalStock} หน่วย จาก inventory)
          </h3>
          <div className="grid-2">
            {stock.byUniversity?.map((item) => (
              <div key={item.university.id} style={{
                padding: '1rem', borderRadius: '12px', background: '#f8f9fa',
                borderLeft: `4px solid ${item.university.color}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <UniversityTag name={item.university.name} color={item.university.color} size="sm" />
                  <strong>{item.totalStock} ชุด</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
