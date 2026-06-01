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
      .from('carrito')
      .select('id, cantidad, tono_seleccionado, producto:productos(id, nombre, precio, imagen_url)')
      .eq('usuario_id', user.id);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ success: true, data });
  } catch (err) {
    return Response.json({ error: 'Error al obtener carrito' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const token = getToken(request);
    const supabase = createServerClient(token);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return Response.json({ error: 'No autenticado' }, { status: 401 });

    const body = await request.json();
    const { producto_id, cantidad, tono_seleccionado } = body;

    if (!producto_id || !Number.isInteger(Number(producto_id))) {
      return Response.json({ error: 'producto_id inválido' }, { status: 400 });
    }
    if (!cantidad || !Number.isInteger(Number(cantidad)) || cantidad < 1 || cantidad > 100) {
      return Response.json({ error: 'cantidad debe ser entre 1 y 100' }, { status: 400 });
    }

    const { data: producto, error: prodError } = await supabase
      .from('productos')
      .select('id, stock')
      .eq('id', producto_id)
      .maybeSingle();

    if (prodError || !producto) return Response.json({ error: 'Producto no encontrado' }, { status: 404 });
    if (producto.stock < cantidad) return Response.json({ error: 'Stock insuficiente' }, { status: 400 });

    const { error } = await supabase.from('carrito').upsert({
      usuario_id: user.id,
      producto_id: Number(producto_id),
      tono_seleccionado: tono_seleccionado || 'Único',
      cantidad: Number(cantidad),
    }, { onConflict: 'usuario_id,producto_id,tono_seleccionado' });

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ success: true }, { status: 201 });
  } catch (err) {
    return Response.json({ error: 'Error al agregar al carrito' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const token = getToken(request);
    const supabase = createServerClient(token);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return Response.json({ error: 'No autenticado' }, { status: 401 });

    const { error } = await supabase.from('carrito').delete().eq('usuario_id', user.id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: 'Error al vaciar carrito' }, { status: 500 });
  }
}
