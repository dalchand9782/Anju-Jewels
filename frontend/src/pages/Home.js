import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { Button } from '../components/ui/button';
import api from '../utils/api';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await api.get('/products');
      setFeaturedProducts(response.data.slice(0, 6));
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { name: 'Earrings', image: 'https://images.unsplash.com/photo-1629297777138-6ae859d4d6df' },
    { name: 'Rings', image: 'https://images.unsplash.com/photo-1588909006332-2e30f95291bc' },
    { name: 'Necklaces', image: 'https://images.pexels.com/photos/6889924/pexels-photo-6889924.jpeg' },
    { name: 'Bracelets', image: 'https://images.pexels.com/photos/7642066/pexels-photo-7642066.jpeg' },
  ];

  return (
    <div className="min-h-screen" data-testid="home-page">
      {/* Hero Section */}
      <section className="relative h-[60vh] md:h-[80vh] overflow-hidden" style={{ background: 'linear-gradient(135deg, #FDFBF7 0%, #FCEDEF 100%)' }}>
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1593260853607-d0e0f639bdab"
            alt="Korean jewelry"
            className="w-full h-full object-cover opacity-40"
            style={{ filter: 'sepia(5%)' }}
          />
        </div>
        <div className="relative h-full flex items-center justify-center text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-4 tracking-tight" data-testid="hero-title">
              Elegance
              <br />
              Redefined
            </h1>
            <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Discover our curated collection of premium Korean jewelry
            </p>
            <Button
              size="lg"
              onClick={() => navigate('/products')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6"
              data-testid="shop-now-button"
            >
              Shop Collection
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Categories Section - Tetris Grid */}
      <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" data-testid="categories-section">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
            Shop by Category
          </h2>
          <p className="text-base md:text-lg text-muted-foreground">
            Find your perfect piece
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ y: -8 }}
              onClick={() => navigate(`/products?category=${category.name}`)}
              className="group cursor-pointer relative overflow-hidden rounded-xl aspect-square"
              data-testid={`category-${category.name.toLowerCase()}`}
            >
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                style={{ filter: 'sepia(5%)' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                <h3 className="font-heading text-xl md:text-2xl font-bold text-white">
                  {category.name}
                </h3>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 md:py-24 bg-muted" data-testid="featured-products-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-primary" />
              <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground tracking-tight">
                Featured Collection
              </h2>
            </div>
            <p className="text-base md:text-lg text-muted-foreground">
              Handpicked pieces just for you
            </p>
          </div>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-x-6 gap-y-12">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
          <div className="text-center mt-12">
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/products')}
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              data-testid="view-all-button"
            >
              View All Products
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Banner Section */}
      <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-accent p-8 md:p-16 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-accent-foreground mb-4">
              Join Our Exclusive Club
            </h2>
            <p className="text-base md:text-lg text-accent-foreground/80 mb-8 max-w-2xl mx-auto">
              Be the first to know about new arrivals, exclusive offers, and special events
            </p>
            <Button
              size="lg"
              onClick={() => navigate('/register')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Sign Up Now
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}