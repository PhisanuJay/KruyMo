import { useState, useEffect } from 'react';
import { notificationAPI } from '../../../services/api';
import DashboardLayout from '../../../components/DashboardLayout';

const TEMPLATE_LABELS = {
  booking_success: 'จองสำเร็จ',
  payment_verified: 'ยืนยันการชำระเงิน',
  booking_approved: 'อนุมัติการจอง',
  booking_rejected: 'ปฏิเสธการจอง',
  ready_for_pickup: 'พร้อมรับชุด',
  return_reminder: 'แจ้งเตือนใกล้ครบกำหนดคืน',
  deposit_refunded: 'คืนเงินมัดจำ',
};

export default function NotificationTemplates() {
  const [templates, setTemplates] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    notificationAPI.getTemplates().then((r) => setTemplates(r.data));
  }, []);

  const handleSave = async () => {
    await notificationAPI.updateTemplates(templates);
    setMessage('บันทึกเทมเพลตสำเร็จ');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <DashboardLayout role="admin">
      <h1 className="page-title">เทมเพลตแจ้งเตือน</h1>
      <p className="page-subtitle">ตั้งค่าข้อความแจ้งเตือนอัตโนมัติ</p>
      {message && <div className="alert alert-success">{message}</div>}

      <div className="card" style={{ padding: '2rem', maxWidth: 700 }}>
        {Object.entries(TEMPLATE_LABELS).map(([key, label]) => (
          <div className="form-group" key={key}>
            <label>{label}</label>
            <textarea
              className="form-input"
              rows={2}
              value={templates[key] || ''}
              onChange={(e) => setTemplates({ ...templates, [key]: e.target.value })}
            />
            <p style={{ fontSize: '0.75rem', color: '#999', marginTop: '4px' }}>
              ใช้ {'{reason}'} หรือ {'{amount}'} หรือ {'{date}'} สำหรับค่าแปร
            </p>
          </div>
        ))}
        <button className="btn btn-primary" onClick={handleSave}>บันทึกเทมเพลต</button>
      </div>
    </DashboardLayout>
  );
}
