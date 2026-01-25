import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useCart } from '../contexts/CartContext';
import { toast } from 'sonner';

export default function Cart() {
  const navigate = useNavigate();
  const { cart, updateCartItem, cartTotal } = useCart();

  const handleUpdateQuantity = async (productId, newQuantity) => {
    try {
      await updateCartItem(productId, newQuantity);
    } catch (error) {
      toast.error('Failed to update cart');
    }
  };

  const handleRemoveItem = async (productId) => {
    try {
      await updateCartItem(productId, 0);
      toast.success('Item removed from cart');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="empty-cart">
        <div className="text-center">
          <ShoppingBag className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">Add some beautiful jewelry to get started!</p>
          <Button
            onClick={() => navigate('/products')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            data-testid="continue-shopping-button"
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 md:py-12" data-testid="cart-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-heading text-4xl md:text-6xl font-bold text-foreground mb-8 tracking-tight" data-testid="cart-title">
            Shopping Cart
          </h1>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <motion.div
                key={item.product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-4 shadow-soft"
                data-testid={`cart-item-${item.product.id}`}
              >
                <div className="flex gap-4">
                  <div
                    className="w-24 h-24 rounded-lg overflow-hidden cursor-pointer"
                    onClick={() => navigate(`/products/${item.product.id}`)}
                  >
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                      style={{ filter: 'sepia(5%)' }}
                    />
                  </div>
                  <div className="flex-1">
                    <h3
                      className="font-heading text-lg font-semibold text-foreground mb-1 cursor-pointer hover:text-primary"
                      onClick={() => navigate(`/products/${item.product.id}`)}
                    >
                      {item.product.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">{item.product.category}</p>
                    <p className="text-lg font-bold text-primary">
                      ₹{item.product.price.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(item.product.id)}
                      className="text-destructive hover:text-destructive"
                      data-testid={`remove-item-${item.product.id}`}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        data-testid={`decrease-quantity-${item.product.id}`}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-semibold" data-testid={`quantity-${item.product.id}`}>
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                        data-testid={`increase-quantity-${item.product.id}`}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-xl p-6 shadow-soft sticky top-24" data-testid="order-summary">
              <h2 className="font-heading text-2xl font-bold text-foreground mb-6">Order Summary</h2>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold" data-testid="subtotal">
                    ₹{cartTotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-semibold text-green-600">Free</span>
                </div>
                <div className="border-t border-border pt-4">
                  <div className="flex justify-between">
                    <span className="font-heading text-lg font-bold">Total</span>
                    <span className="font-heading text-lg font-bold text-primary" data-testid="total">
                      ₹{cartTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                size="lg"
                onClick={() => navigate('/checkout')}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                data-testid="proceed-to-checkout"
              >
                Proceed to Checkout
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/products')}
                className="w-full mt-3"
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