import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Grid3x3, ShoppingCart, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

export const BottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { cartItemCount } = useCart();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50" data-testid="bottom-nav">
      <div className="flex justify-around items-center h-16">
        <Link
          to="/"
          className={`flex flex-col items-center justify-center flex-1 h-full ${
            isActive('/') ? 'text-primary' : 'text-muted-foreground'
          } transition-colors duration-300`}
          data-testid="bottom-nav-home"
        >
          <Home className="h-5 w-5" />
          <span className="text-xs mt-1">Home</span>
        </Link>
        <Link
          to="/products"
          className={`flex flex-col items-center justify-center flex-1 h-full ${
            isActive('/products') ? 'text-primary' : 'text-muted-foreground'
          } transition-colors duration-300`}
          data-testid="bottom-nav-products"
        >
          <Grid3x3 className="h-5 w-5" />
          <span className="text-xs mt-1">Shop</span>
        </Link>
        <Link
          to="/cart"
          className={`flex flex-col items-center justify-center flex-1 h-full relative ${
            isActive('/cart') ? 'text-primary' : 'text-muted-foreground'
          } transition-colors duration-300`}
          data-testid="bottom-nav-cart"
        >
          <ShoppingCart className="h-5 w-5" />
          {cartItemCount > 0 && (
            <span className="absolute top-2 right-1/2 translate-x-3 bg-primary text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              {cartItemCount}
            </span>
          )}
          <span className="text-xs mt-1">Cart</span>
        </Link>
        <Link
          to={user ? '/profile' : '/login'}
          className={`flex flex-col items-center justify-center flex-1 h-full ${
            isActive('/profile') || isActive('/login') ? 'text-primary' : 'text-muted-foreground'
          } transition-colors duration-300`}
          data-testid="bottom-nav-profile"
        >
          <User className="h-5 w-5" />
          <span className="text-xs mt-1">{user ? 'Profile' : 'Login'}</span>
        </Link>
      </div>
    </nav>
  );
};