# Desafío Semana 13 — Integración Mercado Pago Sandbox

## 1. Setup Mercado Pago

### Cuenta y Credenciales
- Cuenta creada en Mercado Pago con cuenta de prueba (vendedor)
- Aplicación creada en el panel de developers: **HAZE Beauty**
- Credenciales de sandbox obtenidas:
  - `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` — APP_USR-xxx (public key)
  - `MERCADOPAGO_ACCESS_TOKEN` — APP_USR-xxx (access token)

### SDK Instalado
```bash
npm install mercadopago
```

### Variables de entorno (`.env.local`)
```
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-...
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
NEXT_PUBLIC_APP_URL=https://haze-beauty-real.vercel.app
```

### Archivo de configuración (`lib/mercadopago.js`)
```js
import MercadoPagoConfig, { Preference } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

export { client, Preference };
```

---

## 2. API — Crear Preferencia

**Endpoint:** `POST /api/pagos/crear-preferencia`

### Funcionamiento
1. Verifica autenticación del usuario (Supabase JWT)
2. Obtiene la orden desde la base de datos
3. Valida que la orden esté en estado `pendiente`
4. Crea la preferencia con el SDK de Mercado Pago
5. Retorna `init_point` (producción) y `sandbox_link` (sandbox)

### Respuesta exitosa
```json
{
  "success": true,
  "preference_id": "3444576541-abc123...",
  "init_point": "https://www.mercadopago.com.ar/checkout/v1/redirect?...",
  "sandbox_link": "https://sandbox.mercadopago.com.ar/checkout/v1/redirect?..."
}
```

### Back URLs configuradas
| Evento | URL |
|--------|-----|
| Pago aprobado | `/pago-completado` |
| Pago rechazado | `/pago-fallido` |
| Pago pendiente | `/pago-pendiente` |

---

## 3. Flujo de Pago

### Páginas implementadas

| Ruta | Descripción |
|------|-------------|
| `/checkout?orden_id=X` | Resumen de orden + botón "Pagar con Mercado Pago" |
| `/pago-completado` | Muestra `payment_id` y `external_reference` |
| `/pago-fallido` | Lista causas y ofrece reintentar |
| `/pago-pendiente` | Informa que el pago está en proceso |

### Flujo completo
1. Usuario agrega productos al carrito
2. Va a `/payment` → se crea la orden en Supabase
3. Redirige a `/checkout?orden_id=X`
4. Click en "Pagar con Mercado Pago"
5. Frontend llama a `/api/pagos/crear-preferencia`
6. Recibe `sandbox_link` → `window.location.href = link`
7. Usuario completa el pago en Mercado Pago
8. MP redirige a `/pago-completado` con `payment_id` y `external_reference`

---

## 4. Testing con Tarjetas de Prueba

### Tarjetas de sandbox (Mercado Pago)

| Resultado | Número | Vencimiento | CVV | Titular |
|-----------|--------|-------------|-----|---------|
| ✅ Aprobado | `4111 1111 1111 1111` | 11/25 | 123 | APRO |
| ❌ Rechazado | `4111 1111 1111 1112` | 11/25 | 123 | OTHE |
| ⏳ Pendiente | `4111 1111 1111 1113` | 11/25 | 123 | PENDING |

### Resultados observados

**Tarjeta APROBADA (APRO):**
- Redirige a `/pago-completado`
- Muestra `payment_id` y número de orden
- Estado en Supabase: queda `pendiente` (webhook se implementa en semana 14)

**Tarjeta RECHAZADA (OTHE):**
- Redirige a `/pago-fallido`
- Muestra opciones para reintentar

**Tarjeta PENDIENTE:**
- Redirige a `/pago-pendiente`
- Informa tiempo de procesamiento

---

## Archivos modificados

```
lib/mercadopago.js                          ← Config del SDK
app/api/pagos/crear-preferencia/route.js    ← Crea preferencia con SDK
app/api/pagos/webhook/route.js              ← Recibe notificaciones de MP
app/checkout/page.js                        ← Muestra orden y redirige a MP
app/pago-completado/page.js                 ← Página de éxito
app/pago-fallido/page.js                    ← Página de error
app/pago-pendiente/page.js                  ← Página de pago pendiente
supabase/migration_mp_columns.sql           ← Columnas mp_payment_id, mp_status
```

---

## Nota sobre Webhook (Semana 14)

El webhook `/api/pagos/webhook` está implementado pero la firma de seguridad y la confirmación automática del estado de la orden se completan en la semana 14. Por ahora el estado de la orden se actualiza manualmente desde el panel admin.
