<template>
  <div class="app-layout">
    <Sidebar :abierto="sidebarAbierto" @cerrar="sidebarAbierto = false" />
    <div class="overlay" :class="{ visible: sidebarAbierto }" @click="sidebarAbierto = false"></div>

    <div class="app-main">
      <div class="mobile-topbar">
        <router-link :to="{ name: 'panel' }" class="mobile-topbar-logo" aria-label="Ir al panel">
          <Logo tema="verde" tamano="sm" :tagline="true" />
        </router-link>
        <button class="btn-menu" type="button" @click="sidebarAbierto = !sidebarAbierto">Menú</button>
      </div>
      <div class="mobile-topbar-links">
        <span class="mobile-topbar-seccion">{{ seccionActual }}</span>
        <span class="mobile-topbar-accesos">
          <router-link :to="{ name: 'panel' }">Panel</router-link>
          <span class="separador">·</span>
          <router-link :to="{ name: 'tareas' }">Tareas</router-link>
          <span class="separador">·</span>
          <button class="mobile-topbar-mas" type="button" @click="sidebarAbierto = !sidebarAbierto">Más</button>
        </span>
      </div>

      <div class="app-content">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import Sidebar from './Sidebar.vue'
import Logo from './Logo.vue'

const router = useRouter()
const sidebarAbierto = ref(false)

const etiquetas = {
  panel: 'Panel principal',
  usuarios: 'Usuarios',
  comisiones: 'Comisiones',
  tareas: 'Tareas',
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

const seccionActual = computed(() => etiquetas[router.currentRoute.value.name] || 'Panel principal')
</script>

<style scoped>
.mobile-topbar-logo {
  display: inline-flex;
  align-items: center;
}

.mobile-topbar-accesos {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.mobile-topbar-accesos a,
.mobile-topbar-mas {
  color: var(--verde);
  font-weight: 800;
  padding: 0;
}

.mobile-topbar-accesos .separador {
  color: var(--texto-suave);
}
</style>
