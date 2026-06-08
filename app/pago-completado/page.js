'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function PagoCompletadoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const paymentId       = searchParams.get('payment_id');
  const externalRef     = searchParams.get('external_reference');
  const paymentStatus   = searchParams.get('status');
  const merchantOrderId = searchParams.get('merchant_order_id');

  return (
    <div className="checkout-page">
      <div className="checkout-layout single-panel">
        <div className="checkout-panel" style={{ textAlign: 'center', borderTop: '4px solid #27ae60' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
          <div className="checkout-eyebrow">PAGO COMPLETADO</div>
          <h1 style={{ color: '#27ae60' }}>¡Tu pago fue aprobado!</h1>
          <p style={{ color: '#6e5d72', lineHeight: 1.7, marginBottom: '28px' }}>
            Gracias por tu compra. Recibimos tu pago y estamos preparando tu pedido.
          </p>

          {(paymentId || externalRef) && (
            <div className="checkout-totals" style={{ textAlign: 'left', marginBottom: '28px' }}>
              {paymentId && (
                <div>
                  <span>ID de pago</span>
                  <strong style={{ fontFamily: 'monospace', fontSize: '13px' }}>{paymentId}</strong>
                </div>
              )}
              {externalRef && (
                <div>
                  <span>Nº de orden</span>
                  <strong>#{externalRef}</strong>
                </div>
              )}
              {paymentStatus && (
                <div>
                  <span>Estado</span>
                  <strong style={{ color: '#27ae60', textTransform: 'capitalize' }}>{paymentStatus}</strong>
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="checkout-primary-btn" onClick={() => router.push('/ordenes')}>
              Ver mis órdenes
            </button>
            <button className="checkout-secondary-btn" onClick={() => router.push('/')}>
              Seguir comprando
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PagoCompletadoPage() {
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
      <PagoCompletadoContent />
    </Suspense>
  );
}
