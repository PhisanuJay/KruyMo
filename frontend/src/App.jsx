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
import Favorites from './pages/customer/Favorites';
import Cart from './pages/customer/Cart';
import HowToRent from './pages/customer/HowToRent';
import About from './pages/customer/About';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyEmail from './pages/auth/VerifyEmail';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

import StaffDashboard from './pages/staff/StaffDashboard';
import StaffBookings from './pages/staff/StaffBookings';
import StaffDispatch from './pages/staff/StaffDispatch';
import DepositRefund from './pages/staff/DepositRefund';

/* Admin — catalog (คนที่ 1) */
import AdminDashboard from './pages/admin/catalog/AdminDashboard';
import CostumeManager from './pages/admin/catalog/CostumeManager';
import MasterDataManager from './pages/admin/catalog/MasterDataManager';
import AllBookings from './pages/admin/catalog/AllBookings';
import AdminBookingDetail from './pages/admin/catalog/AdminBookingDetail';
/* Admin — system (คนที่ 2) */
import UserManager from './pages/admin/system/UserManager';
import Reports from './pages/admin/system/Reports';
import ActivityLog from './pages/admin/system/ActivityLog';
import NotificationTemplates from './pages/admin/system/NotificationTemplates';
import AdminRefund from './pages/admin/system/AdminRefund';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">กำลังโหลด...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    if (user.role === 'staff') return <Navigate to="/staff" replace />;
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/how-to-rent" element={<HowToRent />} />
      <Route path="/about" element={<About />} />
      <Route path="/catalog" element={<Catalog />} />
      <Route path="/costume/:id" element={<CostumeDetail />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Customer */}
      <Route path="/profile" element={<ProtectedRoute roles={['customer']}><Profile /></ProtectedRoute>} />
      <Route path="/booking/:id" element={<ProtectedRoute roles={['customer']}><BookingForm /></ProtectedRoute>} />
      <Route path="/payment/:bookingId" element={<ProtectedRoute roles={['customer']}><Payment /></ProtectedRoute>} />
      <Route path="/bookings" element={<ProtectedRoute roles={['customer']}><BookingHistory /></ProtectedRoute>} />
      <Route path="/bookings/:id" element={<ProtectedRoute roles={['customer']}><BookingDetail /></ProtectedRoute>} />
      <Route path="/favorites" element={<ProtectedRoute roles={['customer']}><Favorites /></ProtectedRoute>} />
      <Route path="/cart" element={<ProtectedRoute roles={['customer']}><Cart /></ProtectedRoute>} />

      {/* Staff */}
      <Route path="/staff" element={<ProtectedRoute roles={['staff', 'admin']}><StaffDashboard /></ProtectedRoute>} />
      <Route path="/staff/bookings" element={<ProtectedRoute roles={['staff', 'admin']}><StaffBookings /></ProtectedRoute>} />
      <Route path="/staff/dispatch" element={<ProtectedRoute roles={['staff']}><StaffDispatch /></ProtectedRoute>} />
      <Route path="/staff/refund" element={<ProtectedRoute roles={['staff']}><DepositRefund /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/bookings/:id" element={<ProtectedRoute roles={['admin']}><AdminBookingDetail /></ProtectedRoute>} />
      <Route path="/admin/bookings" element={<ProtectedRoute roles={['admin']}><AllBookings /></ProtectedRoute>} />
      <Route path="/admin/costumes" element={<ProtectedRoute roles={['admin']}><CostumeManager /></ProtectedRoute>} />
      <Route path="/admin/master-data" element={<ProtectedRoute roles={['admin']}><MasterDataManager /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><UserManager /></ProtectedRoute>} />
      <Route path="/admin/dispatch" element={<ProtectedRoute roles={['admin']}><StaffDispatch /></ProtectedRoute>} />
      <Route path="/admin/refund" element={<ProtectedRoute roles={['admin']}><AdminRefund /></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute roles={['admin']}><Reports /></ProtectedRoute>} />
      <Route path="/admin/activity" element={<ProtectedRoute roles={['admin']}><ActivityLog /></ProtectedRoute>} />
      <Route path="/admin/notifications" element={<ProtectedRoute roles={['admin']}><NotificationTemplates /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
