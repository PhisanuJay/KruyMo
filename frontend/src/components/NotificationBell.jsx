import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { notificationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!user) return;
    notificationAPI.getAll().then((r) => setNotifications(r.data)).catch(() => {});
  }, [user]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = notifications.filter((n) => !n.isRead).length;

  const markAllRead = async () => {
    await notificationAPI.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  if (!user) return null;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: 'none', border: 'none', position: 'relative',
          cursor: 'pointer', padding: '8px',
        }}
      >
        <Bell size={22} color="#2D3436" />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2,
            background: '#FF6B6B', color: 'white', borderRadius: '50%',
            width: 18, height: 18, fontSize: '0.7rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', marginTop: 8,
          background: 'white', borderRadius: '16px', boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
          width: 320, maxHeight: 400, overflowY: 'auto', zIndex: 200,
        }}>
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid #eee',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <strong>การแจ้งเตือน</strong>
            {unread > 0 && (
              <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: '#FF6B6B', fontSize: '0.8rem', cursor: 'pointer' }}>
                อ่านทั้งหมด
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>ไม่มีการแจ้งเตือน</p>
          ) : (
            notifications.slice(0, 10).map((n) => (
              <div key={n.id} style={{
                padding: '12px 16px', borderBottom: '1px solid #f5f5f5',
                background: n.isRead ? 'white' : '#FFF8F0',
              }}>
                <p style={{ fontSize: '0.85rem', marginBottom: 4 }}>{n.message}</p>
                <p style={{ fontSize: '0.75rem', color: '#999' }}>
                  {new Date(n.createdAt).toLocaleString('th-TH')}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
