-- Agregar columna activo a productos (true = visible en catálogo)
ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;

-- Todos los productos existentes quedan activos
UPDATE public.productos SET activo = true WHERE activo IS NULL;
