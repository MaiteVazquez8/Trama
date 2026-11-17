<template>
  <figure class="chart chart-lineas">
    <figcaption class="chart-encabezado">
      <h3 class="chart-titulo">{{ titulo }}</h3>
      <span class="chart-periodo" v-if="periodo">{{ periodo }}</span>
    </figcaption>

    <p v-if="!tieneDatos" class="grafico-vacio">
      Sin tareas programadas en los últimos 6 meses. El gráfico aparecerá cuando haya períodos con
      tareas vigentes.
    </p>

    <template v-else>
      <svg
        class="lineas-svg"
        viewBox="0 0 640 214"
        role="img"
        :aria-label="ariaEtiqueta"
        preserveAspectRatio="xMidYMid meet"
      >
        <!-- grilla horizontal -->
        <g class="grilla">
          <template v-for="n in [0, 25, 50, 75, 100]" :key="n">
            <line :x1="PADDING_IZQ" :x2="ANCHO - PADDING_DER" :y1="yDe(n)" :y2="yDe(n)" class="linea-grilla" />
            <text :x="PADDING_IZQ - 6" :y="yDe(n) + 3" class="texto-grilla" text-anchor="end">{{ n }}%</text>
          </template>
        </g>

        <!-- línea de meta -->
        <line
          :x1="PADDING_IZQ"
          :x2="ANCHO - PADDING_DER"
          :y1="yDe(meta)"
          :y2="yDe(meta)"
          class="linea-meta"
        />
        <text :x="ANCHO - PADDING_DER" :y="yDe(meta) - 4" class="texto-meta" text-anchor="end">
          Meta {{ meta }} %
        </text>

        <!-- segmentos de la curva (se cortan en meses sin datos) -->
        <polyline
          v-for="(segmento, i) in segmentos"
          :key="i"
          :points="segmento.puntos"
          class="curva"
          fill="none"
        />

        <!-- puntos y etiquetas -->
        <g v-for="p in puntos" :key="p.mes">
          <circle
            :cx="p.x"
            :cy="p.y"
            :r="esSeleccionado(p.mes) ? 6.5 : 4.5"
            class="punto"
            :class="{ 'punto-seleccionado': esSeleccionado(p.mes) }"
          />
          <text :x="p.x" :y="p.y - 9" class="texto-punto" text-anchor="middle">{{ p.porcentaje }}%</text>
          <text :x="p.x" :y="ALTO - 10" class="texto-eje" text-anchor="middle" :class="{ 'eje-seleccionado': esSeleccionado(p.mes) }">
            {{ p.mesCorto }}
          </text>
        </g>

        <!-- meses sin datos -->
        <text
          v-for="m in mesesSinDatos"
          :key="m.mes"
          :x="m.x"
          :y="ALTO - 10"
          class="texto-eje eje-vacio"
          text-anchor="middle"
        >{{ m.mesCorto }}</text>
      </svg>

      <p class="chart-pie">
        Línea = tareas completadas a tiempo ÷ tareas programadas del mes (excluye canceladas).
        Meses sin tareas programadas se omiten. La línea punteada marca la meta del 90 %.
      </p>
    </template>
  </figure>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  titulo: { type: String, default: 'Evolución del cumplimiento de tareas' },
  periodo: { type: String, default: '' },
  datos: { type: Array, required: true },
  meta: { type: Number, default: 90 },
  mesSeleccionado: { type: String, default: '' },
})

const ANCHO = 640
const ALTO = 214
const PADDING_IZQ = 36
const PADDING_DER = 12
const PADDING_SUP = 20
const PADDING_INF = 34

const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul',
  'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const yDe = (valor) =>
  PADDING_SUP + ((100 - valor) * (ALTO - PADDING_SUP - PADDING_INF)) / 100

