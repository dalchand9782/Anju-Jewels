import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { Button } from './ui/button';
import { useCart } from '../contexts/CartContext';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

export const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (!user) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }
    try {
      await addToCart(product.id);
      toast.success('Added to cart');
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="group cursor-pointer"
      onClick={() => navigate(`/products/${product.id}`)}
      data-testid={`product-card-${product.id}`}
    >
      <div className="relative overflow-hidden rounded-xl bg-white shadow-soft hover:shadow-hover transition-shadow duration-300">
        <div className="aspect-[3/4] overflow-hidden">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            style={{ filter: 'sepia(5%)' }}
          />
        </div>
        <div className="p-4">
          <h3 className="font-heading text-lg font-semibold text-foreground mb-1">
            {product.name}
          </h3>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {product.description}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xl font-body font-bold text-primary">
              ₹{product.price.toLocaleString()}
            </span>
            <Button
              size="sm"
              onClick={handleAddToCart}
              className="bg-primary hover:bg-primary/90 text-primary-foreground opacity-0 md:opacity-100 group-hover:opacity-100 transition-opacity duration-300"
              data-testid={`add-to-cart-${product.id}`}
            >
              <ShoppingCart className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
          {product.stock < 10 && product.stock > 0 && (
            <p className="text-xs text-accent-foreground mt-2">Only {product.stock} left!</p>
          )}
          {product.stock === 0 && (
            <p className="text-xs text-destructive mt-2">Out of stock</p>
          )}
        </div>
        <Button
          size="sm"
          onClick={handleAddToCart}
          className="md:hidden absolute bottom-4 right-4 bg-primary hover:bg-primary/90 text-primary-foreground"
          data-testid={`add-to-cart-mobile-${product.id}`}
        >
          <ShoppingCart className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
};