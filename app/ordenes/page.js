'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase/client';

export default function OrdenesPage() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function loadOrdenes() {
      if (!supabase) { setLoading(false); return; }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

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

  if (loading) {
    return (
      <div className="ordenes-page">
        <div className="ordenes-shell">
          <p className="ordenes-loading">Cargando órdenes…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="ordenes-page">
        <div className="ordenes-shell">
          <h1>Mis Órdenes</h1>
          <p>Necesitás <Link href="/login">iniciar sesión</Link> para ver tus órdenes.</p>
        </div>
      </div>
    );
  }

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
            <Link href="/">
              <button className="ap-btn-primary">Explorar la tienda</button>
            </Link>
          </div>
        ) : (
          <div className="ordenes-list">
            {ordenes.map((orden) => (
              <article key={orden.id} className="orden-card">
                <div className="orden-card-top">
                  <div>
                    <span className="orden-id">Orden #{orden.id}</span>
                    <span className="orden-fecha">
                      {orden.creado_en
                        ? new Date(orden.creado_en).toLocaleDateString('es-AR', {
                            day: 'numeric', month: 'long', year: 'numeric',
                          })
                        : '—'}
                    </span>
                  </div>
                  <div className="orden-right">
                    <span className={`ap-status ap-status-${orden.estado}`}>{orden.estado}</span>
                    <strong className="orden-total">${Number(orden.total).toLocaleString('es-AR')}</strong>
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
                          x{item.cantidad} · ${Number(item.precio_unitario).toLocaleString('es-AR')} c/u
                        </span>
                      </div>
                    ))}
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
