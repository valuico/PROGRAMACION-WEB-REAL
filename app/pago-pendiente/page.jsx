'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function PagoPendienteContent() {
  const params = useSearchParams();
  const ordenId = params.get('external_reference') || params.get('orden_id');
  const paymentId = params.get('payment_id');

  return (
    <div className="resultado-pago-page">
      <div className="resultado-pago-card pendiente">
        <div className="resultado-icon pendiente">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="resultado-kicker">Pago en proceso</span>
        <h1>Tu pago está pendiente de confirmación</h1>
        <p className="resultado-desc">
          Estamos esperando la confirmación de tu pago. Podés completarlo siguiendo las instrucciones que recibiste o en la sucursal más cercana.
        </p>
        {ordenId && (
          <div className="resultado-detail">
            <span>N° de orden</span>
            <strong>#{ordenId}</strong>
          </div>
        )}
        {paymentId && (
          <div className="resultado-detail">
            <span>ID de pago</span>
            <strong>{paymentId}</strong>
          </div>
        )}
        <p className="resultado-nota">
          Te avisaremos por email cuando el pago sea confirmado. Tu orden permanece reservada.
        </p>
        <div className="resultado-actions">
          <Link href="/perfil">
            <button className="ap-btn-primary">Ver mis pedidos</button>
          </Link>
          <Link href="/">
            <button className="checkout-secondary-btn">Volver a la tienda</button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PagoPendientePage() {
  return (
    <Suspense>
      <PagoPendienteContent />
    </Suspense>
  );
}
