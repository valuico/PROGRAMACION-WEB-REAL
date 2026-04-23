'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const PRODUCTS = {
  makeup: [
    { id: 1, nombre: 'Pro Filt\'r Foundation', p: 'Soft Matte Longwear', precio: 50000, img: '/foundation-haze.png', tones: ['Light', 'Medium', 'Warm', 'Deep'], categoria: 'cara' },
    { id: 2, nombre: 'We\'re Even Concealer', p: 'Hydrating Longwear', precio: 52300, img: '/concelears-haze.png', tones: ['Light', 'Medium', 'Warm', 'Deep'], categoria: 'cara' },
    { id: 3, nombre: 'Radiant Stick Duo', p: 'Iluminador en Barra', precio: 42500, img: '/highlighters.png', tones: ['Golden Glow', 'Rose Stick', 'Silver Stow'], categoria: 'cara' },
    { id: 4, nombre: 'Invisimatte Setting Powder', p: 'Polvos Volátiles', precio: 55000, img: '/polvos-volatiles.png', tones: ['Butter', 'Lavender'], categoria: 'cara' },
    { id: 5, nombre: 'Double Take Blush', p: 'Dúo Polvo y Crema', precio: 48900, img: '/blushes-haze.png', tones: ['Peony', 'Coral Haze', 'Rosewood', 'Sunset'], categoria: 'cara' },
    { id: 6, nombre: 'Mist & Fix Spray', p: 'Larga Duración', precio: 39000, img: '/setting-spray-2.png', tones: [], categoria: 'cara' },
    { id: 7, nombre: 'Iconic Matte Lipstick', p: 'Labial en barra', precio: 42900, img: '/labiales.png', tones: ['Deep Red', 'True Scarlet', 'Dusty Rose', 'Terracotta', 'Nude Beige', 'Honey Nude'], categoria: 'labios' },
    { id: 8, nombre: 'Precision Lip Shaper', p: 'Delineador de labios', precio: 31500, img: '/lip-liner.png', tones: ['Pale Lilac', 'Warm Pink', 'Berry Bite', 'Deep Cocoa'], categoria: 'labios' },
    { id: 9, nombre: 'Gloss Bomb Crystal', p: 'Brillo labial efecto espejo', precio: 38200, img: '/lipgloss.png', tones: ['Diamond Milk', 'Pink Dragonfly', 'Fussy', 'Hot Chocolit'], categoria: 'labios' },
    { id: 10, nombre: 'Ultimate Glow Palette', p: '12 High-Pigment Shades', precio: 65800, img: '/paleta-sombras.png', tones: [], categoria: 'ojos' },
    { id: 11, nombre: 'Hella Thicc Mascara', p: 'Volumizing & Lift', precio: 38500, img: '/mascara-pestañas-haze.png', tones: ['Waterproof', 'Fórmula Original'], categoria: 'ojos' },
    { id: 12, nombre: 'Lineshaper Gel Eyeliner', p: 'Waterproof Gel', precio: 32200, img: '/eyeliners-haze.png', tones: ['Deep Brown', 'Midnight Black'], categoria: 'ojos' }
  ],
  skincare: [
    { id: 13, nombre: 'Hydrating Toner', p: 'Ácido Hialurónico + Lavanda', precio: 35000, img: '/toner-haze.png', tones: [], isNew: true },
    { id: 14, nombre: 'Gentle Cleanser', p: 'Té Verde + Ceramidas', precio: 38500, img: '/cleanser-real.png', tones: [], isNew: true },
    { id: 15, nombre: 'Daily Moisturizer', p: 'Péptidos + Squalane', precio: 44900, img: '/cream-real.png', tones: [], isNew: true }
  ]
};

function ProductCard({ product, selectedTone, onToneSelect, onAddToCart, isSkincare }) {
  return (
    <div className="product-card show">
      <div className="product-img">
        <Image 
          src={product.img} 
          alt={product.nombre} 
          width={300} 
          height={300}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>
      <div className="product-info">
        {isSkincare && product.isNew && <span className="gold-badge">Nuevo</span>}
        <h4>{product.nombre}</h4>
        <p>{product.p}</p>
        
        {product.tones && product.tones.length > 0 && (
          <div className="tone-selector">
            {product.tones.map(tone => (
              <button
                key={tone}
                className={`tone-circle ${selectedTone === tone ? 'active' : ''}`}
                onClick={() => onToneSelect(tone)}
                title={tone}
                style={{
                  backgroundColor: getToneColor(tone),
                  border: selectedTone === tone ? '2px solid #95789b' : '1px solid #ccc'
                }}
              ></button>
            ))}
          </div>
        )}
        
        <span className="price">${product.precio.toLocaleString()}</span>
        <button 
          className={`add-to-cart ${isSkincare ? 'btn-gold' : ''}`}
          onClick={onAddToCart}
        >
          Añadir al Carrito
        </button>
      </div>
    </div>
  );
}

