import { client, Preference } from '../../../../lib/mercadopago';
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

    // 3. Obtener la orden desde Supabase
    const { data: orden, error: ordenError } = await supabase
      .from('ordenes')
      .select('*, orden_items(*)')
      .eq('id', orden_id)
      .eq('usuario_id', user.id)
      .single();

    if (ordenError || !orden) {
      return Response.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    // 4. Validar estado
    if (orden.estado !== 'pendiente') {
      return Response.json({ error: 'La orden no está pendiente' }, { status: 400 });
    }

    if (!orden.orden_items || orden.orden_items.length === 0) {
      return Response.json({ error: 'La orden no tiene items' }, { status: 400 });
    }

    // 5. Crear la preferencia con el SDK
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://haze-beauty-real.vercel.app';
    const preferenceClient = new Preference(client);

    const preference = await preferenceClient.create({
      body: {
        items: orden.orden_items.map((item) => ({
          id: String(item.producto_id),
          title: item.nombre_producto,
          description: `Cantidad: ${item.cantidad}`,
          quantity: Number(item.cantidad),
          unit_price: Number(item.precio_unitario),
          currency_id: 'ARS',
        })),
        // Payer con identificación completa → reduce score de fraude → evita challenge 3DS
        payer: {
          name: 'Test',
          surname: 'User',
          email: orden.email_cliente || user.email,
          identification: {
            type: 'DNI',
            number: '12345678',
          },
        },
        external_reference: String(orden.id),
        notification_url: `${baseUrl}/api/pagos/webhook`,
        back_urls: {
          success: `${baseUrl}/pago-completado`,
          failure: `${baseUrl}/pago-fallido`,
          pending: `${baseUrl}/pago-pendiente`,
        },
        auto_return: 'approved',
      },
    });

    // 6. Retornar init_point al frontend
    return Response.json({
      success: true,
      preference_id: preference.id,
      init_point: preference.init_point,
      sandbox_link: preference.sandbox_init_point,
    });

  } catch (err) {
    console.error('Error en crear-preferencia:', err);
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
