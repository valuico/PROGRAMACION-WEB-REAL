'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase/client';

export default function PerfilPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ordenes');

  useEffect(() => {
    async function load() {
      if (!supabase) { setLoading(false); return; }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

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
    load();
  }, []);

  const formatCurrency = (v) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number(v));

  const formatDate = (v) => {
    if (!v) return '-';
    return new Date(v).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const estadoBadge = (estado) => {
    const map = {
      pagado:    { label: 'Pagado',    bg: '#e6f4ea', color: '#2d7a3a' },
      pendiente: { label: 'Pendiente', bg: '#fff8e1', color: '#a07000' },
      fallido:   { label: 'Fallido',   bg: '#fdecea', color: '#b71c1c' },
      aprobado:  { label: 'Aprobado',  bg: '#e6f4ea', color: '#2d7a3a' },
    };
    const s = map[estado] || { label: estado, bg: '#f0edf2', color: '#6b5278' };
    return (
      <span style={{
        background: s.bg, color: s.color,
        padding: '3px 10px', borderRadius: '999px',
        fontSize: '12px', fontWeight: 600, letterSpacing: '0.04em',
      }}>{s.label}</span>
    );
  };

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] || 'Mi cuenta';

  const initials = displayName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  if (loading) {
    return (
      <div className="perfil-page">
        <div className="perfil-shell">
          <p style={{ color: '#95789b', textAlign: 'center', padding: '60px 0' }}>Cargando perfil…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="perfil-page">
      <div className="perfil-shell">

        {/* HEADER DEL PERFIL */}
        <div className="perfil-hero">
          <div className="perfil-avatar">{initials}</div>
          <div className="perfil-hero-info">
            <span className="hero-kicker">Mi cuenta</span>
            <h1>{displayName}</h1>
            <p className="perfil-email">{user.email}</p>
          </div>
        </div>

        {/* STATS */}
        <div className="perfil-stats">
          <div className="perfil-stat">
            <strong>{ordenes.length}</strong>
            <span>{ordenes.length === 1 ? 'Pedido' : 'Pedidos'}</span>
          </div>
          <div className="perfil-stat">
            <strong>
              {formatCurrency(ordenes.filter(o => o.estado === 'pagado' || o.estado === 'aprobado').reduce((s, o) => s + Number(o.total), 0))}
            </strong>
            <span>Total gastado</span>
          </div>
          <div className="perfil-stat">
            <strong>{ordenes.filter(o => o.estado === 'pendiente').length}</strong>
            <span>Pendientes</span>
          </div>
        </div>

        {/* TABS */}
        <div className="perfil-tabs">
          <button
            className={`perfil-tab ${activeTab === 'ordenes' ? 'active' : ''}`}
            onClick={() => setActiveTab('ordenes')}
          >
            Mis pedidos
          </button>
          <button
            className={`perfil-tab ${activeTab === 'datos' ? 'active' : ''}`}
            onClick={() => setActiveTab('datos')}
          >
            Mis datos
          </button>
        </div>

        {/* TAB: PEDIDOS */}
        {activeTab === 'ordenes' && (
          <div className="perfil-ordenes">
            {ordenes.length === 0 ? (
              <div className="ordenes-empty">
                <p>Todavía no realizaste ninguna compra.</p>
                <Link href="/"><button className="ap-btn-primary">Explorar la tienda</button></Link>
              </div>
            ) : (
              ordenes.map((orden) => (
                <article key={orden.id} className="orden-card">
                  <div className="orden-card-top">
                    <div>
                      <span className="orden-id">Orden #{orden.id}</span>
                      <span className="orden-fecha">{formatDate(orden.creado_en)}</span>
                    </div>
                    <div className="orden-right">
                      {estadoBadge(orden.estado)}
                      <strong className="orden-total">{formatCurrency(orden.total)}</strong>
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
                            x{item.cantidad} · {formatCurrency(item.precio_unitario)} c/u
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
              ))
            )}
          </div>
        )}

        {/* TAB: DATOS */}
        {activeTab === 'datos' && (
          <div className="perfil-datos">
            <div className="perfil-dato-row">
              <span className="perfil-dato-label">Nombre</span>
              <span className="perfil-dato-value">{displayName}</span>
            </div>
            <div className="perfil-dato-row">
              <span className="perfil-dato-label">Email</span>
              <span className="perfil-dato-value">{user.email}</span>
            </div>
            <div className="perfil-dato-row">
              <span className="perfil-dato-label">Cuenta creada</span>
              <span className="perfil-dato-value">{formatDate(user.created_at)}</span>
            </div>
            <div className="perfil-dato-row">
              <span className="perfil-dato-label">Último acceso</span>
              <span className="perfil-dato-value">{formatDate(user.last_sign_in_at)}</span>
            </div>
          </div>
        )}

        <div className="ordenes-back" style={{ marginTop: '40px' }}>
          <Link href="/">← Volver a la tienda</Link>
        </div>

      </div>
    </div>
  );
}
