import { createServerSupabaseClient } from '../../../lib/supabase/server';
import { successResponse, errorResponse } from '../../../lib/api-utils';

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('productos')
      .select('id, nombre, descripcion, descripcion_corta, precio, stock, imagen_url, categoria, tipo, tonos, es_nuevo')
      .order('id', { ascending: true });

    if (error) {
      return errorResponse('No se pudieron cargar los productos.', 'productos_load_error', 500);
    }

    return successResponse(data || [], 200);
  } catch (exception) {
    return errorResponse('Error de servidor al obtener productos.', 'server_error', 500);
  }
}