function getToneColor(tone) {
  const colors = {
    'Light': '#f3d9c1',
    'Medium': '#e5b38a',
    'Warm': '#c3834c',
    'Deep': '#633b26',
    'Golden Glow': '#d4af37',
    'Rose Stick': '#eec0c8',
    'Silver Stow': '#e3e4e5',
    'Butter': '#f5e1cc',
    'Lavender': '#e3e4e5',
    'Peony': '#e1959a',
    'Coral Haze': '#f17f5a',
    'Rosewood': '#bb6d6d',
    'Sunset': '#c47645',
    'Pale Lilac': '#e2d1df',
    'Warm Pink': '#d1a3a4',
    'Berry Bite': '#a35d6a',
    'Deep Cocoa': '#8e6353',
    'Deep Red': '#8b1220',
    'True Scarlet': '#b51a1a',
    'Dusty Rose': '#a65e6d',
    'Terracotta': '#8d5345',
    'Nude Beige': '#b0816a',
    'Honey Nude': '#c8987d',
    'Diamond Milk': '#ffffff',
    'Pink Dragonfly': '#f4ccd3',
    'Fussy': '#d0828c',
    'Hot Chocolit': '#a47158',
    'Waterproof': '#008fb3',
    'Fórmula Original': '#95789b',
    'Deep Brown': '#5d3a1a',
    'Midnight Black': '#000000'
  };
  return colors[tone] || '#ccc';
}

