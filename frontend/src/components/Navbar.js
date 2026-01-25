import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { Button } from './ui/button';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { cartItemCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-white/20" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          <Link to="/" className="flex items-center" data-testid="logo-link">
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground tracking-tight">
              LuxeJewel
            </h1>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/products"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-300"
              data-testid="products-link"
            >
              Collections
            </Link>
            <Link
              to="/products?category=Earrings"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-300"
            >
              Earrings
            </Link>
            <Link
              to="/products?category=Rings"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-300"
            >
              Rings
            </Link>
            <Link
              to="/products?category=Necklaces"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-300"
            >
              Necklaces
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {user.is_admin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/admin')}
                    className="hidden md:flex items-center gap-2"
                    data-testid="admin-dashboard-button"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Admin
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/cart')}
                  className="relative"
                  data-testid="cart-button"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cartItemCount}
                    </span>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/profile')}
                  className="hidden md:flex"
                  data-testid="profile-button"
                >
                  <User className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="hidden md:flex"
                  data-testid="logout-button"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/login')}
                  className="hidden md:flex"
                  data-testid="login-button"
                >
                  Login
                </Button>
                <Button
                  onClick={() => navigate('/register')}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  data-testid="register-button"
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};