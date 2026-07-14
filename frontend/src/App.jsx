import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Home from './pages/customer/Home';
import Catalog from './pages/customer/Catalog';
import CostumeDetail from './pages/customer/CostumeDetail';
import BookingForm from './pages/customer/BookingForm';
import Payment from './pages/customer/Payment';
import Profile from './pages/customer/Profile';
import BookingHistory from './pages/customer/BookingHistory';
import BookingDetail from './pages/customer/BookingDetail';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

import StaffDashboard from './pages/staff/StaffDashboard';
import StaffBookings from './pages/staff/StaffBookings';
import PickupReturn from './pages/staff/PickupReturn';
import DepositRefund from './pages/staff/DepositRefund';

/* Admin — catalog (คนที่ 1) */
import AdminDashboard from './pages/admin/catalog/AdminDashboard';
import CostumeManager from './pages/admin/catalog/CostumeManager';
import MasterDataManager from './pages/admin/catalog/MasterDataManager';
import AllBookings from './pages/admin/catalog/AllBookings';
/* Admin — system (คนที่ 2) */
import UserManager from './pages/admin/system/UserManager';
import Reports from './pages/admin/system/Reports';
import ActivityLog from './pages/admin/system/ActivityLog';
import NotificationTemplates from './pages/admin/system/NotificationTemplates';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">กำลังโหลด...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/catalog" element={<Catalog />} />
      <Route path="/costume/:id" element={<CostumeDetail />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Customer */}
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/booking/:id" element={<ProtectedRoute roles={['customer']}><BookingForm /></ProtectedRoute>} />
      <Route path="/payment/:bookingId" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
      <Route path="/bookings" element={<ProtectedRoute><BookingHistory /></ProtectedRoute>} />
      <Route path="/bookings/:id" element={<ProtectedRoute><BookingDetail /></ProtectedRoute>} />

      {/* Staff */}
      <Route path="/staff" element={<ProtectedRoute roles={['staff', 'admin']}><StaffDashboard /></ProtectedRoute>} />
      <Route path="/staff/bookings" element={<ProtectedRoute roles={['staff', 'admin']}><StaffBookings /></ProtectedRoute>} />
      <Route path="/staff/pickup-return" element={<ProtectedRoute roles={['staff', 'admin']}><PickupReturn /></ProtectedRoute>} />
      <Route path="/staff/refund" element={<ProtectedRoute roles={['staff', 'admin']}><DepositRefund /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/bookings" element={<ProtectedRoute roles={['admin']}><AllBookings /></ProtectedRoute>} />
      <Route path="/admin/costumes" element={<ProtectedRoute roles={['admin']}><CostumeManager /></ProtectedRoute>} />
      <Route path="/admin/master-data" element={<ProtectedRoute roles={['admin']}><MasterDataManager /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><UserManager /></ProtectedRoute>} />
      <Route path="/admin/pickup-return" element={<ProtectedRoute roles={['admin']}><PickupReturn /></ProtectedRoute>} />
      <Route path="/admin/refund" element={<ProtectedRoute roles={['admin']}><DepositRefund /></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute roles={['admin']}><Reports /></ProtectedRoute>} />
      <Route path="/admin/activity" element={<ProtectedRoute roles={['admin']}><ActivityLog /></ProtectedRoute>} />
      <Route path="/admin/notifications" element={<ProtectedRoute roles={['admin']}><NotificationTemplates /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
