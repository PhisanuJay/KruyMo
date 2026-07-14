import { useState, useEffect } from 'react';
import { userAPI } from '../../../services/api';
import DashboardLayout from '../../../components/DashboardLayout';

const ROLE_LABELS = { customer: 'ลูกค้า', staff: 'พนักงาน', admin: 'แอดมิน' };
const ROLE_COLORS = { customer: '#74B9FF', staff: '#A29BFE', admin: '#FF6B6B' };

export default function UserManager() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    userAPI.getAll().then((r) => setUsers(r.data));
  }, []);

  const handleRoleChange = async (id, role) => {
    const { data } = await userAPI.update(id, { role });
    setUsers((prev) => prev.map((u) => (u.id === id ? data : u)));
  };

  return (
    <DashboardLayout role="admin">
      <h1 className="page-title">จัดการผู้ใช้</h1>
      <p className="page-subtitle">กำหนดสิทธิ์ role ให้ผู้ใช้งาน</p>

      <div className="card table-wrapper">
        <table>
          <thead>
            <tr><th>ชื่อ</th><th>อีเมล</th><th>เบอร์โทร</th><th>Role</th><th>เปลี่ยนสิทธิ์</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', background: ROLE_COLORS[u.role],
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.8rem',
                    }}>
                      {u.name?.[0]}
                    </div>
                    {u.name}
                  </div>
                </td>
                <td>{u.email}</td>
                <td>{u.phone || '-'}</td>
                <td>
                  <span style={{
                    padding: '4px 12px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 600,
                    color: 'white', background: ROLE_COLORS[u.role],
                  }}>
                    {ROLE_LABELS[u.role]}
                  </span>
                </td>
                <td>
                  <select className="form-input" style={{ maxWidth: 140 }} value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}>
                    <option value="customer">ลูกค้า</option>
                    <option value="staff">พนักงาน</option>
                    <option value="admin">แอดมิน</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
