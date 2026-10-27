<template>
  <div class="estadisticas">
    <div class="encabezado">
      <h1>Indicadores y estadísticas</h1>
      <p>KPI definidos para Trama, sus objetivos, resultados, unidades, períodos y estados. Los resultados se calculan a partir de los registros del sistema.</p>
    </div>

    <Alerta v-if="error" tipo="error" :mensaje="error" />
    <Alerta v-if="exitoMensaje" tipo="exito" :mensaje="exitoMensaje" />

    <div class="modo-aviso" v-if="modoDesarrollo">
      ⚠️ Modo desarrollo: estos resultados se calculan con <strong>datos ficticios de prueba</strong>. No son mediciones reales.
    </div>

    <div class="kpis-grid">
      <div class="kpi-detalle" v-for="(k, i) in kpis" :key="i">
        <div class="cabecera-kpi">
          <h2>{{ k.nombre }}</h2>
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
import { onMounted, ref, computed } from 'vue'
import { inject } from 'vue'
import { estadisticasService } from '@/services'

import Alerta from '@/components/Alerta.vue'

const auth = inject('auth')

const cargando = ref(true)
const error = ref(null)
const exitoMensaje = ref(null)
const kpis = ref([])

const modoDesarrollo = computed(() => auth && auth.simulado)

onMounted(async () => {
  try {
    const r = await estadisticasService.resumen()
    if (r.exito) {
      const d = r.datos
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
  } finally {
    cargando.value = false
  }
})

const estadoClase = (k) => (k.estadoTexto === 'Cumplido' ? 'badge-activo' : 'badge-cancelada')
const valorClase = (k) => (k.estadoTexto === 'Cumplido' ? 'cumplido' : 'no-cumplido')
</script>

<style scoped>
.estadisticas { max-width: 1000px; margin: 0 auto; padding: 0 20px; }
.encabezado { margin-bottom: 26px; }
.encabezado h1 { font-size: 1.75rem; margin: 0 0 6px 0; color: var(--color-verde-oscuro); }
.encabezado p { margin: 0; color: var(--color-texto-suave); }

.kpis-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }

.kpi-detalle {
  background: var(--color-blanco);
  border: 1px solid var(--color-borde);
  border-radius: 10px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.cabecera-kpi { display: flex; align-items: center; justify-content: space-between; padding-bottom: 10px; border-bottom: 1px solid var(--color-borde); }
.cabecera-kpi h2 { font-size: 1.1rem; margin: 0; color: var(--color-verde-oscuro); }
.valor-contenedor { display: flex; flex-direction: column; gap: 4px; }
.valor-grande { font-size: 2rem; font-weight: 800; }
.valor-grande.cumplido { color: var(--color-verde); }
.valor-grande.no-cumplido { color: var(--color-error); }
.meta { font-size: 0.85rem; color: var(--color-texto-suave); }

.tabla-ficha { width: 100%; font-size: 0.85rem; border-collapse: collapse; }
.tabla-ficha td { padding: 6px 0; border-bottom: 1px solid #F2EEE0; vertical-align: top; }
.tabla-ficha td:first-child { font-weight: 700; color: var(--color-texto-suave); width: 38%; }
.tabla-ficha tr:last-child td { border-bottom: none; }

.nota { margin-top: 8px; font-size: 0.85rem; color: var(--color-texto-suave); padding: 8px 12px; background: var(--color-gris-claro); border-radius: 6px; }

.resumen-nota { margin-top: 22px; font-size: 0.9rem; color: var(--color-texto-suave); background: #FBF0DC; border: 1px solid #E8C98E; border-radius: 6px; padding: 14px 16px; }

.modo-aviso {
  background: #FBF0DC;
  border: 1px solid #E8C98E;
  border-radius: 6px;
  padding: 12px 16px;
  font-size: 0.9rem;
  color: #7A4F00;
  margin-bottom: 16px;
}

@media (max-width: 600px) {
  .kpis-grid { grid-template-columns: 1fr; }
}
</style>
