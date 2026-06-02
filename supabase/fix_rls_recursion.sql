-- =====================================================
-- FIX: Eliminar recursión infinita en políticas RLS
-- El problema: la política "Admins ven todos los usuarios"
-- hace SELECT FROM usuarios dentro de una política de usuarios
-- → PostgreSQL entra en loop → error 500
-- =====================================================

-- 1. Crear función SECURITY DEFINER que bypasea RLS
--    para verificar si el usuario actual es admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 2. Eliminar las políticas problemáticas (con subqueries a usuarios)
DROP POLICY IF EXISTS "Admins ven todos los usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Admins ven todas las ordenes" ON public.ordenes;
DROP POLICY IF EXISTS "Admins actualizan ordenes" ON public.ordenes;
DROP POLICY IF EXISTS "Ver detalles de orden" ON public.orden_items;
DROP POLICY IF EXISTS "Admins ven todos los orden_items" ON public.orden_items;

-- 3. Recrear usando is_admin() que no tiene recursión
CREATE POLICY "Admins ven todos los usuarios"
ON public.usuarios FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins ven todas las ordenes"
ON public.ordenes FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins actualizan ordenes"
ON public.ordenes FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Ver detalles de orden"
ON public.orden_items FOR SELECT
USING (
  orden_id IN (SELECT id FROM public.ordenes WHERE usuario_id = auth.uid())
  OR public.is_admin()
);

-- Verificar que no hay recursión
SELECT public.is_admin();
