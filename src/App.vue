<template>
  <div class="app-layout">
    <Sidebar :abierto="sidebarAbierto" @cerrar="sidebarAbierto = false" />
    <div class="overlay" :class="{ visible: sidebarAbierto && esMovil }" @click="sidebarAbierto = false"></div>

    <main class="app-main">
      <Navbar @toggle-menu="sidebarAbierto = !sidebarAbierto" />
      <div class="app-content">
        <AlertaGlobal />
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { inject } from 'vue'

import Sidebar from './components/layout/Sidebar.vue'
import Navbar from './components/layout/Navbar.vue'
import AlertaGlobal from './components/AlertaGlobal.vue'

const auth = inject('auth')
const router = useRouter()
const sidebarAbierto = ref(false)

const esMovil = computed(() => window.innerWidth <= 900)

onMounted(() => {
  window.addEventListener('resize', () => {
    if (esMovil.value && sidebarAbierto.value) sidebarAbierto.value = false
  })
})

const esAdmin = computed(() => auth && auth.rol === 'administrador')
</script>

<style>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
