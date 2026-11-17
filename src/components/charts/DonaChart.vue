<template>
  <figure class="chart chart-dona">
    <figcaption class="chart-encabezado">
      <h3 class="chart-titulo">{{ titulo }}</h3>
      <span class="chart-periodo" v-if="periodo">{{ periodo }}</span>
    </figcaption>

    <p v-if="total <= 0" class="grafico-vacio">
      Sin registros revisados en el período seleccionado. El indicador no es calculable con
      denominador cero.
    </p>

    <template v-else>
      <div class="dona-cuerpo">
        <svg
          class="dona-svg"
          viewBox="0 0 140 140"
          role="img"
          :aria-label="ariaEtiqueta"
        >
          <circle cx="70" cy="70" r="52" fill="none" class="dona-pista" stroke-width="22" />
          <circle
            cx="70"
            cy="70"
            r="52"
            fill="none"
            class="dona-correctos"
            stroke-width="22"
            stroke-linecap="butt"
            :stroke-dasharray="dashCorrectos"
            :stroke-dashoffset="offsetCorrectos"
            transform="rotate(-90 70 70)"
          />
          <text x="70" y="66" text-anchor="middle" class="dona-numero">{{ porcentajeTexto }}</text>
          <text x="70" y="84" text-anchor="middle" class="dona-subtexto">correctos</text>
        </svg>

        <ul class="dona-leyenda">
          <li>
            <span class="muestra muestra-correctos" aria-hidden="true"></span>
            <span>
              <strong>Correctamente separados</strong><br />
              {{ correctos }} de {{ total }} registros ({{ porcentajeTexto }})
            </span>
          </li>
          <li>
            <span class="muestra muestra-incorrectos" aria-hidden="true"></span>
            <span>
              <strong>Incorrectamente separados</strong><br />
              {{ incorrectos }} de {{ total }} registros ({{ porcentajeIncorrectos }})
            </span>
          </li>
          <li class="leyenda-total">
            Total revisado en el período: <strong>{{ total }}</strong> registros
          </li>
        </ul>
      </div>
      <p class="chart-pie">
        La proporción se calcula sobre los registros activos del período. Un contenedor se considera
        correctamente separado cuando la mayor parte de su contenido corresponde a la categoría
        indicada en el cartel.
      </p>
    </template>
  </figure>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  titulo: { type: String, default: 'Residuos correctamente separados' },
  periodo: { type: String, default: '' },
  correctos: { type: Number, default: 0 },
  incorrectos: { type: Number, default: 0 },
})

const total = computed(() => props.correctos + props.incorrectos)
const porcentaje = computed(() => (total.value > 0 ? Math.round((props.correctos / total.value) * 100) : null))

const RADIO = 52
const CIRCUNFERENCIA = 2 * Math.PI * RADIO
const fraccionCorrectos = computed(() => (total.value > 0 ? props.correctos / total.value : 0))
const dashCorrectos = computed(() => `${(fraccionCorrectos.value * CIRCUNFERENCIA).toFixed(2)} ${CIRCUNFERENCIA.toFixed(2)}`)
const offsetCorrectos = computed(() => 0)

const porcentajeTexto = computed(() => (porcentaje.value != null ? `${porcentaje.value} %` : 's/d'))
const porcentajeIncorrectos = computed(() => (porcentaje.value != null ? `${100 - porcentaje.value} %` : 's/d'))

const ariaEtiqueta = computed(() => {
  if (total.value <= 0) return 'Sin registros revisados en el período.'
  return `${props.correctos} de ${total.value} registros correctamente separados (${porcentaje.value} por ciento).`
})
</script>

<style scoped>
.chart-encabezado { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
.chart-titulo { font-size: 1.02rem; margin: 0; }
.chart-periodo { font-size: 0.78rem; color: var(--texto-suave); font-weight: 700; white-space: nowrap; }
.dona-cuerpo { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
.dona-svg { width: 170px; height: 170px; flex: 0 0 auto; min-width: 150px; }
.dona-pista { stroke: var(--borde); }
.dona-correctos { stroke: var(--color-verde); transition: stroke-dasharray 0.4s ease; }
.dona-numero { font-size: 24px; font-weight: 800; fill: var(--texto); }
.dona-subtexto { font-size: 9.5px; font-weight: 700; fill: var(--texto-suave); text-transform: uppercase; letter-spacing: 0.06em; }
.dona-leyenda { list-style: none; display: flex; flex-direction: column; gap: 12px; font-size: 0.82rem; color: var(--texto); }
.dona-leyenda li { display: flex; align-items: flex-start; gap: 10px; }
.muestra { flex: 0 0 auto; width: 18px; height: 18px; border-radius: 4px; margin-top: 2px; }
.muestra-correctos { background: var(--color-verde); }
.muestra-incorrectos { background: var(--borde-fuerte); }
.leyenda-total { border-top: 1px solid var(--borde); padding-top: 10px; color: var(--texto-suave); }
.chart-pie { font-size: 0.74rem; color: var(--texto-suave); margin-top: 10px; }
.grafico-vacio { padding: 18px; border: 1px dashed var(--borde-fuerte); border-radius: var(--radio-campo); color: var(--texto-suave); font-size: 0.88rem; background: var(--fondo-encabezado-tabla); }
@media (max-width: 560px) {
  .dona-cuerpo { justify-content: center; }
}
</style>
