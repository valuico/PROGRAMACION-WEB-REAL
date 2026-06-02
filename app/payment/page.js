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

      // Redirigir al checkout de pago con la orden creada
      const ordenId = result.data?.id;
      if (ordenId) {
        router.push(`/checkout?orden_id=${ordenId}`);
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

              <label>Número de Tarjeta</label>
              <input type="text" placeholder="4532 1234 5678 9010" disabled value="4532 1234 5678 9010" />

              <div className="checkout-grid">
                <div>
                  <label>Vencimiento</label>
                  <input type="text" placeholder="12/26" disabled value="12/26" />
                </div>
                <div>
                  <label>CVV</label>
                  <input type="text" placeholder="123" disabled value="123" />
                </div>
              </div>

              {error ? <p className="auth-feedback auth-error">{error}</p> : null}

              <button type="submit" className="checkout-primary-btn">
                GUARDAR PEDIDO
              </button>
              <button type="button" className="checkout-secondary-btn" onClick={() => router.push('/')}>
                Volver al Carrito
              </button>
              <div className="payment-icons-row" aria-label="Métodos de pago">
                <span className="payment-icon-chip">VISA</span>
                <span className="payment-icon-chip">Mastercard</span>
              </div>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  );
}
