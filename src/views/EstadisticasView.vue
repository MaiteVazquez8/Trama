<template>
  <div class="estadisticas">
    <VistaEncabezado titulo="Estadísticas" subtitulo="Indicadores para decidir y mejorar">
      <template #accion>
        <button class="btn btn-primary" @click="descargarInforme" :disabled="!kpis.length">
          Descargar informe
        </button>
      </template>
    </VistaEncabezado>

    <Alerta v-if="error" tipo="error" :mensaje="error" />
    <Alerta v-if="exitoMensaje" tipo="exito" :mensaje="exitoMensaje" />

    <div class="modo-aviso" v-if="modoDesarrollo">
      Modo desarrollo: estos resultados se calculan con <strong>datos ficticios de prueba</strong>. No son mediciones reales.
    </div>

    <div class="estadisticas-fila">
      <TarjetaStat :texto="`${kgRecuperados} kg recuperados`" />
      <TarjetaStat :texto="`${kgSemanales} kg semanales`" />
      <TarjetaStat :texto="`${participantesTotal} participantes`" />
    </div>

    <div class="contenido-doble tarjetas-superiores">
      <figure class="card evolucion-card">
        <h2>Evolución mensual</h2>
        <img class="evolucion-foto" src="/img/reciclaje.jpeg" alt="Latas y botellas de vidrio y plástico recolectadas por la cooperativa" loading="lazy" />
        <figcaption>{{ mesAnioActual }} · Todos los materiales · Toda la institución</figcaption>
      </figure>

      <TarjetaDatos titulo="Lectura rápida">
        <p class="item-datos">Cartón representa el {{ porcentajeCarton }} % del total.</p>
        <p class="item-datos">La participación suma {{ participantesTotal }} personas este período.</p>
        <p class="item-datos">{{ entregasConfirmadas }} entregas fueron confirmadas.</p>
      </TarjetaDatos>
    </div>

    <h2 class="detalle-titulo">Detalle de indicadores</h2>

    <div class="kpis-grid">
      <div class="kpi-detalle" v-for="(k, i) in kpis" :key="i">
        <div class="cabecera-kpi">
          <h3>{{ k.nombre }}</h3>
          <span class="badge" :class="estadoClase(k)">{{ k.estadoTexto }}</span>
        </div>

        <div class="valor-contenedor">
          <div class="valor-grande" :class="valorClase(k)">{{ k.valor }}</div>
          <div class="meta">{{ k.meta }}</div>
        </div>

        <table class="tabla-ficha">
          <tr><td>Categoría</td><td>{{ k.categoria }}</td></tr>
          <tr><td>Objetivo relacionado</td><td>{{ k.objetivo }}</td></tr>
          <tr><td>Fórmula de cálculo</td><td>{{ k.formula }}</td></tr>
          <tr><td>Unidad de medida</td><td>{{ k.unidad }}</td></tr>
          <tr><td>Meta y plazo</td><td>{{ k.plazo }}</td></tr>
          <tr><td>Fuente de datos</td><td>{{ k.fuente }}</td></tr>
          <tr><td>Frecuencia de revisión</td><td>{{ k.frecuencia }}</td></tr>
          <tr><td>Responsable</td><td>{{ k.responsable }}</td></tr>
          <tr><td>Interpretación</td><td>{{ k.interpretacion }}</td></tr>
        </table>

        <div class="nota" v-if="k.nota">{{ k.nota }}</div>
      </div>
    </div>

    <div class="resumen-nota">
      <p>
        Consideración: si el denominador es cero, el indicador se informa como <strong>no calculable por falta de datos</strong>,
        en lugar de asignarle un 0 %.
      </p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed, inject } from 'vue'
import { estadisticasService, registrosResiduoService, actividadesService, entregasService } from '@/services'

import Alerta from '@/components/Alerta.vue'
import VistaEncabezado from '@/components/VistaEncabezado.vue'
import TarjetaStat from '@/components/TarjetaStat.vue'
import TarjetaDatos from '@/components/TarjetaDatos.vue'

const auth = inject('auth')

const error = ref(null)
const exitoMensaje = ref(null)
const kpis = ref([])
const resumenDatos = ref(null)
const registros = ref([])
const actividades = ref([])
const entregas = ref([])

const modoDesarrollo = computed(() => auth && auth.simulado)

const kgRecuperados = computed(() => Math.round(resumenDatos.value?.recuperadoKgMes || 0))
const kgSemanales = computed(() => Math.round((resumenDatos.value?.recuperadoKgMes || 0) / 4.3))
const participantesTotal = computed(() => actividades.value.reduce((suma, a) => suma + Number(a.participantes || 0), 0))
const entregasConfirmadas = computed(() => entregas.value.filter((e) => e.estado === 'completada').length)
const porcentajeCarton = computed(() => {
  const total = registros.value.filter((r) => r.estado === 'activo').length
  if (!total) return 0
  const carton = registros.value.filter((r) => r.estado === 'activo' && r.tipoResiduo === 'tr-1').length
  return Math.round((carton / total) * 100)
})
const mesAnioActual = computed(() => {
  const texto = new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
})

