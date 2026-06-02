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

    // 5. Construir estructura de preferencia para Mercado Pago
    // (Semana 13: aquí se llamará al SDK real de Mercado Pago)
    const preferencia = {
      items: orden.orden_items.map((item) => ({
        title: item.nombre_producto,
        quantity: item.cantidad,
        unit_price: Number(item.precio_unitario),
        currency_id: 'ARS',
      })),
      payer: {
        email: orden.email_cliente || user.email,
      },
      external_reference: String(orden.id),
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/pagos/webhook`,
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/ordenes?pago=exitoso`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/${orden.id}?pago=fallido`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/ordenes?pago=pendiente`,
      },
      auto_return: 'approved',
    };

    return Response.json({
      success: true,
      preferencia,
      orden_id: orden.id,
      total: Number(orden.total),
      // Semana 13: esto será el init_point (link) real de Mercado Pago
      payment_link: null,
      mensaje: 'Preferencia preparada. Integración con Mercado Pago disponible en Semana 13.',
    });
  } catch (err) {
    return Response.json({ error: 'Error al crear preferencia de pago' }, { status: 500 });
  }
}
