import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { favoriteAPI, cartAPI } from '../services/api';
import { useAuth } from './AuthContext';

const ShopContext = createContext(null);

export const ShopProvider = ({ children }) => {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [cartCount, setCartCount] = useState(0);

  const refreshFavorites = useCallback(async () => {
    if (!user || user.role !== 'customer') {
      setFavoriteIds([]);
      return;
    }
    try {
      const { data } = await favoriteAPI.getIds();
      setFavoriteIds(data);
    } catch {
      setFavoriteIds([]);
    }
  }, [user]);

  const refreshCartCount = useCallback(async () => {
    if (!user || user.role !== 'customer') {
      setCartCount(0);
      return;
    }
    try {
      const { data } = await cartAPI.getCount();
      setCartCount(data.count || 0);
    } catch {
      setCartCount(0);
    }
  }, [user]);

  useEffect(() => {
    refreshFavorites();
    refreshCartCount();
  }, [refreshFavorites, refreshCartCount]);

  const isFavorite = (costumeId) => favoriteIds.includes(costumeId);

  const toggleFavorite = async (costumeId) => {
    if (!user || user.role !== 'customer') {
      return { needsLogin: true };
    }
    const { data } = await favoriteAPI.toggle(costumeId);
    setFavoriteIds((prev) => (
      data.favorited
        ? [...prev.filter((id) => id !== costumeId), costumeId]
        : prev.filter((id) => id !== costumeId)
    ));
    return data;
  };

  const addToCart = async (payload) => {
    if (!user || user.role !== 'customer') {
      return { needsLogin: true };
    }
    const { data } = await cartAPI.add(payload);
    setCartCount((c) => c + 1);
    return data;
  };

  const removeFromCart = async (id) => {
    await cartAPI.remove(id);
    setCartCount((c) => Math.max(0, c - 1));
  };

  const clearCart = async () => {
    await cartAPI.clear();
    setCartCount(0);
  };

  return (
    <ShopContext.Provider value={{
      favoriteIds,
      cartCount,
      isFavorite,
      toggleFavorite,
      addToCart,
      removeFromCart,
      clearCart,
      refreshFavorites,
      refreshCartCount,
      setCartCount,
    }}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => useContext(ShopContext);
