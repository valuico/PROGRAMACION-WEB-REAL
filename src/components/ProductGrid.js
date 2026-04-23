import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';

const ProductGrid = ({ category }) => {
  const [filter, setFilter] = useState('all');

  const makeupProducts = [
    { id: 1, name: 'Pro Filt\'r Foundation', description: 'Soft Matte Longwear', image: '/foundation-haze.png', price: 50000, category: 'cara', tones: ['Light', 'Medium', 'Warm', 'Deep'] },
    { id: 2, name: 'We\'re Even Concealer', description: 'Hydrating Longwear', image: '/concelears-haze.png', price: 52300, category: 'cara', tones: ['Light', 'Medium', 'Warm', 'Deep'] },
    { id: 3, name: 'Radiant Stick Duo', description: 'Iluminador en Barra', image: '/highlighters.png', price: 42500, category: 'cara', tones: ['Golden Glow', 'Rose Stick', 'Silver Stow'] },
    { id: 4, name: 'Invisimatte Setting Powder', description: 'Polvos Volátiles', image: '/polvos-volatiles.png', price: 55000, category: 'cara', tones: ['Butter', 'Lavender'] },
    { id: 5, name: 'Double Take Blush', description: 'Dúo Polvo y Crema', image: '/blushes-haze.png', price: 48900, category: 'cara', tones: ['Peony', 'Coral Haze', 'Rosewood', 'Sunset'] },
    { id: 6, name: 'Iconic Matte Lipstick', description: 'Labial en barra - Acabado Terciopelo', image: '/labiales.png', price: 42900, category: 'labios', tones: ['Deep Red', 'True Scarlet', 'Dusty Rose', 'Terracotta', 'Nude Beige', 'Honey Nude'] },
    { id: 7, name: 'Precision Lip Shaper', description: 'Delineador de labios larga duración', image: '/lip-liner.png', price: 31500, category: 'labios', tones: ['Pale Lilac', 'Warm Pink', 'Berry Bite', 'Deep Cocoa'] },
    { id: 8, name: 'Gloss Bomb Crystal', description: 'Brillo labial efecto espejo', image: '/lipgloss.png', price: 38200, category: 'labios', tones: ['Diamond Milk', 'Pink Dragonfly', 'Fussy', 'Hot Chocolit'] },
    { id: 9, name: 'Ultimate Glow Palette', description: '12 High-Pigment Shades', image: '/paleta-sombras.png', price: 65800, category: 'ojos' },
    { id: 10, name: 'Hella Thicc Mascara', description: 'Volumizing & Lift', image: '/mascara-pestañas-haze.png', price: 38500, category: 'ojos', tones: ['Waterproof', 'Fórmula Original'] },
    { id: 11, name: 'Lineshaper Gel Eyeliner', description: 'Waterproof Gel', image: '/eyeliners-haze.png', price: 32200, category: 'ojos', tones: ['Deep Brown', 'Midnight Black'] },
  ];

  const skincareProducts = [
    { id: 12, name: 'Hydrating Toner', description: 'Ácido Hialurónico + Lavanda', image: '/toner-haze.png', price: 35000, badge: 'Nuevo' },
    { id: 13, name: 'Gentle Cleanser', description: 'Té Verde + Ceramidas', image: '/clenser-haze.jpg', price: 38500, badge: 'Nuevo' },
    { id: 14, name: 'Daily Moisturizer', description: 'Péptidos + Squalane', image: '/face-cream.jpg', price: 44900, badge: 'Nuevo' },
    { id: 15, name: 'Coming Soon', description: 'Serum Reparador Nocturno', image: 'placeholder', price: 0, upcoming: true },
    { id: 16, name: 'Coming Soon', description: 'Protector Solar Glow', image: 'placeholder', price: 0, upcoming: true },
    { id: 17, name: 'Coming Soon', description: 'Mascarilla Facial Revitalizante', image: 'placeholder', price: 0, upcoming: true },
  ];

  const products = category === 'makeup' ? makeupProducts : skincareProducts;

  const filteredProducts = filter === 'all' ? products : products.filter(p => p.category === filter);

  useEffect(() => {
    if (category === 'makeup') {
      setFilter('cara');
    }
  }, [category]);

  const applyFilter = (newFilter) => {
    setFilter(newFilter);
  };

  return (
    <section className="catalog-container">
      {category === 'makeup' && (
        <aside className="sidebar">
          <h3>MAKEUP</h3>
          <ul>
            <li><a href="javascript:void(0)" className="filter-btn" onClick={() => applyFilter('all')}>Explorar Todo</a></li>
            <li><a href="javascript:void(0)" className="filter-btn" onClick={() => applyFilter('cara')}>Cara</a></li>
            <li><a href="javascript:void(0)" className="filter-btn" onClick={() => applyFilter('ojos')}>Ojos</a></li>
            <li><a href="javascript:void(0)" className="filter-btn" onClick={() => applyFilter('labios')}>Labios</a></li>
          </ul>
        </aside>
      )}

      {category === 'skincare' && (
        <aside className="sidebar skincare-sidebar">
          <h3>THE GLOW EDIT</h3>
          <p className="sidebar-desc">Fórmulas minimalistas diseñadas para resaltar tu luz propia. El dorado de la ciencia y la pureza de la naturaleza.</p>
          <div className="gold-line"></div>
        </aside>
      )}

      <div className="products-grid">
        {filteredProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

export default ProductGrid;