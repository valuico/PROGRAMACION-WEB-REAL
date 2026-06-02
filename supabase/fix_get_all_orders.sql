-- Actualizar get_all_orders para incluir orden_items en cada pedido
CREATE OR REPLACE FUNCTION get_all_orders()
RETURNS json
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT json_agg(o)
  FROM (
    SELECT o.*,
      (
        SELECT json_agg(i)
        FROM orden_items i
        WHERE i.orden_id = o.id
      ) AS orden_items
    FROM ordenes o
    ORDER BY o.creado_en DESC
  ) o;
$$;
