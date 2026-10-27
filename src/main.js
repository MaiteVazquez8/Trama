import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import routes from './router'
import './styles.css'
import { tieneSupabase } from './supabase/client'

// Estado global simple de autenticación (se sincroniza con Supabase cuando está configurado)
const authState = {
  usuario: null,
  cargando: true,
  error: null,
  simulado: !tieneSupabase,
  setUsuario(u) { this.usuario = u; this.cargando = false; },
  setCargando(c) { this.cargando = c; },
  setError(e) { this.error = e; this.cargando = false; },
  limpiar() { this.usuario = null; this.cargando = false; this.error = null; },
  get autenticado() { return !!this.usuario; },
  get rol() { return this.usuario ? this.usuario.rol : null; },
  get comision() { return this.usuario ? this.usuario.comision : null; },
}

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to) {
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
})

router.beforeEach((to, from, next) => {
  const requiereAuth = to.meta.requiereAuth
  const soloVisitantes = to.meta.soloVisitantes

  if (soloVisitantes && authState.autenticado) {
    next({ name: 'panel' })
    return
  }

  if (requiereAuth && !authState.autenticado) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  if (to.meta.rol && authState.rol !== to.meta.rol) {
    next({ name: 'panel' })
    return
  }

  next()
})

const app = createApp(App)
app.provide('auth', authState)
app.use(router)
app.mount('#app')

export { authState }
