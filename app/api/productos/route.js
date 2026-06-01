import { createServerClient } from '../../../lib/supabase/server';

export async function GET() {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('tipo', { ascending: true })
      .order('nombre', { ascending: true });

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ success: true, data });
  } catch (err) {
    return Response.json({ error: 'Error al obtener productos' }, { status: 500 });
  }
}