onMounted(async () => {
  try {
    const [r, rRegistros, rActividades, rEntregas] = await Promise.all([
      estadisticasService.resumen(),
      registrosResiduoService.listar(),
      actividadesService.listar(),
      entregasService.listar(),
    ])

    if (rRegistros.exito) registros.value = rRegistros.data || []
    if (rActividades.exito) actividades.value = rActividades.data || []
    if (rEntregas.exito) entregas.value = rEntregas.data || []

    if (r.exito) {
      const d = r.datos
      resumenDatos.value = d
      exitoMensaje.value = r.simulado
        ? 'Estadísticas calculadas con datos de prueba (modo desarrollo).'
        : 'Estadísticas calculadas con datos de Supabase.'
      kpis.value = [
        {
          nombre: 'Kilogramos de materiales reciclables recuperados',
          valor: d.recuperadoKgMes.toFixed(1) + ' kg',
          meta: 'Al menos 20 kg por mes',
          categoria: 'Financiero o de recursos',
          objetivo: 'Recuperar al menos 20 kg de materiales reciclables por mes.',
          formula: 'Suma del peso de todos los materiales reciclables correctamente clasificados durante el mes.',
          unidad: 'Kilogramos (kg)',
          plazo: 'Alcanzar al menos 20 kg mensuales durante los próximos dos meses.',
          fuente: 'Planillas de pesaje y registros de clasificación.',
          frecuencia: 'Mensual.',
          responsable: 'Comisión de recolección y clasificación, con apoyo de administración.',
          interpretacion: 'Conviene que el valor aumente hasta alcanzar la meta, siempre que los materiales estén correctamente clasificados.',
          nota: `Resultado: ${d.recuperadoKgMes.toFixed(1)} kg. Meta: 20 kg. ${d.cumplimientoRecuperado ? 'Se cumple el objetivo mensual.' : 'No se cumple el objetivo.'}`,
          estadoTexto: d.cumplimientoRecuperado ? 'Cumplido' : 'No cumplido',
        },
        {
          nombre: 'Porcentaje de residuos correctamente separados',
          valor: d.porcentajeSeparados != null ? d.porcentajeSeparados + ' %' : 'No calculable',
          meta: 'Al menos 80 % al finalizar los próximos dos meses',
          categoria: 'Usuarios o comunidad',
          objetivo: 'Mejorar la separación de residuos en la escuela.',
          formula: '(Cantidad de residuos correctamente separados ÷ cantidad total de residuos revisados) × 100.',
          unidad: 'Porcentaje (%)',
          plazo: 'Alcanzar al menos el 80 % al finalizar los próximos dos meses.',
          fuente: 'Registros de revisión de los recipientes señalizados.',
          frecuencia: 'Semanal, con evaluación mensual.',
          responsable: 'Comisión de recolección y clasificación.',
          interpretacion: 'Conviene que el porcentaje aumente hasta alcanzar o superar el 80 %.',
          nota: d.porcentajeSeparados != null
            ? `Resultado: ${d.porcentajeSeparados} %. Meta: 80 %. ${d.cumplimientoSeparados ? 'Se cumple el objetivo.' : 'No se cumple el objetivo.'}`
            : 'No hay datos suficientes para calcularlo.',
          estadoTexto: d.porcentajeSeparados != null && d.cumplimientoSeparados ? 'Cumplido' : 'No cumplido',
        },
        {
          nombre: 'Porcentaje de tareas de recolección y clasificación completadas a tiempo',
          valor: d.porcentajeTareas != null ? d.porcentajeTareas + ' %' : 'No calculable',
          meta: 'Cumplir al menos el 90 % de las tareas programadas cada mes',
          categoria: 'Procesos',
          objetivo: 'Mejorar la organización y el cumplimiento de las tareas previstas.',
          formula: '(Cantidad de tareas completadas dentro del plazo ÷ cantidad total de tareas programadas para el período) × 100.',
          unidad: 'Porcentaje (%)',
          plazo: 'Cumplir al menos el 90 % de las tareas programadas cada mes.',
          fuente: 'Cronograma de actividades y planillas de seguimiento.',
          frecuencia: 'Semanal, con evaluación mensual.',
          responsable: 'Comisión de coordinación y comisión de recolección y clasificación.',
          interpretacion: 'Conviene que el porcentaje aumente hasta alcanzar o superar el 90 %.',
          nota: d.porcentajeTareas != null
            ? `Resultado: ${d.porcentajeTareas} %. Meta: 90 %. ${d.cumplimientoTareas ? 'Se cumple el objetivo.' : 'No se cumple el objetivo.'}`
            : 'No hay datos suficientes para calcularlo.',
          estadoTexto: d.porcentajeTareas != null && d.cumplimientoTareas ? 'Cumplido' : 'No cumplido',
        },
        {
          nombre: 'Porcentaje de estudiantes que participan en las actividades',
          valor: d.porcentajeParticipacion != null ? d.porcentajeParticipacion + ' %' : 'No calculable',
          meta: 'Al menos 70 % de participación al finalizar los próximos dos meses',
          categoria: 'Personas',
          objetivo: 'Aumentar la participación estudiantil en las actividades del proyecto.',
          formula: '(Cantidad de estudiantes que participaron al menos una vez durante el mes ÷ cantidad total de estudiantes de los cursos seleccionados) × 100.',
          unidad: 'Porcentaje (%)',
          plazo: 'Alcanzar al menos el 70 % de participación al finalizar los próximos dos meses.',
          fuente: 'Listas de participación y registros de las actividades.',
          frecuencia: 'Mensual.',
          responsable: 'Comisión de comunicación y comisión de coordinación.',
          interpretacion: 'Conviene que el porcentaje aumente hasta alcanzar o superar el 70 %.',
          nota: d.porcentajeParticipacion != null
            ? `Resultado: ${d.porcentajeParticipacion} %. Meta: 70 %. ${d.cumplimientoParticipacion ? 'Se cumple el objetivo.' : 'No se cumple el objetivo.'}`
            : 'No hay datos suficientes para calcularlo.',
          estadoTexto: d.porcentajeParticipacion != null && d.cumplimientoParticipacion ? 'Cumplido' : 'No cumplido',
        },
      ]
    } else {
      error.value = r.error?.message || 'No se pudieron cargar los indicadores.'
    }
  } catch (e) {
    error.value = 'Error de conexión al cargar los indicadores.'
  }
})

