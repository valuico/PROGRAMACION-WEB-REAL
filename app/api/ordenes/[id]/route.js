import { createServerClient } from '../../../../lib/supabase/server';

function getToken(request) {
  return request.headers.get('authorization')?.replace('Bearer ', '') || null;
}

export async function GET(request, { params }) {
  try {
    const token = getToken(request);
    const supabase = createServerClient(token);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return Response.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('ordenes')
      .select('*, orden_items(*)')
      .eq('id', params.id)
      .eq('usuario_id', user.id)
      .single();

    if (error || !data) {
      return Response.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    return Response.json({ success: true, data });
  } catch (err) {
    return Response.json({ error: 'Error al obtener la orden' }, { status: 500 });
  }
}
