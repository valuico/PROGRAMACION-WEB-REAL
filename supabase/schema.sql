create extension if not exists "pgcrypto";

create table if not exists public.productos (
  id bigint primary key generated always as identity,
  nombre varchar(255) not null,
  descripcion text,
  descripcion_corta varchar(255),
  precio numeric(10, 2) not null,
  stock int default 0,
  imagen_url varchar(500),
  categoria varchar(100) not null,
  tipo varchar(50) not null check (tipo in ('makeup', 'skincare')),
  tonos jsonb default '[]'::jsonb,
  es_nuevo boolean default false,
  creado_en timestamp default now(),
  actualizado_en timestamp default now()
);

create table if not exists public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  email varchar(255) unique not null,
  nombre varchar(255),
  apellido varchar(255),
  direccion text,
  telefono varchar(20),
  creado_en timestamp default now()
);

create table if not exists public.carrito (
  id bigint primary key generated always as identity,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  producto_id bigint not null references public.productos(id) on delete cascade,
  tono_seleccionado varchar(120),
  cantidad int not null default 1,
  creado_en timestamp default now(),
  unique (usuario_id, producto_id, tono_seleccionado)
);

create table if not exists public.ordenes (
  id bigint primary key generated always as identity,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  total numeric(10, 2) not null,
  estado varchar(50) not null default 'pendiente',
  nombre_cliente varchar(255),
  email_cliente varchar(255),
  creado_en timestamp default now()
);

create table if not exists public.orden_items (
  id bigint primary key generated always as identity,
  orden_id bigint not null references public.ordenes(id) on delete cascade,
  producto_id bigint not null references public.productos(id),
  nombre_producto varchar(255) not null,
  precio_unitario numeric(10, 2) not null,
  cantidad int not null default 1,
  tono_seleccionado varchar(120)
);

alter table public.productos enable row level security;
alter table public.usuarios enable row level security;
alter table public.carrito enable row level security;
alter table public.ordenes enable row level security;
alter table public.orden_items enable row level security;

drop policy if exists "Productos visibles para todos" on public.productos;
create policy "Productos visibles para todos"
on public.productos
for select
using (true);

drop policy if exists "Usuarios ven su propio perfil" on public.usuarios;
create policy "Usuarios ven su propio perfil"
on public.usuarios
for select
using (auth.uid() = id);

drop policy if exists "Usuarios crean su propio perfil" on public.usuarios;
create policy "Usuarios crean su propio perfil"
on public.usuarios
for insert
with check (auth.uid() = id);

drop policy if exists "Usuarios actualizan su propio perfil" on public.usuarios;
create policy "Usuarios actualizan su propio perfil"
on public.usuarios
for update
using (auth.uid() = id);

drop policy if exists "Usuarios ven su carrito" on public.carrito;
create policy "Usuarios ven su carrito"
on public.carrito
for select
using (auth.uid() = usuario_id);

drop policy if exists "Usuarios agregan a su carrito" on public.carrito;
create policy "Usuarios agregan a su carrito"
on public.carrito
for insert
with check (auth.uid() = usuario_id);

drop policy if exists "Usuarios actualizan su carrito" on public.carrito;
create policy "Usuarios actualizan su carrito"
on public.carrito
for update
using (auth.uid() = usuario_id);

drop policy if exists "Usuarios eliminan de su carrito" on public.carrito;
create policy "Usuarios eliminan de su carrito"
on public.carrito
for delete
using (auth.uid() = usuario_id);

drop policy if exists "Usuarios ven sus ordenes" on public.ordenes;
create policy "Usuarios ven sus ordenes"
on public.ordenes
for select
using (auth.uid() = usuario_id);

drop policy if exists "Usuarios crean sus ordenes" on public.ordenes;
create policy "Usuarios crean sus ordenes"
on public.ordenes
for insert
with check (auth.uid() = usuario_id);

drop policy if exists "Usuarios ven items de sus ordenes" on public.orden_items;
create policy "Usuarios ven items de sus ordenes"
on public.orden_items
for select
using (
  exists (
    select 1
    from public.ordenes
    where public.ordenes.id = orden_items.orden_id
      and public.ordenes.usuario_id = auth.uid()
  )
);

