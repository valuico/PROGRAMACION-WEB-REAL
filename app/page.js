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

function NotifyButton() {
  const [notifyMode, setNotifyMode] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleNotifyClick = () => {
    setNotifyMode(true);
  };

  const handleSubmit = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(email)) {
      setSubmitted(true);
      setTimeout(() => {
        setNotifyMode(false);
        setSubmitted(false);
        setEmail('');
      }, 3000);
    } else {
      alert('Por favor, ingresa un email válido.');
    }
  };

  return (
    <div className="notify-container">
      {!notifyMode ? (
        <button 
          className="notify-btn"
          onClick={handleNotifyClick}
          style={{
            backgroundColor: '#95789b',
            color: 'white',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            transition: '0.3s ease-in-out',
            width: '100%'
          }}
        >
          Avisame cuando salga
        </button>
      ) : submitted ? (
        <div 
          className="thank-you-msg"
          style={{
            backgroundColor: '#e8f5e8',
            color: '#2e7d32',
            padding: '12px 20px',
            borderRadius: '8px',
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: 'bold',
            transition: '0.3s ease-in-out'
          }}
        >
          ¡Gracias! Te avisaremos.
        </div>
      ) : (
        <div 
          className="notify-input-container"
          style={{
            display: 'flex',
            gap: '8px',
            transition: '0.3s ease-in-out'
          }}
        >
          <input
            type="email"
            placeholder="Tu email aquí..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              flex: 1,
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <button 
            onClick={handleSubmit}
            style={{
              backgroundColor: '#95789b',
              color: 'white',
              border: 'none',
              padding: '12px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              transition: '0.3s ease-in-out'
            }}
          >
            ✓
          </button>
        </div>
      )}
    </div>
  );
}

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
  const [notifications, setNotifications] = useState([]);

  // Cargar carrito del localStorage
  useEffect(() => {
    const saved = localStorage.getItem('hazeCart');
    if (saved) setCart(JSON.parse(saved));
  }, []);

  // Guardar carrito en localStorage
  useEffect(() => {
    localStorage.setItem('hazeCart', JSON.stringify(cart));
  }, [cart]);

  const addNotification = (message) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((toast) => toast.id !== id));
    }, 3200);
  };

  const addToCart = (product) => {
    const toneTone = selectedTones[product.id];
    if (product.tones && product.tones.length > 0 && !toneTone) {
      alert('Por favor, selecciona un tono');
      return;
    }
    
    setCart([...cart, { ...product, selectedTone: toneTone || 'Único' }]);
    setSelectedTones({ ...selectedTones, [product.id]: null });
    addNotification(`${product.nombre} agregado al carrito`);
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
            <li><a onClick={() => setCurrentSection('faq')}>FAQ</a></li>
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
                  <NotifyButton />
                </div>
              </div>
              <div className="product-card show">
                <div className="product-img placeholder-gold">✨</div>
                <div className="product-info">
                  <h4>Coming Soon</h4>
                  <p>Protector Solar Glow</p>
                  <span className="price">--</span>
                  <NotifyButton />
                </div>
              </div>
              <div className="product-card show">
                <div className="product-img placeholder-gold">✨</div>
                <div className="product-info">
                  <h4>Coming Soon</h4>
                  <p>Mascarilla Calmante de Noche</p>
                  <span className="price">--</span>
                  <NotifyButton />
                </div>
              </div>
            </div>
          </section>
        )}

        {currentSection === 'faq' && (
          <section className="faq-section">
            <div className="faq-main">
              <section className="faq-hero">
                <div className="faq-hero-copy">
                  <span className="news-tag">Preguntas Frecuentes</span>
                  <h2>Todo lo que necesitás saber antes de comprar en <span className="gold-text">HAZE</span></h2>
                  <p>Respondimos las dudas más comunes sobre envíos, pagos, tonos, rutinas y experiencia de compra para que recorrer la tienda se sienta simple, segura y linda.</p>
                  <div className="faq-cta-row">
                    <a className="skincare-link faq-link-dark" onClick={() => setCurrentSection('makeup')}>
                      Ver makeup →
                    </a>
                    <a className="faq-secondary-link" onClick={() => setCurrentSection('skincare')}>
                      Descubrir skincare
                    </a>
                  </div>
                </div>

                <div className="faq-hero-visual">
                  <div className="faq-floating-card">
                    <Image src="/toner-haze.png" alt="Hydrating Toner HAZE" width={420} height={420} />
                  </div>
                  <div className="faq-floating-card alt">
                    <Image src="/paleta-sombras.png" alt="Ultimate Glow Palette HAZE" width={360} height={360} />
                  </div>
                </div>
              </section>

              <section className="faq-feature-strip">
                <article>
                  <strong>Envíos a todo el país</strong>
                  <p>Despachamos entre 2 y 6 días hábiles y te mandamos seguimiento apenas sale tu pedido.</p>
                </article>
                <article>
                  <strong>Pago simple y seguro</strong>
                  <p>Podés recorrer un checkout claro, prolijo y pensado para que comprar se sienta fácil.</p>
                </article>
                <article>
                  <strong>Rutinas y tonos guiados</strong>
                  <p>Te ayudamos a elegir texturas, fórmulas y combinaciones sin que te pierdas entre opciones.</p>
                </article>
              </section>

              <section className="faq-content">
                <div className="faq-column">
                  <div className="faq-section-head">
                    <span className="news-tag faq-mini-tag">Dudas más consultadas</span>
                    <h3>Respuestas claras para comprar con confianza</h3>
                  </div>

                  <details className="faq-item" open>
                    <summary>¿Cuánto tarda en llegar mi pedido?</summary>
                    <p>Los envíos suelen demorar entre 2 y 6 días hábiles. Cuando tu compra se despacha, recibís un correo con el seguimiento para ver cada paso.</p>
                  </details>

                  <details className="faq-item">
                    <summary>¿Puedo combinar makeup y skincare en el mismo carrito?</summary>
                    <p>Sí. Podés mezclar productos de ambas categorías y finalizar todo junto. El carrito mantiene la selección completa en una sola compra.</p>
                  </details>

                  <details className="faq-item">
                    <summary>¿Cómo sé qué tono o producto elegir?</summary>
                    <p>En makeup podés usar el selector de tonos para comparar opciones, y en skincare te conviene arrancar con fórmulas livianas como toner, cleanser y moisturizer según tu rutina.</p>
                  </details>

                  <details className="faq-item">
                    <summary>¿Los productos sirven para piel sensible?</summary>
                    <p>Las fórmulas están pensadas para sentirse suaves y minimalistas. Si tu piel es muy reactiva, te recomendamos probar primero en una zona pequeña.</p>
                  </details>

                  <details className="faq-item">
                    <summary>¿La compra del sitio procesa pagos reales?</summary>
                    <p>El checkout actual funciona como demo del flujo de compra. Está diseñado para mostrar la experiencia completa sin cobrar de verdad.</p>
                  </details>

                  <details className="faq-item">
                    <summary>¿Qué pasa si mi pedido llega con un problema?</summary>
                    <p>Si hay daño, error o algo no llegó como esperabas, escribinos dentro de las primeras 48 horas y te ayudamos con cambio o resolución.</p>
                  </details>
                </div>

                <aside className="faq-column faq-side-panel">
                  <h3>Favoritos del momento</h3>

                  <article className="faq-product-callout">
                    <Image src="/toner-haze.png" alt="Hydrating Toner HAZE" width={110} height={140} />
                    <div>
                      <h4>Hydrating Toner</h4>
                      <p>Ideal para refrescar, hidratar y preparar la piel antes del serum, la crema o el makeup.</p>
                    </div>
                  </article>

                  <article className="faq-product-callout">
                    <Image src="/foundation-haze.png" alt="Pro Filt'r Foundation HAZE" width={110} height={140} />
                    <div>
                      <h4>Pro Filt&apos;r Foundation</h4>
                      <p>Acabado soft matte y cobertura pareja para un look prolijo que dura todo el día.</p>
                    </div>
                  </article>

                  <div className="faq-note">
                    <h4>Tip HAZE</h4>
                    <p>Aplicá el toner con la piel apenas húmeda y sellá enseguida con crema para potenciar la hidratación y el glow natural.</p>
                  </div>
                </aside>
              </section>

              <section className="faq-reviews-section">
                <div className="faq-section-head faq-section-head-center">
                  <span className="news-tag faq-mini-tag">Reseñas</span>
                  <h3>Lo que dice la comunidad</h3>
                </div>

                <div className="faq-review-grid">
                  <article className="faq-review-card">
                    <div className="faq-review-product">
                      <Image src="/foundation-haze.png" alt="Pro Filt'r Foundation" width={90} height={110} />
                      <div>
                        <h4>Pro Filt&apos;r Foundation</h4>
                        <span>★★★★★</span>
                      </div>
                    </div>
                    <p>"La base queda prolija, liviana y súper pareja. Tiene ese acabado elegante que hace que todo el makeup se vea más premium."</p>
                    <strong>Martina, Córdoba</strong>
                  </article>

                  <article className="faq-review-card">
                    <div className="faq-review-product">
                      <Image src="/paleta-sombras.png" alt="Ultimate Glow Palette" width={90} height={110} />
                      <div>
                        <h4>Ultimate Glow Palette</h4>
                        <span>★★★★★</span>
                      </div>
                    </div>
                    <p>"Los tonos pigmentan hermoso y se difuminan fácil. La uso para looks suaves de día y también para algo más nocturno."</p>
                    <strong>Julieta, Rosario</strong>
                  </article>

                  <article className="faq-review-card">
                    <div className="faq-review-product">
                      <Image src="/toner-haze.png" alt="Hydrating Toner" width={90} height={110} />
                      <div>
                        <h4>Hydrating Toner</h4>
                        <span>★★★★★</span>
                      </div>
                    </div>
                    <p>"Deja la piel fresca, calma rápido y me ordena toda la rutina. Se siente liviano pero se nota el cambio enseguida."</p>
                    <strong>Camila, Buenos Aires</strong>
                  </article>
                </div>
              </section>
            </div>
          </section>
        )}

      </main>

      {/* Footer */}
      <footer className="main-footer">
        <div className="footer-container">
          <div className="footer-section brand">
            <Image src="/LOGO-removebg-preview.png" alt="HAZE" width={320} height={80} className="footer-logo" />
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

      <div id="notification-container">
        {notifications.map((toast) => (
          <div key={toast.id} className="toast-notification">
            <div className="toast-top">
              <span className="toast-icon">✨</span>
              <span className="toast-title">HAZE BEAUTY</span>
            </div>
            <p className="toast-message">{toast.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
