import { createClient } from '@supabase/supabase-js';

// Cliente con service role para poder actualizar sin RLS
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

// Mapea el status de Mercado Pago al estado interno de la orden
function mapearEstado(mpStatus) {
  switch (mpStatus) {
    case 'approved':   return 'pagada';
    case 'pending':    return 'pendiente';
    case 'in_process': return 'pendiente';
    case 'rejected':   return 'cancelada';
    case 'cancelled':  return 'cancelada';
    case 'refunded':   return 'cancelada';
    default:           return null;
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    // MP envía distintos tipos de notificaciones
    const topic = body.type || body.topic;
    const resourceId = body.data?.id || body.id;

    // Solo nos interesan las notificaciones de pagos
    if (topic !== 'payment') {
      return Response.json({ received: true }, { status: 200 });
    }

    if (!resourceId) {
      return Response.json({ error: 'ID de pago no encontrado' }, { status: 400 });
    }

    // Consultar el pago a la API de MP para obtener datos reales
    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!mpToken) {
      console.error('MERCADOPAGO_ACCESS_TOKEN no configurado');
      return Response.json({ error: 'Configuración incompleta' }, { status: 500 });
    }

    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${resourceId}`, {
      headers: { Authorization: `Bearer ${mpToken}` },
    });

    if (!mpRes.ok) {
      console.error('Error al consultar pago en MP:', mpRes.status);
      return Response.json({ error: 'No se pudo verificar el pago' }, { status: 502 });
    }

    const pago = await mpRes.json();
    const ordenId = pago.external_reference; // lo seteamos en crear-preferencia
    const nuevoEstado = mapearEstado(pago.status);

    if (!ordenId) {
      console.error('external_reference vacío en el pago de MP');
      return Response.json({ error: 'external_reference no encontrado' }, { status: 400 });
    }

    if (!nuevoEstado) {
      // Estado desconocido, lo ignoramos pero respondemos 200 para que MP no reintente
      return Response.json({ received: true, status: pago.status }, { status: 200 });
    }

    // Actualizar la orden en Supabase
    const supabase = getAdminClient();
    if (!supabase) {
      return Response.json({ error: 'Supabase no configurado' }, { status: 500 });
    }

    const { error: updateError } = await supabase
      .from('ordenes')
      .update({
        estado: nuevoEstado,
        mp_payment_id: String(resourceId),
        mp_status: pago.status,
        actualizado_en: new Date().toISOString(),
      })
      .eq('id', ordenId);

    if (updateError) {
      console.error('Error actualizando orden:', updateError.message);
      return Response.json({ error: 'Error al actualizar la orden' }, { status: 500 });
    }

    console.log(`Orden ${ordenId} actualizada a "${nuevoEstado}" (pago ${resourceId})`);
    return Response.json({ success: true, orden_id: ordenId, estado: nuevoEstado }, { status: 200 });

  } catch (err) {
    console.error('Error en webhook MP:', err);
    return Response.json({ error: 'Error interno' }, { status: 500 });
  }
}

// MP a veces hace GET para verificar que el endpoint existe
export async function GET() {
  return Response.json({ ok: true }, { status: 200 });
}
