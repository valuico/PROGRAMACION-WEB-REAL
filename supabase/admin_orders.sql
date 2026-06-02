-- =====================================================
-- MIGRACIÓN: Órdenes admin sin usuario obligatorio
-- =====================================================

-- 1. Hacer usuario_id nullable para órdenes creadas por admin
ALTER TABLE public.ordenes
  ALTER COLUMN usuario_id DROP NOT NULL;

-- 2. Stored procedure para que el admin cree órdenes completas
--    sin pasar por el flujo de pago
CREATE OR REPLACE FUNCTION public.admin_crear_orden(
  p_items JSONB,
  p_nombre_cliente TEXT DEFAULT '',
  p_email_cliente TEXT DEFAULT '',
  p_usuario_id UUID DEFAULT NULL,
  p_estado TEXT DEFAULT 'confirmada'
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
  v_total DECIMAL := 0;
BEGIN
  -- Calcular total
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_total := v_total + (v_item->>'precio_unitario')::DECIMAL * (v_item->>'cantidad')::INT;
  END LOOP;

  -- Crear la orden
  INSERT INTO public.ordenes (usuario_id, total, estado, nombre_cliente, email_cliente)
  VALUES (p_usuario_id, v_total, p_estado, p_nombre_cliente, p_email_cliente)
  RETURNING id INTO v_orden_id;

  -- Insertar items y descontar stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_producto_id     := (v_item->>'producto_id')::BIGINT;
    v_cantidad        := (v_item->>'cantidad')::INT;
    v_precio          := (v_item->>'precio_unitario')::DECIMAL;
    v_producto_nombre := v_item->>'nombre_producto';

    SELECT stock INTO v_stock_actual
    FROM public.productos WHERE id = v_producto_id FOR UPDATE;

    IF v_stock_actual IS NULL THEN
      RAISE EXCEPTION 'Producto % no encontrado', v_producto_id;
    END IF;

    IF v_stock_actual < v_cantidad THEN
      RAISE EXCEPTION 'Stock insuficiente para "%". Disponible: %', v_producto_nombre, v_stock_actual;
    END IF;

    INSERT INTO public.orden_items (
      orden_id, producto_id, nombre_producto,
      precio_unitario, cantidad, tono_seleccionado
    ) VALUES (
      v_orden_id, v_producto_id, v_producto_nombre,
      v_precio, v_cantidad, v_item->>'tono_seleccionado'
    );

    UPDATE public.productos SET stock = stock - v_cantidad WHERE id = v_producto_id;
  END LOOP;

  RETURN QUERY SELECT v_orden_id, TRUE, NULL::TEXT;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT NULL::BIGINT, FALSE, SQLERRM;
END;
$$;

-- 3. Función para actualizar una orden completa (admin)
CREATE OR REPLACE FUNCTION public.admin_actualizar_orden(
  p_orden_id BIGINT,
  p_nombre_cliente TEXT,
  p_email_cliente TEXT,
  p_estado TEXT,
  p_items JSONB
)
RETURNS TABLE (success BOOLEAN, error_msg TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item JSONB;
  v_total DECIMAL := 0;
  v_stock_actual INT;
  v_producto_id BIGINT;
  v_cantidad INT;
  v_precio DECIMAL;
  v_producto_nombre TEXT;
  v_item_existente_id BIGINT;
  v_cantidad_anterior INT;
BEGIN
  -- Actualizar datos de la orden
  UPDATE public.ordenes
  SET nombre_cliente = p_nombre_cliente,
      email_cliente  = p_email_cliente,
      estado         = p_estado
  WHERE id = p_orden_id;

  -- Calcular total nuevo
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_total := v_total + (v_item->>'precio_unitario')::DECIMAL * (v_item->>'cantidad')::INT;
  END LOOP;

  UPDATE public.ordenes SET total = v_total WHERE id = p_orden_id;

  -- Restaurar stock de los items actuales antes de reemplazarlos
  FOR v_item IN
    SELECT oi.producto_id, oi.cantidad
    FROM public.orden_items oi
    WHERE oi.orden_id = p_orden_id
  LOOP
    UPDATE public.productos
    SET stock = stock + (v_item->>'cantidad')::INT
    WHERE id = (v_item->>'producto_id')::BIGINT;
  END LOOP;

  -- Borrar items anteriores
  DELETE FROM public.orden_items WHERE orden_id = p_orden_id;

  -- Insertar items nuevos y descontar stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_producto_id     := (v_item->>'producto_id')::BIGINT;
    v_cantidad        := (v_item->>'cantidad')::INT;
    v_precio          := (v_item->>'precio_unitario')::DECIMAL;
    v_producto_nombre := v_item->>'nombre_producto';

    SELECT stock INTO v_stock_actual
    FROM public.productos WHERE id = v_producto_id FOR UPDATE;

    IF v_stock_actual IS NULL THEN
      RAISE EXCEPTION 'Producto % no encontrado', v_producto_id;
    END IF;

    IF v_stock_actual < v_cantidad THEN
      RAISE EXCEPTION 'Stock insuficiente para "%". Disponible: %', v_producto_nombre, v_stock_actual;
    END IF;

    INSERT INTO public.orden_items (
      orden_id, producto_id, nombre_producto,
      precio_unitario, cantidad, tono_seleccionado
    ) VALUES (
      p_orden_id, v_producto_id, v_producto_nombre,
      v_precio, v_cantidad, v_item->>'tono_seleccionado'
    );

    UPDATE public.productos SET stock = stock - v_cantidad WHERE id = v_producto_id;
  END LOOP;

  RETURN QUERY SELECT TRUE, NULL::TEXT;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT FALSE, SQLERRM;
END;
$$;
