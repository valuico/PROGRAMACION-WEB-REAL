-- =====================================================
-- MIGRACIÓN: Columnas para integración Mercado Pago
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- Agregar columnas que usa el webhook de MP para registrar el pago
ALTER TABLE public.ordenes
  ADD COLUMN IF NOT EXISTS mp_payment_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS mp_status     VARCHAR(100),
  ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMP DEFAULT now();

-- Índice para buscar órdenes por payment_id de MP (útil para debug)
CREATE INDEX IF NOT EXISTS idx_ordenes_mp_payment_id
  ON public.ordenes (mp_payment_id)
  WHERE mp_payment_id IS NOT NULL;

-- Permitir que el webhook (service role) pueda actualizar ordenes
-- El service role bypasea RLS por defecto, pero lo dejamos explícito
-- para documentación
COMMENT ON COLUMN public.ordenes.mp_payment_id IS 'ID del pago en Mercado Pago';
COMMENT ON COLUMN public.ordenes.mp_status IS 'Estado del pago según Mercado Pago (approved, pending, rejected, etc.)';
COMMENT ON COLUMN public.ordenes.actualizado_en IS 'Última actualización del registro';
