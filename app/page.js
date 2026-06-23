'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DEFAULT_PRODUCTS, buildProductsFromRows, getToneColor, normalizeCartItems } from '../lib/shop';
import { isSupabaseConfigured, supabase } from '../lib/supabase/client';

const EDITORIAL_SLIDES = [
  {
    image: '/labiales carrusel.png',
    title: 'Brillo suave, gesto preciso',
    text: 'Texturas luminosas, tonos delicados y una estética pensada para elevar lo cotidiano.',
    tag: 'Glow Edit',
  },
  {
    image: '/haze-editorial-flatlay.png',
    title: 'Una colección que conversa entre sí',
    text: 'Makeup intuitivo, femenino y versátil para crear looks completos con una sola identidad visual.',
    tag: 'Makeup Story',
  },
  {
    image: '/haze-editorial-lips.png',
    title: 'El detalle final que cambia todo',
    text: 'Lips y liner en tonos románticos para un acabado pulido, moderno y naturalmente HAZE.',
    tag: 'Soft Color',
  },
];

const TICKER_ITEMS = [
  'Crueldad cero',
  'Envío gratis en compras +$50.000',
  'Nuevo lanzamiento Skincare',
  'Fórmulas veganas',
  'Glow minimalista todos los días',
];

const ROUTINE_STEPS = [
  { number: '01', title: 'Limpiar', copy: 'Una limpieza suave para retirar impurezas sin perder confort.', icon: '○' },
  { number: '02', title: 'Tonificar', copy: 'Prepará la piel con hidratación liviana y una base fresca.', icon: '◐' },
  { number: '03', title: 'Hidratar', copy: 'Sellá la rutina con nutrición ligera y una textura envolvente.', icon: '◌' },
  { number: '04', title: 'Iluminar', copy: 'Sumá glow y color con un acabado pulido, delicado y moderno.', icon: '✦' },
];

const TESTIMONIALS = [
  {
    quote: 'La rutina se siente simple, elegante y mi piel queda luminosa sin esfuerzo.',
    name: 'Martina, Buenos Aires',
  },
  {
    quote: 'Los tonos de makeup son suaves pero distintos. Todo se ve muy premium.',
    name: 'Julieta, Rosario',
  },
  {
    quote: 'El sitio transmite la marca perfecto: femenino, limpio y fácil de recorrer.',
    name: 'Sofía, Córdoba',
  },
];

const COMMUNITY_CARDS = Array.from({ length: 6 }, (_, index) => ({
  id: index + 1,
}));

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

async function fetchRemoteCartItems(userId) {
  if (!supabase || !userId) return [];

  const { data: cartRows, error: cartError } = await supabase
    .from('carrito')
    .select('id, cantidad, tono_seleccionado, producto_id')
    .eq('usuario_id', userId);

  if (cartError || !cartRows) {
    throw cartError || new Error('No se pudo leer el carrito.');
  }

  if (cartRows.length === 0) return [];

  const productIds = [...new Set(cartRows.map((row) => row.producto_id))];

  const { data: productRows, error: productsError } = await supabase
    .from('productos')
    .select('id, nombre, precio, imagen_url')
    .in('id', productIds);

  if (productsError || !productRows) {
    throw productsError || new Error('No se pudieron leer los productos del carrito.');
  }

  const productMap = new Map(productRows.map((product) => [product.id, product]));

  return cartRows.map((row) => ({
    id: row.id,
    cantidad: row.cantidad,
    tono_seleccionado: row.tono_seleccionado,
    producto_id: row.producto_id,
    producto: productMap.get(row.producto_id) || null,
  }));
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
    }, 4000);
  };

  return (
    <div className="notify-container">
      {!notifyMode ? (
        <button className="notify-btn" onClick={() => setNotifyMode(true)}>
          ✦ Avisame cuando salga
        </button>
      ) : submitted ? (
        <div className="thank-you-msg">
          <span className="thank-you-sparkle">✦</span>
          <p className="thank-you-title">¡Anotada!</p>
          <p className="thank-you-sub">Vas a ser la primera en saber cuando llegue.</p>
        </div>
      ) : (
        <div className="notify-input-container">
          <input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="notify-input"
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <button onClick={handleSubmit} className="notify-submit" aria-label="Enviar">
            →
          </button>
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, selectedTone, onToneSelect, onAddToCart, isSkincare }) {
  const [hoveredTone, setHoveredTone] = useState(null);

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
          <div>
            <div className="tone-selector">
              {product.tones.map((tone) => (
                <button
                  key={tone}
                  className={`tone-circle ${selectedTone === tone ? 'active' : ''}`}
                  onClick={() => onToneSelect(tone)}
                  onMouseEnter={() => setHoveredTone(tone)}
                  onMouseLeave={() => setHoveredTone(null)}
                  data-tone={tone}
                  style={{
                    backgroundColor: getToneColor(tone),
                    border: selectedTone === tone ? '2px solid #95789b' : '1px solid #ccc',
                  }}
                />
              ))}
            </div>
            <span className="tone-label-display">
              {hoveredTone || selectedTone || ''}
            </span>
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

function FooterNewsletter() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="footer-newsletter-success">
        <span className="footer-newsletter-success-icon">✦</span>
        <p>¡Bienvenida a la comunidad!</p>
        <span>Vas a recibir lo mejor de HAZE antes que nadie.</span>
      </div>
    );
  }

  return (
    <form className="footer-form" onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="tu@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <button type="submit">Suscribirme</button>
    </form>
  );
}

