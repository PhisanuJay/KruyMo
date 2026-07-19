import { useState, useEffect } from 'react';
import { reportAPI } from '../../../services/api';
import DashboardLayout from '../../../components/DashboardLayout';

export default function ActivityLog() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    reportAPI.activityLog()
      .then((r) => setLogs(Array.isArray(r.data) ? r.data : []))
      .catch(() => setLogs([]));
  }, []);

  return (
    <DashboardLayout role="admin">
      <h1 className="page-title">ประวัติการทำรายการ</h1>
      <p className="page-subtitle">Log กิจกรรมทั้งหมดในระบบ</p>

      <div className="card table-wrapper">
        <table>
          <thead>
            <tr><th>เวลา</th><th>การกระทำ</th><th>รายละเอียด</th><th>ผู้ใช้</th></tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                  {new Date(log.createdAt).toLocaleString('th-TH')}
                </td>
                <td>
                  <span style={{
                    padding: '2px 8px', borderRadius: '6px', fontSize: '0.8rem',
                    background: '#f0f0f0', fontWeight: 600,
                  }}>
                    {log.action}
                  </span>
                </td>
                <td>{log.details}</td>
                <td style={{ fontSize: '0.8rem', color: '#999' }}>{log.userId?.substring(0, 8) || '-'}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: 'center', color: '#999' }}>ยังไม่มีประวัติ</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