const estadoClase = (k) => (k.estadoTexto === 'Cumplido' ? 'badge-activo' : 'badge-cancelada')
const valorClase = (k) => (k.estadoTexto === 'Cumplido' ? 'cumplido' : 'no-cumplido')

function descargarInforme() {
  const encabezados = ['Indicador', 'Resultado', 'Meta', 'Estado', 'Unidad']
  const filas = kpis.value.map((k) => [k.nombre, k.valor, k.meta, k.estadoTexto, k.unidad])
  const escapar = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csv = [encabezados, ...filas].map((f) => f.map(escapar).join(';')).join('\r\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'trama-informe-indicadores.csv'
  a.click()
  URL.revokeObjectURL(url)
  exitoMensaje.value = 'Informe de indicadores exportado como CSV.'
}
</script>

<style scoped>
.estadisticas { width: 100%; }

.tarjetas-superiores { margin-bottom: 20px; }
.tarjetas-superiores h2 { font-size: 1.05rem; margin-bottom: 10px; }

.evolucion-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.evolucion-foto {
  width: 100%;
  height: 190px;
  object-fit: cover;
  border-radius: var(--radio-tarjeta);
  display: block;
}

.evolucion-card figcaption {
  font-size: 0.82rem;
  color: var(--texto-suave);
}

.detalle-titulo {
  font-size: 1.15rem;
  margin: 4px 0 12px 0;
}

.kpis-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; }

.kpi-detalle {
  background: var(--fondo-tarjeta);
  border: 1px solid var(--borde);
  border-radius: var(--radio-tarjeta);
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.cabecera-kpi { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding-bottom: 10px; border-bottom: 1px solid var(--borde); }
.cabecera-kpi h3 { font-size: 0.98rem; margin: 0; }
.valor-contenedor { display: flex; flex-direction: column; gap: 4px; }
.valor-grande { font-size: 1.9rem; font-weight: 800; }
.valor-grande.cumplido { color: var(--color-verde); }
.valor-grande.no-cumplido { color: var(--error-texto); }
.meta { font-size: 0.82rem; color: var(--texto-suave); }

.tabla-ficha { width: 100%; font-size: 0.82rem; border-collapse: collapse; }
.tabla-ficha td { padding: 6px 0; border-bottom: 1px solid var(--borde); vertical-align: top; }
.tabla-ficha td:first-child { font-weight: 700; color: var(--texto-suave); width: 38%; }
.tabla-ficha tr:last-child td { border-bottom: none; }

.nota { margin-top: 8px; font-size: 0.82rem; color: var(--texto-suave); padding: 8px 12px; background: var(--fondo-crema); border-radius: var(--radio-campo); }

.resumen-nota { margin-top: 20px; font-size: 0.88rem; color: var(--texto-suave); background: var(--aviso-fondo); border: 1px solid var(--aviso-borde); border-radius: var(--radio-campo); padding: 12px 16px; }

@media (max-width: 600px) {
  .kpis-grid { grid-template-columns: 1fr; }
}
</style>
