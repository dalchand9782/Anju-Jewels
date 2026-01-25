import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { Package, ShoppingBag, Users, DollarSign, TrendingUp } from 'lucide-react';
import { Button } from '../../components/ui/button';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !user.is_admin) {
      navigate('/');
      return;
    }
    fetchAnalytics();
  }, [user, navigate]);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/admin/analytics');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || !user.is_admin) {
    return null;
  }

  return (
    <div className="min-h-screen py-8 md:py-12 bg-muted" data-testid="admin-dashboard-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="font-heading text-4xl md:text-6xl font-bold text-foreground mb-4 tracking-tight" data-testid="admin-dashboard-title">
            Admin Dashboard
          </h1>
          <div className="flex gap-4">
            <Link to="/admin/products">
              <Button variant="outline" data-testid="manage-products-link">
                Manage Products
              </Button>
            </Link>
            <Link to="/admin/orders">
              <Button variant="outline" data-testid="manage-orders-link">
                Manage Orders
              </Button>
            </Link>
          </div>
        </motion.div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        ) : analytics ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl p-6 shadow-soft"
                data-testid="stat-total-products"
              >
                <div className="flex items-center justify-between mb-4">
                  <Package className="h-8 w-8 text-primary" />
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-foreground mb-1">{analytics.total_products}</p>
                <p className="text-sm text-muted-foreground">Total Products</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl p-6 shadow-soft"
                data-testid="stat-total-orders"
              >
                <div className="flex items-center justify-between mb-4">
                  <ShoppingBag className="h-8 w-8 text-blue-600" />
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-foreground mb-1">{analytics.total_orders}</p>
                <p className="text-sm text-muted-foreground">Total Orders</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl p-6 shadow-soft"
                data-testid="stat-total-users"
              >
                <div className="flex items-center justify-between mb-4">
                  <Users className="h-8 w-8 text-purple-600" />
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-foreground mb-1">{analytics.total_users}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-xl p-6 shadow-soft"
                data-testid="stat-total-revenue"
              >
                <div className="flex items-center justify-between mb-4">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-foreground mb-1">
                  ₹{analytics.total_revenue.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </motion.div>
            </div>

            {/* Recent Orders & Category Sales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Orders */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-xl p-6 shadow-soft"
              >
                <h2 className="font-heading text-2xl font-bold text-foreground mb-4">Recent Orders</h2>
                <div className="space-y-3">
                  {analytics.recent_orders.slice(0, 5).map((order) => (
                    <div
                      key={order.id}
                      className="flex justify-between items-center p-3 bg-muted/30 rounded-lg"
                      data-testid={`recent-order-${order.id}`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          Order #{order.id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-primary">
                          ₹{order.total_amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">{order.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Category Sales */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white rounded-xl p-6 shadow-soft"
              >
                <h2 className="font-heading text-2xl font-bold text-foreground mb-4">Sales by Category</h2>
                <div className="space-y-4">
                  {Object.entries(analytics.category_sales).map(([category, sales]) => (
                    <div key={category}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-foreground">{category}</span>
                        <span className="text-sm font-bold text-primary">
                          ₹{sales.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2 transition-all duration-500"
                          style={{
                            width: `${(sales / analytics.total_revenue) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}