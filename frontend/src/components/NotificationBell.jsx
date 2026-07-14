import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { notificationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const POLL_MS = 10000;

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await notificationAPI.getAll();
      setNotifications(data);
    } catch {
      // ignore transient errors
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return undefined;
    }

    load();
    const timer = setInterval(load, POLL_MS);

    const onFocus = () => load();
    const onVisible = () => {
      if (document.visibilityState === 'visible') load();
    };
    const onRefresh = () => load();

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('kruymo:notifications-refresh', onRefresh);

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('kruymo:notifications-refresh', onRefresh);
    };
  }, [user, load]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = notifications.filter((n) => !n.isRead).length;

  const markAllRead = async () => {
    await notificationAPI.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markOneRead = async (id, isRead) => {
    if (isRead) return;
    try {
      await notificationAPI.markRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch {
      // ignore
    }
  };

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) load();
  };

  if (!user) return null;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={toggleOpen}
        style={{
          background: 'none', border: 'none', position: 'relative',
          cursor: 'pointer', padding: '8px',
        }}
        aria-label="การแจ้งเตือน"
      >
        <Bell size={22} color="#2D3436" />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2,
            background: '#FF6B6B', color: 'white', borderRadius: '50%',
            width: 18, height: 18, fontSize: '0.7rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {unread > 9 ? '9+' : unread}
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
              <button
                key={n.id}
                type="button"
                onClick={() => markOneRead(n.id, n.isRead)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '12px 16px', border: 'none', borderBottom: '1px solid #f5f5f5',
                  background: n.isRead ? 'white' : '#FFF8F0',
                  cursor: 'pointer',
                }}
              >
                <p style={{ fontSize: '0.85rem', marginBottom: 4 }}>{n.message}</p>
                <p style={{ fontSize: '0.75rem', color: '#999' }}>
                  {new Date(n.createdAt).toLocaleString('th-TH')}
                </p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
