'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function PagoFallidoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const externalRef = searchParams.get('external_reference');

  return (
    <div className="checkout-page">
      <div className="checkout-layout single-panel">
        <div className="checkout-panel" style={{ textAlign: 'center', borderTop: '4px solid #b42318' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>❌</div>
          <div className="checkout-eyebrow">PAGO FALLIDO</div>
          <h1 style={{ color: '#b42318' }}>El pago no pudo procesarse</h1>
          <p style={{ color: '#6e5d72', lineHeight: 1.7, marginBottom: '8px' }}>
            Tu pago fue rechazado. Posibles razones:
          </p>
          <ul style={{ textAlign: 'left', color: '#6e5d72', lineHeight: 2, marginBottom: '28px', paddingLeft: '20px' }}>
            <li>Fondos insuficientes en la cuenta</li>
            <li>Tarjeta rechazada por el banco</li>
            <li>Datos de tarjeta incorrectos</li>
            <li>Cancelación del proceso de pago</li>
          </ul>

          {externalRef && (
            <div className="checkout-totals" style={{ textAlign: 'left', marginBottom: '28px' }}>
              <div>
                <span>Nº de orden</span>
                <strong>#{externalRef}</strong>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {externalRef && (
              <button
                className="checkout-primary-btn"
                onClick={() => router.push(`/checkout?orden_id=${externalRef}`)}
              >
                Reintentar pago
              </button>
            )}
            <button className="checkout-secondary-btn" onClick={() => router.push('/ordenes')}>
              Ver mis órdenes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PagoFallidoPage() {
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
      <PagoFallidoContent />
    </Suspense>
  );
}
