# Mercado Pago — Estado de la Integración Sandbox

## ✅ Qué funciona

### Pago con dinero en cuenta de Mercado Pago
El método **"Dinero en cuenta"** funciona correctamente en sandbox. Cuando se redirige al checkout de MP, el comprador puede iniciar sesión con la cuenta de prueba y pagar con el saldo disponible.

> ⚠️ **Por qué se bajaron los precios:** La cuenta de prueba compradora tiene un saldo limitado de **$10.000 ARS**. Los productos originales costaban entre $31.500 y $65.800 ARS, lo que hacía imposible completar una compra de prueba. Los precios se redujeron a **$800–$2.000 ARS** para poder testear el flujo completo con el saldo disponible.

### Pago con efectivo (Rapipago / Pago Fácil)
El pago en efectivo también funciona. Genera un código de pago y redirige a `/pago-pendiente`.

---

## ❌ Qué NO funciona (bug de sandbox MP Argentina)

### Pago con tarjeta de crédito/débito
El pago con tarjeta **falla en el sandbox de Mercado Pago Argentina** con el error:

```
POST https://api.mercadopago.com/pp/api/card-form/association  →  404 Not Found
```

Este es un **bug conocido de la infraestructura sandbox de MP Argentina**, no un error de nuestro código. El endpoint `card-form/association` no existe en el ambiente de pruebas para Argentina.

**Evidencia de que nuestro código es correcto:**
- La preferencia se crea exitosamente (se obtiene `init_point` y `sandbox_init_point`)
- La redirección a MP funciona
- El pago con "Dinero en cuenta" se procesa correctamente
- El webhook recibe la notificación y actualiza la orden en Supabase

---

## Credenciales de prueba

### Cuenta vendedora (nuestra app — configurada en `.env.local`)
| Campo | Valor |
|-------|-------|
| Usuario | TESTUSER2077 |
| User ID | 3444576541 |
| Contraseña | 5fDTXNLIQr |
| Código de verificación | 576541 |

### Cuenta compradora (para iniciar sesión en el checkout de MP)
| Campo | Valor |
|-------|-------|
| Usuario | TESTUSER8136 |
| User ID | 3444576543 |
| Contraseña | I5IYR0uOM7 |
| Código de verificación | 576543 |
| Saldo disponible | $10.000 ARS |

> Usá la cuenta **compradora** cuando MP te pida iniciar sesión durante el checkout. La cuenta vendedora es la que genera la preferencia (está configurada en el backend).

---

## Tarjetas de prueba (sandbox MP Argentina)

El nombre del titular determina el resultado del pago. El DNI siempre es `12345678`.

> ⚠️ Las tarjetas pueden fallar en sandbox Argentina por el bug `card-form/association 404`. Si esto pasa, usá **"Dinero en cuenta"** con la cuenta compradora de arriba.

### Tarjetas de crédito
| Tarjeta | Número | CVV | Vencimiento |
|---------|--------|-----|-------------|
| Mastercard | `5031 7557 3453 0604` | 123 | 11/30 |
| Visa | `4509 9535 6623 3704` | 123 | 11/30 |
| American Express | `3711 803032 57522` | 1234 | 11/30 |

### Tarjetas de débito
| Tarjeta | Número | CVV | Vencimiento |
|---------|--------|-----|-------------|
| Mastercard Débito | `5287 3383 1025 3304` | 123 | 11/30 |
| Visa Débito | `4002 7686 9439 5619` | 123 | 11/30 |

### Resultado según nombre del titular
| Titular | Resultado | DNI |
|---------|-----------|-----|
| `APRO` | ✅ Pago aprobado | 12345678 |
| `OTHE` | ❌ Rechazado por error general | 12345678 |

**Fuente oficial:** https://www.mercadopago.com.ar/developers/es/docs/checkout-api/testing/test-cards

---

## Cómo probar el flujo completo

### Con dinero en cuenta (RECOMENDADO — funciona 100%)

1. Iniciar sesión en **haze-beauty-real.vercel.app** con cualquier cuenta de Supabase
2. Agregar productos al carrito (total debe ser menor a $10.000 ARS)
3. Ir a **Comprar** → completar datos → seleccionar "Mercado Pago"
4. En el checkout de MP, hacer clic en **"Iniciar sesión"**
5. Ingresar con la cuenta compradora **TESTUSER8136** (email/pass desde el panel de developers)
6. Seleccionar **"Dinero en cuenta"** y confirmar el pago
7. MP redirige a `/pago-completado` con el `payment_id` y número de orden ✅

### Con tarjeta (sandbox Argentina — puede dar error 404)

1. Seguir los mismos pasos 1-3
2. En el checkout de MP, seleccionar **"Nueva tarjeta"**
3. Ingresar los datos de la tarjeta de prueba (ver tabla arriba)
4. Si aparece error → es el bug de MP Argentina, no de nuestro código

---

## Flujo técnico

```
Usuario agrega productos al carrito
        ↓
Va a /payment → crea orden en Supabase (estado: "pendiente")
        ↓
Redirige a /checkout?orden_id=X
        ↓
Click "Pagar con Mercado Pago"
        ↓
POST /api/pagos/crear-preferencia
  → Valida auth JWT
  → Lee orden de Supabase
  → Crea preferencia con SDK
  → Retorna sandbox_init_point
        ↓
window.location.href = sandbox_init_point
        ↓
Usuario paga en Mercado Pago
        ↓
MP notifica webhook: POST /api/pagos/webhook
  → Consulta GET /v1/payments/:id
  → Actualiza orden en Supabase (estado: "pagada")
        ↓
MP redirige a /pago-completado (o /pago-fallido / /pago-pendiente)
```

---

## Archivos clave

```
lib/mercadopago.js                        → Config del SDK
app/api/pagos/crear-preferencia/route.js  → Crea preferencia y retorna init_point
app/api/pagos/webhook/route.js            → Recibe notificaciones de MP
app/checkout/page.js                      → Página de checkout con resumen de orden
app/pago-completado/page.js               → Resultado exitoso
app/pago-fallido/page.js                  → Resultado fallido
app/pago-pendiente/page.js                → Resultado pendiente
lib/shop.js                               → Precios reducidos ($800–$2.000 ARS)
```
