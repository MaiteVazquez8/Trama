<template>
  <div v-if="mensaje" class="alerta" :class="`alerta-${tipo}`" role="alert">
    <span class="icono">{{ icono }}</span>
    <span>{{ mensaje }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  mensaje: { type: String, default: '' },
  tipo: { type: String, default: 'info' },
  duracion: { type: Number, default: 4000 },
})

const iconos = { exito: '✅', error: '❌', info: 'ℹ️', cargando: '⏳' }
const icono = computed(() => iconos[props.tipo] || 'ℹ️')
</script>

<style scoped>
.alerta {
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 0.9rem;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 14px;
  animation: aparecer 0.25s ease;
}
.alerta-exito { background-color: #E3F0DE; color: #1E4620; border: 1px solid #B9D8AE; }
.alerta-error { background-color: #F7DEDE; color: #6E1818; border: 1px solid #D8A9A9; }
.alerta-info { background-color: #FBF0DC; color: #7A4F00; border: 1px solid #E8C98E; }
.alerta-cargando { background-color: #E8EEF5; color: #2F547A; border: 1px solid #C8D6E4; }
.icono { line-height: 1; }

@keyframes aparecer {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
