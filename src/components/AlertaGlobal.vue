<template>
  <transition name="alerta">
    <div
      v-if="alerta"
      class="alerta"
      :class="`alerta-${alerta.tipo}`"
      role="alert"
      aria-live="polite"
    >
      <span class="icono">{{ icono }}</span>
      <span>{{ alerta.mensaje }}</span>
      <button class="cerrar" @html.self.prevent @click="cerrar" aria-label="Cerrar mensaje">✕</button>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { inject } from 'vue'

const auth = inject('auth')

const alerta = ref(null)

const iconos = {
  exito: '✅',
  error: '❌',
  info: 'ℹ️',
  cargando: '⏳',
}

const icono = computed(() => iconos[alerta.value?.tipo] || 'ℹ️')

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
  border-radius: 6px;
  padding: 12px 16px;
  font-size: 0.9rem;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  position: sticky;
  top: 72px;
  z-index: 100;
  width: 100%;
  max-width: 700px;
  margin: 0 auto 16px auto;
  animation: aparecer 0.25s ease;
}
.alerta-exito { background-color: #E3F0DE; color: #1E4620; border: 1px solid #B9D8AE; }
.alerta-error { background-color: #F7DEDE; color: #6E1818; border: 1px solid #D8A9A9; }
.alerta-info { background-color: #FBF0DC; color: #7A4F00; border: 1px solid #E8C98E; }
.alerta-cargando { background-color: #E8EEF5; color: #2F547A; border: 1px solid #C8D6E4; }

.icono { font-size: 1.1rem; line-height: 1; }
.cerrar {
  background: none;
  border: none;
  color: inherit;
  opacity: 0.7;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 2px 6px;
  margin-left: auto;
}
.cerrar:hover { opacity: 1; }

@keyframes aparecer {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 900px) {
  .alerta { position: static; top: 0; max-width: none; border-radius: 0; }
}
</style>
