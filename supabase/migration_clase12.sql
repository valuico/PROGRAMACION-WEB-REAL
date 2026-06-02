-- =====================================================
-- MIGRACIÓN CLASE 12: Transacciones, Roles y Pagos
-- NOTA: la columna de rol se llama "role" (ya existente)
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. POLÍTICAS RLS AVANZADAS CON ROLES
-- =====================================================

-- Admins pueden ver todos los usuarios
DROP POLICY IF EXISTS "Admins ven todos los usuarios" ON public.usuarios;
CREATE POLICY "Admins ven todos los usuarios"
ON public.usuarios FOR SELECT
USING (
  auth.uid() IN (SELECT id FROM public.usuarios WHERE role = 'admin')
);

-- Admins pueden ver todas las órdenes
DROP POLICY IF EXISTS "Admins ven todas las ordenes" ON public.ordenes;
CREATE POLICY "Admins ven todas las ordenes"
ON public.ordenes FOR SELECT
USING (
  auth.uid() IN (SELECT id FROM public.usuarios WHERE role = 'admin')
);

-- Admins pueden actualizar estado de órdenes
DROP POLICY IF EXISTS "Admins actualizan ordenes" ON public.ordenes;
CREATE POLICY "Admins actualizan ordenes"
ON public.ordenes FOR UPDATE
USING (
  auth.uid() IN (SELECT id FROM public.usuarios WHERE role = 'admin')
);

-- Política avanzada para orden_items (cliente ve los suyos, admin ve todos)
DROP POLICY IF EXISTS "Ver detalles de orden" ON public.orden_items;
DROP POLICY IF EXISTS "Usuarios ven items de sus ordenes" ON public.orden_items;
CREATE POLICY "Ver detalles de orden"
ON public.orden_items FOR SELECT
USING (
  (
    orden_id IN (SELECT id FROM public.ordenes WHERE usuario_id = auth.uid())
  )
  OR
  (
    auth.uid() IN (SELECT id FROM public.usuarios WHERE role = 'admin')
  )
);

-- Usuarios crean items de sus órdenes
DROP POLICY IF EXISTS "Usuarios crean items de sus ordenes" ON public.orden_items;
CREATE POLICY "Usuarios crean items de sus ordenes"
ON public.orden_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ordenes
    WHERE public.ordenes.id = orden_items.orden_id
      AND public.ordenes.usuario_id = auth.uid()
  )
);

-- =====================================================
-- 2. PREPARACIÓN PARA PAGOS
-- =====================================================

ALTER TABLE public.ordenes
  ADD COLUMN IF NOT EXISTS metodo_pago VARCHAR(50),
  ADD COLUMN IF NOT EXISTS referencia_pago VARCHAR(255),
  ADD COLUMN IF NOT EXISTS pagado_en TIMESTAMP;

-- ENUM para estados de orden
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_orden') THEN
    CREATE TYPE estado_orden AS ENUM (
      'pendiente', 'pagada', 'confirmada',
      'enviada', 'entregada', 'cancelada'
    );
  END IF;
END$$;

-- =====================================================
-- 3. STORED PROCEDURE: crear_orden_completa
-- Transacción atómica — rollback automático si falla
-- =====================================================

CREATE OR REPLACE FUNCTION public.crear_orden_completa(
  p_usuario_id UUID,
  p_items JSONB,
  p_total DECIMAL,
  p_nombre_cliente TEXT DEFAULT '',
  p_email_cliente TEXT DEFAULT ''
)
RETURNS TABLE (
  orden_id BIGINT,
  success BOOLEAN,
  error_msg TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_orden_id BIGINT;
  v_item JSONB;
  v_stock_actual INT;
  v_producto_nombre TEXT;
  v_cantidad INT;
  v_producto_id BIGINT;
  v_precio DECIMAL;
BEGIN

  -- Crear la orden
  INSERT INTO public.ordenes (usuario_id, total, estado, nombre_cliente, email_cliente)
  VALUES (p_usuario_id, p_total, 'pendiente', p_nombre_cliente, p_email_cliente)
  RETURNING id INTO v_orden_id;

  -- Iterar sobre cada item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_producto_id     := (v_item->>'producto_id')::BIGINT;
    v_cantidad        := (v_item->>'cantidad')::INT;
    v_precio          := (v_item->>'precio_unitario')::DECIMAL;
    v_producto_nombre := v_item->>'nombre_producto';

    -- Verificar stock con bloqueo (evita race conditions)
    SELECT stock INTO v_stock_actual
    FROM public.productos
    WHERE id = v_producto_id
    FOR UPDATE;

    IF v_stock_actual IS NULL THEN
      RAISE EXCEPTION 'Producto % no encontrado', v_producto_id;
    END IF;

    IF v_stock_actual < v_cantidad THEN
      RAISE EXCEPTION 'Stock insuficiente para "%". Disponible: %, Solicitado: %',
        v_producto_nombre, v_stock_actual, v_cantidad;
    END IF;

    -- Insertar item
    INSERT INTO public.orden_items (
      orden_id, producto_id, nombre_producto,
      precio_unitario, cantidad, tono_seleccionado
    ) VALUES (
      v_orden_id, v_producto_id, v_producto_nombre,
      v_precio, v_cantidad, v_item->>'tono_seleccionado'
    );

    -- Descontar stock
    UPDATE public.productos
    SET stock = stock - v_cantidad
    WHERE id = v_producto_id;

  END LOOP;

  -- Vaciar carrito
  DELETE FROM public.carrito WHERE usuario_id = p_usuario_id;

  RETURN QUERY SELECT v_orden_id, TRUE, NULL::TEXT;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT NULL::BIGINT, FALSE, SQLERRM;

END;
$$;

-- =====================================================
-- 4. TRIGGER: auto-asignar role 'cliente' al registrarse
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.usuarios (id, email, role)
  VALUES (NEW.id, NEW.email, 'cliente')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- Para crear/verificar admin:
-- UPDATE public.usuarios SET role = 'admin' WHERE email = 'valenicono@gmail.com';
-- =====================================================
