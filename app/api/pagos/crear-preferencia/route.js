import MercadoPagoConfig, { Preference } from 'mercadopago';
import { createServerClient } from '../../../../lib/supabase/server';

function getToken(req) {
  return req.headers.get('authorization')?.replace('Bearer ', '') || null;
}

export async function POST(req) {
  try {
    // 1. Autenticación
    const token = getToken(req);
    const supabase = createServerClient(token);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return Response.json({ error: 'No autenticado' }, { status: 401 });
    }

    // 2. Leer orden_id del body
    const { orden_id } = await req.json();
    if (!orden_id) {
      return Response.json({ error: 'orden_id requerido' }, { status: 400 });
    }

    // 3. Buscar la orden en Supabase
    const { data: orden, error: ordenError } = await supabase
      .from('ordenes')
      .select('*, orden_items(*)')
      .eq('id', orden_id)
      .eq('usuario_id', user.id)
      .single();

    if (ordenError || !orden) {
      return Response.json({ error: 'Orden no encontrada' }, { status: 404 });
    }
    if (orden.estado !== 'pendiente') {
      return Response.json({ error: 'La orden no está pendiente' }, { status: 400 });
    }
    if (!orden.orden_items || orden.orden_items.length === 0) {
      return Response.json({ error: 'La orden no tiene items' }, { status: 400 });
    }

    // 4. Inicializar SDK de Mercado Pago
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      return Response.json({ error: 'MERCADOPAGO_ACCESS_TOKEN no configurado' }, { status: 500 });
    }

    const client = new MercadoPagoConfig({ accessToken });
    const preferenceClient = new Preference(client);

    // 5. Crear la preferencia con el SDK
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://haze-beauty-real.vercel.app';

    const preference = await preferenceClient.create({
      body: {
        items: orden.orden_items.map((item) => ({
          id: String(item.producto_id),
          title: item.nombre_producto,
          quantity: Number(item.cantidad),
          unit_price: Number(item.precio_unitario),
          currency_id: 'ARS',
        })),
        payer: {
          email: orden.email_cliente || user.email,
        },
        external_reference: String(orden.id),
        notification_url: `${baseUrl}/api/pagos/webhook`,
        back_urls: {
          success: `${baseUrl}/ordenes?pago=exitoso`,
          failure: `${baseUrl}/checkout?orden_id=${orden.id}&error=pago_fallido`,
          pending: `${baseUrl}/ordenes?pago=pendiente`,
        },
        auto_return: 'approved',
      },
    });

    // 6. Devolver los links
    return Response.json({
      success: true,
      preference_id: preference.id,
      sandbox_link: preference.sandbox_init_point,
      payment_link: preference.init_point,
    });

  } catch (err) {
    console.error('Error en crear-preferencia:', err);
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
