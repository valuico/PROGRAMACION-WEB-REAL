'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function PagoPendienteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const externalRef = searchParams.get('external_reference');

  return (
    <div className="checkout-page">
      <div className="checkout-layout single-panel">
        <div className="checkout-panel" style={{ textAlign: 'center', borderTop: '4px solid #e67e22' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⏳</div>
          <div className="checkout-eyebrow">PAGO PENDIENTE</div>
          <h1 style={{ color: '#e67e22' }}>Pago en proceso</h1>
          <p style={{ color: '#6e5d72', lineHeight: 1.7, marginBottom: '28px' }}>
            Tu pago está siendo confirmado. Las transferencias bancarias pueden tardar 1-2 días hábiles.
            Te notificaremos cuando se confirme.
          </p>

          {externalRef && (
            <div className="checkout-totals" style={{ textAlign: 'left', marginBottom: '28px' }}>
              <div>
                <span>Nº de orden</span>
                <strong>#{externalRef}</strong>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="checkout-primary-btn" onClick={() => router.push('/ordenes')}>
              Ver mis órdenes
            </button>
            <button className="checkout-secondary-btn" onClick={() => router.push('/')}>
              Volver a la tienda
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PagoPendientePage() {
  return (
    <Suspense fallback={
      <div className="checkout-page">
        <div className="checkout-layout single-panel">
          <div className="checkout-panel">
            <p style={{ textAlign: 'center', padding: '40px 0', color: '#95789b' }}>Cargando…</p>
          </div>
        </div>
      </div>
    }>
      <PagoPendienteContent />
    </Suspense>
  );
}
