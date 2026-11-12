<template>
  <div v-if="mensaje" class="alerta" :class="`alerta-${tipo}`" role="alert">
    <span class="icono" v-html="icono"></span>
    <span>{{ mensaje }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

import { iconoDe } from './alertaIconos'

const props = defineProps({
  mensaje: { type: String, default: '' },
  tipo: { type: String, default: 'info' },
  duracion: { type: Number, default: 4000 },
})

const icono = computed(() => iconoDe(props.tipo))
</script>

<style scoped>
.alerta {
  border-radius: var(--radio-campo);
  padding: 10px 14px;
  font-size: 0.9rem;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 14px;
  animation: aparecer 0.25s ease;
  border: 1px solid transparent;
}
.alerta-exito { background-color: var(--exito-fondo); color: var(--exito-texto); border-color: var(--exito-borde); }
.alerta-error { background-color: var(--error-fondo); color: var(--error-texto); border-color: var(--error-borde); }
.alerta-info { background-color: var(--aviso-fondo); color: var(--aviso-texto); border-color: var(--aviso-borde); }
.alerta-cargando { background-color: var(--cargando-fondo); color: var(--cargando-texto); border-color: var(--cargando-borde); }
.icono { line-height: 1; display: inline-flex; margin-top: 1px; }

@keyframes aparecer {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
