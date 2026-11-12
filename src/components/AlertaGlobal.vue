<template>
  <transition name="alerta">
    <div
      v-if="alerta"
      class="alerta"
      :class="`alerta-${alerta.tipo}`"
      role="alert"
      aria-live="polite"
    >
      <span class="icono" v-html="icono"></span>
      <span>{{ alerta.mensaje }}</span>
      <button class="cerrar" @click="cerrar" aria-label="Cerrar mensaje">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { inject } from 'vue'

import { iconoDe } from './alertaIconos'

const auth = inject('auth')

const alerta = ref(null)

const icono = computed(() => (alerta.value ? iconoDe(alerta.value.tipo) : ''))

function mostrar(mensaje, tipo = 'info', duracion = 5000) {
  alerta.value = { mensaje, tipo }
  if (duracion > 0) {
    setTimeout(() => { alerta.value = null }, duracion)
  }
}

function cerrar() {
  alerta.value = null
}

// Escucha cambios globales de error/sesión en auth (modo desarrollo)
watch(
  () => auth && auth.error,
  (nuevo) => {
    if (nuevo) mostrar(nuevo.message || 'Ocurrió un error.', 'error', 6000)
  }
)
</script>

<style scoped>
.alerta {
  border-radius: var(--radio-campo);
  padding: 12px 16px;
  font-size: 0.88rem;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  position: sticky;
  top: 16px;
  z-index: 100;
  width: 100%;
  max-width: 720px;
  margin: 0 auto 16px auto;
  border: 1px solid transparent;
  animation: aparecer 0.25s ease;
}
.alerta-exito { background-color: var(--exito-fondo); color: var(--exito-texto); border-color: var(--exito-borde); }
.alerta-error { background-color: var(--error-fondo); color: var(--error-texto); border-color: var(--error-borde); }
.alerta-info { background-color: var(--aviso-fondo); color: var(--aviso-texto); border-color: var(--aviso-borde); }
.alerta-cargando { background-color: var(--cargando-fondo); color: var(--cargando-texto); border-color: var(--cargando-borde); }

.icono { line-height: 1; display: inline-flex; margin-top: 1px; }
.cerrar {
  background: none;
  border: none;
  color: inherit;
  opacity: 0.7;
  cursor: pointer;
  padding: 2px;
  margin-left: auto;
  display: inline-flex;
}
.cerrar:hover { opacity: 1; }

@keyframes aparecer {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 900px) {
  .alerta { position: static; top: 0; max-width: none; border-radius: var(--radio-campo); }
}
</style>
