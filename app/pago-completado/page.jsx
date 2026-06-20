'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function PagoCompletadoContent() {
  const params = useSearchParams();
  const ordenId = params.get('external_reference') || params.get('orden_id');
  const paymentId = params.get('payment_id');

  return (
    <div className="resultado-pago-page">
      <div className="resultado-pago-card exito">
        <div className="resultado-icon exito">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="resultado-kicker">¡Pago aprobado!</span>
        <h1>Tu compra fue procesada con éxito</h1>
        <p className="resultado-desc">
          Gracias por tu compra en <strong>HAZE BEAUTY</strong>. Tu pedido ha sido confirmado y lo estamos preparando.
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
        <div className="resultado-actions">
          <Link href="/perfil">
            <button className="ap-btn-primary">Ver mis pedidos</button>
          </Link>
          <Link href="/">
            <button className="checkout-secondary-btn">Seguir comprando</button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PagoCompletadoPage() {
  return (
    <Suspense>
      <PagoCompletadoContent />
    </Suspense>
  );
}
