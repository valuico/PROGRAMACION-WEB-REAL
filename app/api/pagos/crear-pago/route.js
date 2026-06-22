import { Payment } from 'mercadopago';
import { client } from '../../../../lib/mercadopago';
import { createServerClient } from '../../../../lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function getToken(req) {
  return req.headers.get('authorization')?.replace('Bearer ', '') || null;
}

export async function POST(req) {
  try {
    const token = getToken(req);
    const supabase = createServerClient(token);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return Response.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const { orden_id, token: cardToken, issuer_id, payment_method_id, installments, payer } = body;

    if (!orden_id || !cardToken) {
      return Response.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    // Obtener la orden
    const { data: orden, error: ordenError } = await supabase
      .from('ordenes')
      .select('*')
      .eq('id', orden_id)
      .eq('usuario_id', user.id)
      .single();

    if (ordenError || !orden) {
      return Response.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    if (orden.estado !== 'pendiente') {
      return Response.json({ error: 'La orden no está pendiente' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://haze-beauty-real.vercel.app';

    // Crear el pago con el token de tarjeta
    const paymentClient = new Payment(client);
    const payment = await paymentClient.create({
      body: {
        token: cardToken,
        installments: Number(installments) || 1,
        issuer_id: issuer_id,
        payment_method_id: payment_method_id,
        transaction_amount: Number(orden.total),
        description: `Orden HAZE Beauty #${orden.id}`,
        payer: {
          email: payer?.email || user.email,
          identification: {
            type: payer?.identification?.type || 'DNI',
            number: payer?.identification?.number || '12345678',
          },
        },
        external_reference: String(orden.id),
        notification_url: `${baseUrl}/api/pagos/webhook`,
      },
    });

    const status = payment.status;
    const paymentId = payment.id;

    // Actualizar la orden según el resultado
    const admin = getAdminClient();
    let nuevoEstado = 'pendiente';
    if (status === 'approved') nuevoEstado = 'pagada';
    if (status === 'rejected' || status === 'cancelled') nuevoEstado = 'cancelada';

    await admin.from('ordenes').update({
      estado: nuevoEstado,
      mp_payment_id: String(paymentId),
      mp_status: status,
      actualizado_en: new Date().toISOString(),
    }).eq('id', orden_id);

    // Redirigir según resultado
    if (status === 'approved') {
      return Response.json({
        success: true,
        status,
        redirect: `/pago-completado?payment_id=${paymentId}&external_reference=${orden_id}`,
      });
    } else if (status === 'pending' || status === 'in_process') {
      return Response.json({
        success: true,
        status,
        redirect: `/pago-pendiente?payment_id=${paymentId}&external_reference=${orden_id}`,
      });
    } else {
      return Response.json({
        success: true,
        status,
        redirect: `/pago-fallido?external_reference=${orden_id}`,
      });
    }

  } catch (err) {
    console.error('Error en crear-pago:', err);
    return Response.json({ error: err.message || 'Error interno' }, { status: 500 });
  }
}
