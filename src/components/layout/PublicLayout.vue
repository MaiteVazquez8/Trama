<template>
  <div class="public-layout">
    <header class="public-header">
      <div class="public-header-inner">
        <router-link :to="{ name: 'inicio' }" class="public-header-logo" aria-label="Ir al inicio">
          <Logo tema="verde" tamano="md" :tagline="true" />
        </router-link>

        <nav class="public-nav" aria-label="Navegación principal">
          <a href="#que-es-trama" @click="irASeccion('que-es-trama', $event)">Qué es Trama</a>
          <a href="#como-funciona" @click="irASeccion('como-funciona', $event)">Cómo funciona</a>
          <a href="#comunidad" @click="irASeccion('comunidad', $event)">Comunidad</a>
          <a href="#impacto" @click="irASeccion('impacto', $event)">Impacto</a>
        </nav>

        <div class="public-header-actions">
          <button class="btn btn-outline btn-sm public-btn-login" type="button" @click="irLogin">Iniciar sesión</button>
          <button class="btn btn-primary btn-sm" type="button" @click="irRegistro">Sumarme</button>
          <button class="btn-menu-publico" type="button" :aria-expanded="menuAbierto" @click="menuAbierto = !menuAbierto">Menú</button>
        </div>
      </div>

      <div v-if="menuAbierto" class="public-menu-movil">
        <a href="#que-es-trama" @click="irASeccion('que-es-trama', $event); menuAbierto = false">Qué es Trama</a>
        <a href="#como-funciona" @click="irASeccion('como-funciona', $event); menuAbierto = false">Cómo funciona</a>
        <a href="#comunidad" @click="irASeccion('comunidad', $event); menuAbierto = false">Comunidad</a>
        <a href="#impacto" @click="irASeccion('impacto', $event); menuAbierto = false">Impacto</a>
        <a href="#" @click.prevent="menuAbierto = false; irLogin()">Iniciar sesión</a>
        <a href="#" class="public-menu-sumarme" @click.prevent="menuAbierto = false; irRegistro()">Sumarme</a>
      </div>
    </header>

    <main class="public-main">
      <slot />
    </main>

    <footer class="public-footer">
      <div class="public-footer-inner">
        <router-link :to="{ name: 'inicio' }" class="public-footer-logo" aria-label="Ir al inicio">
          <Logo tema="blanco" tamano="sm" :tagline="true" />
        </router-link>
        <nav class="public-footer-links" aria-label="Enlaces del pie">
          <a href="#que-es-trama" @click="irASeccion('que-es-trama', $event)">Proyecto</a>
          <span aria-hidden="true">·</span>
          <a href="#como-funciona" @click="irASeccion('como-funciona', $event)">Participación</a>
          <span aria-hidden="true">·</span>
          <router-link :to="{ name: 'registro' }">Privacidad</router-link>
          <span aria-hidden="true">·</span>
          <a href="mailto:hola@trama.coop.ar">Contacto</a>
        </nav>
        <p class="public-footer-note">Cooperativa Trama · 2026</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import Logo from './Logo.vue'

const router = useRouter()
const menuAbierto = ref(false)

function irLogin() { router.push({ name: 'login' }) }
function irRegistro() { router.push({ name: 'registro' }) }

function irASeccion(id, evento) {
  if (router.currentRoute.value.name !== 'inicio') {
    evento?.preventDefault()
    router.push({ name: 'inicio', hash: `#${id}` })
    return
  }
  const el = document.getElementById(id)
  if (el) {
    evento?.preventDefault()
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
</script>

<style scoped>
.public-header-logo { display: inline-flex; align-items: center; }
.public-footer-logo { display: inline-flex; align-items: center; }

.btn-menu-publico {
  display: none;
  align-items: center;
  padding: 6px 16px;
  border-radius: var(--radio-pill);
  border: 1.5px solid var(--verde);
  color: var(--verde);
  font-weight: 800;
  font-size: 0.78rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.public-menu-movil {
  display: flex;
  flex-direction: column;
  background-color: var(--fondo-tarjeta);
  border-top: 1px solid var(--borde);
  padding: 10px 18px 16px 18px;
}

.public-menu-movil a {
  padding: 12px 8px;
  border-bottom: 1px solid var(--borde);
  font-weight: 700;
  color: var(--texto);
}

.public-menu-movil a:last-child {
  border-bottom: none;
}

.public-menu-sumarme {
  color: var(--verde) !important;
}

@media (max-width: 1100px) {
  .public-nav { display: none; }
  .public-btn-login { display: none; }
  .btn-menu-publico { display: inline-flex; }
}

@media (max-width: 900px) {
  .public-header-inner { height: 60px; gap: 10px; }
  .public-footer-inner { flex-direction: column; align-items: flex-start; gap: 14px; }
}
</style>
