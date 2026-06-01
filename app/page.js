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
    }, 3000);
  };

  return (
    <div className="notify-container">
      {!notifyMode ? (
        <button
          className="notify-btn"
          onClick={() => setNotifyMode(true)}
        >
          Avisame cuando salga
        </button>
      ) : submitted ? (
        <div className="thank-you-msg">
          ¡Gracias! Te avisaremos.
        </div>
      ) : (
        <div className="notify-input-container">
          <input
            type="email"
            placeholder="Tu email aquí..."
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="notify-input"
          />
          <button
            onClick={handleSubmit}
            className="notify-submit"
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
                data-tone={tone}
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
  const [currentEditorialSlide, setCurrentEditorialSlide] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showLoader, setShowLoader] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [adminProducts, setAdminProducts] = useState([]);
  const [adminOrders, setAdminOrders] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [adminSection, setAdminSection] = useState('dashboard');
  const [adminClients, setAdminClients] = useState([]);
  const [adminForm, setAdminForm] = useState({
    nombre: '',
    descripcion: '',
    descripcion_corta: '',
    precio: '',
    stock: '',
    categoria: 'skincare',
    tipo: 'skincare',
    imagen_url: '',
  });

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
        setUserProfile(null);
        return;
      }

      const email = user.email?.toLowerCase() || '';
      const isCompanyEmail = email.endsWith('@hazebeauty.com');
      let dbRole = null;
      let profile = null;

      if (supabase) {
        const { data: roleData } = await supabase.rpc('get_my_role');
        if (roleData) dbRole = roleData;

        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (!error && data) {
          profile = data;
        }
      }

      setUserProfile(profile);
      setIsAdmin(isCompanyEmail || dbRole === 'admin');
    }

    loadUserProfile();
  }, [user, authReady]);

  useEffect(() => {
    if (!isAdmin || !supabase) return;

    async function loadAdminData() {
      setAdminLoading(true);
      setAdminError('');

      try {
        const [productResponse, orderResponse, clientResponse] = await Promise.all([
          supabase.rpc('get_all_products'),
          supabase.rpc('get_all_orders'),
          supabase.rpc('get_all_clients'),
        ]);

        if (!productResponse.error && productResponse.data) {
          setAdminProducts(productResponse.data);
        }

        if (!orderResponse.error && orderResponse.data) {
          // get_all_orders devuelve json_agg (un solo objeto JSON)
          const orders = Array.isArray(orderResponse.data)
            ? orderResponse.data
            : orderResponse.data || [];
          setAdminOrders(orders);
        }

        if (!clientResponse.error && clientResponse.data) {
          setAdminClients(clientResponse.data);
        }
      } catch (adminFetchError) {
        setAdminError('No se pudieron cargar los datos de administración.');
        console.error(adminFetchError);
      } finally {
        setAdminLoading(false);
      }
    }

    loadAdminData();
  }, [isAdmin]);

  const refreshCatalog = async () => {
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
  };

  useEffect(() => {
    refreshCatalog();
  }, []);

  useEffect(() => {
    async function loadCart() {
      if (!authReady) return;

      if (user && supabase) {
        try {
          const data = await fetchRemoteCartItems(user.id);
          setCart(normalizeCartItems(data));
          return;
        } catch (error) {
          console.error('No se pudo cargar el carrito remoto:', error);
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

  const handleAdminFormChange = (field, value) => {
    setAdminForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdateAdminProduct = async (product) => {
    if (!supabase || !isAdmin) return;

    const { id, nombre, descripcion, descripcion_corta, precio, stock, categoria, tipo, imagen_url } = product;
    const numericPrice = Number(precio);
    const numericStock = Number(stock);

    const { error } = await supabase.from('productos').update({
      nombre,
      descripcion,
      descripcion_corta,
      precio: numericPrice,
      stock: numericStock,
      categoria,
      tipo,
      imagen_url,
    }).eq('id', id);

    if (error) {
      setAdminError('No se pudo actualizar el producto.');
      return;
    }

    addNotification('Producto actualizado');
    await refreshCatalog();
    setAdminProducts((prev) => prev.map((item) => (item.id === id ? { ...item, precio: numericPrice, stock: numericStock } : item)));
  };

  const handleDeleteAdminProduct = async (productId) => {
    if (!supabase || !isAdmin) return;

    const { error } = await supabase.from('productos').delete().eq('id', productId);
    if (error) {
      setAdminError('No se pudo eliminar el producto.');
      return;
    }

    addNotification('Producto eliminado');
    await refreshCatalog();
    setAdminProducts((prev) => prev.filter((item) => item.id !== productId));
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    if (!supabase || !isAdmin) return;
    const { error } = await supabase.from('ordenes').update({ estado: newStatus }).eq('id', orderId);
    if (!error) {
      setAdminOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, estado: newStatus } : o));
      addNotification('Estado del pedido actualizado');
    }
  };

  const handleCreateAdminProduct = async () => {
    if (!supabase || !isAdmin) return;

    const { nombre, descripcion, descripcion_corta, precio, stock, categoria, tipo, imagen_url } = adminForm;
    if (!nombre || !precio || !stock) {
      setAdminError('Completá nombre, precio y stock antes de crear el producto.');
      return;
    }

    const numericPrice = Number(precio);
    const numericStock = Number(stock);

    const { error } = await supabase.from('productos').insert([{ 
      nombre,
      descripcion,
      descripcion_corta,
      precio: numericPrice,
      stock: numericStock,
      categoria,
      tipo,
      imagen_url,
    }]);

    if (error) {
      setAdminError('No se pudo crear el producto.');
      return;
    }

    addNotification('Producto creado');
    setAdminForm({ nombre: '', descripcion: '', descripcion_corta: '', precio: '', stock: '', categoria: 'skincare', tipo: 'skincare', imagen_url: '' });
    await refreshCatalog();
    if (supabase && isAdmin) {
      const { data, error: adminDataError } = await supabase
        .from('productos')
        .select('*')
        .order('nombre', { ascending: true });

      if (!adminDataError && data) {
        setAdminProducts(data);
      }
    }
  };

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
                  onClick={() => setCurrentSection('admin')}
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
                    <Link href="/ordenes" className="nav-icon-btn" title="Mis órdenes">
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
              <button type="button" onClick={openSkincareSection}>Hydrating Toner</button>
              <button type="button" onClick={openSkincareSection}>Gentle Cleanser</button>
              <button type="button" onClick={openSkincareSection}>Daily Moisturizer</button>
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
          <section className="ap-shell">
            {/* Sidebar */}
            <aside className="ap-sidebar">
              <div className="ap-sidebar-brand">
                <span className="ap-brand-label">HAZE</span>
                <span className="ap-brand-sub">Admin</span>
              </div>
              <nav className="ap-nav">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: '◈' },
                  { id: 'productos', label: 'Productos', icon: '◇' },
                  { id: 'pedidos', label: 'Pedidos', icon: '◻' },
                  { id: 'clientes', label: 'Clientes', icon: '○' },
                ].map(({ id, label, icon }) => (
                  <button
                    key={id}
                    type="button"
                    className={`ap-nav-item ${adminSection === id ? 'active' : ''}`}
                    onClick={() => setAdminSection(id)}
                  >
                    <span className="ap-nav-icon">{icon}</span>
                    {label}
                  </button>
                ))}
              </nav>
              <div className="ap-sidebar-user">
                <span className="ap-user-email">{user?.email}</span>
                <button type="button" className="ap-signout" onClick={handleSignOut}>Cerrar sesión</button>
              </div>
            </aside>

            {/* Contenido principal */}
            <main className="ap-content">
              {adminLoading ? (
                <div className="ap-loading">Cargando…</div>
              ) : !isAdmin ? (
                <div className="ap-unauthorized">
                  <h3>Acceso no autorizado</h3>
                  <p>Solo administradores pueden ver este panel.</p>
                </div>
              ) : (
                <>
                  {/* ── DASHBOARD ── */}
                  {adminSection === 'dashboard' && (
                    <div className="ap-section">
                      <div className="ap-page-header">
                        <h2>Dashboard</h2>
                        <p>Resumen general del negocio</p>
                      </div>

                      <div className="ap-kpi-grid">
                        <div className="ap-kpi">
                          <span className="ap-kpi-label">Ventas totales</span>
                          <span className="ap-kpi-value">${adminOrders.reduce((s, o) => s + Number(o.total || 0), 0).toLocaleString('es-AR')}</span>
                        </div>
                        <div className="ap-kpi">
                          <span className="ap-kpi-label">Pedidos</span>
                          <span className="ap-kpi-value">{adminOrders.length}</span>
                        </div>
                        <div className="ap-kpi">
                          <span className="ap-kpi-label">Productos</span>
                          <span className="ap-kpi-value">{adminProducts.length}</span>
                        </div>
                        <div className="ap-kpi">
                          <span className="ap-kpi-label">Clientes</span>
                          <span className="ap-kpi-value">{adminClients.length}</span>
                        </div>
                      </div>

                      <div className="ap-recent-header">
                        <h3>Pedidos recientes</h3>
                      </div>
                      <div className="ap-table-wrap">
                        <table className="ap-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Cliente</th>
                              <th>Total</th>
                              <th>Estado</th>
                              <th>Fecha</th>
                            </tr>
                          </thead>
                          <tbody>
                            {adminOrders.slice(0, 8).map((order) => (
                              <tr key={order.id}>
                                <td className="ap-td-muted">#{order.id}</td>
                                <td>{order.email_cliente || '—'}</td>
                                <td>${Number(order.total || 0).toLocaleString('es-AR')}</td>
                                <td><span className={`ap-status ap-status-${order.estado}`}>{order.estado}</span></td>
                                <td className="ap-td-muted">{order.creado_en ? new Date(order.creado_en).toLocaleDateString('es-AR') : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* ── PRODUCTOS ── */}
                  {adminSection === 'productos' && (
                    <div className="ap-section">
                      <div className="ap-page-header">
                        <h2>Productos</h2>
                        <p>Editá precios, stock y creá nuevos productos</p>
                      </div>

                      {adminError && <p className="ap-error">{adminError}</p>}

                      <div className="ap-table-wrap">
                        <table className="ap-table">
                          <thead>
                            <tr>
                              <th>Nombre</th>
                              <th>Precio</th>
                              <th>Stock</th>
                              <th>Categoría</th>
                              <th>Tipo</th>
                              <th>Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {adminProducts.map((product) => (
                              <tr key={product.id}>
                                <td>
                                  <input className="ap-input" type="text" value={product.nombre || ''} onChange={(e) => setAdminProducts((prev) => prev.map((i) => i.id === product.id ? { ...i, nombre: e.target.value } : i))} />
                                </td>
                                <td>
                                  <input className="ap-input ap-input-sm" type="number" value={product.precio ?? ''} onChange={(e) => setAdminProducts((prev) => prev.map((i) => i.id === product.id ? { ...i, precio: e.target.value } : i))} />
                                </td>
                                <td>
                                  <input className="ap-input ap-input-sm" type="number" value={product.stock ?? ''} onChange={(e) => setAdminProducts((prev) => prev.map((i) => i.id === product.id ? { ...i, stock: e.target.value } : i))} />
                                </td>
                                <td>
                                  <input className="ap-input ap-input-sm" type="text" value={product.categoria || ''} onChange={(e) => setAdminProducts((prev) => prev.map((i) => i.id === product.id ? { ...i, categoria: e.target.value } : i))} />
                                </td>
                                <td>
                                  <input className="ap-input ap-input-sm" type="text" value={product.tipo || ''} onChange={(e) => setAdminProducts((prev) => prev.map((i) => i.id === product.id ? { ...i, tipo: e.target.value } : i))} />
                                </td>
                                <td className="ap-actions-cell">
                                  <button type="button" className="ap-btn-save" onClick={() => handleUpdateAdminProduct(product)}>Guardar</button>
                                  <button type="button" className="ap-btn-delete" onClick={() => handleDeleteAdminProduct(product.id)}>Eliminar</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="ap-form-section">
                        <h3>Agregar producto</h3>
                        <div className="ap-form-grid">
                          {[
                            { label: 'Nombre', field: 'nombre', type: 'text', full: false },
                            { label: 'Precio', field: 'precio', type: 'number', full: false },
                            { label: 'Stock', field: 'stock', type: 'number', full: false },
                            { label: 'Categoría', field: 'categoria', type: 'text', full: false },
                            { label: 'Tipo', field: 'tipo', type: 'text', full: false },
                            { label: 'URL de imagen', field: 'imagen_url', type: 'text', full: true },
                            { label: 'Descripción corta', field: 'descripcion_corta', type: 'text', full: true },
                          ].map(({ label, field, type, full }) => (
                            <label key={field} className={`ap-label ${full ? 'full' : ''}`}>
                              {label}
                              <input className="ap-input" type={type} value={adminForm[field]} onChange={(e) => handleAdminFormChange(field, e.target.value)} />
                            </label>
                          ))}
                        </div>
                        <button type="button" className="ap-btn-primary" onClick={handleCreateAdminProduct}>Crear producto</button>
                      </div>
                    </div>
                  )}

                  {/* ── PEDIDOS ── */}
                  {adminSection === 'pedidos' && (
                    <div className="ap-section">
                      <div className="ap-page-header">
                        <h2>Pedidos</h2>
                        <p>{adminOrders.length} pedidos en total</p>
                      </div>
                      <div className="ap-table-wrap">
                        <table className="ap-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Cliente</th>
                              <th>Total</th>
                              <th>Items</th>
                              <th>Estado</th>
                              <th>Fecha</th>
                            </tr>
                          </thead>
                          <tbody>
                            {adminOrders.map((order) => (
                              <tr key={order.id}>
                                <td className="ap-td-muted">#{order.id}</td>
                                <td>{order.email_cliente || '—'}</td>
                                <td>${Number(order.total || 0).toLocaleString('es-AR')}</td>
                                <td className="ap-td-muted">{order.orden_items?.length ?? 0} items</td>
                                <td>
                                  <select
                                    className="ap-select"
                                    value={order.estado || 'pendiente'}
                                    onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                  >
                                    <option value="pendiente">Pendiente</option>
                                    <option value="procesando">Procesando</option>
                                    <option value="enviado">Enviado</option>
                                    <option value="entregado">Entregado</option>
                                    <option value="cancelado">Cancelado</option>
                                  </select>
                                </td>
                                <td className="ap-td-muted">{order.creado_en ? new Date(order.creado_en).toLocaleDateString('es-AR') : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* ── CLIENTES ── */}
                  {adminSection === 'clientes' && (
                    <div className="ap-section">
                      <div className="ap-page-header">
                        <h2>Clientes</h2>
                        <p>{adminClients.length} usuarios registrados</p>
                      </div>
                      <div className="ap-table-wrap">
                        <table className="ap-table">
                          <thead>
                            <tr>
                              <th>Email</th>
                              <th>Nombre</th>
                              <th>Rol</th>
                              <th>Registro</th>
                            </tr>
                          </thead>
                          <tbody>
                            {adminClients.map((client) => (
                              <tr key={client.id}>
                                <td>{client.email || '—'}</td>
                                <td>{client.nombre || client.full_name || '—'}</td>
                                <td><span className={`ap-status ${client.role === 'admin' ? 'ap-status-admin' : 'ap-status-pendiente'}`}>{client.role || 'cliente'}</span></td>
                                <td className="ap-td-muted">{client.creado_en ? new Date(client.creado_en).toLocaleDateString('es-AR') : '—'}</td>
                              </tr>
                            ))}
                            {adminClients.length === 0 && (
                              <tr><td colSpan={4} className="ap-empty">No hay clientes registrados aún.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </main>
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
                <ProductCard
                  key={product.id}
                  product={product}
                  isSkincare
                  onAddToCart={() => addToCart(product)}
                />
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
            <div className="faq-main reveal-on-scroll">
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
