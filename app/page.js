'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DEFAULT_PRODUCTS, buildProductsFromRows, getToneColor, normalizeCartItems } from '../lib/shop';
import { isSupabaseConfigured, supabase } from '../lib/supabase/client';

function getUserDisplayName(user) {
  if (!user) return 'Cuenta';

  return (
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'Mi cuenta'
  );
}

function readLocalCart() {
  try {
    return JSON.parse(localStorage.getItem('hazeCart') || '[]');
  } catch {
    return [];
  }
}

function saveLocalCart(cart) {
  localStorage.setItem('hazeCart', JSON.stringify(cart));
}

function NotifyButton() {
  const [notifyMode, setNotifyMode] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Por favor, ingresá un email válido.');
      return;
    }

    setSubmitted(true);
    setTimeout(() => {
      setNotifyMode(false);
      setSubmitted(false);
      setEmail('');
    }, 3000);
  };

  return (
    <div className="notify-container">
      {!notifyMode ? (
        <button
          className="notify-btn"
          onClick={() => setNotifyMode(true)}
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
            width: '100%',
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
          }}
        >
          ¡Gracias! Te avisaremos.
        </div>
      ) : (
        <div
          className="notify-input-container"
          style={{ display: 'flex', gap: '8px' }}
        >
          <input
            type="email"
            placeholder="Tu email aquí..."
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            style={{
              flex: 1,
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
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
        {isSkincare && product.isNew ? <span className="gold-badge">Nuevo</span> : null}
        <h4>{product.nombre}</h4>
        <p>{product.p}</p>

        {product.tones && product.tones.length > 0 ? (
          <div className="tone-selector">
            {product.tones.map((tone) => (
              <button
                key={tone}
                className={`tone-circle ${selectedTone === tone ? 'active' : ''}`}
                onClick={() => onToneSelect(tone)}
                title={tone}
                style={{
                  backgroundColor: getToneColor(tone),
                  border: selectedTone === tone ? '2px solid #95789b' : '1px solid #ccc',
                }}
              />
            ))}
          </div>
        ) : (
          <div className="tone-selector tone-selector-placeholder" aria-hidden="true" />
        )}

        <span className="price">${Number(product.precio).toLocaleString()}</span>
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

export default function Home() {
  const router = useRouter();
  const [currentSection, setCurrentSection] = useState('hero');
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedTones, setSelectedTones] = useState({});
  const [filter, setFilter] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [catalog, setCatalog] = useState(DEFAULT_PRODUCTS);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    async function bootstrapAuth() {
      if (!supabase) {
        setAuthReady(true);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      setUser(session?.user ?? null);
      setAuthReady(true);
    }

    bootstrapAuth();

    if (!supabase) return undefined;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      if (!supabase) return;

      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('tipo', { ascending: true })
        .order('categoria', { ascending: true })
        .order('nombre', { ascending: true });

      if (!error && data?.length) {
        setCatalog(buildProductsFromRows(data));
      }
    }

    fetchProducts();
  }, []);

  useEffect(() => {
    async function loadCart() {
      if (!authReady) return;

      if (user && supabase) {
        const { data, error } = await supabase
          .from('carrito')
          .select(`
            id,
            cantidad,
            tono_seleccionado,
            producto_id,
            producto:productos!carrito_producto_id_fkey (
              id,
              nombre,
              precio,
              imagen_url
            )
          `)
          .eq('usuario_id', user.id)
          .order('creado_en', { ascending: false });

        if (!error) {
          setCart(normalizeCartItems(data || []));
          return;
        }
      }

      setCart(readLocalCart());
    }

    loadCart();
  }, [user, authReady]);

  useEffect(() => {
    if (!user) {
      saveLocalCart(cart);
    }
  }, [cart, user]);

  const addNotification = (message) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((toast) => toast.id !== id));
    }, 3200);
  };

  const syncRemoteCart = async () => {
    if (!user || !supabase) return;

    const { data } = await supabase
      .from('carrito')
      .select(`
        id,
        cantidad,
        tono_seleccionado,
        producto_id,
        producto:productos!carrito_producto_id_fkey (
          id,
          nombre,
          precio,
          imagen_url
        )
      `)
      .eq('usuario_id', user.id)
      .order('creado_en', { ascending: false });

    setCart(normalizeCartItems(data || []));
  };

  const addToCart = async (product) => {
    const selectedTone = selectedTones[product.id];

    if (product.tones && product.tones.length > 0 && !selectedTone) {
      alert('Por favor, seleccioná un tono');
      return;
    }

    const toneValue = selectedTone || 'Único';

    if (user && supabase) {
      const existing = cart.find(
        (item) => item.id === product.id && item.selectedTone === toneValue
      );

      if (existing?.rowId) {
        await supabase
          .from('carrito')
          .update({ cantidad: existing.cantidad + 1 })
          .eq('id', existing.rowId);
      } else {
        await supabase.from('carrito').insert({
          usuario_id: user.id,
          producto_id: product.id,
          tono_seleccionado: toneValue,
          cantidad: 1,
        });
      }

      await syncRemoteCart();
    } else {
      setCart((prev) => {
        const existingIndex = prev.findIndex(
          (item) => item.id === product.id && item.selectedTone === toneValue
        );

        if (existingIndex >= 0) {
          const next = [...prev];
          next[existingIndex] = {
            ...next[existingIndex],
            cantidad: next[existingIndex].cantidad + 1,
          };
          return next;
        }

        return [
          ...prev,
          {
            id: product.id,
            nombre: product.nombre,
            precio: product.precio,
            img: product.img,
            selectedTone: toneValue,
            cantidad: 1,
          },
        ];
      });
    }

    setSelectedTones((prev) => ({ ...prev, [product.id]: null }));
    addNotification(`${product.nombre} agregado al carrito`);
  };

  const removeFromCart = async (index) => {
    const item = cart[index];
    if (!item) return;

    if (user && supabase && item.rowId) {
      if (item.cantidad > 1) {
        await supabase
          .from('carrito')
          .update({ cantidad: item.cantidad - 1 })
          .eq('id', item.rowId);
      } else {
        await supabase.from('carrito').delete().eq('id', item.rowId);
      }

      await syncRemoteCart();
      return;
    }

    setCart((prev) => {
      if (item.cantidad > 1) {
        return prev.map((entry, entryIndex) =>
          entryIndex === index
            ? { ...entry, cantidad: entry.cantidad - 1 }
            : entry
        );
      }

      return prev.filter((_, entryIndex) => entryIndex !== index);
    });
  };

  const handleSignOut = async () => {
    if (!supabase) return;

    await supabase.auth.signOut();
    setCart(readLocalCart());
    addNotification('Sesión cerrada');
  };

  const filteredProducts = catalog.makeup.filter(
    (product) => filter === 'all' || product.categoria === filter
  );

  const totalPrice = cart.reduce(
    (sum, item) => sum + Number(item.precio) * (item.cantidad || 1),
    0
  );

  return (
    <div>
      <header className="main-header">
        <div className="logo-container">
          <a onClick={() => setCurrentSection('hero')} style={{ cursor: 'pointer' }}>
            <Image
              src="/LOGO-removebg-preview.png"
              alt="HAZE Beauty"
              className="haze-logo"
              width={70}
              height={70}
            />
          </a>
        </div>

        <nav className="nav-menu">
          <ul>
            <li><a onClick={() => setCurrentSection('hero')}>Inicio</a></li>
            <li><a onClick={() => setCurrentSection('skincare')}>Skincare</a></li>
            <li><a onClick={() => setCurrentSection('makeup')}>Makeup</a></li>
            <li><a onClick={() => setCurrentSection('faq')}>FAQ</a></li>
            <li>
              <Link href="/login" className="account-link">
                {getUserDisplayName(user)}
              </Link>
            </li>
            {user ? (
              <li>
                <button type="button" className="logout-link" onClick={handleSignOut}>
                  Salir
                </button>
              </li>
            ) : null}
            <li>
              <div className="cart-container">
                <div className="cart-wrapper" onClick={() => setCartOpen(!cartOpen)}>
                  <span className="cart-icon">🛒</span>
                  <span id="cart-count">
                    {cart.reduce((sum, item) => sum + (item.cantidad || 1), 0)}
                  </span>
                </div>
              </div>
            </li>
          </ul>
        </nav>
      </header>

      <main>
        {currentSection === 'hero' ? (
          <section className="hero-section">
            <div className="hero-block skincare-news skincare-bg">
              <div className="news-container">
                <span className="news-tag">NUEVO LANZAMIENTO</span>
                <h2>HAZE <span className="gold-text">SKINCARE</span> LINE</h2>
                <p>La espera terminó. Presentamos nuestra primera línea de cuidado facial: fórmulas puras, minimalistas y altamente efectivas para lograr ese glow natural.</p>
                <a onClick={() => setCurrentSection('skincare')} className="skincare-link">
                  Explorar Skincare →
                </a>
              </div>
            </div>

            <div className="hero-story-band">
              <div className="hero-story-intro">
                <span className="hero-kicker">Nuestra esencia</span>
                <h3>Más que belleza: una marca creada para dejar pasar tu luz natural</h3>
                <p>En HAZE combinamos estética, fórmulas cuidadas y una experiencia simple para que cada rutina se sienta íntima, elegante y real.</p>
              </div>

              <div className="hero-story-grid">
                <article className="hero-story-card">
                  <span className="hero-story-label">Misión</span>
                  <p>Crear productos que eleven tu rutina diaria con fórmulas efectivas, sensoriales y fáciles de amar.</p>
                </article>

                <article className="hero-story-card">
                  <span className="hero-story-label">Visión</span>
                  <p>Construir una belleza más clara y consciente, donde el lujo se sienta cercano y auténtico.</p>
                </article>

                <article className="hero-story-card">
                  <span className="hero-story-label">Valores</span>
                  <p>Minimalismo, glow natural, crueldad cero y una experiencia pensada para hacerte sentir bien.</p>
                </article>
              </div>
            </div>
          </section>
        ) : null}

        {currentSection === 'makeup' ? (
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
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  selectedTone={selectedTones[product.id]}
                  onToneSelect={(tone) =>
                    setSelectedTones((prev) => ({ ...prev, [product.id]: tone }))
                  }
                  onAddToCart={() => addToCart(product)}
                />
              ))}
            </div>
          </section>
        ) : null}

        {currentSection === 'skincare' ? (
          <section className="catalog-container skincare-catalog">
            <aside className="sidebar skincare-sidebar">
              <h3>THE GLOW EDIT</h3>
              <p className="sidebar-desc">Fórmulas minimalistas diseñadas para resaltar tu luz propia. El dorado de la ciencia y la pureza de la naturaleza.</p>
              <div className="gold-line"></div>
            </aside>

            <div className="products-grid">
              {catalog.skincare.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isSkincare
                  onAddToCart={() => addToCart(product)}
                />
              ))}

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
        ) : null}

        {currentSection === 'faq' ? (
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
                    <p>Sí. Podés mezclar productos de ambas categorías y finalizar todo junto. Si iniciás sesión, además tu carrito queda guardado en Supabase.</p>
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
                    <p>El checkout actual guarda el pedido en Supabase como simulación académica. No ejecuta un cobro real.</p>
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

              <section className="supabase-showcase">
                <div className="faq-section-head faq-section-head-center">
                  <span className="news-tag faq-mini-tag">Integración real</span>
                  <h3>Supabase dentro de la tienda</h3>
                </div>

                <article className="supabase-crud-card">
                  <div className="supabase-crud-copy">
                    <span className="supabase-pill">CRUD</span>
                    <h4>Operaciones CRUD con Supabase</h4>
                    <p>
                      La tienda ya puede crear, leer, actualizar y eliminar datos
                      usando Supabase como base real.
                    </p>

                    <div className="crud-list">
                      <article>
                        <strong>Create</strong>
                        <p>Crear usuarios, guardar carrito y registrar órdenes.</p>
                      </article>
                      <article>
                        <strong>Read</strong>
                        <p>Leer productos, sesión del cliente y carrito guardado.</p>
                      </article>
                      <article>
                        <strong>Update</strong>
                        <p>Actualizar cantidades y datos de perfil del usuario.</p>
                      </article>
                      <article>
                        <strong>Delete</strong>
                        <p>Eliminar items del carrito o limpiar datos de prueba.</p>
                      </article>
                    </div>
                  </div>

                  <div className="supabase-code-panel">
                    <pre>{`const { data } = await supabase
  .from('productos')
  .select('*');

await supabase
  .from('carrito')
  .insert({
    usuario_id: user.id,
    producto_id: product.id,
    cantidad: 1
  });`}</pre>
                  </div>
                </article>

                <div className="supabase-compare-grid">
                  <article className="supabase-compare-card">
                    <h4>Leer productos desde la base de datos</h4>
                    <div className="supabase-compare-columns">
                      <div>
                        <span className="supabase-compare-title">Antes</span>
                        <pre>{`const productos = [
  { id: 1, nombre: 'Base' },
  { id: 2, nombre: 'Paleta' }
];`}</pre>
                        <ul className="supabase-bad-list">
                          <li>Los datos no persistían</li>
                          <li>Había que tocar el código</li>
                          <li>No escalaba bien</li>
                        </ul>
                      </div>
                      <div>
                        <span className="supabase-compare-title">Ahora</span>
                        <pre>{`const { data, error } = await supabase
  .from('productos')
  .select('*');

return data || [];`}</pre>
                        <ul className="supabase-good-list">
                          <li>Persisten en la nube</li>
                          <li>Se leen desde Supabase</li>
                          <li>Es más profesional y escalable</li>
                        </ul>
                      </div>
                    </div>
                  </article>

                  <article className="supabase-compare-card">
                    <h4>Agregar al carrito</h4>
                    <p className="supabase-card-copy">
                      Si el cliente está autenticado, el carrito se guarda con su
                      cuenta y se puede recuperar entre sesiones.
                    </p>
                    <pre>{`if (!user) router.push('/login');

await supabase.from('carrito').insert({
  usuario_id: user.id,
  producto_id: product.id,
  cantidad: 1
});`}</pre>
                    <div className="supabase-note">
                      En tu app ya quedó conectado el login, la lectura de productos
                      y el carrito persistente con Supabase.
                    </div>
                  </article>
                </div>
              </section>
            </div>
          </section>
        ) : null}
      </main>

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
            <form className="footer-form" onSubmit={(event) => event.preventDefault()}>
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

      <div
        id="cart-overlay"
        onClick={() => setCartOpen(false)}
        style={{ display: cartOpen ? 'block' : 'none' }}
      ></div>
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
              <div
                key={`${item.id}-${item.selectedTone}-${idx}`}
                style={{
                  display: 'flex',
                  gap: '15px',
                  marginBottom: '20px',
                  alignItems: 'center',
                  borderBottom: '1px solid #eee',
                  paddingBottom: '10px',
                }}
              >
                <Image src={item.img} alt={item.nombre} width={60} height={60} style={{ borderRadius: '8px' }} />
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '14px', margin: 0, color: '#333' }}>{item.nombre}</h4>
                  <p style={{ fontSize: '12px', color: '#95789b', margin: '4px 0' }}>
                    Tono: {item.selectedTone}
                  </p>
                  <p style={{ fontSize: '12px', color: '#95789b', margin: '4px 0' }}>
                    Cantidad: {item.cantidad || 1}
                  </p>
                  <span style={{ fontWeight: 'bold', color: '#d4af37' }}>
                    ${(Number(item.precio) * (item.cantidad || 1)).toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => removeFromCart(idx)}
                  style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '20px' }}
                >
                  &times;
                </button>
              </div>
            ))
          )}
        </div>

        <div className="cart-footer">
          <div className="cart-total">
            <span>Total:</span>
            <span id="cart-total-amount">${totalPrice.toLocaleString()}</span>
          </div>

          {isSupabaseConfigured && !user ? (
            <button className="btn-checkout" onClick={() => router.push('/login')}>
              Iniciá sesión para comprar
            </button>
          ) : (
            <Link href="/payment">
              <button className="btn-checkout">Finalizar Compra</button>
            </Link>
          )}

          <p className="payment-methods">
            {user
              ? 'Tu carrito está sincronizado con tu cuenta de Supabase.'
              : 'Podés comprar como invitada o iniciar sesión para guardar el carrito.'}
          </p>
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
