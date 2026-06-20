'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase/client';

export default function OrdenesPage() {
  const router = useRouter();
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function loadOrdenes() {
      if (!supabase) { setLoading(false); return; }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      setUser(session.user);

      const res = await fetch('/api/ordenes', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.ok) {
        const result = await res.json();
        setOrdenes(result.data || []);
      }

      setLoading(false);
    }

    loadOrdenes();
  }, []);

  const formatCurrency = (value) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);

  const formatDate = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="ordenes-page">
        <div className="ordenes-shell">
          <p className="ordenes-loading">Cargando órdenes…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="ordenes-page">
      <div className="ordenes-shell">
        <div className="ordenes-header">
          <span className="hero-kicker">Mi cuenta</span>
          <h1>Historial de Órdenes</h1>
          <p>{ordenes.length} {ordenes.length === 1 ? 'compra' : 'compras'} registradas</p>
        </div>

        {ordenes.length === 0 ? (
          <div className="ordenes-empty">
            <p>Todavía no realizaste ninguna compra.</p>
            <Link href="/"><button className="ap-btn-primary">Explorar la tienda</button></Link>
          </div>
        ) : (
          <div className="ordenes-list">
            {ordenes.map((orden) => (
              <article key={orden.id} className="orden-card">
                <div className="orden-card-top">
                  <div>
                    <span className="orden-id">Orden #{orden.id}</span>
                    <span className="orden-fecha">{formatDate(orden.creado_en)}</span>
                  </div>
                  <div className="orden-right">
                    <span className={`ap-status ap-status-${orden.estado}`}>{orden.estado}</span>
                    <strong className="orden-total">{formatCurrency(Number(orden.total))}</strong>
                  </div>
                </div>

                {orden.orden_items && orden.orden_items.length > 0 && (
                  <div className="orden-items-list">
                    {orden.orden_items.map((item) => (
                      <div key={item.id} className="orden-item">
                        <span>{item.nombre_producto}</span>
                        <span className="orden-item-meta">
                          {item.tono_seleccionado && item.tono_seleccionado !== 'Único'
                            ? `${item.tono_seleccionado} · ` : ''}
                          x{item.cantidad} · {formatCurrency(Number(item.precio_unitario))} c/u
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {orden.estado === 'pendiente' && (
                  <div style={{ marginTop: '12px' }}>
                    <Link href={`/checkout?orden_id=${orden.id}`}>
                      <button className="ap-btn-primary" style={{ fontSize: '13px', padding: '10px 20px' }}>
                        Completar pago
                      </button>
                    </Link>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        <div className="ordenes-back">
          <Link href="/">← Volver a la tienda</Link>
        </div>
      </div>
    </div>
  );
}
