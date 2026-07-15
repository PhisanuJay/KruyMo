import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const saved = localStorage.getItem('kruymo_user');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  // อ่านจาก localStorage ตั้งแต่เฟรมแรก — กันรีเresh แล้ว user หายชั่วคราวแล้วเด้งหน้า
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setUser(readStoredUser());
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('kruymo_token', token);
    localStorage.setItem('kruymo_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('kruymo_token');
    localStorage.removeItem('kruymo_user');
    setUser(null);
  };

  const updateUser = (userData) => {
    localStorage.setItem('kruymo_user', JSON.stringify(userData));
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
