import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, cartTotal } = useCart();
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user || !token) {
      toast.error('Please login to continue');
      navigate('/login');
      return;
    }

    if (cart.items.length === 0) {
      toast.error('Your cart is empty');
      navigate('/products');
      return;
    }

    setLoading(true);

    try {
      // Load Razorpay script
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error('Failed to load payment gateway');
        setLoading(false);
        return;
      }

      // Create order
      const orderResponse = await api.post('/orders/create', {
        shipping_address: formData,
      });

      const { razorpay_order_id, amount, currency, key_id, order_id } = orderResponse.data;

      // Razorpay options
      const options = {
        key: key_id,
        amount: amount * 100, // in paise
        currency: currency,
        name: 'LuxeJewel',
        description: 'Premium Korean Jewelry',
        order_id: razorpay_order_id,
        handler: async function (response) {
          try {
            // Verify payment
            await api.post('/orders/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              order_id: order_id,
            });
            toast.success('Order placed successfully!');
            navigate(`/orders`);
          } catch (error) {
            console.error('Payment verification failed:', error);
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: '#E0C097',
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on('payment.failed', function (response) {
        toast.error('Payment failed. Please try again.');
        console.error('Payment failed:', response.error);
      });
      paymentObject.open();
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-heading text-2xl font-bold mb-4">Please login to checkout</h2>
          <Button onClick={() => navigate('/login')} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Login
          </Button>
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="min-h-screen py-8 md:py-12" data-testid="checkout-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-heading text-4xl md:text-6xl font-bold text-foreground mb-8 tracking-tight" data-testid="checkout-title">
            Checkout
          </h1>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Shipping Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-xl p-6 shadow-soft"
            >
              <h2 className="font-heading text-2xl font-bold text-foreground mb-6">Shipping Information</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      data-testid="fullName-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      data-testid="email-input"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    data-testid="phone-input"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    data-testid="address-input"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      data-testid="city-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      required
                      data-testid="state-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input
                      id="pincode"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      required
                      data-testid="pincode-input"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  size="lg"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-6"
                  data-testid="place-order-button"
                >
                  {loading ? 'Processing...' : (
                    <>
                      <Lock className="h-5 w-5 mr-2" />
                      Proceed to Payment
                    </>
                  )}
                </Button>
              </form>
            </motion.div>
          </div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-xl p-6 shadow-soft sticky top-24">
              <h2 className="font-heading text-2xl font-bold text-foreground mb-6">Order Summary</h2>
              <div className="space-y-4 mb-6">
                {cart.items.map((item) => (
                  <div key={item.product.id} className="flex gap-3">
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="w-16 h-16 rounded-lg object-cover"
                      style={{ filter: 'sepia(5%)' }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      <p className="text-sm font-bold text-primary">
                        ₹{(item.product.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">₹{cartTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-semibold text-green-600">Free</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="font-heading text-lg font-bold">Total</span>
                  <span className="font-heading text-lg font-bold text-primary">
                    ₹{cartTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}