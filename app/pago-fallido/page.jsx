'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function PagoFallidoContent() {
  const params = useSearchParams();
  const ordenId = params.get('external_reference') || params.get('orden_id');

  return (
    <div className="resultado-pago-page">
      <div className="resultado-pago-card error">
        <div className="resultado-icon error">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="10" />
            <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round" />
          </svg>
        </div>
        <span className="resultado-kicker">Pago rechazado</span>
        <h1>No pudimos procesar tu pago</h1>
        <p className="resultado-desc">
          El pago fue rechazado. Podés intentarlo nuevamente con otro medio de pago o verificar los datos de tu tarjeta.
        </p>
        {ordenId && (
          <div className="resultado-detail">
            <span>N° de orden</span>
            <strong>#{ordenId}</strong>
          </div>
        )}
        <div className="resultado-actions">
          {ordenId ? (
            <Link href={`/checkout?orden_id=${ordenId}&error=pago_fallido`}>
              <button className="ap-btn-primary">Intentar de nuevo</button>
            </Link>
          ) : (
            <Link href="/">
              <button className="ap-btn-primary">Volver a la tienda</button>
            </Link>
          )}
          <Link href="/perfil">
            <button className="checkout-secondary-btn">Ver mis pedidos</button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PagoFallidoPage() {
  return (
    <Suspense>
      <PagoFallidoContent />
    </Suspense>
  );
}
