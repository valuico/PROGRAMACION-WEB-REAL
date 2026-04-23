import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Header = ({ onCartToggle }) => {
  const [cartCount, setCartCount] = useState(0);
  const pathname = usePathname();

  const updateCartCount = () => {
    const cart = JSON.parse(localStorage.getItem('hazeCart') || '[]');
    setCartCount(cart.length);
  };

  useEffect(() => {
    updateCartCount();
    window.addEventListener('cartUpdated', updateCartCount);
    return () => window.removeEventListener('cartUpdated', updateCartCount);
  }, []);

  const handleSectionChange = (section) => {
    if (pathname === '/') {
      window.dispatchEvent(new CustomEvent('sectionChange', { detail: section }));
    }
  };

  const toggleCart = () => {
    onCartToggle();
  };

  return (
    <header className="main-header">
      <div className="logo-container">
        <Link href="/">
          <img src="/LOGO-removebg-preview.png" alt="HAZE Beauty Logo" className="haze-logo" />
        </Link>
      </div>

      <nav className="nav-menu">
        <ul>
          <li><a href="#" onClick={() => handleSectionChange('hero')}>Inicio</a></li>
          <li><a href="#" onClick={() => handleSectionChange('skincare')}>Skincare</a></li>
          <li><a href="#" onClick={() => handleSectionChange('makeup')}>Makeup</a></li>
          <li>
            <div className="cart-container">
              <div className="cart-wrapper" onClick={toggleCart}>
                <span className="cart-icon">🛒</span>
                <span id="cart-count">{cartCount}</span>
              </div>
            </div>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;