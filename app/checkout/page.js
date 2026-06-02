'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase/client';

const ESTADO_LABELS = {
  pendiente:  'Pendiente de pago',
  pagada:     'Pagada',
  confirmada: 'Confirmada',
  enviada:    'Enviada',
  entregada:  'Entregada',
  cancelada:  'Cancelada',
};

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orden_id = searchParams.get('orden_id');

  const [orden, setOrden] = useState(null);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orden_id) {
      setError('No se especificó una orden.');
      setLoading(false);
      return;
    }
    fetchOrden();
  }, [orden_id]);

  async function fetchOrden() {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      const res = await fetch(`/api/ordenes/${orden_id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) { setError(json.error || 'No se pudo cargar la orden.'); return; }
      setOrden(json.data);
    } catch {
      setError('Error al cargar la orden.');
    } finally {
      setLoading(false);
    }
  }

  async function handlePagar() {
    setProcesando(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/pagos/crear-preferencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ orden_id: orden.id }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) { setError(json.error || 'Error al procesar el pago.'); return; }
      if (json.payment_link) {
        window.location.href = json.payment_link;
      } else {
        alert('Preferencia creada. Integración real con Mercado Pago disponible próximamente.');
      }
    } catch {
      setError('Error al conectar con el servicio de pagos.');
    } finally {
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

  if (error && !orden) {
    return (
      <div className="checkout-page">
        <div className="checkout-layout single-panel">
          <div className="checkout-panel">
            <div className="checkout-eyebrow">ERROR</div>
            <h1>Algo salió mal</h1>
            <p style={{ color: '#b42318', marginBottom: '24px' }}>{error}</p>
            <button className="checkout-secondary-btn" onClick={() => router.push('/ordenes')}>
              Ver mis órdenes
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

        {/* Panel izquierdo — resumen */}
        <div className="checkout-panel">
          <div className="checkout-eyebrow">RESUMEN DE ORDEN</div>
          <h1>Finalizar compra</h1>

          {/* Info de la orden */}
          <div className="checkout-totals" style={{ marginBottom: '24px' }}>
            <div>
              <span>Nº de orden</span>
              <strong>#{orden.id}</strong>
            </div>
            <div>
              <span>Estado</span>
              <strong>
                <span className={`ap-status ap-status-${orden.estado}`}>
                  {ESTADO_LABELS[orden.estado] || orden.estado}
                </span>
              </strong>
            </div>
          </div>

          {/* Items */}
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

          {/* Total */}
          <div className="checkout-totals" style={{ marginTop: '8px' }}>
            <div>
              <span>Subtotal</span>
              <strong>${total.toLocaleString('es-AR')}</strong>
            </div>
            <div>
              <span>Envío</span>
              <strong>Gratis</strong>
            </div>
            <div style={{ borderTop: '1px solid #ece0ee', paddingTop: '12px', marginTop: '4px' }}>
              <span style={{ fontWeight: '700', fontSize: '16px' }}>Total</span>
              <strong style={{ fontSize: '22px', color: '#95789b' }}>${total.toLocaleString('es-AR')}</strong>
            </div>
          </div>

          <button className="checkout-secondary-btn" onClick={() => router.push('/ordenes')} style={{ marginTop: '20px' }}>
            ← Volver a mis órdenes
          </button>
        </div>

        {/* Panel derecho — pago */}
        {orden.estado === 'pendiente' && (
          <div className="checkout-panel">
            <div className="checkout-eyebrow">MÉTODO DE PAGO</div>
            <h2>Seleccioná cómo pagar</h2>

            {/* Mercado Pago */}
            <div style={{
              border: '2px solid #95789b', borderRadius: '16px', padding: '20px',
              marginBottom: '12px', background: 'rgba(149,120,155,0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.4rem' }}>💳</span>
                <div>
                  <strong style={{ color: '#3f2c46', display: 'block' }}>Mercado Pago</strong>
                  <span style={{ fontSize: '0.8rem', color: '#95789b' }}>Tarjeta, transferencia o dinero en cuenta</span>
                </div>
                <span className="news-tag" style={{ marginLeft: 'auto', fontSize: '11px' }}>Disponible</span>
              </div>
            </div>

            {/* Transferencia — próximamente */}
            <div style={{
              border: '1px solid #ece0ee', borderRadius: '16px', padding: '20px',
              marginBottom: '24px', opacity: 0.5
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.4rem' }}>🏦</span>
                <div>
                  <strong style={{ color: '#3f2c46', display: 'block' }}>Transferencia bancaria</strong>
                  <span style={{ fontSize: '0.8rem', color: '#95789b' }}>Próximamente</span>
                </div>
              </div>
            </div>

            {error && (
              <p className="auth-feedback auth-error" style={{ marginBottom: '16px' }}>
                ⚠ {error}
              </p>
            )}

            <button
              className="checkout-primary-btn"
              onClick={handlePagar}
              disabled={procesando}
              style={{ opacity: procesando ? 0.7 : 1 }}
            >
              {procesando ? 'Procesando...' : 'Pagar con Mercado Pago'}
            </button>

            {/* Seguridad */}
            <div style={{
              display: 'flex', gap: '10px', alignItems: 'flex-start',
              marginTop: '20px', padding: '14px', background: '#faf7fb',
              borderRadius: '12px', border: '1px solid #ece0ee'
            }}>
              <span>🔒</span>
              <p style={{ margin: 0, fontSize: '12px', color: '#95789b', lineHeight: 1.6 }}>
                Tus datos están protegidos con encriptación SSL. No almacenamos información de tu tarjeta.
              </p>
            </div>

            <div className="payment-icons-row" style={{ marginTop: '16px' }}>
              <span className="payment-icon-chip">VISA</span>
              <span className="payment-icon-chip">Mastercard</span>
              <span className="payment-icon-chip">Mercado Pago</span>
            </div>
          </div>
        )}

        {/* Si ya está pagada/confirmada */}
        {orden.estado !== 'pendiente' && (
          <div className="checkout-panel">
            <div className="checkout-eyebrow">ESTADO</div>
            <h2>
              {orden.estado === 'entregada' ? '¡Orden completada!' :
               orden.estado === 'cancelada' ? 'Orden cancelada' :
               'Orden en proceso'}
            </h2>
            <p style={{ color: '#6e5d72', lineHeight: 1.7 }}>
              {orden.estado === 'pagada' && 'Tu pago fue confirmado. Estamos preparando tu pedido.'}
              {orden.estado === 'confirmada' && 'Tu pedido fue confirmado y está siendo preparado.'}
              {orden.estado === 'enviada' && 'Tu pedido está en camino.'}
              {orden.estado === 'entregada' && '¡Gracias por tu compra! Esperamos que disfrutes tus productos.'}
              {orden.estado === 'cancelada' && 'Esta orden fue cancelada. Si tenés preguntas, contactanos.'}
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
