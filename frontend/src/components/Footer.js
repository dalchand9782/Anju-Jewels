import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="bg-muted mt-24 py-12 mb-16 md:mb-0" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-heading text-2xl font-bold mb-4">LuxeJewel</h3>
            <p className="text-sm text-muted-foreground">
              Premium Korean jewelry for those who appreciate elegance and sophistication.
            </p>
          </div>
          <div>
            <h4 className="font-heading font-semibold mb-4">Shop</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/products?category=Earrings" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Earrings
                </Link>
              </li>
              <li>
                <Link to="/products?category=Rings" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Rings
                </Link>
              </li>
              <li>
                <Link to="/products?category=Necklaces" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Necklaces
                </Link>
              </li>
              <li>
                <Link to="/products?category=Bracelets" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Bracelets
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-semibold mb-4">Customer Care</h4>
            <ul className="space-y-2">
              <li className="text-sm text-muted-foreground">Contact Us</li>
              <li className="text-sm text-muted-foreground">Shipping Info</li>
              <li className="text-sm text-muted-foreground">Returns</li>
              <li className="text-sm text-muted-foreground">FAQ</li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-semibold mb-4">About</h4>
            <ul className="space-y-2">
              <li className="text-sm text-muted-foreground">Our Story</li>
              <li className="text-sm text-muted-foreground">Craftsmanship</li>
              <li className="text-sm text-muted-foreground">Sustainability</li>
              <li className="text-sm text-muted-foreground">Careers</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 LuxeJewel. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};