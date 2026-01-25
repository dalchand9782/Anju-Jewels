import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      fetchCart();
    }
  }, [token]);

  const fetchCart = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await axios.get(`${API}/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCart(response.data);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    if (!token) {
      throw new Error('Please login to add items to cart');
    }
    try {
      await axios.post(
        `${API}/cart/add`,
        { product_id: productId, quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchCart();
    } catch (error) {
      console.error('Failed to add to cart:', error);
      throw error;
    }
  };

  const updateCartItem = async (productId, quantity) => {
    if (!token) return;
    try {
      await axios.put(
        `${API}/cart/update`,
        { product_id: productId, quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchCart();
    } catch (error) {
      console.error('Failed to update cart:', error);
      throw error;
    }
  };

  const clearCart = async () => {
    if (!token) return;
    try {
      await axios.delete(`${API}/cart/clear`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCart({ items: [] });
    } catch (error) {
      console.error('Failed to clear cart:', error);
      throw error;
    }
  };

  const cartTotal = cart.items.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

  const cartItemCount = cart.items.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        addToCart,
        updateCartItem,
        clearCart,
        fetchCart,
        cartTotal,
        cartItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;