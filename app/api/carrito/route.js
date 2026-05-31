import { createServerSupabaseClient } from '../../../lib/supabase/server';
import { successResponse, errorResponse, validarCantidad } from '../../../lib/api-utils';

export async function POST(request) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: user, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse('No autorizado. Debes iniciar sesión.', 'auth_required', 401);
    }

    const body = await request.json();
    const productoId = Number(body.producto_id);
    const cantidad = Number(body.cantidad);

    if (!Number.isInteger(productoId) || productoId <= 0) {
      return errorResponse('producto_id inválido.', 'invalid_product_id', 400);
    }

    if (!validarCantidad(cantidad)) {
      return errorResponse('cantidad inválida. Debe ser un entero entre 1 y 100.', 'invalid_quantity', 400);
    }

    const { data: product, error: productError } = await supabase
      .from('productos')
      .select('id, stock')
      .eq('id', productoId)
      .maybeSingle();

    if (productError) {
      return errorResponse('Error al verificar el producto.', 'product_validation_error', 500);
    }

    if (!product) {
      return errorResponse('Producto no encontrado.', 'product_not_found', 404);
    }

    if (product.stock < cantidad) {
      return errorResponse('No hay stock suficiente para el producto solicitado.', 'insufficient_stock', 400);
    }

    const { data: existingCartItem, error: cartQueryError } = await supabase
      .from('carrito')
      .select('id, cantidad')
      .eq('usuario_id', user.id)
      .eq('producto_id', productoId)
      .maybeSingle();

    if (cartQueryError) {
      return errorResponse('Error al consultar el carrito.', 'cart_query_error', 500);
    }

    if (existingCartItem) {
      const { error: updateError } = await supabase
        .from('carrito')
        .update({ cantidad })
        .eq('id', existingCartItem.id);

      if (updateError) {
        return errorResponse('No se pudo actualizar el carrito.', 'cart_update_error', 500);
      }
    } else {
      const { error: insertError } = await supabase.from('carrito').insert({
        usuario_id: user.id,
        producto_id: productoId,
        cantidad,
        tono_seleccionado: null,
      });

      if (insertError) {
        return errorResponse('No se pudo agregar el producto al carrito.', 'cart_insert_error', 500);
      }
    }

    return successResponse({ producto_id: productoId, cantidad }, 201);
  } catch (exception) {
    return errorResponse('Error de servidor al manipular el carrito.', 'server_error', 500);
  }
}
