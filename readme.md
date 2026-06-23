# HAZE Beauty — E-commerce Full Stack

Aplicación web de e-commerce para una marca de cosméticos, desarrollada como proyecto final del curso de Programación Web (71.38) en el ITBA.

🔗 **Deploy:** [programacion-web-real-git-main-valuicos-projects.vercel.app](https://programacion-web-real-git-main-valuicos-projects.vercel.app)

---

## Stack tecnológico

- **Frontend:** Next.js 14 (App Router), React 18
- **Base de datos:** Supabase (PostgreSQL)
- **Autenticación:** Supabase Auth
- **Hosting:** Vercel
- **Estilos:** CSS vanilla + estilos inline

---

## Funcionalidades

### Clientes
- Catálogo de productos con filtros por categoría (makeup / skincare)
- Selector de tonos por producto
- Carrito sincronizado con Supabase por usuario autenticado
- Registro e inicio de sesión
- Creación de órdenes con transacción atómica (stock validado en BD)
- Historial de órdenes propias

### Admin
- Panel de administración en `/admin` con acceso restringido por rol
- CRUD completo de productos (crear, editar precio/stock, activar/desactivar, eliminar)
- Gestión de pedidos: ver items, cambiar estado, editar orden completa
- Creación de órdenes manuales desde el panel (con cliente registrado o datos manuales)
- Gestión de clientes y cambio de roles

### Seguridad
- Row Level Security (RLS) en todas las tablas
- Políticas diferenciadas por rol (admin / cliente)
- Transacciones ACID con stored procedures en PostgreSQL
- Validación de stock en servidor (nunca en cliente)

---

## Correr localmente

### Requisitos
- Node.js 18+
- Cuenta en [Supabase](https://supabase.com)

### Instalación

```bash
git clone https://github.com/valuico/PROGRAMACION-WEB-REAL.git
cd PROGRAMACION-WEB-REAL
npm install
```

### Variables de entorno

Crear un archivo `.env.local` en la raíz con:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Base de datos

Ejecutar los scripts SQL en orden desde el SQL Editor de Supabase:

1. `supabase/schema.sql` — tablas base y datos iniciales
2. `supabase/migration_clase12.sql` — roles, transacciones y estados de pago
3. `supabase/fix_rls_recursion.sql` — políticas RLS sin recursión
4. `supabase/fix_get_all_orders.sql` — función con items incluidos
5. `supabase/admin_orders.sql` — funciones para órdenes admin
6. `supabase/add_activo_productos.sql` — columna activo en productos

### Correr el servidor

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

---

## Estructura del proyecto

```
app/
  admin/        → Panel de administración (solo admins)
  api/          → API Routes (ordenes, carrito, auth, pagos)
  checkout/     → Página de checkout
  login/        → Autenticación
  ordenes/      → Historial de órdenes del cliente
  payment/      → Página de pago
  page.js       → Home (catálogo, carrito, FAQ)
src/
  components/   → Componentes reutilizables
lib/
  supabase/     → Cliente de Supabase
  shop.js       → Utilidades del catálogo
supabase/       → Migraciones SQL
```

---

## Crear un usuario admin

Después de registrarte con un email, ejecutar en Supabase SQL Editor:

```sql
UPDATE public.usuarios SET role = 'admin' WHERE email = 'tu@email.com';
```

---

## Credenciales para evaluación

> Todas las credenciales de abajo son de prueba/sandbox. No ejecutan cobros reales.

### 🔐 Usuario administrador (panel `/admin`)

| Campo | Valor |
|-------|-------|
| Email | `valenicono@gmail.com` |
| Contraseña | `Valen1234` |

Desde el panel admin podés ver y gestionar órdenes, productos y clientes.

### 👤 Usuario cliente de prueba

Podés registrarte con cualquier email desde `/login` → "Crear cuenta".  
O usá esta cuenta ya creada:

| Campo | Valor |
|-------|-------|
| Email | `viconomopulos@itba.edu.ar` |
| Contraseña | `Valen1234` |

### 💳 Mercado Pago — Cuenta compradora (sandbox)

Cuando MP te pida iniciar sesión durante el checkout, usá esta cuenta:

| Campo | Valor |
|-------|-------|
| Usuario | `TESTUSER813683783719832950` |
| Contraseña | `I5IYR0uOM7` |
| Código de verificación | `576543` |
| Saldo disponible | $10.000 ARS |

### 🃏 Tarjetas de prueba (sandbox MP Argentina)

El **nombre del titular** determina el resultado. El DNI siempre es `12345678`.

| Tarjeta | Número | CVV | Vencimiento |
|---------|--------|-----|-------------|
| Mastercard | `5031 7557 3453 0604` | 123 | 11/30 |
| Visa | `4509 9535 6623 3704` | 123 | 11/30 |
| American Express | `3711 803032 57522` | 1234 | 11/30 |
| Mastercard Débito | `5287 3383 1025 3304` | 123 | 11/30 |
| Visa Débito | `4002 7686 9439 5619` | 123 | 11/30 |

| Titular | Resultado |
|---------|-----------|
| `APRO` | ✅ Pago aprobado |
| `OTHE` | ❌ Pago rechazado |

### 🧪 Flujo de prueba recomendado

1. Ir a [haze-beauty-real.vercel.app](https://haze-beauty-real.vercel.app)
2. Iniciar sesión con `viconomopulos@itba.edu.ar` / `Valen1234`
3. Agregar productos al carrito
4. Ir a **Comprar** → completar datos → continuar
5. En el checkout de MP, iniciar sesión con **TESTUSER8136**
6. Elegir **tarjeta** e ingresar los datos de arriba (titular: `APRO`)
7. El pago se aprueba y redirige a `/pago-completado` ✅
8. Para ver el panel admin, cerrar sesión e iniciar con `valenicono@gmail.com`

---

## Autor

Valentina Iconomopulos — ITBA 2026
