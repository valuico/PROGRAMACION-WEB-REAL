import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

function mpEstadoToInterno(mpStatus) {
  switch (mpStatus) {
    case 'approved':   return 'pagada';
    case 'pending':
    case 'in_process': return 'pendiente';
    case 'rejected':
    case 'cancelled':
    case 'refunded':   return 'cancelada';
    default:           return null;
  }
}

// MP envía POST cuando hay un evento de pago
export async function POST(req) {
  try {
    const body = await req.json();
    console.log('Webhook MP recibido:', JSON.stringify(body));

    const tipo = body.type || body.topic;
    const pagoId = body.data?.id || body.id;

    // Solo nos importan notificaciones de tipo "payment"
    if (tipo !== 'payment') {
      return Response.json({ ok: true, ignorado: tipo }, { status: 200 });
    }

    if (!pagoId) {
      return Response.json({ error: 'ID de pago no recibido' }, { status: 400 });
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      return Response.json({ error: 'Token MP no configurado' }, { status: 500 });
    }

    // Consultar el pago en MP para obtener el estado real
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${pagoId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!mpRes.ok) {
      console.error('No se pudo consultar el pago en MP:', mpRes.status);
      return Response.json({ error: 'Error consultando pago en MP' }, { status: 502 });
    }

    const pago = await mpRes.json();
    const ordenId = pago.external_reference;
    const nuevoEstado = mpEstadoToInterno(pago.status);

    if (!ordenId) {
      return Response.json({ error: 'external_reference vacío' }, { status: 400 });
    }

    if (!nuevoEstado) {
      // Estado desconocido — respondemos 200 para que MP no reintente
      return Response.json({ ok: true, status: pago.status }, { status: 200 });
    }

    // Actualizar la orden usando el cliente admin (bypasea RLS)
    const supabase = getAdminClient();
    if (!supabase) {
      return Response.json({ error: 'Supabase admin no configurado' }, { status: 500 });
    }

    const { error } = await supabase
      .from('ordenes')
      .update({
        estado: nuevoEstado,
        mp_payment_id: String(pagoId),
        mp_status: pago.status,
        actualizado_en: new Date().toISOString(),
      })
      .eq('id', Number(ordenId));

    if (error) {
      console.error('Error actualizando orden:', error.message);
      return Response.json({ error: 'Error actualizando orden' }, { status: 500 });
    }

    console.log(`✓ Orden ${ordenId} → "${nuevoEstado}" (pago MP: ${pagoId})`);
    return Response.json({ ok: true, orden_id: ordenId, estado: nuevoEstado }, { status: 200 });

  } catch (err) {
    console.error('Error en webhook MP:', err);
    return Response.json({ error: 'Error interno' }, { status: 500 });
  }
}

// MP hace GET para verificar que el endpoint existe
export async function GET() {
  return Response.json({ ok: true }, { status: 200 });
}
