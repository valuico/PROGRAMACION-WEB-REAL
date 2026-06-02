'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '../../lib/supabase/client';

const ESTADO_LABELS = {
  pendiente: 'Pendiente de pago',
  pagada: 'Pagada',
  confirmada: 'Confirmada',
  enviada: 'Enviada',
  entregada: 'Entregada',
  cancelada: 'Cancelada',
};

export default function CheckoutPage() {
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
      const supabase = createBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      const res = await fetch(`/api/ordenes/${orden_id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error || 'No se pudo cargar la orden.');
        return;
      }

      setOrden(json.data);
    } catch (err) {
      setError('Error al cargar la orden.');
    } finally {
      setLoading(false);
    }
  }

  async function handlePagar() {
    setProcesando(true);
    setError(null);
    try {
      const supabase = createBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

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
        setError(json.error || 'Error al procesar el pago.');
        return;
      }

      if (json.payment_link) {
        // Semana 13: redirigir a Mercado Pago
        window.location.href = json.payment_link;
      } else {
        alert('Preferencia creada correctamente. La integración real con Mercado Pago estará disponible en la Semana 13.');
      }
    } catch (err) {
      setError('Error al conectar con el servicio de pagos.');
    } finally {
      setProcesando(false);
    }
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <p style={styles.loading}>Cargando orden...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorBox}>
          <p>{error}</p>
          <button onClick={() => router.push('/ordenes')} style={styles.btnSecundario}>
            Ver mis órdenes
          </button>
        </div>
      </div>
    );
  }

  if (!orden) return null;

  const total = Number(orden.total);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.titulo}>Finalizar compra</h1>

        {/* Resumen de la orden */}
        <div style={styles.seccion}>
          <h2 style={styles.subtitulo}>Resumen de orden</h2>
          <div style={styles.infoRow}>
            <span style={styles.label}>Nº de orden</span>
            <span style={styles.valor}>#{orden.id}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.label}>Estado</span>
            <span style={{ ...styles.badge, ...getBadgeStyle(orden.estado) }}>
              {ESTADO_LABELS[orden.estado] || orden.estado}
            </span>
          </div>
        </div>

        {/* Items */}
        {orden.orden_items && orden.orden_items.length > 0 && (
          <div style={styles.seccion}>
            <h2 style={styles.subtitulo}>Productos</h2>
            {orden.orden_items.map((item) => (
              <div key={item.id} style={styles.itemRow}>
                <div>
                  <p style={styles.itemNombre}>{item.nombre_producto}</p>
                  {item.tono_seleccionado && (
                    <p style={styles.itemTono}>{item.tono_seleccionado}</p>
                  )}
                </div>
                <div style={styles.itemPrecio}>
                  <span>{item.cantidad}x</span>
                  <span>${Number(item.precio_unitario).toLocaleString('es-AR')}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Total */}
        <div style={styles.totalRow}>
          <span style={styles.totalLabel}>Total a pagar</span>
          <span style={styles.totalValor}>${total.toLocaleString('es-AR')}</span>
        </div>

        {/* Métodos de pago */}
        {orden.estado === 'pendiente' && (
          <div style={styles.seccion}>
            <h2 style={styles.subtitulo}>Método de pago</h2>

            <div style={styles.metodoPago}>
              <div style={styles.metodoPagoHeader}>
                <span style={styles.metodoPagoIcon}>💳</span>
                <span style={styles.metodoPagoNombre}>Mercado Pago</span>
                <span style={styles.metodoPagoBadge}>Disponible</span>
              </div>
              <p style={styles.metodoPagoDesc}>
                Pagá con tarjeta, transferencia o dinero en cuenta.
              </p>
            </div>

            <div style={{ ...styles.metodoPago, opacity: 0.5 }}>
              <div style={styles.metodoPagoHeader}>
                <span style={styles.metodoPagoIcon}>🏦</span>
                <span style={styles.metodoPagoNombre}>Transferencia bancaria</span>
                <span style={{ ...styles.metodoPagoBadge, background: '#e5e7eb', color: '#6b7280' }}>
                  Próximamente
                </span>
              </div>
            </div>

            <button
              onClick={handlePagar}
              disabled={procesando}
              style={procesando ? { ...styles.btnPagar, opacity: 0.7, cursor: 'not-allowed' } : styles.btnPagar}
            >
              {procesando ? 'Procesando...' : 'Pagar con Mercado Pago'}
            </button>
          </div>
        )}

        {/* Seguridad */}
        <div style={styles.seguridadBox}>
          <span>🔒</span>
          <p style={styles.seguridadTexto}>
            Tus datos están protegidos con encriptación SSL. No almacenamos información de tu tarjeta.
          </p>
        </div>

        {/* Navegación */}
        <button onClick={() => router.push('/ordenes')} style={styles.btnSecundario}>
          ← Volver a mis órdenes
        </button>
      </div>
    </div>
  );
}

function getBadgeStyle(estado) {
  const colores = {
    pendiente: { background: '#fef3c7', color: '#92400e' },
    pagada: { background: '#d1fae5', color: '#065f46' },
    confirmada: { background: '#dbeafe', color: '#1e40af' },
    enviada: { background: '#ede9fe', color: '#5b21b6' },
    entregada: { background: '#d1fae5', color: '#065f46' },
    cancelada: { background: '#fee2e2', color: '#991b1b' },
  };
  return colores[estado] || {};
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f9fafb',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '2rem 1rem',
  },
  card: {
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 1px 8px rgba(0,0,0,0.1)',
    padding: '2rem',
    width: '100%',
    maxWidth: '520px',
  },
  titulo: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '1.5rem',
  },
  subtitulo: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '0.75rem',
  },
  seccion: {
    borderTop: '1px solid #f3f4f6',
    paddingTop: '1rem',
    marginTop: '1rem',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  label: { color: '#6b7280', fontSize: '0.9rem' },
  valor: { fontWeight: '600', color: '#111827' },
  badge: {
    padding: '2px 10px',
    borderRadius: '999px',
    fontSize: '0.8rem',
    fontWeight: '600',
  },
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 0',
    borderBottom: '1px solid #f3f4f6',
  },
  itemNombre: { margin: 0, fontWeight: '500', color: '#111827', fontSize: '0.9rem' },
  itemTono: { margin: 0, color: '#9ca3af', fontSize: '0.8rem' },
  itemPrecio: { display: 'flex', gap: '0.5rem', color: '#374151', fontSize: '0.9rem' },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 0',
    borderTop: '2px solid #f3f4f6',
    marginTop: '0.5rem',
  },
  totalLabel: { fontWeight: '600', fontSize: '1rem', color: '#374151' },
  totalValor: { fontWeight: '700', fontSize: '1.4rem', color: '#111827' },
  metodoPago: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    marginBottom: '0.75rem',
  },
  metodoPagoHeader: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' },
  metodoPagoIcon: { fontSize: '1.1rem' },
  metodoPagoNombre: { fontWeight: '600', fontSize: '0.95rem', flex: 1 },
  metodoPagoBadge: {
    background: '#d1fae5',
    color: '#065f46',
    padding: '2px 8px',
    borderRadius: '999px',
    fontSize: '0.75rem',
    fontWeight: '600',
  },
  metodoPagoDesc: { margin: 0, color: '#6b7280', fontSize: '0.85rem' },
  btnPagar: {
    width: '100%',
    padding: '0.85rem',
    background: '#009ee3',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '700',
    fontSize: '1rem',
    cursor: 'pointer',
    marginTop: '0.5rem',
  },
  btnSecundario: {
    background: 'none',
    border: 'none',
    color: '#6b7280',
    cursor: 'pointer',
    fontSize: '0.9rem',
    marginTop: '1rem',
    padding: '0',
    textDecoration: 'underline',
  },
  seguridadBox: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'flex-start',
    background: '#f9fafb',
    borderRadius: '8px',
    padding: '0.75rem',
    marginTop: '1rem',
  },
  seguridadTexto: { margin: 0, color: '#6b7280', fontSize: '0.8rem' },
  loading: { color: '#6b7280', fontSize: '1rem' },
  errorBox: { textAlign: 'center', color: '#dc2626' },
};
