<template>
  <article class="kpi-card" :class="{ 'kpi-prioritario': prioritario, 'kpi-no-calculable': !calculable }">
    <div class="encabezado-kpi">
      <div class="etiqueta">{{ nombre }}</div>
      <span v-if="prioritario" class="chip-prioritario" title="Indicador prioritario del proyecto">Prioritario</span>
    </div>
    <div class="valor" :class="claseValor" v-if="calculable">
      {{ valor }}<span v-if="unidad" class="unidad">{{ unidad }}</span>
    </div>
    <div class="valor valor-nc" v-else>No calculable</div>
    <div class="meta" v-if="meta">Meta: {{ meta }}</div>
    <div class="detalle" v-if="detalle">{{ detalle }}</div>
    <div class="estado">
      <span class="badge" :class="claseBadge">{{ textoEstado }}</span>
      <span class="rotulo" v-if="categoria">{{ categoria }}</span>
      <span class="rotulo" v-if="periodoTexto">· {{ periodoTexto }}</span>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  nombre: { type: String, required: true },
  valor: { type: [String, Number], default: '' },
  unidad: { type: String, default: '' },
  meta: { type: String, default: '' },
  cumplido: { type: Boolean, default: false },
  categoria: { type: String, default: '' },
  periodo: { type: String, default: '' },
  prioritario: { type: Boolean, default: false },
  calculable: { type: Boolean, default: true },
  detalle: { type: String, default: '' },
})

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
  'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

const periodoTexto = computed(() => {
  if (!props.periodo) return ''
  if (props.periodo === 'todos') return 'Todos los períodos'
  const [anio, m] = props.periodo.split('-').map(Number)
  if (!anio || !m) return props.periodo
  const nombre = MESES[m - 1]
  return `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} ${anio}`
})

const claseValor = computed(() => {
  if (!props.calculable) return ''
  return props.cumplido ? 'cumplido' : 'no-cumplido'
})

const claseBadge = computed(() => {
  if (!props.calculable) return 'badge-pendiente'
  return props.cumplido ? 'badge-activo' : 'badge-pendiente'
})

const textoEstado = computed(() => {
  if (!props.calculable) return 'No calculable'
  return props.cumplido ? 'Cumplido' : 'Pendiente'
})
</script>

<style scoped>
.kpi-card {
  gap: 6px;
  position: relative;
  border: 1px solid var(--borde);
  background: var(--fondo-tarjeta);
  border-radius: var(--radio-tarjeta);
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
}
.kpi-prioritario {
  border: 2px solid var(--color-verde);
  box-shadow: 0 0 0 3px var(--badge-fondo);
}
.encabezado-kpi { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.chip-prioritario {
  flex: 0 0 auto;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--texto-sobre-verde);
  background: var(--color-verde);
  border-radius: var(--radio-pill);
  padding: 3px 10px;
}
.etiqueta { font-size: 0.8rem; color: var(--texto-suave); font-weight: 700; line-height: 1.35; }
.valor { font-size: 1.75rem; font-weight: 800; color: var(--texto); display: flex; align-items: baseline; gap: 6px; }
.valor.cumplido { color: var(--color-verde); }
.valor.no-cumplido { color: var(--error-texto); }
.valor-nc { font-size: 1.35rem; color: var(--texto-suave); font-weight: 800; }
.unidad { font-size: 0.95rem; font-weight: 600; opacity: 0.75; }
.meta { font-size: 0.78rem; color: var(--texto-suave); margin-top: 2px; }
.detalle { font-size: 0.78rem; color: var(--texto-suave); margin-top: 2px; }
.estado { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-top: 8px; font-size: 0.78rem; }
.rotulo { color: var(--texto-suave); }
</style>
