import { createServerClient } from '../../../lib/supabase/server';

function getToken(request) {
  return request.headers.get('authorization')?.replace('Bearer ', '') || null;
}

export async function GET(request) {
  try {
    const token = getToken(request);
    const supabase = createServerClient(token);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return Response.json({ error: 'No autenticado' }, { status: 401 });

    const { data, error } = await supabase
      .from('ordenes')
      .select('*, orden_items(*)')
      .eq('usuario_id', user.id)
      .order('creado_en', { ascending: false });

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ success: true, data });
  } catch (err) {
    return Response.json({ error: 'Error al obtener órdenes' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const token = getToken(request);
    const supabase = createServerClient(token);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return Response.json({ error: 'No autenticado' }, { status: 401 });

    const body = await request.json();
    const { nombre_cliente, email_cliente } = body;

    // Obtener carrito con productos
    const { data: carritoItems, error: carritoError } = await supabase
      .from('carrito')
      .select('id, cantidad, tono_seleccionado, producto:productos(id, nombre, precio, stock)')
      .eq('usuario_id', user.id);

    if (carritoError) return Response.json({ error: carritoError.message }, { status: 500 });
    if (!carritoItems || carritoItems.length === 0) {
      return Response.json({ error: 'El carrito está vacío' }, { status: 400 });
    }

    // Validar stock
    for (const item of carritoItems) {
      if (!item.producto) return Response.json({ error: 'Producto no encontrado' }, { status: 404 });
      if (item.producto.stock < item.cantidad) {
        return Response.json({ error: `Stock insuficiente para ${item.producto.nombre}` }, { status: 400 });
      }
    }

    // Calcular total en servidor (nunca confiar en el cliente)
    const total = carritoItems.reduce(
      (sum, item) => sum + Number(item.producto.precio) * item.cantidad, 0
    );

    // Crear orden
    const { data: orderData, error: orderError } = await supabase
      .from('ordenes')
      .insert({
        usuario_id: user.id,
        total,
        estado: 'pendiente',
        nombre_cliente: nombre_cliente || '',
        email_cliente: email_cliente || user.email,
      })
      .select()
      .single();

    if (orderError) return Response.json({ error: orderError.message }, { status: 500 });

    // Insertar items de la orden
    const itemsPayload = carritoItems.map((item) => ({
      orden_id: orderData.id,
      producto_id: item.producto.id,
      nombre_producto: item.producto.nombre,
      precio_unitario: Number(item.producto.precio),
      cantidad: item.cantidad,
      tono_seleccionado: item.tono_seleccionado,
    }));

    const { error: itemsError } = await supabase.from('orden_items').insert(itemsPayload);
    if (itemsError) return Response.json({ error: itemsError.message }, { status: 500 });

    // Actualizar stock
    for (const item of carritoItems) {
      await supabase
        .from('productos')
        .update({ stock: item.producto.stock - item.cantidad })
        .eq('id', item.producto.id);
    }

    // Vaciar carrito
    await supabase.from('carrito').delete().eq('usuario_id', user.id);

    return Response.json({ success: true, data: orderData }, { status: 201 });
  } catch (err) {
    return Response.json({ error: 'Error al crear la orden' }, { status: 500 });
  }
}
