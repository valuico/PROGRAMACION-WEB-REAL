import { createServerSupabaseClient } from '../../../lib/supabase/server';
import { successResponse, errorResponse } from '../../../lib/api-utils';

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const { data: user, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse('No autorizado. Debes iniciar sesión.', 'auth_required', 401);
    }

    const { data, error } = await supabase
      .from('ordenes')
      .select('id, total, estado, creado_en')
      .eq('usuario_id', user.id)
      .order('creado_en', { ascending: false });

    if (error) {
      return errorResponse('No se pudo cargar el historial de órdenes.', 'orders_load_error', 500);
    }

    return successResponse(data || [], 200);
  } catch (exception) {
    return errorResponse('Error de servidor al obtener las órdenes.', 'server_error', 500);
  }
}

export async function POST() {
  try {
    const supabase = createServerSupabaseClient();
    const { data: user, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse('No autorizado. Debes iniciar sesión.', 'auth_required', 401);
    }

    const { data: cartItems, error: cartError } = await supabase
      .from('carrito')
      .select('id, cantidad, producto:producto_id (id, nombre, precio, stock)')
      .eq('usuario_id', user.id);

    if (cartError) {
      return errorResponse('No se pudo leer el carrito.', 'cart_read_error', 500);
    }

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return errorResponse('El carrito está vacío. No se puede generar la orden.', 'empty_cart', 400);
    }

    const items = cartItems.map((item) => ({
      carrito_id: item.id,
      producto_id: item.producto.id,
      nombre: item.producto.nombre,
      precio: Number(item.producto.precio),
      stock: item.producto.stock,
      cantidad: item.cantidad,
    }));

    const noStock = items.filter((item) => item.cantidad > item.stock);
    if (noStock.length > 0) {
      return errorResponse(
        'No hay stock suficiente para algunos productos.',
        'insufficient_stock',
        400,
      );
    }

    const total = items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

    const { data: insertedOrder, error: orderError } = await supabase
      .from('ordenes')
      .insert({
        usuario_id: user.id,
        total,
        estado: 'pendiente',
        nombre_cliente: user.email,
        email_cliente: user.email,
      })
      .select('id')
      .single();

    if (orderError || !insertedOrder) {
      return errorResponse('No se pudo crear la orden.', 'order_create_error', 500);
    }

    for (const item of items) {
      const { data: updatedProduct, error: updateError } = await supabase
        .from('productos')
        .update({ stock: item.stock - item.cantidad })
        .eq('id', item.producto_id)
        .gte('stock', item.cantidad)
        .select('id');

      if (updateError || !updatedProduct || updatedProduct.length === 0) {
        return errorResponse(
          'Error al actualizar stock de productos.',
          'stock_update_error',
          500,
        );
      }
    }

    const { error: deleteError } = await supabase
      .from('carrito')
      .delete()
      .eq('usuario_id', user.id);

    if (deleteError) {
      return errorResponse('No se pudo vaciar el carrito.', 'cart_clear_error', 500);
    }

    return successResponse(
      { id: insertedOrder.id, total, estado: 'pendiente' },
      201,
    );
  } catch (exception) {
    return errorResponse('Error de servidor al procesar la orden.', 'server_error', 500);
  }
}