drop policy if exists "Usuarios crean items de sus ordenes" on public.orden_items;
create policy "Usuarios crean items de sus ordenes"
on public.orden_items
for insert
with check (
  exists (
    select 1
    from public.ordenes
    where public.ordenes.id = orden_items.orden_id
      and public.ordenes.usuario_id = auth.uid()
  )
);

insert into public.productos
  (nombre, descripcion, descripcion_corta, precio, stock, imagen_url, categoria, tipo, tonos, es_nuevo)
values
  ('Pro Filt''r Foundation', 'Base soft matte de larga duración.', 'Soft Matte Longwear', 50000, 40, '/foundation-haze.png', 'cara', 'makeup', '["Light","Medium","Warm","Deep"]', false),
  ('We''re Even Concealer', 'Corrector hidratante de larga duración.', 'Hydrating Longwear', 52300, 35, '/concelears-haze.png', 'cara', 'makeup', '["Light","Medium","Warm","Deep"]', false),
  ('Radiant Stick Duo', 'Iluminador en barra con acabado glow.', 'Iluminador en Barra', 42500, 25, '/highlighters.png', 'cara', 'makeup', '["Golden Glow","Rose Stick","Silver Stow"]', false),
  ('Invisimatte Setting Powder', 'Polvos volátiles de acabado suave.', 'Polvos Volátiles', 55000, 28, '/polvos-volatiles.png', 'cara', 'makeup', '["Butter","Lavender"]', false),
  ('Double Take Blush', 'Rubor dúo polvo y crema.', 'Dúo Polvo y Crema', 48900, 30, '/blushes-haze.png', 'cara', 'makeup', '["Peony","Coral Haze","Rosewood","Sunset"]', false),
  ('Mist & Fix Spray', 'Spray fijador de larga duración.', 'Larga Duración', 39000, 24, '/setting-spray-2.png', 'cara', 'makeup', '[]', false),
  ('Iconic Matte Lipstick', 'Labial en barra acabado terciopelo.', 'Labial en barra', 42900, 60, '/labiales.png', 'labios', 'makeup', '["Deep Red","True Scarlet","Dusty Rose","Terracotta","Nude Beige","Honey Nude"]', false),
  ('Precision Lip Shaper', 'Delineador de labios de larga duración.', 'Delineador de labios', 31500, 55, '/lip-liner.png', 'labios', 'makeup', '["Pale Lilac","Warm Pink","Berry Bite","Deep Cocoa"]', false),
  ('Gloss Bomb Crystal', 'Brillo labial efecto espejo.', 'Brillo labial efecto espejo', 38200, 32, '/lipgloss.png', 'labios', 'makeup', '["Diamond Milk","Pink Dragonfly","Fussy","Hot Chocolit"]', false),
  ('Ultimate Glow Palette', 'Paleta de 12 sombras pigmentadas.', '12 High-Pigment Shades', 65800, 18, '/paleta-sombras.png', 'ojos', 'makeup', '[]', false),
  ('Hella Thicc Mascara', 'Mascara voluminizadora y lifting.', 'Volumizing & Lift', 38500, 45, '/mascara-pestañas-haze.png', 'ojos', 'makeup', '["Waterproof","Fórmula Original"]', false),
  ('Lineshaper Gel Eyeliner', 'Delineador gel waterproof.', 'Waterproof Gel', 32200, 34, '/eyeliners-haze.png', 'ojos', 'makeup', '["Deep Brown","Midnight Black"]', false),
  ('Hydrating Toner', 'Toner con ácido hialurónico y lavanda.', 'Ácido Hialurónico + Lavanda', 35000, 50, '/toner-haze.png', 'skincare', 'skincare', '[]', true),
  ('Gentle Cleanser', 'Limpieza suave con té verde y ceramidas.', 'Té Verde + Ceramidas', 38500, 48, '/cleanser-real.png', 'skincare', 'skincare', '[]', true),
  ('Daily Moisturizer', 'Crema diaria con péptidos y squalane.', 'Péptidos + Squalane', 44900, 42, '/cream-real.png', 'skincare', 'skincare', '[]', true)
on conflict do nothing;