export default function Home() {
  const router = useRouter();
  const [currentSection, setCurrentSection] = useState('hero');
  const [cart, setCart] = useState([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedTones, setSelectedTones] = useState({});
  const [filter, setFilter] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [catalog, setCatalog] = useState(DEFAULT_PRODUCTS);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [currentEditorialSlide, setCurrentEditorialSlide] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState(null);
  const [targetProductId, setTargetProductId] = useState(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showLoader, setShowLoader] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentEditorialSlide((prev) => (prev + 1) % EDITORIAL_SLIDES.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 18);

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setShowLoader(false), 1500);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentSection]);

  useEffect(() => {
    const handleScrollProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };

    handleScrollProgress();
    window.addEventListener('scroll', handleScrollProgress, { passive: true });

    return () => window.removeEventListener('scroll', handleScrollProgress);
  }, []);

  useEffect(() => {
    if (showLoader) return;

    const alreadySeen = localStorage.getItem('hazeWelcomeSeen');
    if (alreadySeen) return;

    const timeoutId = window.setTimeout(() => {
      setShowWelcomeModal(true);
      localStorage.setItem('hazeWelcomeSeen', 'true');
    }, 2000);

    return () => window.clearTimeout(timeoutId);
  }, [showLoader]);

  useEffect(() => {
    const elements = document.querySelectorAll('.reveal-on-scroll');

    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -40px 0px' }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [currentSection]);

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
    async function loadUserProfile() {
      if (!authReady || !user) {
        setIsAdmin(false);
        return;
      }

      const email = user.email?.toLowerCase() || '';
      const isCompanyEmail = email.endsWith('@hazebeauty.com');
      let dbRole = null;

      if (supabase) {
        const { data: roleData } = await supabase.rpc('get_my_role');
        if (roleData) dbRole = roleData;
      }

      setIsAdmin(isCompanyEmail || dbRole === 'admin');
    }

    loadUserProfile();
  }, [user, authReady]);


  const refreshCatalog = async () => {
    if (!supabase) return;

    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .neq('activo', false)
      .order('tipo', { ascending: true })
      .order('categoria', { ascending: true })
      .order('nombre', { ascending: true });

    if (!error && data?.length) {
      setCatalog(buildProductsFromRows(data));
    }
  };

  useEffect(() => {
    refreshCatalog();
  }, []);

  useEffect(() => {
    async function loadCart() {
      if (!authReady) return;

      if (user && supabase) {
        try {
          // Mergear carrito local (invitado) a Supabase al iniciar sesión
          const localCart = readLocalCart();
          if (localCart.length > 0) {
            for (const item of localCart) {
              await supabase.from('carrito').upsert({
                usuario_id: user.id,
                producto_id: item.id,
                tono_seleccionado: item.selectedTone || 'Único',
                cantidad: item.cantidad || 1,
              }, { onConflict: 'usuario_id,producto_id,tono_seleccionado' });
            }
            saveLocalCart([]);
          }

          const data = await fetchRemoteCartItems(user.id);
          setCart(normalizeCartItems(data));
          setCartLoaded(true);
          return;
        } catch (error) {
          console.error('No se pudo cargar el carrito remoto:', error);
        }
      }

      setCart(readLocalCart());
      setCartLoaded(true);
    }

    loadCart();
  }, [user, authReady]);

  useEffect(() => {
    if (!cartLoaded) return; // No guardar hasta que el carrito esté cargado
    if (!user) {
      saveLocalCart(cart);
    }
  }, [cart, user, cartLoaded]);


  const addNotification = (message) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((toast) => toast.id !== id));
    }, 3200);
  };

  const syncRemoteCart = async () => {
    if (!user || !supabase) return;

    const data = await fetchRemoteCartItems(user.id);
    setCart(normalizeCartItems(data));
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

      const newCantidad = existing ? (existing.cantidad || 1) + 1 : 1;

      const { error: remoteError } = await supabase.from('carrito').upsert({
        usuario_id: user.id,
        producto_id: product.id,
        tono_seleccionado: toneValue,
        cantidad: newCantidad,
      }, { onConflict: 'usuario_id,producto_id,tono_seleccionado' });

      if (remoteError) {
        console.error('No se pudo agregar al carrito remoto:', remoteError);
        addNotification('No se pudo guardar en Supabase. Revisá carrito/policies.');
        return;
      }

      // Mostrar notificación inmediatamente
      setSelectedTones((prev) => ({ ...prev, [product.id]: null }));
      addNotification(`${product.nombre} agregado al carrito`);

      // Sincronizar carrito en segundo plano
      try {
        await syncRemoteCart();
      } catch (syncErr) {
        console.error('Error sincronizando carrito:', syncErr);
        // Actualizar estado local como fallback
        setCart((prev) => {
          const existingIndex = prev.findIndex(
            (item) => item.id === product.id && item.selectedTone === toneValue
          );
          if (existingIndex >= 0) {
            const next = [...prev];
            next[existingIndex] = { ...next[existingIndex], cantidad: newCantidad };
            return next;
          }
          return [...prev, { id: product.id, nombre: product.nombre, precio: product.precio, img: product.img, selectedTone: toneValue, cantidad: 1 }];
        });
      }
      return;
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
      let remoteError = null;

      if (item.cantidad > 1) {
        const { error } = await supabase
          .from('carrito')
          .update({ cantidad: item.cantidad - 1 })
          .eq('id', item.rowId);
        remoteError = error;
      } else {
        const { error } = await supabase.from('carrito').delete().eq('id', item.rowId);
        remoteError = error;
      }

      if (remoteError) {
        console.error('No se pudo actualizar el carrito remoto:', remoteError);
        addNotification('No se pudo actualizar el carrito en Supabase.');
        return;
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

  const openMakeupCategory = (nextFilter) => {
    setFilter(nextFilter);
    setCurrentSection('makeup');
    setActiveMegaMenu(null);
  };

  const openSkincareSection = () => {
    setCurrentSection('skincare');
    setActiveMegaMenu(null);
  };

  const openSkincareProduct = (productId) => {
    setTargetProductId(productId);
    setCurrentSection('skincare');
    setActiveMegaMenu(null);
  };

  useEffect(() => {
    if (!targetProductId || currentSection !== 'skincare') return;
    const el = document.querySelector(`[data-product-id="${targetProductId}"]`);
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('product-highlight');
        setTimeout(() => el.classList.remove('product-highlight'), 1500);
      }, 80);
      setTargetProductId(null);
    }
  }, [targetProductId, currentSection]);

  return (
    <div>
      <div className="scroll-progress-bar" style={{ transform: `scaleX(${scrollProgress / 100})` }} />

      {showLoader ? (
        <div className="page-loader">
          <Image
            src="/LOGO-removebg-preview.png"
            alt="HAZE Beauty"
            width={220}
            height={88}
            className="loader-logo"
          />
        </div>
      ) : null}

      {showWelcomeModal ? (
        <div className="welcome-modal-overlay" onClick={() => setShowWelcomeModal(false)}>
          <div className="welcome-modal" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="welcome-close"
              onClick={() => setShowWelcomeModal(false)}
              aria-label="Cerrar"
            >
              ×
            </button>
            <span className="hero-kicker">Bienvenida</span>
            <h3>Bienvenida a HAZE</h3>
            <p>Suscribite y recibí 10% off en tu primera compra.</p>
            <div className="welcome-form">
              <input type="email" placeholder="Tu email" />
              <button type="button">Suscribirme</button>
            </div>
          </div>
        </div>
      ) : null}

      <header
        className={`main-header premium-header ${isScrolled ? 'scrolled' : ''}`}
        onMouseLeave={() => setActiveMegaMenu(null)}
      >
        {/* promo-banner oculto temporalmente */}

        <div className="nav-container">
          {/* Fila superior: utilidades a la derecha, logo centrado */}
          <div className="header-row">
            <div className="header-left">
              {isAdmin ? (
                <button
                  type="button"
                  className="admin-panel-btn nav-utility-btn"
                  onClick={() => router.push('/admin')}
                >
                  Admin
                </button>
              ) : <span />}
            </div>

            <div className="header-center">
              <a onClick={() => setCurrentSection('hero')} style={{ cursor: 'pointer', display: 'flex' }}>
                <Image
                  src="/LOGO-removebg-preview.png"
                  alt="HAZE Beauty"
                  className="haze-logo"
                  width={220}
                  height={72}
                  style={{ width: '200px', height: 'auto' }}
                />
              </a>
            </div>

            <div className="header-right">
              <div className="nav-utility">
                {user ? (
                  <>
                    <Link href="/perfil" className="nav-icon-btn" title="Mi perfil">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      <span className="nav-icon-label">{getUserDisplayName(user)}</span>
                    </Link>
                    <button type="button" className="nav-icon-btn" onClick={handleSignOut} title="Cerrar sesión">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                      <span className="nav-icon-label">Salir</span>
                    </button>
                  </>
                ) : (
                  <Link href="/login" className="nav-icon-btn" title="Ingresar">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <span className="nav-icon-label">Ingresar</span>
                  </Link>
                )}
                <button className="nav-icon-btn cart-icon-btn" onClick={() => setCartOpen(!cartOpen)} title="Carrito">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <path d="M16 10a4 4 0 0 1-8 0"/>
                  </svg>
                  {cart.reduce((sum, item) => sum + (item.cantidad || 1), 0) > 0 && (
                    <span className="cart-badge">
                      {cart.reduce((sum, item) => sum + (item.cantidad || 1), 0)}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Fila de navegación full-width debajo del logo */}
        <div className="header-nav-row">
          <nav className="nav-menu premium-nav">
            <ul>
              <li><a onClick={() => setCurrentSection('hero')}>Inicio</a></li>
              <li
                className="nav-has-mega"
                onMouseEnter={() => setActiveMegaMenu('skincare')}
              >
                <a onClick={() => setCurrentSection('skincare')}>Skincare</a>
              </li>
              <li
                className="nav-has-mega"
                onMouseEnter={() => setActiveMegaMenu('makeup')}
              >
                <a onClick={() => openMakeupCategory('all')}>Makeup</a>
              </li>
              <li><a onClick={() => setCurrentSection('faq')}>FAQ</a></li>
            </ul>
          </nav>
        </div>

        {activeMegaMenu === 'skincare' ? (
          <div className="mega-menu">
            <div className="mega-menu-links">
              <span className="mega-menu-label">Skincare edit</span>
              <button type="button" onClick={openSkincareSection}>Ver toda la rutina</button>
              <button type="button" onClick={() => openSkincareProduct(13)}>Hydrating Toner</button>
              <button type="button" onClick={() => openSkincareProduct(14)}>Gentle Cleanser</button>
              <button type="button" onClick={() => openSkincareProduct(15)}>Daily Moisturizer</button>
            </div>
            <div className="mega-menu-feature">
              <Image src="/toner-haze.png" alt="Hydrating Toner" width={180} height={220} />
              <div>
                <strong>Hydrating Toner</strong>
                <p>El primer paso glow para una piel fresca, calma y luminosa.</p>
              </div>
            </div>
          </div>
        ) : null}

        {activeMegaMenu === 'makeup' ? (
          <div className="mega-menu">
            <div className="mega-menu-links">
              <span className="mega-menu-label">Makeup edit</span>
              <button type="button" onClick={() => openMakeupCategory('all')}>Explorar todo</button>
              <button type="button" onClick={() => openMakeupCategory('cara')}>Cara</button>
              <button type="button" onClick={() => openMakeupCategory('ojos')}>Ojos</button>
              <button type="button" onClick={() => openMakeupCategory('labios')}>Labios</button>
            </div>
            <div className="mega-menu-feature">
              <Image src="/paleta-sombras.png" alt="Ultimate Glow Palette" width={220} height={180} />
              <div>
                <strong>Ultimate Glow Palette</strong>
                <p>Sombras suaves y tonos versátiles para looks pulidos con identidad HAZE.</p>
              </div>
            </div>
          </div>
        ) : null}


        {/* ticker oculto temporalmente */}
      </header>

      <main>
        {currentSection === 'admin' ? (
          <section style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', flexDirection:'column', gap:'1rem' }}>
            <p style={{ color:'#6b7280' }}>Redirigiendo al panel de administración…</p>
          </section>
        ) : null}

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
              <div className="hero-scroll-indicator">
                <span />
              </div>
            </div>

            <div className="hero-story-band reveal-on-scroll">
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

            <section className="editorial-carousel reveal-on-scroll">
              <div className="editorial-copy">
                <span className="hero-kicker">Visual Story</span>
                <h3>Una identidad suave, luminosa y muy HAZE</h3>
                <p>
                  Imágenes que traducen el universo de la marca: brillos sutiles,
                  lavandas delicados y una belleza pensada para sentirse cercana.
                </p>
                <div className="editorial-slide-meta">
                  <span className="editorial-pill">
                    {EDITORIAL_SLIDES[currentEditorialSlide].tag}
                  </span>
                  <h4>{EDITORIAL_SLIDES[currentEditorialSlide].title}</h4>
                  <p>{EDITORIAL_SLIDES[currentEditorialSlide].text}</p>
                </div>
              </div>

              <div className="editorial-visual">
                <div className="editorial-frame">
                  {EDITORIAL_SLIDES.map((slide, index) => (
                    <div
                      key={slide.image}
                      className={`editorial-slide ${index === currentEditorialSlide ? 'active' : ''}`}
                    >
                      <Image
                        src={slide.image}
                        alt={slide.title}
                        width={1400}
                        height={1000}
                        className="editorial-image"
                      />
                    </div>
                  ))}
                </div>

                <div className="editorial-controls">
                  {EDITORIAL_SLIDES.map((slide, index) => (
                    <button
                      key={slide.title}
                      type="button"
                      className={`editorial-dot ${index === currentEditorialSlide ? 'active' : ''}`}
                      onClick={() => setCurrentEditorialSlide(index)}
                      aria-label={`Ver slide ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </section>

            <section className="routine-section reveal-on-scroll">
              <div className="routine-shell">
                <div className="routine-heading">
                  <span className="hero-kicker">Rutina diaria</span>
                  <h3>Tu rutina HAZE</h3>
                </div>
                <div className="routine-grid">
                  {ROUTINE_STEPS.map((step) => (
                    <article key={step.number} className="routine-step">
                      <span className="routine-icon">{step.icon}</span>
                      <strong>{step.number}</strong>
                      <h4>{step.title}</h4>
                      <p>{step.copy}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="testimonials-section reveal-on-scroll">
              <div className="testimonials-shell">
                <span className="hero-kicker">Reseñas</span>
                <h3>Lo que dice la comunidad</h3>
                <div className="testimonials-grid">
                  {TESTIMONIALS.map((testimonial) => (
                    <article key={testimonial.name} className="testimonial-card">
                      <span className="testimonial-stars">★★★★★</span>
                      <p>{testimonial.quote}</p>
                      <strong>{testimonial.name}</strong>
                    </article>
                  ))}
                </div>
              </div>
            </section>

          </section>
        ) : null}

        {currentSection === 'makeup' ? (
          <section className="catalog-container">
            <div className="catalog-shell">
              <div className="catalog-intro">
                <span className="hero-kicker">Makeup edit</span>
                <h3>Looks suaves, tonos pulidos y fórmulas que acompañan tu ritmo</h3>
                <div className="catalog-pills">
                  <button type="button" className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>Explorar todo</button>
                  <button type="button" className={filter === 'cara' ? 'active' : ''} onClick={() => setFilter('cara')}>Cara</button>
                  <button type="button" className={filter === 'ojos' ? 'active' : ''} onClick={() => setFilter('ojos')}>Ojos</button>
                  <button type="button" className={filter === 'labios' ? 'active' : ''} onClick={() => setFilter('labios')}>Labios</button>
                </div>
              </div>

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
            </div>
          </section>
        ) : null}

        {currentSection === 'skincare' ? (
          <section className="catalog-container skincare-catalog">
            <div className="catalog-shell">
              <div className="catalog-intro skincare-intro-card">
                <span className="hero-kicker">The glow edit</span>
                <h3>Fórmulas minimalistas para una rutina delicada, sensorial y luminosa</h3>
                <p className="sidebar-desc">Limpiá, tonificá e hidratá con una colección pensada para resaltar tu luz propia desde el primer paso.</p>
                <div className="gold-line"></div>
              </div>

              <div className="products-grid">
              {catalog.skincare.map((product) => (
                <div key={product.id} data-product-id={product.id}>
                  <ProductCard
                    product={product}
                    isSkincare
                    onAddToCart={() => addToCart(product)}
                  />
                </div>
              ))}

              <div className="product-card show coming-soon-card">
                <div className="product-img coming-soon-img">
                  <span className="coming-soon-label">— Pronto —</span>
                </div>
                <div className="product-info">
                  <h4>Serum Reparador Nocturno</h4>
                  <p>En desarrollo · Lanzamiento 2026</p>
                  <NotifyButton />
                </div>
              </div>

              <div className="product-card show coming-soon-card">
                <div className="product-img coming-soon-img">
                  <span className="coming-soon-label">— Pronto —</span>
                </div>
                <div className="product-info">
                  <h4>Protector Solar Glow</h4>
                  <p>En desarrollo · Lanzamiento 2026</p>
                  <NotifyButton />
                </div>
              </div>

              <div className="product-card show coming-soon-card">
                <div className="product-img coming-soon-img">
                  <span className="coming-soon-label">— Pronto —</span>
                </div>
                <div className="product-info">
                  <h4>Mascarilla Calmante de Noche</h4>
                  <p>En desarrollo · Lanzamiento 2026</p>
                  <NotifyButton />
                </div>
              </div>
              </div>
            </div>
          </section>
        ) : null}

        {currentSection === 'faq' ? (
          <section className="faq-section">
            {/* Hero */}
            <div className="faq-v2-hero">
              <span className="faq-v2-tag">Preguntas Frecuentes</span>
              <h1 className="faq-v2-title">Todo lo que necesitás saber sobre <span className="gold-text">HAZE</span></h1>
              <p className="faq-v2-subtitle">Envíos, pagos, tonos y rutinas — respondemos lo más consultado para que comprar se sienta simple y seguro.</p>
              <div className="faq-v2-cta-row">
                <button className="faq-v2-cta-primary" onClick={() => setCurrentSection('makeup')}>Ver makeup →</button>
                <button className="faq-v2-cta-secondary" onClick={() => setCurrentSection('skincare')}>Descubrir skincare</button>
              </div>
            </div>

            {/* Chips de info */}
            <div className="faq-v2-chips">
              {[
                { icon: '🚚', label: 'Envíos 2–6 días hábiles' },
                { icon: '🔒', label: 'Pago seguro con Mercado Pago' },
                { icon: '🌿', label: 'Fórmulas veganas y cruelty-free' },
                { icon: '🎨', label: 'Selector de tonos interactivo' },
              ].map((c) => (
                <div key={c.label} className="faq-v2-chip">
                  <span className="faq-v2-chip-icon">{c.icon}</span>
                  <span>{c.label}</span>
                </div>
              ))}
            </div>

            {/* Acordeón */}
            <div className="faq-v2-grid">
              <div className="faq-v2-accordion">
                {[
                  {
                    q: '¿Cuánto tarda en llegar mi pedido?',
                    a: 'Los envíos suelen demorar entre 2 y 6 días hábiles. Cuando tu compra se despacha, recibís un correo con el número de seguimiento para ver cada paso.',
                    icon: '🚚',
                  },
                  {
                    q: '¿Puedo combinar makeup y skincare en el mismo carrito?',
                    a: 'Sí. Podés mezclar productos de ambas categorías y finalizar todo junto en una sola compra. Si iniciás sesión, tu carrito queda guardado.',
                    icon: '🛒',
                  },
                  {
                    q: '¿Cómo sé qué tono o producto elegir?',
                    a: 'En cada product card de makeup podés pasar el mouse sobre los círculos de color para ver el nombre del tono antes de elegir. En skincare te conviene arrancar con toner, cleanser y moisturizer.',
                    icon: '🎨',
                  },
                  {
                    q: '¿Los productos sirven para piel sensible?',
                    a: 'Las fórmulas están pensadas para sentirse suaves y minimalistas. Si tu piel es muy reactiva, recomendamos probar primero en una zona pequeña.',
                    icon: '🌿',
                  },
                  {
                    q: '¿La compra procesa pagos reales?',
                    a: 'El checkout está integrado con Mercado Pago sandbox. Podés probar el flujo completo con las cuentas y tarjetas de prueba que aparecen en el checkout antes de pagar.',
                    icon: '💳',
                  },
                  {
                    q: '¿Puedo ver mis pedidos anteriores?',
                    a: 'Sí. Si iniciás sesión, en tu perfil (ícono de usuario arriba a la derecha) encontrás el historial completo de tus órdenes con estado y detalle de productos.',
                    icon: '📦',
                  },
                ].map((item, i) => (
                  <details key={i} className="faq-v2-item">
                    <summary className="faq-v2-summary">
                      <span className="faq-v2-q-icon">{item.icon}</span>
                      <span className="faq-v2-q-text">{item.q}</span>
                      <span className="faq-v2-chevron">▾</span>
                    </summary>
                    <div className="faq-v2-answer">{item.a}</div>
                  </details>
                ))}
              </div>

              {/* Panel lateral */}
              <aside className="faq-v2-side">
                <div className="faq-v2-side-card">
                  <Image src="/toner-haze.png" alt="Hydrating Toner" width={90} height={110} style={{ objectFit: 'contain' }} />
                  <div>
                    <span className="faq-v2-tag" style={{ marginBottom: '6px', display: 'inline-block' }}>Favorito</span>
                    <h4>Hydrating Toner</h4>
                    <p>Refrescá e hidratá antes del serum o la crema. La base perfecta para cualquier rutina.</p>
                  </div>
                </div>
                <div className="faq-v2-side-card">
                  <Image src="/foundation-haze.png" alt="Foundation" width={90} height={110} style={{ objectFit: 'contain' }} />
                  <div>
                    <span className="faq-v2-tag" style={{ marginBottom: '6px', display: 'inline-block' }}>Más vendido</span>
                    <h4>Pro Filt&apos;r Foundation</h4>
                    <p>Cobertura pareja y acabado soft matte que dura todo el día con look natural.</p>
                  </div>
                </div>
                <div className="faq-v2-tip">
                  <span className="faq-v2-tip-icon">✦</span>
                  <div>
                    <strong>Tip HAZE</strong>
                    <p>Aplicá el toner con la piel apenas húmeda y sellá con crema para potenciar la hidratación y el glow natural.</p>
                  </div>
                </div>
              </aside>
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
            <span className="footer-newsletter-kicker">Comunidad HAZE</span>
            <h4>Sé la primera en enterarte</h4>
            <p>Lanzamientos, rutinas y ofertas exclusivas directo a tu mail.</p>
            <FooterNewsletter />
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2026 HAZE Beauty. Todos los derechos reservados.</p>
          <div className="social-icons">
            <a href="#" aria-label="Instagram" className="social-icon-link">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3.5" y="3.5" width="17" height="17" rx="5"></rect>
                <circle cx="12" cy="12" r="4"></circle>
                <circle cx="17.3" cy="6.7" r="1"></circle>
              </svg>
            </a>
            <a href="#" aria-label="TikTok" className="social-icon-link">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M14.5 4c.5 2 1.9 3.6 4 4.1v2.7c-1.5 0-2.9-.4-4-1.2v6.2a5.3 5.3 0 1 1-5.3-5.3c.4 0 .8 0 1.1.1v2.7a2.7 2.7 0 1 0 1.6 2.5V4h2.6z"></path>
              </svg>
            </a>
            <a href="#" aria-label="Facebook" className="social-icon-link">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M13.7 20v-7h2.4l.4-2.8h-2.8V8.4c0-.8.2-1.4 1.4-1.4H16.6V4.5c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4.1v1.7H8v2.8h2.4v7h3.3z"></path>
              </svg>
            </a>
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
                  <span style={{ fontWeight: 'bold', color: '#996998' }}>
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
