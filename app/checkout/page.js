'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase/client';

const ESTADO_LABELS = {
  pendiente:  'Pendiente de pago',
  pagada:     'Pagada ✓',
  confirmada: 'Confirmada',
  enviada:    'En camino',
  entregada:  'Entregada',
  cancelada:  'Cancelada',
};

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orden_id = searchParams.get('orden_id');
  const errorParam = searchParams.get('error');

  const [orden, setOrden] = useState(null);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState(
    errorParam === 'pago_fallido' ? 'El pago no pudo procesarse. Podés intentarlo de nuevo.' : null
  );

  useEffect(() => {
    if (!orden_id) { setError('No se especificó una orden.'); setLoading(false); return; }
    cargarOrden();
  }, [orden_id]);

  async function cargarOrden() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      const res = await fetch(`/api/ordenes/${orden_id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error || 'No se pudo cargar la orden.');
        return;
      }
      setOrden(json.data);
    } catch {
      setError('Error de conexión al cargar la orden.');
    } finally {
      setLoading(false);
    }
  }

  async function pagarConMP() {
    setProcesando(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      const res = await fetch('/api/pagos/crear-preferencia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ orden_id: orden.id }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error || 'No se pudo crear la preferencia de pago.');
        setProcesando(false);
        return;
      }

      const link = json.sandbox_link || json.init_point;
      if (!link) {
        setError('Mercado Pago no devolvió un link de pago.');
        setProcesando(false);
        return;
      }

      window.location.href = link;

    } catch {
      setError('Error de conexión. Intentá de nuevo.');
      setProcesando(false);
    }
  }

  if (loading) {
    return (
      <div className="checkout-page">
        <div className="checkout-layout single-panel">
          <div className="checkout-panel">
            <p style={{ color: '#95789b', textAlign: 'center', padding: '40px 0' }}>Cargando orden…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!orden && error) {
    return (
      <div className="checkout-page">
        <div className="checkout-layout single-panel">
          <div className="checkout-panel">
            <div className="checkout-eyebrow">ERROR</div>
            <h1>Algo salió mal</h1>
            <p style={{ color: '#b42318', marginBottom: '24px' }}>{error}</p>
            <button className="checkout-secondary-btn" onClick={() => router.push('/')}>
              Volver a la tienda
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!orden) return null;

  const total = Number(orden.total);

  return (
    <div className="checkout-page">
      <div className="checkout-layout">

        <div className="checkout-panel checkout-summary">
          <div className="checkout-eyebrow">RESUMEN DE ORDEN</div>
          <h1>Finalizar compra</h1>

          <div className="checkout-totals" style={{ marginBottom: '24px' }}>
            <div><span>Nº de orden</span><strong>#{orden.id}</strong></div>
            <div>
              <span>Estado</span>
              <strong>
                <span className={`ap-status ap-status-${orden.estado}`}>
                  {ESTADO_LABELS[orden.estado] || orden.estado}
                </span>
              </strong>
            </div>
          </div>

          {orden.orden_items && orden.orden_items.length > 0 && (
            <div className="checkout-items">
              {orden.orden_items.map((item) => (
                <div key={item.id} className="checkout-item" style={{ alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <h4>{item.nombre_producto}</h4>
                    {item.tono_seleccionado && item.tono_seleccionado !== 'Único' && (
                      <p>Tono: {item.tono_seleccionado}</p>
                    )}
                    <p>Cantidad: {item.cantidad}</p>
                    <span>${(Number(item.precio_unitario) * item.cantidad).toLocaleString('es-AR')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="checkout-totals" style={{ marginTop: '8px' }}>
            <div><span>Subtotal</span><strong>${total.toLocaleString('es-AR')}</strong></div>
            <div><span>Envío</span><strong>Gratis</strong></div>
            <div style={{ borderTop: '1px solid #ece0ee', paddingTop: '12px', marginTop: '4px' }}>
              <span style={{ fontWeight: '700', fontSize: '16px' }}>Total</span>
              <strong style={{ fontSize: '22px', color: '#95789b' }}>${total.toLocaleString('es-AR')}</strong>
            </div>
          </div>

          <button className="checkout-secondary-btn" onClick={() => router.push('/ordenes')} style={{ marginTop: '20px' }}>
            ← Ver mis órdenes
          </button>
        </div>

        {orden.estado === 'pendiente' && (
          <div className="checkout-panel checkout-payment">
            <div className="checkout-eyebrow">MÉTODO DE PAGO</div>
            <h2>Pagar con Mercado Pago</h2>

            <p style={{ color: '#6e5d72', fontSize: '14px', lineHeight: 1.6, marginBottom: '20px' }}>
              Pagá con tarjeta, efectivo, transferencia o dinero en cuenta de Mercado Pago.
            </p>

            <button
              className="checkout-primary-btn"
              onClick={pagarConMP}
              disabled={procesando}
              style={{ opacity: procesando ? 0.7 : 1, marginBottom: '20px' }}
            >
              {procesando ? 'Redirigiendo…' : '🔵 Pagar con Mercado Pago'}
            </button>

            {/* CAJA DE TESTING — para que el profesor pueda probar */}
            <div style={{
              background: '#fffbea', border: '1px solid #f5c842',
              borderRadius: '14px', padding: '16px 18px', marginBottom: '20px',
              fontSize: '13px', lineHeight: 1.7,
            }}>
              <p style={{ fontWeight: 700, color: '#7a5c00', marginBottom: '10px', fontSize: '13px' }}>
                🧪 Datos de prueba — Sandbox Mercado Pago
              </p>

              <p style={{ color: '#5a4500', marginBottom: '4px', fontWeight: 600 }}>✅ Recomendado: Dinero en cuenta MP</p>
              <div style={{ background: '#fff8d6', borderRadius: '8px', padding: '8px 12px', marginBottom: '12px', fontFamily: 'monospace', fontSize: '12px', color: '#3d2f00', lineHeight: 1.9 }}>
                Usuario: <strong>TESTUSER8136</strong><br/>
                Contraseña: <strong>I5IYR0uOM7</strong><br/>
                Cód. verificación: <strong>576543</strong><br/>
                Saldo: <strong>$10.000 ARS</strong>
              </div>

              <p style={{ color: '#5a4500', marginBottom: '4px', fontWeight: 600 }}>🃏 Tarjetas de prueba (Titular = resultado)</p>
              <div style={{ background: '#fff8d6', borderRadius: '8px', padding: '8px 12px', marginBottom: '10px', fontFamily: 'monospace', fontSize: '11px', color: '#3d2f00', lineHeight: 2 }}>
                Mastercard: <strong>5031 7557 3453 0604</strong> · CVV 123 · 11/30 · Titular: <strong>APRO</strong><br/>
                Visa: <strong>4509 9535 6623 3704</strong> · CVV 123 · 11/30 · Titular: <strong>APRO</strong><br/>
                Amex: <strong>3711 803032 57522</strong> · CVV 1234 · 11/30 · Titular: <strong>APRO</strong><br/>
                <span style={{ color: '#7a5c00' }}>Titular <strong>OTHE</strong> = rechazado · DNI siempre: 12345678</span>
              </div>

              <p style={{ color: '#7a5c00', fontSize: '11px', marginBottom: '0' }}>
                ⚠ Precios bajados a $800–$2.000 ARS para entrar en el límite de $10.000 de la cuenta de prueba.
                Si la tarjeta da error 404 es un bug del sandbox de MP Argentina — usá "Dinero en cuenta".
              </p>
            </div>

            {error && (
              <p className="auth-feedback auth-error" style={{ marginBottom: '16px' }}>
                ⚠ {error}
              </p>
            )}

            <div style={{
              display: 'flex', gap: '10px', alignItems: 'flex-start',
              marginTop: '20px', padding: '14px', background: '#faf7fb',
              borderRadius: '12px', border: '1px solid #ece0ee',
            }}>
              <span>🔒</span>
              <p style={{ margin: 0, fontSize: '12px', color: '#95789b', lineHeight: 1.6 }}>
                Pago seguro procesado por Mercado Pago. No almacenamos datos de tu tarjeta.
              </p>
            </div>

            <div className="payment-icons-row" style={{ marginTop: '16px' }}>
              <span className="payment-icon-chip">VISA</span>
              <span className="payment-icon-chip">Mastercard</span>
              <span className="payment-icon-chip">Mercado Pago</span>
            </div>
          </div>
        )}

        {orden.estado !== 'pendiente' && (
          <div className="checkout-panel">
            <div className="checkout-eyebrow">ESTADO</div>
            <h2>
              {orden.estado === 'pagada'    ? '¡Pago recibido!' :
               orden.estado === 'entregada' ? '¡Orden completada!' :
               orden.estado === 'cancelada' ? 'Orden cancelada' :
               'Orden en proceso'}
            </h2>
            <p style={{ color: '#6e5d72', lineHeight: 1.7 }}>
              {orden.estado === 'pagada'     && 'Tu pago fue confirmado. Estamos preparando tu pedido.'}
              {orden.estado === 'confirmada' && 'Tu pedido fue confirmado y está siendo preparado.'}
              {orden.estado === 'enviada'    && 'Tu pedido está en camino.'}
              {orden.estado === 'entregada'  && '¡Gracias por tu compra! Esperamos que disfrutes tus productos.'}
              {orden.estado === 'cancelada'  && 'Esta orden fue cancelada. Contactanos si tenés alguna pregunta.'}
            </p>
            <button className="checkout-secondary-btn" onClick={() => router.push('/')} style={{ marginTop: '20px' }}>
              Volver a la tienda
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="checkout-page">
        <div className="checkout-layout single-panel">
          <div className="checkout-panel">
            <p style={{ color: '#95789b', textAlign: 'center', padding: '40px 0' }}>Cargando…</p>
          </div>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