export default function Home() {
  const [currentSection, setCurrentSection] = useState('hero');
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedTones, setSelectedTones] = useState({});
  const [filter, setFilter] = useState('all');

  // Cargar carrito del localStorage
  useEffect(() => {
    const saved = localStorage.getItem('hazeCart');
    if (saved) setCart(JSON.parse(saved));
  }, []);

  // Guardar carrito en localStorage
  useEffect(() => {
    localStorage.setItem('hazeCart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => {
    const toneTone = selectedTones[product.id];
    if (product.tones && product.tones.length > 0 && !toneTone) {
      alert('Por favor, selecciona un tono');
      return;
    }
    
    setCart([...cart, { ...product, selectedTone: toneTone || 'Único' }]);
    setSelectedTones({ ...selectedTones, [product.id]: null });
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const filteredProducts = PRODUCTS.makeup.filter(p => 
    filter === 'all' || p.categoria === filter
  );

  const totalPrice = cart.reduce((sum, item) => sum + item.precio, 0);

  return (
    <div>
      {/* Header */}
      <header className="main-header">
        <div className="logo-container">
          <a onClick={() => setCurrentSection('hero')} style={{ cursor: 'pointer' }}>
            <Image src="/LOGO-removebg-preview.png" alt="HAZE Beauty" className="haze-logo" width={70} height={70} />
          </a>
        </div>

        <nav className="nav-menu">
          <ul>
            <li><a onClick={() => setCurrentSection('hero')}>Inicio</a></li>
            <li><a onClick={() => setCurrentSection('skincare')}>Skincare</a></li>
            <li><a onClick={() => setCurrentSection('makeup')}>Makeup</a></li>
            <li>
              <div className="cart-container">
                <div className="cart-wrapper" onClick={() => setCartOpen(!cartOpen)}>
                  <span className="cart-icon">🛒</span>
                  <span id="cart-count">{cart.length}</span>
                </div>
              </div>
            </li>
          </ul>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        {currentSection === 'hero' && (
          <section className="hero-section">
            <div className="hero-block skincare-news skincare-bg">
              <div className="news-container">
                <span className="news-tag">NUEVO LANZAMIENTO</span>
                <h2>HAZE <span className="gold-text">SKINCARE</span> LINE</h2>
                <p>La espera terminó. Presentamos nuestra primera línea de cuidado facial: fórmulas puras, minimalistas y altamente efectivas para lograr ese "glow" natural.</p>
                <a onClick={() => setCurrentSection('skincare')} className="skincare-link">
                  Explorar Skincare →
                </a>
              </div>
            </div>
          </section>
        )}

        {/* Makeup Section */}
        {currentSection === 'makeup' && (
          <section className="catalog-container">
            <aside className="sidebar">
              <h3>MAKEUP</h3>
              <ul>
                <li><a onClick={() => setFilter('all')}>Explorar Todo</a></li>
                <li><a onClick={() => setFilter('cara')}>Cara</a></li>
                <li><a onClick={() => setFilter('ojos')}>Ojos</a></li>
                <li><a onClick={() => setFilter('labios')}>Labios</a></li>
              </ul>
            </aside>

            <div className="products-grid">
              {filteredProducts.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product}
                  selectedTone={selectedTones[product.id]}
                  onToneSelect={(tone) => setSelectedTones({ ...selectedTones, [product.id]: tone })}
                  onAddToCart={() => addToCart(product)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Skincare Section */}
        {currentSection === 'skincare' && (
          <section className="catalog-container skincare-catalog">
            <aside className="sidebar skincare-sidebar">
              <h3>THE GLOW EDIT</h3>
              <p className="sidebar-desc">Fórmulas minimalistas diseñadas para resaltar tu luz propia. El dorado de la ciencia y la pureza de la naturaleza.</p>
              <div className="gold-line"></div>
            </aside>

            <div className="products-grid">
              {PRODUCTS.skincare.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product}
                  isSkincare
                  onAddToCart={() => addToCart(product)}
                />
              ))}
              {/* Coming Soon Cards */}
              <div className="product-card show">
                <div className="product-img placeholder-gold">✨</div>
                <div className="product-info">
                  <h4>Coming Soon</h4>
                  <p>Serum Reparador Nocturno</p>
                  <span className="price">--</span>
                  <button className="add-to-cart" disabled>Próximamente</button>
                </div>
              </div>
              <div className="product-card show">
                <div className="product-img placeholder-gold">✨</div>
                <div className="product-info">
                  <h4>Coming Soon</h4>
                  <p>Protector Solar Glow</p>
                  <span className="price">--</span>
                  <button className="add-to-cart" disabled>Próximamente</button>
                </div>
              </div>
            </div>
          </section>
        )}

      </main>

      {/* Footer */}
      <footer className="main-footer">
        <div className="footer-container">
          <div className="footer-section brand">
            <Image src="/LOGO-removebg-preview.png" alt="HAZE" width={60} height={60} className="footer-logo" />
            <p>Realzando tu brillo natural con productos de alta gama y crueldad cero.</p>
          </div>

          <div className="footer-section links">
            <h4>Navegación</h4>
            <ul>
              <li><a onClick={() => setCurrentSection('hero')}>Inicio</a></li>
              <li><a onClick={() => setCurrentSection('makeup')}>Makeup</a></li>
              <li><a onClick={() => setCurrentSection('skincare')}>Skincare</a></li>
            </ul>
          </div>

          <div className="footer-section newsletter">
            <h4>¡Unite a la comunidad!</h4>
            <p>Recibí ofertas exclusivas y lanzamientos antes que nadie.</p>
            <form className="footer-form" onSubmit={(e) => { e.preventDefault(); alert('¡Gracias por suscribirte!'); }}>
              <input type="email" placeholder="Tu email aquí..." required />
              <button type="submit">Suscribirme</button>
            </form>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2026 HAZE Beauty. Todos los derechos reservados.</p>
          <div className="social-icons">
            <span>Instagram</span> | <span>TikTok</span> | <span>Facebook</span>
          </div>
        </div>
      </footer>

      {/* Cart Sidebar */}
      <div id="cart-overlay" onClick={() => setCartOpen(false)} style={{ display: cartOpen ? 'block' : 'none' }}></div>
      <div className="side-cart" style={{ right: cartOpen ? '0' : '-400px' }}>
        <div className="cart-header">
          <h3>Tu Carrito</h3>
          <span className="close-cart" onClick={() => setCartOpen(false)}>&times;</span>
        </div>

        <div className="cart-body">
          {cart.length === 0 ? (
            <p className="empty-msg">Tu carrito está vacío.</p>
          ) : (
            cart.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                <Image src={item.img} alt={item.nombre} width={60} height={60} style={{ borderRadius: '8px' }} />
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '14px', margin: 0, color: '#333' }}>{item.nombre}</h4>
                  <p style={{ fontSize: '12px', color: '#95789b', margin: '4px 0' }}>Tono: {item.selectedTone}</p>
                  <span style={{ fontWeight: 'bold', color: '#d4af37' }}>${item.precio.toLocaleString()}</span>
                </div>
                <button onClick={() => removeFromCart(idx)} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '20px' }}>&times;</button>
              </div>
            ))
          )}
        </div>

        <div className="cart-footer">
          <div className="cart-total">
            <span>Total:</span>
            <span id="cart-total-amount">${totalPrice.toLocaleString()}</span>
          </div>
          <Link href="/payment">
            <button className="btn-checkout">Finalizar Compra</button>
          </Link>
          <p className="payment-methods">Aceptamos tarjetas de crédito, débito y transferencia.</p>
        </div>
      </div>

      <div id="notification-container"></div>
    </div>
  );
}
