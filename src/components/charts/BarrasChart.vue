<template>
  <figure class="chart chart-barras">
    <figcaption class="chart-encabezado">
      <h3 class="chart-titulo">{{ titulo }}</h3>
      <span class="chart-periodo" v-if="periodo">{{ periodo }}</span>
    </figcaption>

    <p v-if="!datos.length" class="grafico-vacio">
      Sin materiales reciclables registrados en el período seleccionado.
    </p>

    <ul v-else class="barras" role="list">
      <li
        v-for="item in datos"
        :key="item.id"
        class="barra-fila"
        role="img"
        :aria-label="`${item.material}: ${formatear(item.kg)} kilogramos`"
      >
        <span class="barra-etiqueta">{{ item.material }}</span>
        <span class="barra-pista">
          <span class="barra-relleno" :style="{ width: ancho(item.kg) }"></span>
        </span>
        <span class="barra-valor">{{ formatear(item.kg) }} kg</span>
      </li>
    </ul>

    <p v-if="datos.length" class="chart-pie">
      Escala proporcional al material de mayor peso ({{ formatear(maxKg) }} kg).
      Fuente: registros de residuos del período.
    </p>
  </figure>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  titulo: { type: String, default: 'Materiales recuperados por tipo' },
  periodo: { type: String, default: '' },
  datos: { type: Array, required: true },
})

const maxKg = computed(() => props.datos.reduce((m, i) => Math.max(m, Number(i.kg) || 0), 0))

const ancho = (kg) => (maxKg.value > 0 ? `${(Number(kg) / maxKg.value) * 100}%` : '0%')
const formatear = (kg) => new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 }).format(Number(kg) || 0)
</script>

<style scoped>
.chart-encabezado { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
.chart-titulo { font-size: 1.02rem; margin: 0; }
.chart-periodo { font-size: 0.78rem; color: var(--texto-suave); font-weight: 700; white-space: nowrap; }
.barras { display: flex; flex-direction: column; gap: 10px; }
.barra-fila { display: grid; grid-template-columns: minmax(90px, 170px) 1fr auto; align-items: center; gap: 10px; }
.barra-etiqueta { font-size: 0.82rem; font-weight: 700; color: var(--texto); }
.barra-pista { height: 22px; background: var(--fondo-encabezado-tabla); border-radius: var(--radio-pill); overflow: hidden; }
.barra-relleno { display: block; height: 100%; min-width: 6px; background: var(--color-verde); border-radius: var(--radio-pill); transition: width 0.4s ease; }
.barra-valor { font-size: 0.82rem; font-weight: 800; color: var(--color-verde); min-width: 58px; text-align: right; }
.chart-pie { font-size: 0.74rem; color: var(--texto-suave); margin-top: 10px; }
.grafico-vacio { padding: 18px; border: 1px dashed var(--borde-fuerte); border-radius: var(--radio-campo); color: var(--texto-suave); font-size: 0.88rem; background: var(--fondo-encabezado-tabla); }
@media (max-width: 520px) {
  .barra-fila { grid-template-columns: 1fr; gap: 4px; }
  .barra-valor { text-align: left; }
}
</style>
