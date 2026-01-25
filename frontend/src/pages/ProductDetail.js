import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, ArrowLeft, Package } from 'lucide-react';
import { Button } from '../components/ui/button';
import api from '../utils/api';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/products/${id}`);
      setProduct(response.data);
    } catch (error) {
      console.error('Failed to fetch product:', error);
      toast.error('Product not found');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }
    try {
      await addToCart(product.id, quantity);
      toast.success(`Added ${quantity} item(s) to cart`);
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="min-h-screen py-8 md:py-12" data-testid="product-detail-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/products')}
          className="mb-6"
          data-testid="back-button"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* Product Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-2xl bg-white shadow-soft"
          >
            <div className="aspect-[3/4]">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
                style={{ filter: 'sepia(5%)' }}
              />
            </div>
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col"
          >
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-accent text-accent-foreground text-sm rounded-full mb-4">
                {product.category}
              </span>
              <h1 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-4 tracking-tight" data-testid="product-name">
                {product.name}
              </h1>
              <p className="text-2xl md:text-3xl font-bold text-primary mb-6" data-testid="product-price">
                ₹{product.price.toLocaleString()}
              </p>
            </div>

            <div className="mb-6">
              <h3 className="font-heading text-lg font-semibold mb-2">Description</h3>
              <p className="text-base text-muted-foreground leading-relaxed" data-testid="product-description">
                {product.description}
              </p>
            </div>

            <div className="mb-6 flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground" data-testid="product-stock">
                {product.stock > 0 ? (
                  <span className="text-green-600">In Stock ({product.stock} available)</span>
                ) : (
                  <span className="text-destructive">Out of Stock</span>
                )}
              </span>
            </div>

            {product.stock > 0 && (
              <div className="mb-6">
                <label className="block font-heading text-sm font-semibold mb-2">Quantity</label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    data-testid="decrease-quantity"
                  >
                    -
                  </Button>
                  <span className="w-12 text-center font-semibold" data-testid="quantity-value">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                    data-testid="increase-quantity"
                  >
                    +
                  </Button>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                data-testid="add-to-cart-button"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Add to Cart
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/products')}
                className="flex-1 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                Continue Shopping
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}