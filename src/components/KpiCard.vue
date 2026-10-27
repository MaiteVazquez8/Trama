<template>
  <div class="kpi-card">
    <div class="etiqueta">{{ nombre }}</div>
    <div class="valor" :class="{ cumplido, 'no-cumplido': !cumplido && valor != null && valor !== '—' }">
      {{ valor }} <span style="font-size:1rem; font-weight:600; opacity:0.8">{{ unidad }}</span>
    </div>
    <div class="meta" v-if="meta">Meta: {{ meta }}</div>
    <div class="estado" v-if="categoria">
      <span class="badge" :class="clase">{{ cumplido ? 'Cumplido' : 'Pendiente' }}</span>
      <span class="rotulo">{{ categoria }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  nombre: { type: String, required: true },
  valor: { type: [String, Number], required: true },
  unidad: { type: String, default: '' },
  meta: { type: String, default: '' },
  cumplido: { type: Boolean, default: false },
  categoria: { type: String, default: '' },
})

const clase = computed(() => props.cumplido ? 'badge-activo' : 'badge-pendiente')
</script>

<style scoped>
.kpi-card { gap: 8px; }
.etiqueta { font-size: 0.85rem; color: var(--color-texto-suave); }
.valor { font-size: 1.75rem; font-weight: 800; color: var(--color-verde-oscuro); display: flex; align-items: baseline; gap: 4px; }
.valor.cumplido { color: var(--color-verde); }
.valor.no-cumplido { color: var(--color-error); }
.meta { font-size: 0.8rem; color: var(--color-texto-suave); margin-top: 4px; }
.estado { display: flex; align-items: center; gap: 8px; margin-top: 8px; font-size: 0.78rem; }
.rotulo { color: var(--color-texto-suave); }
</style>
