<template>
  <aside class="app-sidebar" :class="{ abierto: abierto }">
    <div class="sidebar-brand">
      <Logo tema="crema" tamano="md" :tagline="true" />
    </div>

    <nav class="sidebar-menu" aria-label="Sección activa">
      <button class="sidebar-item active" type="button" @click="ir(rutaActual.ruta)">
        {{ rutaActual.label }}
      </button>
    </nav>

    <div class="sidebar-links" aria-label="Navegación principal">
      <div>
        <template v-for="(grupo, gi) in gruposVisibles" :key="gi">
          <template v-for="(item, i) in grupo" :key="item.ruta">
            <a
              :class="{ 'link-activo': rutaActual.ruta === item.ruta }"
              href="#"
              @click.prevent="ir(item.ruta)"
            >{{ item.label }}</a><span v-if="i < grupo.length - 1" class="separador">·</span>
          </template>
          <br />
        </template>
      </div>
    </div>

    <div class="sidebar-user">
      <p class="sidebar-user-nombre">{{ nombreUsuario }}</p>
      <p class="sidebar-user-rol">{{ rolTexto }}</p>
      <button class="sidebar-logout" type="button" @click="cerrarSesion">Cerrar sesión</button>
    </div>

    <div class="sidebar-logo-bottom" aria-hidden="true">
      <Logo variante="isotipo" tema="crema" tamano="xl" :tagline="false" />
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { inject } from 'vue'

import Logo from './Logo.vue'

const auth = inject('auth')
const router = useRouter()

defineProps({
  abierto: { type: Boolean, default: false },
})

const emit = defineEmits(['cerrar'])

const esAdmin = computed(() => auth && auth.rol === 'administrador')

const rutaActualNombre = computed(() => router.currentRoute.value.name)

const items = [
  { ruta: 'panel', label: 'Panel' },
  { ruta: 'usuarios', label: 'Usuarios', admin: true },
  { ruta: 'comisiones', label: 'Comisiones' },
  { ruta: 'tareas', label: 'Tareas' },
  { ruta: 'residuo-nuevo', label: 'Residuos' },
  { ruta: 'historial-residuos', label: 'Historial' },
  { ruta: 'estadisticas', label: 'Estadísticas' },
  { ruta: 'tachos', label: 'Tachos' },
  { ruta: 'campañas', label: 'Campañas' },
  { ruta: 'reuniones', label: 'Reuniones' },
  { ruta: 'acuerdos', label: 'Acuerdos' },
  { ruta: 'entregas', label: 'Entregas' },
  { ruta: 'perfil', label: 'Perfil' },
  { ruta: 'configuracion', label: 'Configuración', admin: true },
]

const itemsVisibles = computed(() => items.filter((item) => !item.admin || esAdmin.value))

// Agrupación de enlaces como en el mock (líneas de tres enlaces)
const gruposVisibles = computed(() => {
  const visibles = itemsVisibles.value
  const grupos = [
    ['panel', 'usuarios', 'comisiones'],
    ['tareas', 'residuo-nuevo', 'historial-residuos'],
    ['estadisticas', 'tachos', 'campañas'],
    ['reuniones', 'acuerdos', 'entregas'],
    ['perfil', 'configuracion'],
  ]
  return grupos
    .map((grupo) => grupo.map((ruta) => visibles.find((i) => i.ruta === ruta)).filter(Boolean))
    .filter((grupo) => grupo.length > 0)
})

const etiquetas = {
  panel: 'Panel principal',
  usuarios: 'Usuarios',
  comisiones: 'Comisiones',
  tareas: 'Tareas',
  tareaForm: 'Nueva tarea',
  'tarea-nuevo': 'Nueva tarea',
  'tarea-editar': 'Editar tarea',
  'residuo-nuevo': 'Registro de residuos',
  'residuo-editar': 'Editar registro',
  'historial-residuos': 'Historial',
  estadisticas: 'Estadísticas',
  tachos: 'Tachos',
  campañas: 'Campañas',
  reuniones: 'Reuniones',
  acuerdos: 'Acuerdos',
  entregas: 'Entregas',
  perfil: 'Perfil',
  configuracion: 'Configuración',
}

const rutaActual = computed(() => {
  const nombre = rutaActualNombre.value
  const label = etiquetas[nombre] || 'Panel principal'
  const ruta = itemsVisibles.value.some((i) => i.ruta === nombre)
    ? nombre
    : ({ 'tarea-nuevo': 'tareas', 'tarea-editar': 'tareas', 'residuo-nuevo': 'residuo-nuevo', 'residuo-editar': 'historial-residuos' }[nombre] || 'panel')
  return { label, ruta }
})

const nombreUsuario = computed(() => (auth && auth.usuario && auth.usuario.nombre) || 'Integrante')

const rolTexto = computed(() => {
  const rol = auth && auth.usuario && auth.usuario.rol
  return { administrador: 'Administración', integrante: 'Integrante de la cooperativa', comunidad: 'Comunidad educativa' }[rol] || 'Integrante'
})

function ir(ruta) {
  router.push({ name: ruta })
  emit('cerrar')
}

async function cerrarSesion() {
  try {
    const { services } = await import('@/services')
    await services.authService.logout()
  } catch (e) {
    // Se ignora: igualmente se vuelve al login.
  }
  if (auth && auth.limpiar) auth.limpiar()
  router.push({ name: 'login' })
  emit('cerrar')
}
</script>

<style scoped>
.app-sidebar {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-user-nombre {
  font-weight: 800;
  color: var(--sidebar-texto);
  font-size: 0.92rem;
}

.sidebar-user-rol {
  font-size: 0.8rem;
  color: rgba(251, 245, 221, 0.75);
  margin-top: 2px;
}

.sidebar-logout {
  margin-top: 10px;
  font-size: 0.78rem;
  font-weight: 700;
  color: rgba(251, 245, 221, 0.7);
  text-decoration: underline;
  padding: 0;
}

.sidebar-logout:hover {
  color: #FFFFFF;
}
</style>
