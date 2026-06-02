import { createServerClient } from '../../../../lib/supabase/server';

function getToken(request) {
  return request.headers.get('authorization')?.replace('Bearer ', '') || null;
}

export async function POST(request) {
  try {
    const token = getToken(request);
    const supabase = createServerClient(token);

    // 1. Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return Response.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { orden_id } = body;

    if (!orden_id) {
      return Response.json({ error: 'orden_id es requerido' }, { status: 400 });
    }

    // 2. Verificar que la orden existe y pertenece al usuario
    const { data: orden, error: ordenError } = await supabase
      .from('ordenes')
      .select('*, orden_items(*)')
      .eq('id', orden_id)
      .eq('usuario_id', user.id)
      .single();

    if (ordenError || !orden) {
      return Response.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    // 3. Verificar que el estado es 'pendiente'
    if (orden.estado !== 'pendiente') {
      return Response.json(
        { error: `La orden no está pendiente de pago. Estado actual: ${orden.estado}` },
        { status: 400 }
      );
    }

    // 4. Verificar que la orden tiene items
    if (!orden.orden_items || orden.orden_items.length === 0) {
      return Response.json({ error: 'La orden no tiene items' }, { status: 400 });
    }

    // 5. Verificar que el Access Token de MP está configurado
    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!mpToken) {
      return Response.json({ error: 'Mercado Pago no configurado' }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://haze-beauty-real.vercel.app';

    // 6. Construir preferencia y llamar a la API de Mercado Pago
    const preferencia = {
      items: orden.orden_items.map((item) => ({
        title: item.nombre_producto,
        quantity: Number(item.cantidad),
        unit_price: Number(item.precio_unitario),
        currency_id: 'ARS',
      })),
      payer: {
        email: orden.email_cliente || user.email,
      },
      external_reference: String(orden.id),
      notification_url: `${appUrl}/api/pagos/webhook`,
      back_urls: {
        success: `${appUrl}/ordenes?pago=exitoso`,
        failure: `${appUrl}/checkout?orden_id=${orden.id}&pago=fallido`,
        pending: `${appUrl}/ordenes?pago=pendiente`,
      },
      auto_return: 'approved',
    };

    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mpToken}`,
      },
      body: JSON.stringify(preferencia),
    });

    if (!mpRes.ok) {
      const mpError = await mpRes.json();
      console.error('Error de Mercado Pago:', mpError);
      return Response.json({ error: 'Error al crear preferencia en Mercado Pago' }, { status: 502 });
    }

    const mpData = await mpRes.json();

    return Response.json({
      success: true,
      orden_id: orden.id,
      total: Number(orden.total),
      payment_link: mpData.init_point,       // link real de MP (producción)
      sandbox_link: mpData.sandbox_init_point, // link de prueba
    });

  } catch (err) {
    console.error('Error en crear-preferencia:', err);
    return Response.json({ error: 'Error al crear preferencia de pago' }, { status: 500 });
  }
}