const puntos = computed(() => {
  const conDatos = props.datos.filter((d) => d.porcentaje != null)
  if (!conDatos.length) return []
  const paso = (ANCHO - PADDING_IZQ - PADDING_DER) / Math.max(props.datos.length - 1, 1)
  return props.datos
    .map((d, i) => ({
      ...d,
      x: PADDING_IZQ + i * paso,
      y: d.porcentaje != null ? yDe(d.porcentaje) : null,
      mesCorto: etiquetaMes(d.mes),
    }))
    .filter((d) => d.porcentaje != null)
})

const mesesSinDatos = computed(() => {
  const paso = (ANCHO - PADDING_IZQ - PADDING_DER) / Math.max(props.datos.length - 1, 1)
  return props.datos
    .map((d, i) => ({ ...d, x: PADDING_IZQ + i * paso, mesCorto: etiquetaMes(d.mes) }))
    .filter((d) => d.porcentaje == null)
})

const segmentos = computed(() => {
  const paso = (ANCHO - PADDING_IZQ - PADDING_DER) / Math.max(props.datos.length - 1, 1)
  const puntosConIndice = props.datos.map((d, i) => ({
    x: PADDING_IZQ + i * paso,
    y: d.porcentaje != null ? yDe(d.porcentaje) : null,
  }))
  const resultado = []
  let actual = []
  for (const p of puntosConIndice) {
    if (p.y == null) {
      if (actual.length >= 2) resultado.push({ puntos: actual.map((q) => `${q.x},${q.y}`).join(' ') })
      actual = []
    } else {
      actual.push(p)
    }
  }
  if (actual.length >= 2) resultado.push({ puntos: actual.map((q) => `${q.x},${q.y}`).join(' ') })
  return resultado
})

const tieneDatos = computed(() => props.datos.some((d) => d.porcentaje != null))
const esSeleccionado = (mes) => props.mesSeleccionado && props.mesSeleccionado === mes

function etiquetaMes(clave) {
  const [anio, mes] = String(clave).split('-').map(Number)
  if (!anio || !mes) return String(clave)
  return `${MESES_CORTOS[mes - 1]} ${String(anio).slice(2)}`
}

const ariaEtiqueta = computed(() => {
  const partes = props.datos
    .filter((d) => d.porcentaje != null)
    .map((d) => `${etiquetaMes(d.mes)}: ${d.porcentaje} por ciento (${d.completadas} de ${d.total} tareas)`)
  return `Evolución del cumplimiento de tareas. ${partes.join('. ')}.`
})
</script>

<style scoped>
.chart-encabezado { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
.chart-titulo { font-size: 1.02rem; margin: 0; }
.chart-periodo { font-size: 0.78rem; color: var(--texto-suave); font-weight: 700; white-space: nowrap; }
.lineas-svg { width: 100%; height: auto; display: block; }
.linea-grilla { stroke: var(--borde); stroke-width: 1; }
.texto-grilla { font-size: 9px; fill: var(--texto-suave); }
.linea-meta { stroke: var(--badge-pendiente-texto); stroke-width: 1.4; stroke-dasharray: 5 4; }
.texto-meta { font-size: 8.5px; fill: var(--badge-pendiente-texto); font-weight: 800; }
.curva { stroke: var(--color-verde); stroke-width: 2.4; stroke-linejoin: round; stroke-linecap: round; }
.punto { fill: var(--color-verde); stroke: var(--fondo-tarjeta); stroke-width: 1.6; }
.punto-seleccionado { fill: var(--color-verde-oscuro); stroke: var(--texto-sobre-verde); stroke-width: 2; }
.texto-punto { font-size: 9px; font-weight: 800; fill: var(--texto); }
.texto-eje { font-size: 9px; fill: var(--texto-suave); font-weight: 700; }
.eje-seleccionado { fill: var(--color-verde); font-weight: 800; }
.eje-vacio { fill: var(--borde-fuerte); font-weight: 400; font-style: italic; }
.chart-pie { font-size: 0.74rem; color: var(--texto-suave); margin-top: 10px; }
.grafico-vacio { padding: 18px; border: 1px dashed var(--borde-fuerte); border-radius: var(--radio-campo); color: var(--texto-suave); font-size: 0.88rem; background: var(--fondo-encabezado-tabla); }
</style>
