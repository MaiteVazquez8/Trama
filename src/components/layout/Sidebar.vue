<template>
  <aside class="app-sidebar" :class="{ colapsado: esDesktopColapsado, abierto: esMovil && abierto }">
    <div class="sidebar-brand">
      <h2>TRAMA</h2>
    </div>

    <nav class="sidebar-menu">
      <div class="sidebar-section">
        <div class="sidebar-section-label">Gestión</div>
        <a
          v-for="item in itemsPrincipal"
          :key="item.ruta"
          class="sidebar-item"
          :class="{ active: rutaActual === item.ruta }"
          @click="ir(item.ruta)"
        >
          <span class="icono">{{ item.icono }}</span>
          {{ item.label }}
        </a>
      </div>

      <div class="sidebar-section" v-if="puedeAdministrar">
        <div class="sidebar-section-label">Administración</div>
        <a
          v-for="item in itemsAdmin"
          :key="item.ruta"
          class="sidebar-item"
          :class="{ active: rutaActual === item.ruta }"
          @click="ir(item.ruta)"
        >
          <span class="icono">{{ item.icono }}</span>
          {{ item.label }}
        </a>
      </div>

      <div class="sidebar-section">
        <div class="sidebar-section-label">Cuenta</div>
        <a class="sidebar-item" @click="ir('perfil')">
          <span class="icono">👤</span>
          Mi perfil
        </a>
        <button class="sidebar-item" @click="cerrarSesion">
          <span class="icono">🚪</span>
          Cerrar sesión
        </button>
      </div>
    </nav>

    <div class="sidebar-footer">
      <p>Modo: {{ modo }}</p>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { inject } from 'vue'

const auth = inject('auth')
const router = useRouter()

const props = defineProps({
  abierto: { type: Boolean, default: false },
})

const emit = defineEmits(['cerrar'])

const esDesktopColapsado = computed(() => !props.abierto && window.innerWidth > 900)

const rutaActual = computed(() => router.currentRoute.value.name)

const esMovil = computed(() => window.innerWidth <= 900)
const modo = computed(() => (auth && auth.simulado ? 'Desarrollo (datos de prueba)' : 'Producción (Supabase)'))

const puedeAdministrar = computed(() => auth && auth.rol === 'administrador')

const itemsPrincipal = [
  { ruta: 'panel', label: 'Panel principal', icono: '🏠' },
  { ruta: 'historial-residuos', label: 'Registro de residuos', icono: '♻️' },
  { ruta: 'tareas', label: 'Tareas', icono: '📋' },
  { ruta: 'tachos', label: 'Tachos', icono: '🗑️' },
  { ruta: 'campañas', label: 'Campañas', icono: '📢' },
  { ruta: 'reuniones', label: 'Reuniones', icono: '🗓️' },
  { ruta: 'acuerdos', label: 'Acuerdos', icono: '📝' },
  { ruta: 'entregas', label: 'Entregas', icono: '🚚' },
  { ruta: 'estadisticas', label: 'Estadísticas', icono: '📊' },
]

const itemsAdmin = [
  { ruta: 'usuarios', label: 'Usuarios', icono: '👥' },
  { ruta: 'comisiones', label: 'Comisiones', icono: '🏢' },
  { ruta: 'configuracion', label: 'Configuración', icono: '⚙️' },
]

function ir(ruta) {
  router.push({ name: ruta })
  if (esMovil.value) emit('cerrar')
}

async function cerrarSesion() {
  try {
    const { services } = await import('@/services')
    await services.authService.logout()
  } catch (e) {
    // ignore
  }
  router.push({ name: 'login' })
  if (esMovil.value) emit('cerrar')
}
</script>

<style scoped>
.app-sidebar {
  transition: transform 0.3s ease, width 0.3s ease;
}
.icono {
  width: 24px;
  text-align: center;
  display: inline-block;
}
</style>
