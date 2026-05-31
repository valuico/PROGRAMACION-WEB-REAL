'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function OrdenesPage() {
  const [ordenes, setOrdenes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchOrdenes() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/ordenes');
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || 'No se pudo cargar el historial.');
        }

        setOrdenes(payload.data || []);
      } catch (err) {
        setError(err.message || 'Error al cargar las órdenes.');
      } finally {
        setLoading(false);
      }
    }

    fetchOrdenes();
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <main style={{ padding: '80px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: '1.2rem', color: '#5f4a73' }}>Cargando...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ padding: '80px 24px', maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ color: '#3f2c46' }}>Historial de órdenes</h1>
        <p style={{ color: '#a73f6a', marginTop: 16 }}>{error}</p>
        <Link href="/" style={{ display: 'inline-block', marginTop: 24, color: '#7d5d95' }}>
          Volver al catálogo
        </Link>
      </main>
    );
  }

  if (!ordenes || ordenes.length === 0) {
    return (
      <main style={{ padding: '80px 24px', textAlign: 'center' }}>
        <h1 style={{ color: '#3f2c46' }}>No hay compras registradas</h1>
        <p style={{ marginTop: 16, color: '#6f5f78' }}>
          Todavía no hiciste ninguna compra. Cuando completes una orden, aparecerá aquí.
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-block',
            marginTop: 28,
            padding: '14px 26px',
            borderRadius: 999,
            backgroundColor: '#a473a3',
            color: '#fff',
            textDecoration: 'none',
            fontWeight: 700,
          }}
        >
          Volver al catálogo
        </Link>
      </main>
    );
  }

  return (
    <main style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <p style={{ textTransform: 'uppercase', letterSpacing: '0.2em', color: '#7d6788', marginBottom: 8 }}>
            Historial de órdenes
          </p>
          <h1 style={{ margin: 0, color: '#3f2c46' }}>Tus compras recientes</h1>
        </div>
        <Link
          href="/"
          style={{
            padding: '12px 22px',
            borderRadius: 999,
            backgroundColor: '#f4e6f5',
            color: '#5f4a73',
            textDecoration: 'none',
            fontWeight: 700,
          }}
        >
          Ir al catálogo
        </Link>
      </div>

      <div style={{ overflowX: 'auto', borderRadius: 24, border: '1px solid rgba(149, 120, 155, 0.18)', background: '#fff' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
          <thead style={{ background: '#f7eef8' }}>
            <tr>
              <th style={{ padding: '16px 18px', textAlign: 'left', fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7d6788' }}>
                Orden
              </th>
              <th style={{ padding: '16px 18px', textAlign: 'left', fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7d6788' }}>
                Total
              </th>
              <th style={{ padding: '16px 18px', textAlign: 'left', fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7d6788' }}>
                Estado
              </th>
              <th style={{ padding: '16px 18px', textAlign: 'left', fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7d6788' }}>
                Fecha
              </th>
            </tr>
          </thead>
          <tbody>
            {ordenes.map((orden) => (
              <tr key={orden.id} style={{ borderBottom: '1px solid rgba(149, 120, 155, 0.12)' }}>
                <td style={{ padding: '18px', color: '#3f2c46' }}>#{orden.id}</td>
                <td style={{ padding: '18px', color: '#5f4a73', fontWeight: 700 }}>{formatCurrency(Number(orden.total))}</td>
                <td style={{ padding: '18px' }}>
                  <span style={{ display: 'inline-flex', padding: '8px 14px', borderRadius: 999, backgroundColor: '#f3e4f4', color: '#6f4c80', fontWeight: 700, textTransform: 'capitalize' }}>
                    {orden.estado}
                  </span>
                </td>
                <td style={{ padding: '18px', color: '#6f5f78' }}>{formatDate(orden.creado_en)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
