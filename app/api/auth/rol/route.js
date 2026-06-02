import { createServerClient } from '../../../../lib/supabase/server';

function getToken(request) {
  return request.headers.get('authorization')?.replace('Bearer ', '') || null;
}

export async function GET(request) {
  try {
    const token = getToken(request);
    const supabase = createServerClient(token);

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ rol: null, autenticado: false });
    }

    const { data: perfil, error: perfilError } = await supabase
      .from('usuarios')
      .select('role')
      .eq('id', user.id)
      .single();

    if (perfilError || !perfil) {
      return Response.json({ rol: 'cliente', autenticado: true, email: user.email });
    }

    return Response.json({
      rol: perfil.role,
      autenticado: true,
      email: user.email,
    });
  } catch (err) {
    return Response.json({ error: 'Error al verificar rol' }, { status: 500 });
  }
}
