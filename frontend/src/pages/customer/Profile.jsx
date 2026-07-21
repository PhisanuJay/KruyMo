import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Camera, User, MapPin, Wallet, Lock, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { userAPI, uploadAPI } from '../../services/api';
import CustomerLayout from '../../components/CustomerLayout';
import DeliveryAddressFields, {
  deliveryAddressFromUser,
  normalizeDeliveryAddress,
  validateDeliveryAddress,
} from '../../components/DeliveryAddressFields';
import RefundAccountFields, {
  refundAccountFromUser,
  validateRefundAccount,
  normalizeRefundAccount,
  isRefundAccountEmpty,
} from '../../components/RefundAccountFields';

function applyUserToForm(data, setters) {
  const { setForm, setAddress, setRefundAccount, setAvatar } = setters;
  setForm({
    name: data.name || '',
    phone: data.phone || '',
    email: data.email || '',
  });
  setAddress(deliveryAddressFromUser(data));
  setRefundAccount(refundAccountFromUser(data));
  setAvatar(data.avatar || null);
}

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [address, setAddress] = useState(deliveryAddressFromUser(null));
  const [refundAccount, setRefundAccount] = useState(refundAccountFromUser(null));
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [avatar, setAvatar] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loading, setLoading] = useState(true);
  const avatarInputRef = useRef(null);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    userAPI.get(user.id)
      .then(({ data }) => {
        if (cancelled) return;
        updateUser(data);
        applyUserToForm(data, { setForm, setAddress, setRefundAccount, setAvatar });
      })
      .catch(() => {
        if (cancelled) return;
        applyUserToForm(user, { setForm, setAddress, setRefundAccount, setAvatar });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [user?.id]);

  const handleAvatarPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user) return;
    setUploadingAvatar(true);
    setError('');
    setMessage('');
    try {
      const { data } = await uploadAPI.single(file);
      const { data: updated } = await userAPI.updateAvatar(user.id, data.url);
      updateUser(updated);
      setAvatar(updated.avatar);
      setMessage('อัปเดตรูปโปรไฟล์แล้ว');
    } catch (err) {
      setError(err.response?.data?.error || 'อัปโหลดรูปไม่สำเร็จ');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const name = form.name.trim();
      const phone = form.phone.trim();
      if (!name) {
        setError('กรุณากรอกชื่อ-นามสกุล');
        setSaving(false);
        return;
      }
      if (phone && !/^[0-9+\-\s]{9,15}$/.test(phone)) {
        setError('เบอร์โทรไม่ถูกต้อง');
        setSaving(false);
        return;
      }

      const addressForSave = {
        ...address,
        recipientName: address.recipientName || name,
        recipientPhone: address.recipientPhone || phone,
      };
      const addressErr = validateDeliveryAddress(addressForSave, { required: false });
      if (addressErr) {
        setError(addressErr);
        setSaving(false);
        return;
      }

      const refundForSave = {
        ...refundAccount,
        promptpay: refundAccount.promptpay || phone,
        accountName: refundAccount.accountName || name,
      };
      const refundErr = validateRefundAccount(refundForSave, { required: false });
      if (refundErr) {
        setError(refundErr);
        setSaving(false);
        return;
      }

      if (passwords.newPassword) {
        if (passwords.newPassword.length < 6) {
          setError('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร');
          setSaving(false);
          return;
        }
        if (passwords.newPassword !== passwords.confirmPassword) {
          setError('รหัสผ่านใหม่ไม่ตรงกัน');
          setSaving(false);
          return;
        }
        if (!passwords.currentPassword) {
          setError('กรุณากรอกรหัสผ่านปัจจุบัน');
          setSaving(false);
          return;
        }
      }

      const payload = {
        name,
        phone,
      };

      const hasAddress = Boolean(addressForSave.line1?.trim());
      if (hasAddress) {
        payload.address = normalizeDeliveryAddress(addressForSave);
      }

      if (!isRefundAccountEmpty(refundForSave)) {
        payload.refundAccount = normalizeRefundAccount(refundForSave);
      }

      if (passwords.newPassword) {
        payload.currentPassword = passwords.currentPassword;
        payload.newPassword = passwords.newPassword;
      }

      const { data } = await userAPI.update(user.id, payload);
      updateUser(data);
      applyUserToForm(data, { setForm, setAddress, setRefundAccount, setAvatar });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage('บันทึกโปรไฟล์สำเร็จ — ข้อมูลอัปเดตแล้ว');
    } catch (err) {
      setError(err.response?.data?.error || 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <CustomerLayout>
        <div className="empty-state">กรุณา <Link to="/login">เข้าสู่ระบบ</Link></div>
      </CustomerLayout>
    );
  }

  const initials = (form.name || user.name || '?').trim().charAt(0).toUpperCase();

  return (
    <CustomerLayout>
      <div className="container profile-page">
        <header className="profile-hero">
          <div className="profile-hero-text">
            <p className="profile-kicker">บัญชีของฉัน</p>
            <h1 className="page-title">โปรไฟล์</h1>
            <p className="page-subtitle">
              แก้ไขข้อมูลส่วนตัว ที่อยู่จัดส่ง และบัญชีรับเงินคืนมัดจำ — กดบันทึกเพื่ออัปเดตจริงในระบบ
            </p>
          </div>

          <div className="profile-avatar-block">
            <div className="profile-avatar">
              {avatar ? (
                <img src={avatar} alt="" />
              ) : (
                <span>{initials}</span>
              )}
              <button
                type="button"
                className="profile-avatar-btn"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                aria-label="เปลี่ยนรูปโปรไฟล์"
              >
                {uploadingAvatar ? <Loader2 size={16} className="spin" /> : <Camera size={16} />}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleAvatarPick}
              />
            </div>
            <div className="profile-avatar-meta">
              <strong>{form.name || user.name}</strong>
              <span>{form.email || user.email}</span>
            </div>
          </div>
        </header>

        {message && (
          <div className="alert alert-success profile-alert">
            <CheckCircle2 size={18} />
            <span>{message}</span>
          </div>
        )}
        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="loading">กำลังโหลดโปรไฟล์...</div>
        ) : (
          <form className="profile-form" onSubmit={handleSave}>
            <section className="profile-card">
              <div className="profile-card-head">
                <User size={18} />
                <div>
                  <h2>ข้อมูลส่วนตัว</h2>
                  <p>ชื่อและเบอร์ติดต่อที่ใช้ในระบบจอง</p>
                </div>
              </div>
              <div className="profile-card-body profile-fields-2">
                <div className="form-group">
                  <label htmlFor="profile-name">ชื่อ-นามสกุล *</label>
                  <input
                    id="profile-name"
                    className="form-input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    autoComplete="name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="profile-phone">เบอร์โทร</label>
                  <input
                    id="profile-phone"
                    className="form-input"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="08x-xxx-xxxx"
                    inputMode="tel"
                    autoComplete="tel"
                  />
                </div>
                <div className="form-group profile-field-span">
                  <label htmlFor="profile-email">อีเมล</label>
                  <input
                    id="profile-email"
                    className="form-input"
                    type="email"
                    value={form.email}
                    disabled
                    readOnly
                  />
                  <small className="form-hint">อีเมลที่ยืนยันแล้วเปลี่ยนเองไม่ได้ — ติดต่อร้านหากต้องการแก้</small>
                </div>
              </div>
            </section>

            <section className="profile-card">
              <div className="profile-card-head">
                <MapPin size={18} />
                <div>
                  <h2>ที่อยู่จัดส่งเริ่มต้น</h2>
                  <p>ใช้เติมฟอร์มตอนจองอัตโนมัติ — ตอนจองยังแก้เองได้</p>
                </div>
              </div>
              <div className="profile-card-body">
                <DeliveryAddressFields
                  value={{
                    ...address,
                    recipientName: address.recipientName || form.name,
                    recipientPhone: address.recipientPhone || form.phone,
                  }}
                  onChange={setAddress}
                  compact
                />
              </div>
            </section>

            <section className="profile-card">
              <div className="profile-card-head">
                <Wallet size={18} />
                <div>
                  <h2>บัญชีรับเงินคืนมัดจำ</h2>
                  <p>บันทึกไว้ใช้ตอนแจ้งส่งคืนชุด — ระบบจะเติมให้อัตโนมัติ</p>
                </div>
              </div>
              <div className="profile-card-body">
                <RefundAccountFields
                  value={{
                    ...refundAccount,
                    promptpay: refundAccount.promptpay || form.phone,
                    accountName: refundAccount.accountName || form.name,
                  }}
                  onChange={setRefundAccount}
                  compact
                  title=""
                  hint=""
                />
              </div>
            </section>

            <section className="profile-card">
              <div className="profile-card-head">
                <Lock size={18} />
                <div>
                  <h2>ความปลอดภัย</h2>
                  <p>เปลี่ยนรหัสผ่านเมื่อต้องการ — เว้นว่างไว้ถ้าไม่เปลี่ยน</p>
                </div>
              </div>
              <div className="profile-card-body profile-fields-2">
                <div className="form-group profile-field-span">
                  <label htmlFor="profile-current-password">รหัสผ่านปัจจุบัน</label>
                  <input
                    id="profile-current-password"
                    className="form-input"
                    type="password"
                    value={passwords.currentPassword}
                    onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                    autoComplete="current-password"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="profile-new-password">รหัสผ่านใหม่</label>
                  <input
                    id="profile-new-password"
                    className="form-input"
                    type="password"
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                    autoComplete="new-password"
                    minLength={6}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="profile-confirm-password">ยืนยันรหัสผ่านใหม่</label>
                  <input
                    id="profile-confirm-password"
                    className="form-input"
                    type="password"
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </section>

            <div className="profile-actions">
              <button type="submit" className="btn btn-primary" disabled={saving || uploadingAvatar}>
                {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
              </button>
              <p className="form-hint">กดบันทึกเพื่ออัปเดตข้อมูลในระบบทันที</p>
            </div>
          </form>
        )}
      </div>
    </CustomerLayout>
  );
}
