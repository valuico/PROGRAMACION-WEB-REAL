'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { normalizeCartItems } from '../../lib/shop';
import { isSupabaseConfigured, supabase } from '../../lib/supabase/client';

function readLocalCart() {
  try {
    return JSON.parse(localStorage.getItem('hazeCart') || '[]');
  } catch {
    return [];
  }
}

async function fetchRemoteCartItems(userId) {
  if (!supabase || !userId) return [];

  const { data: cartRows, error: cartError } = await supabase
    .from('carrito')
    .select('id, cantidad, tono_seleccionado, producto_id')
    .eq('usuario_id', userId)
    .order('creado_en', { ascending: false });

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

export default function PaymentPage() {
  const router = useRouter();
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [metodoPago, setMetodoPago] = useState('mercadopago');
  const [cardData, setCardData] = useState({ numero: '', titular: '', vencimiento: '', cvv: '' });
  const [cardFlipped, setCardFlipped] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      if (!supabase) {
        setCart(readLocalCart());
        setAuthReady(true);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      setUser(session?.user ?? null);

      if (!session?.user && isSupabaseConfigured) {
        router.push('/login');
        return;
      }

      if (session?.user) {
        setFormData((prev) => ({
          ...prev,
          name: session.user.user_metadata?.full_name || '',
          email: session.user.email || '',
        }));

        try {
          const data = await fetchRemoteCartItems(session.user.id);
          setCart(normalizeCartItems(data));
        } catch (error) {
          console.error('No se pudo cargar el carrito remoto:', error);
          setCart([]);
        }
      } else {
        setCart(readLocalCart());
      }

      setAuthReady(true);
    }

    bootstrap();
  }, []);

  const totalPrice = cart.reduce(
    (sum, item) => sum + Number(item.precio) * (item.cantidad || 1),
    0
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!user) {
      setError('Necesitás iniciar sesión para completar la compra.');
      return;
    }

    try {
      // Obtener token de sesión para enviarlo a la API
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Actualizar perfil
      await supabase.from('usuarios').upsert({
        id: user.id,
        email: user.email,
        nombre: formData.name,
      });

      // Crear orden via API Route (total calculado en servidor)
      const res = await fetch('/api/ordenes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre_cliente: formData.name,
          email_cliente: formData.email,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || 'Error al procesar la orden.');
        return;
      }

      // Redirigir según método de pago
      const ordenId = result.data?.id;
      if (ordenId) {
        if (metodoPago === 'mercadopago') {
          router.push(`/checkout?orden_id=${ordenId}`);
        } else {
          // Tarjeta o efectivo: mostrar confirmación
          setSubmitted(true);
          setCart([]);
        }
        return;
      }
    } catch (err) {
      setError('Error de conexión. Intentá de nuevo.');
      return;
    }

    setSubmitted(true);
    setCart([]);
  };

  if (authReady && isSupabaseConfigured && !user) {
    return (
      <div className="checkout-page">
        <div className="checkout-layout single-panel">
          <div className="checkout-panel">
            <div className="checkout-eyebrow">ACCESO REQUERIDO</div>
            <h1>Iniciá sesión para continuar</h1>
            <p className="checkout-intro">
              Tu tienda ya está conectada a Supabase, así que el checkout guarda el pedido con la cuenta autenticada del cliente.
            </p>
            <Link href="/login">
              <button className="checkout-primary-btn">Ir a login</button>
            </Link>
            <Link href="/">
              <button className="checkout-secondary-btn">Volver a la tienda</button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-layout">
        <div className="checkout-panel">
          <div className="checkout-eyebrow">PASO FINAL</div>
          <h1>Resumen de tu Compra</h1>
          <p className="checkout-intro">Revisá los items antes de confirmar el pedido.</p>

          <div className="checkout-items">
            {cart.length === 0 && !submitted ? (
              <div className="checkout-empty">
                <h3>No hay productos para pagar</h3>
                <p>Agregá artículos al carrito para simular una compra.</p>
              </div>
            ) : null}

            {cart.map((item, index) => (
              <article key={`${item.id}-${index}`} className="checkout-item">
                <Image src={item.img} alt={item.nombre} width={78} height={78} />
                <div>
                  <h4>{item.nombre}</h4>
                  <p>Tono: {item.selectedTone}</p>
                  <p>Cantidad: {item.cantidad || 1}</p>
                  <span>${(Number(item.precio) * (item.cantidad || 1)).toLocaleString()}</span>
                </div>
              </article>
            ))}
          </div>

          {!submitted ? (
            <div className="checkout-totals">
              <div>
                <span>Subtotal</span>
                <strong>${totalPrice.toLocaleString()}</strong>
              </div>
              <div>
                <span>Envío</span>
                <strong>Gratis</strong>
              </div>
              <div>
                <span>Total</span>
                <strong>${totalPrice.toLocaleString()}</strong>
              </div>
            </div>
          ) : null}

          {submitted ? (
            <div className="checkout-success">
              <h3>¡Compra simulada con éxito!</h3>
              <p>Gracias, {formData.name}. Registramos el pedido de prueba a nombre de {formData.email}.</p>
              <p>La orden quedó guardada en Supabase como demo académica y no se realizó ningún cobro real.</p>
              <Link href="/" style={{ marginTop: '20px', display: 'inline-block' }}>
                <button className="checkout-secondary-btn">Volver a la Tienda</button>
              </Link>
            </div>
          ) : null}
        </div>

        {!submitted ? (
          <div className="checkout-panel">
            <div className="checkout-eyebrow">INFORMACIÓN</div>
            <h2>Datos de Contacto</h2>

            <form className="checkout-form" onSubmit={handleSubmit}>
              <label>Nombre Completo</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Tu nombre"
              />

              <label>Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, email: event.target.value }))
                }
                placeholder="tu@email.com"
              />

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: '#3f2c46', fontSize: '14px', letterSpacing: '0.5px' }}>
                  Método de pago
                </label>
                {[
                  { id: 'mercadopago', label: 'Mercado Pago', desc: 'Tarjeta, transferencia o dinero en cuenta', icon: '💳' },
                  { id: 'tarjeta', label: 'Tarjeta de crédito/débito', desc: 'Visa, Mastercard y más', icon: '🏦' },
                  { id: 'efectivo', label: 'Efectivo', desc: 'Pago contra entrega', icon: '💵' },
                ].map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setMetodoPago(m.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '14px 16px', borderRadius: '14px', marginBottom: '8px',
                      cursor: 'pointer', transition: 'all 0.2s',
                      border: metodoPago === m.id ? '2px solid #95789b' : '1px solid #ece0ee',
                      background: metodoPago === m.id ? 'rgba(149,120,155,0.06)' : '#fff',
                    }}
                  >
                    <span style={{ fontSize: '1.4rem' }}>{m.icon}</span>
                    <div style={{ flex: 1 }}>
                      <strong style={{ color: '#3f2c46', display: 'block', fontSize: '14px' }}>{m.label}</strong>
                      <span style={{ color: '#95789b', fontSize: '12px' }}>{m.desc}</span>
                    </div>
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '50%',
                      border: metodoPago === m.id ? '5px solid #95789b' : '2px solid #ccc',
                      flexShrink: 0,
                    }} />
                  </div>
                ))}
              </div>

              {/* FORMULARIO DE TARJETA */}
              {metodoPago === 'tarjeta' && (
                <div style={{ marginBottom: '20px' }}>
                  {/* Vista previa de la tarjeta */}
                  <div style={{
                    background: 'linear-gradient(135deg, #3f2c46 0%, #95789b 100%)',
                    borderRadius: '16px', padding: '24px 24px 20px',
                    marginBottom: '20px', color: '#fff', position: 'relative',
                    minHeight: '160px', boxShadow: '0 8px 24px rgba(63,44,70,0.25)',
                  }}>
                    {/* Logo chip */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                      <div style={{ width: '36px', height: '28px', background: 'rgba(255,220,100,0.85)', borderRadius: '5px' }} />
                      <span style={{ fontSize: '13px', opacity: 0.7, letterSpacing: '0.1em' }}>
                        {cardData.numero.startsWith('4') ? 'VISA' :
                         cardData.numero.startsWith('5') ? 'MASTERCARD' :
                         cardData.numero.startsWith('3') ? 'AMEX' : '● ● ●'}
                      </span>
                    </div>
                    {/* Número */}
                    <p style={{ fontSize: '20px', letterSpacing: '0.18em', marginBottom: '16px', fontFamily: 'monospace', opacity: cardData.numero ? 1 : 0.4 }}>
                      {cardData.numero || '•••• •••• •••• ••••'}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <div>
                        <p style={{ fontSize: '10px', opacity: 0.6, marginBottom: '2px', letterSpacing: '0.08em' }}>TITULAR</p>
                        <p style={{ fontSize: '14px', letterSpacing: '0.06em', opacity: cardData.titular ? 1 : 0.4 }}>
                          {cardData.titular?.toUpperCase() || 'TU NOMBRE'}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '10px', opacity: 0.6, marginBottom: '2px', letterSpacing: '0.08em' }}>VENCE</p>
                        <p style={{ fontSize: '14px', fontFamily: 'monospace', opacity: cardData.vencimiento ? 1 : 0.4 }}>
                          {cardData.vencimiento || 'MM/AA'}
                        </p>
                      </div>
                    </div>
                    {/* CVV overlay al dar vuelta */}
                    {cardFlipped && (
                      <div style={{
                        position: 'absolute', inset: 0, borderRadius: '16px',
                        background: 'linear-gradient(135deg, #2a1c30 0%, #6b4c74 100%)',
                        display: 'flex', flexDirection: 'column', justifyContent: 'center',
                      }}>
                        <div style={{ background: '#1a1a1a', height: '40px', marginBottom: '16px' }} />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: '24px', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '11px', opacity: 0.6 }}>CVV</span>
                          <div style={{ background: '#fff', color: '#333', padding: '6px 16px', borderRadius: '4px', fontFamily: 'monospace', letterSpacing: '0.2em' }}>
                            {cardData.cvv || '•••'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Campos */}
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#3f2c46', marginBottom: '4px' }}>
                    Número de tarjeta
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={19}
                    placeholder="1234 5678 9012 3456"
                    value={cardData.numero}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
                      const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
                      setCardData(prev => ({ ...prev, numero: formatted }));
                    }}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #ddd', marginBottom: '12px', fontSize: '16px', fontFamily: 'monospace', letterSpacing: '0.1em' }}
                  />

                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#3f2c46', marginBottom: '4px' }}>
                    Nombre del titular
                  </label>
                  <input
                    type="text"
                    placeholder="Como figura en la tarjeta"
                    value={cardData.titular}
                    onChange={(e) => setCardData(prev => ({ ...prev, titular: e.target.value }))}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #ddd', marginBottom: '12px', fontSize: '14px' }}
                  />

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#3f2c46', marginBottom: '4px' }}>
                        Vencimiento
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={5}
                        placeholder="MM/AA"
                        value={cardData.vencimiento}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
                          const formatted = raw.length > 2 ? `${raw.slice(0,2)}/${raw.slice(2)}` : raw;
                          setCardData(prev => ({ ...prev, vencimiento: formatted }));
                        }}
                        style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '14px', fontFamily: 'monospace' }}
                      />
                    </div>
                    <div style={{ width: '110px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#3f2c46', marginBottom: '4px' }}>
                        CVV
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        placeholder="•••"
                        value={cardData.cvv}
                        onFocus={() => setCardFlipped(true)}
                        onBlur={() => setCardFlipped(false)}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
                          setCardData(prev => ({ ...prev, cvv: raw }));
                        }}
                        style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '14px', fontFamily: 'monospace', letterSpacing: '0.2em' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {error ? <p className="auth-feedback auth-error">{error}</p> : null}

              <button type="submit" className="checkout-primary-btn">
                {metodoPago === 'mercadopago' ? 'Continuar con Mercado Pago' : 'Confirmar Pedido'}
              </button>
              <button type="button" className="checkout-secondary-btn" onClick={() => router.push('/')}>
                Volver al Carrito
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  );
}
