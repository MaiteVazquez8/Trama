-- ============================================================================
-- Trama - Esquema inicial de la base de datos (Supabase)
-- Cooperativa escolar para la separación y gestión responsable de residuos
--
-- Ejecutá este script en el Editor SQL de tu proyecto de Supabase.
-- No contiene contraseñas, tokens ni claves secretas.
-- ============================================================================

-- Extensión para UUIDs
create extension if not exists "pgcrypto";

-- --------------------------------------------------------------------------
-- Tablas de catálogo
-- --------------------------------------------------------------------------

create table comisiones (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table tipos_residuo (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  categoria text not null check (categoria in ('reciclable','compostable','no-reciclable')),
  descripcion text
);

-- --------------------------------------------------------------------------
-- Usuarios y perfiles (vinculados a Supabase Auth)
-- --------------------------------------------------------------------------

create table perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nombre text not null,
  rol text not null check (rol in ('administrador','integrante','comunidad')),
  comision uuid references comisiones(id),
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- Registro de residuos (historial con cancelación lógica)
-- --------------------------------------------------------------------------

create table tachos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  ubicacion text not null,
  tipo_residuo uuid references tipos_residuo(id),
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

create table registros_residuo (
  id uuid primary key default gen_random_uuid(),
  tipo_residuo uuid not null references tipos_residuo(id),
  cantidad_kg numeric not null check (cantidad_kg >= 0),
  lugar text not null,
  fecha date not null,
  registrado_por uuid not null references perfiles(id),
  estado text not null default 'activo' check (estado in ('activo','cancelado')),
  motivo_cancelacion text,
  cancelado_en timestamptz,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- Tareas de las comisiones (con cancelación lógica)
-- --------------------------------------------------------------------------

create table tareas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text,
  comision uuid references comisiones(id),
  responsable uuid references perfiles(id),
  fecha date not null,
  estado text not null default 'pendiente' check (estado in ('pendiente','completada','cancelada')),
  motivo_cancelacion text,
  cancelado_en timestamptz,
  creado_en timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- Campañas de concientización
-- --------------------------------------------------------------------------

create table campañas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text,
  fecha_inicio date not null,
  fecha_fin date not null,
  estado text not null default 'programada' check (estado in ('programada','activa','finalizada')),
  publicado_por uuid references perfiles(id),
  creado_en timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- Reuniones y acuerdos
-- --------------------------------------------------------------------------

create table reuniones (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  temas text not null,
  asistentes text,
  creado_en timestamptz not null default now()
);

create table acuerdos (
  id uuid primary key default gen_random_uuid(),
  reunion uuid references reuniones(id),
  tema text not null,
  decision text not null,
  responsable uuid references perfiles(id),
  fecha_prevista date,
  creado_en timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- Entregas a la cooperativa externa
-- --------------------------------------------------------------------------

create table entregas (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  materiales text not null,
  peso_total_kg numeric check (peso_total_kg >= 0),
  recibido_por text,
  estado text not null default 'programada' check (estado in ('programada','completada','cancelada')),
  creado_en timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- Problemas reportados de tachos y actividades (participación)
-- --------------------------------------------------------------------------

create table problemas_tacho (
  id uuid primary key default gen_random_uuid(),
  tacho uuid references tachos(id),
  tipo text not null check (tipo in ('lleno','roto','otro')),
  descripcion text,
  reportado_por uuid references perfiles(id),
  fecha date not null,
  estado text not null default 'abierto' check (estado in ('abierto','cerrado')),
  resuelto_en timestamptz,
  creado_en timestamptz not null default now()
);

create table actividades (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  tipo text not null check (tipo in ('separacion','concientizacion','recoleccion','otra')),
  fecha date not null,
  participantes integer not null default 0 check (participantes >= 0),
  creado_por uuid references perfiles(id),
  creado_en timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- Índices para búsquedas y filtros frecuentes
-- --------------------------------------------------------------------------

create index idx_registros_residuo_fecha on registros_residuo(fecha);
create index idx_registros_residuo_tipo on registros_residuo(tipo_residuo);
create index idx_registros_residuo_estado on registros_residuo(estado);
create index idx_registros_residuo_lugar on registros_residuo using gin (to_tsvector('spanish', lugar));

create index idx_tareas_fecha on tareas(fecha);
create index idx_tareas_estado on tareas(estado);
create index idx_tareas_comision on tareas(comision);

create index idx_entregas_fecha on entregas(fecha);
create index idx_entregas_estado on entregas(estado);

create index idx_actividades_fecha on actividades(fecha);
create index idx_problemas_tacho_fecha on problemas_tacho(fecha);

-- --------------------------------------------------------------------------
-- Trigger para mantener actualizado_en automáticamente
-- --------------------------------------------------------------------------

create or replace function actualizar_columna_actualizado_en()
returns trigger as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$ language 'plpgsql';

create trigger trg_perfiles_actualizado_en
  before update on perfiles for each row execute function actualizar_columna_actualizado_en();

create trigger trg_registros_residuo_actualizado_en
  before update on registros_residuo for each row execute function actualizar_columna_actualizado_en();

-- --------------------------------------------------------------------------
-- Políticas de seguridad a nivel de fila (RLS)
-- --------------------------------------------------------------------------

alter table perfiles enable row level security;
alter table comisiones enable row level security;
alter table tipos_residuo enable row level security;
alter table tachos enable row level security;
alter table registros_residuo enable row level security;
alter table tareas enable row level security;
alter table campañas enable row level security;
alter table reuniones enable row level security;
alter table acuerdos enable row level security;
alter table entregas enable row level security;
alter table problemas_tacho enable row level security;
alter table actividades enable row level security;

-- Lectura de catálogos y perfiles: cualquier usuario autenticado
create policy "Catálogos y perfiles: lectura autenticados"
  on comisiones, tipos_residuo, tachos, perfiles
  for select
  to authenticated
  using (true);

-- Los usuarios leen su propio perfil
create policy "Perfiles: lectura propia"
  on perfiles
  for select
  to authenticated
  using (auth.uid() = id);

-- Solo administrador gestiona perfiles y comisiones
create policy "Admin gestiona perfiles"
  on perfiles
  for all
  to authenticated
  using (
    exists (select 1 from perfiles p where p.id = auth.uid() and p.rol = 'administrador')
  );

create policy "Admin gestiona comisiones"
  on comisiones
  for all
  to authenticated
  using (
    exists (select 1 from perfiles p where p.id = auth.uid() and p.rol = 'administrador')
  );

-- Registros de residuos: lectura autenticados; creación por integrante/admin;
-- actualización/cancelación por el autor o administrador
create policy "Registros: lectura autenticados"
  on registros_residuo
  for select
  to authenticated
  using (true);

create policy "Registros: creación integrante o admin"
  on registros_residuo
  for insert
  to authenticated
  with check (
    auth.uid() = registrado_por
    or exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in ('administrador','integrante'))
  );

create policy "Registros: actualización autor o admin"
  on registros_residuo
  for update
  to authenticated
  using (
    auth.uid() = registrado_por
    or exists (select 1 from perfiles p where p.id = auth.uid() and p.rol = 'administrador')
  );

-- Tareas: lectura autenticados; creación admin/integrante;
-- actualización/cancelación por responsable o administrador
create policy "Tareas: lectura autenticados"
  on tareas
  for select
  to authenticated
  using (true);

create policy "Tareas: creación admin o integrante"
  on tareas
  for insert
  to authenticated
  with check (
    exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in ('administrador','integrante'))
  );

create policy "Tareas: actualización responsable o admin"
  on tareas
  for update
  to authenticated
  using (
    auth.uid() = responsable
    or exists (select 1 from perfiles p where p.id = auth.uid() and p.rol = 'administrador')
  );

-- Campañas: lectura autenticados; creación admin/integrante; actualización admin
create policy "Campañas: lectura autenticados"
  on campañas
  for select
  to authenticated
  using (true);

create policy "Campañas: creación admin o integrante"
  on campañas
  for insert
  to authenticated
  with check (
    exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in ('administrador','integrante'))
  );

create policy "Campañas: actualización admin"
  on campañas
  for update
  to authenticated
  using (
    exists (select 1 from perfiles p where p.id = auth.uid() and p.rol = 'administrador')
  );

-- Reuniones, acuerdos, entregas, problemas de tacho y actividades:
-- lectura autenticados; escritura para admin e integrantes según corresponda
create policy "Reuniones: lectura autenticados"
  on reuniones for select to authenticated using (true);

create policy "Reuniones: creación admin o integrante"
  on reuniones for insert to authenticated
  with check (exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in ('administrador','integrante')));

create policy "Acuerdos: lectura autenticados"
  on acuerdos for select to authenticated using (true);

create policy "Acuerdos: creación admin o integrante"
  on acuerdos for insert to authenticated
  with check (exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in ('administrador','integrante')));

create policy "Entregas: lectura autenticados"
  on entregas for select to authenticated using (true);

create policy "Entregas: creación admin o integrante"
  on entregas for insert to authenticated
  with check (exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in ('administrador','integrante')));

create policy "Problemas tacho: lectura autenticados"
  on problemas_tacho for select to authenticated using (true);

create policy "Problemas tacho: creación admin o integrante"
  on problemas_tacho for insert to authenticated
  with check (
    auth.uid() = reportado_por
    or exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in ('administrador','integrante'))
  );

create policy "Actividades: lectura autenticados"
  on actividades for select to authenticated using (true);

create policy "Actividades: creación admin o integrante"
  on actividades for insert to authenticated
  with check (
    auth.uid() = creado_por
    or exists (select 1 from perfiles p where p.id = auth.uid() and p.rol in ('administrador','integrante'))
  );

-- --------------------------------------------------------------------------
-- Fin del script
-- ============================================================================
