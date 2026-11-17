<template>
  <div class="informe">
    <!-- Segunda puerta: audiencia del informe -->
    <div v-if="!accesoPermitido" class="card aviso-acceso">
      <h2>Acceso restringido</h2>
      <p>
        El informe de seguimiento está destinado a los responsables de seguimiento del proyecto:
        administración y las comisiones de <strong>Organización</strong> y <strong>Registro</strong>.
      </p>
      <router-link class="btn btn-primary" :to="{ name: 'panel' }">Volver al panel</router-link>
    </div>

    <template v-else>
    <VistaEncabezado
      titulo="Informe de seguimiento"
      subtitulo="Desempeño de Trama en un período seleccionable · Para imprimir o guardar como PDF"
    >
      <template #accion>
        <PeriodoSelector
          id="informe-periodo"
          v-model="periodo"
          :meses="datos ? datos.periodosDisponibles : [periodo]"
          class="no-print"
          @update:modelValue="cargar"
        />
        <button class="btn btn-primary no-print" :disabled="cargando || !datos" @click="imprimir">
          Imprimir / Guardar PDF
        </button>
      </template>
    </VistaEncabezado>

    <Alerta v-if="error" tipo="error" :mensaje="error" />

    <div class="banner-simulado" v-if="datos && datos.simulado" role="note">
      IMPORTANTE — DATOS SIMULADOS: este informe fue generado con datos ficticios de prueba
      (modo desarrollo). No representa mediciones reales de la escuela.
    </div>

    <div class="card estado-carga" v-if="cargando && !datos">
      <p>Cargando el informe del período seleccionado…</p>
    </div>
    <div class="card estado-error" v-if="error && !datos">
      <h2>No se pudo generar el informe</h2>
      <p>{{ error }}</p>
      <button class="btn btn-primary" @click="cargar(periodo)">Reintentar</button>
    </div>

    <!-- Documento imprimible -->
    <article v-if="datos" class="informe-documento">
      <header class="informe-portada">
        <p class="informe-proyecto">Trama — Cooperativa escolar para la separación y gestión responsable de residuos</p>
        <h1>Informe de seguimiento</h1>
        <dl class="informe-meta">
          <div><dt>Propósito</dt><dd>Evaluar, con evidencia del período seleccionado, el desempeño del proyecto frente a sus objetivos SMART.</dd></div>
          <div><dt>Destinatarios</dt><dd>Administración, coordinación del proyecto y comisiones de Organización y Registro. Disponible además para toda la comunidad educativa.</dd></div>
          <div><dt>Período</dt><dd>{{ datos.nombrePeriodo }}</dd></div>
          <div><dt>Fecha de generación</dt><dd>{{ formatearFechaLarga(fechaGeneracion) }}</dd></div>
        </dl>
        <p v-if="datos.simulado" class="informe-simulado">
          Los valores de este informe provienen de datos SIMULADOS (modo desarrollo, sin Supabase
          configurado). Ninguna cifra aquí contenida representa una medición real de la escuela.
        </p>
        <p v-else class="informe-real">
          Datos tomados de los registros reales del sistema (Supabase).
        </p>
      </header>

      <section>
        <h2>1. Objetivos de seguimiento</h2>
        <p>El informe evalúa el cumplimiento de los cuatro indicadores definidos para el proyecto, vinculados con los objetivos SMART de Trama:</p>
        <ul>
          <li><strong>Objetivo 1 (separación):</strong> lograr que al menos el 80 % de los residuos depositados en los recipientes señalizados estén correctamente separados al finalizar el período.</li>
          <li><strong>Objetivo 2 (recuperación):</strong> recolectar y clasificar correctamente al menos 20 kg de materiales reciclables por mes.</li>
          <li><strong>Objetivo 3 (participación):</strong> lograr que al menos el 70 % de los estudiantes de los cursos seleccionados participe en alguna actividad del proyecto.</li>
          <li><strong>Procesos:</strong> cumplir al menos el 90 % de las tareas programadas dentro del período.</li>
        </ul>
      </section>

      <section>
        <h2>2. Fuentes de información</h2>
        <p>Este informe se genera exclusivamente con los datos registrados en el sistema:</p>
        <ul>
          <li>Registros de residuos recolectados (comisión de Registro): tipo, cantidad, lugar, fecha y estado.</li>
          <li>Tareas programadas y su estado (comisión de Organización): pendientes, en curso, completadas o canceladas.</li>
          <li>Actividades de concientización y recolección (comisión de Concientización): tipo, fecha y participantes.</li>
          <li>Entregas a la cooperativa externa: peso, materiales y comprobantes.</li>
        </ul>
        <p>Las fuentes no incluyen encuestas en este período ni auditorías externas; la interpretación se limita a los datos disponibles.</p>
      </section>

      <section>
        <h2>3. Indicadores (KPI), metas y resultados</h2>
        <table class="kpi-tabla">
          <thead>
            <tr>
              <th>Indicador</th>
              <th>Meta</th>
              <th>Resultado</th>
              <th>Estado</th>
              <th>Prioridad</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="kpi in datos.kpis" :key="kpi.id" :class="{ 'fila-prioritario': kpi.prioritario }">
              <td>{{ kpi.nombre }}</td>
              <td>{{ kpi.meta }}</td>
              <td>{{ kpi.resultadoFormateado }}<span v-if="kpi.detalle" class="detalle-celda">{{ kpi.detalle }}</span></td>
              <td>{{ textoEstado(kpi) }}</td>
              <td>{{ kpi.prioritario ? 'Prioritario' : '—' }}</td>
            </tr>
          </tbody>
        </table>
        <p class="nota-tabla">«No calculable» indica que el denominador del indicador fue cero: no se asigna 0 % ni se compara contra la meta.</p>
      </section>

      <section>
        <h2>4. Datos del período</h2>
        <table class="kpi-tabla">
          <tbody>
            <tr><th scope="row">Registros de residuos activos</th><td>{{ datos.registrosPeriodo.length }}</td></tr>
            <tr><th scope="row">Materiales recuperados (reciclables)</th><td>{{ formatearKg(kgReciclables) }} kg</td></tr>
            <tr v-for="barra in datos.barrasMateriales" :key="barra.id">
              <th scope="row">· {{ barra.material }}</th><td>{{ formatearKg(barra.kg) }} kg</td>
            </tr>
            <tr><th scope="row">Tareas programadas (sin canceladas)</th><td>{{ kpiPorId('tareas').detalle }}</td></tr>
            <tr><th scope="row">Actividades del período</th><td>{{ datos.actividadesPeriodo.length }} · {{ participacionAcumulada }} participaciones</td></tr>
            <tr><th scope="row">Entregas completadas a la cooperativa externa</th><td>{{ entregasConfirmadas }} · {{ formatearKg(datos.kgEntregados) }} kg</td></tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>5. Gráficos</h2>
        <p>Los siguientes gráficos son los mismos que utiliza el tablero de seguimiento (sección 7.9 del informe), filtrados por el período seleccionado.</p>
        <figure class="informe-grafico">
          <BarrasChart :datos="datos.barrasMateriales" :periodo="datos.nombrePeriodo" titulo="Materiales recuperados por tipo" />
        </figure>
        <figure class="informe-grafico">
          <DonaChart
            :correctos="datos.donaSeparacion.correctos"
            :incorrectos="datos.donaSeparacion.incorrectos"
            :periodo="datos.nombrePeriodo"
            titulo="Residuos correctamente separados"
          />
        </figure>
      </section>

      <section>
        <h2>6. Interpretación de los resultados</h2>
        <p v-for="(p, i) in interpretacion" :key="i">{{ p }}</p>
        <p v-if="datos.simulado" class="interpretacion-aviso">
          <strong>Límites de esta interpretación:</strong> los datos son simulados (modo desarrollo) y
          corresponden a un solo período. No permiten sostener causas, tendencias definitivas ni
          comparar con períodos previos reales; solo describen el período evaluado y orientan las
          decisiones del próximo ciclo.
        </p>
      </section>

      <section>
        <h2>7. Dificultades y aspectos que requieren atención</h2>
        <ul>
          <li v-for="(d, i) in dificultades" :key="i">{{ d }}</li>
        </ul>
      </section>

      <section>
        <h2>8. Propuestas de mejora</h2>
        <ul>
          <li v-for="(m, i) in mejoras" :key="i">{{ m }}</li>
        </ul>
        <p class="pie-doc">
          Las propuestas de mejora aplican el mismo criterio que la sección 7.8 del informe: partir del
          resultado observado, asignar un responsable y volver a medir al finalizar el próximo mes.
        </p>
      </section>

      <footer class="informe-pie">
        <p>Trama — Cooperativa escolar · E.E.S. Técnica N.° 1 «Esteban Echeverría» · Organización y métodos</p>
        <p v-if="datos.simulado">Documento generado con datos simulados. No válido como rendición real de gestión.</p>
        <p v-else>Documento generado con datos reales del sistema.</p>
      </footer>
    </article>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, inject } from 'vue'
import { cargarDatosPeriodo, mesActualClave } from '@/services/kpi'

import Alerta from '@/components/Alerta.vue'
import VistaEncabezado from '@/components/VistaEncabezado.vue'
import PeriodoSelector from '@/components/PeriodoSelector.vue'
import BarrasChart from '@/components/charts/BarrasChart.vue'
import DonaChart from '@/components/charts/DonaChart.vue'

const auth = inject('auth')

const COMISIONES_SEGUIMIENTO = ['com-1', 'com-4'] // Organización y Registro

const accesoPermitido = computed(() => {
  const u = auth && auth.usuario
  if (!u) return false
  if (u.rol === 'administrador') return true
  return COMISIONES_SEGUIMIENTO.includes(u.comision)
})

const datos = ref(null)
const error = ref(null)
const cargando = ref(false)
const periodo = ref(mesActualClave())
const fechaGeneracion = new Date()

const kgReciclables = computed(() => datos.value ? datos.value.barrasMateriales.reduce((s, b) => s + Number(b.kg || 0), 0) : 0)
const participacionAcumulada = computed(() => datos.value ? datos.value.actividadesPeriodo.reduce((s, a) => s + Number(a.participantes || 0), 0) : 0)
const entregasConfirmadas = computed(() => datos.value ? datos.value.entregas.filter((e) => e.estado === 'completada').length : 0)

onMounted(() => { if (accesoPermitido.value) cargar(periodo.value) })

async function cargar(valor) {
  periodo.value = valor
  cargando.value = true
  error.value = null
  try {
    const r = await cargarDatosPeriodo(valor)
    if (r.exito) {
      datos.value = r
    } else {
      error.value = r.error || 'No se pudieron cargar los datos del informe.'
      datos.value = null
    }
  } catch (e) {
    error.value = 'Error de conexión al generar el informe.'
    datos.value = null
  } finally {
    cargando.value = false
  }
}

const kpiPorId = (id) => datos.value?.kpis.find((k) => k.id === id) || {}

const cumplidos = computed(() => datos.value ? datos.value.kpis.filter((k) => k.cumplido).length : 0)
const calculables = computed(() => datos.value ? datos.value.kpis.filter((k) => k.calculable).length : 0)
const noCalculables = computed(() => datos.value ? datos.value.kpis.filter((k) => !k.calculable).map((k) => k.nombre) : [])

const interpretacion = computed(() => {
  const ds = datos.value
  if (!ds) return []
  const parrafos = []
  const [kg, sep, tar, part] = ds.kpis

  if (calculables.value > 0) {
    const n = calculables.value - cumplidos.value
    const phrase = cumplidos.value === 1
      ? '1 cumple su meta'
      : `${cumplidos.value} cumplen su meta`
    const rest = n === 0
      ? '.'
      : ` y ${n === 1 ? '1 queda pendiente' : `${n} quedan pendientes`}. Las metas pendientes concentran el foco de la próxima etapa (sección 8) y no deben leerse como un fracaso del proyecto sino como la señal de dónde actuar primero.`
    parrafos.push(`De los ${calculables.value} indicadores calculables en el período, ${phrase}${rest}`)
  } else {
    parrafos.push('Ningún indicador resulta calculable en el período: el sistema no registró actividad suficiente. Antes de interpretar resultados, corresponde cargar datos fiables.')
  }

  if (kg.calculable) {
    parrafos.push(`Recuperación de materiales: ${kg.resultadoFormateado} frente a la meta de ≥ ${kg.metaValor} kg por mes${ds.esTodos ? ' (promedio mensual del período agregado)' : ''}. ${kg.cumplido ? 'Se supera la meta, lo que indica que la escuela está clasificando y pesando material efectivamente recuperable.' : 'No se alcanza la meta; puede deberse a menor volumen recolectado, registros incompletos o materiales no contabilizados como recuperables.'}`)
  }

  const mejorMaterial = ds.barrasMateriales[0]
  if (mejorMaterial) {
    parrafos.push(`El material con mayor peso recuperado en el período es ${mejorMaterial.material.toLowerCase()}, con ${formatearKg(mejorMaterial.kg)} kg. Esta lectura ayuda a dimensionar la capacidad de los tachos y la frecuencia de retiro de la cooperativa externa.`)
  } else if (kg.calculable) {
    parrafos.push('No se registró material reciclable en el período: solo residuos comunes. Revisar la separación en origen y el alcance del registro.')
  }

  if (sep.calculable) {
    parrafos.push(`Separación correcta: ${sep.resultadoFormateado} (${ds.donaSeparacion.correctos} de ${ds.donaSeparacion.total} registros correctos) frente a la meta de ≥ ${sep.metaValor} %. ${sep.cumplido ? 'La comunidad ya usa mayoritariamente bien los recipientes.' : 'Los registros todavía muestran errores que contaminan el resto de los materiales; el desvío es compatible con cartelería poco clara, tachos llenos o hábitos en formación.'}`)
  }

  if (tar.calculable) {
    const tendencia = ds.lineasTareas.filter((l) => l.porcentaje != null)
    let patron = ''
    if (tendencia.length >= 2) {
      const ultimo = tendencia[tendencia.length - 1].porcentaje
      const anterior = tendencia[tendencia.length - 2].porcentaje
      patron = ultimo < anterior
        ? ` La evolución reciente muestra una caída (${anterior} % → ${ultimo} %), que requiere intervención.`
        : ` La evolución reciente muestra una mejora (${anterior} % → ${ultimo} %).`
    }
    parrafos.push(`Cumplimiento de tareas: ${tar.resultadoFormateado} (${tar.detalle.toLowerCase()}) frente a la meta de ≥ ${tar.metaValor} %.${patron}`)
  }

  if (part.calculable) {
    parrafos.push(`Participación: ${part.resultadoFormateado} frente a la meta de ≥ ${part.metaValor} % (${part.detalle}). ${part.cumplido ? 'La campaña está logrando que la comunidad se involucre.' : 'La participación estudiantil es el indicador más asociado al hábito a largo plazo; conviene reforzar las actividades de concientización antes de evaluar expansión.'}`)
  } else {
    parrafos.push(`Participación: no calculable en período agregado. ${part.detalle}`)
  }

  if (noCalculables.value.length > 0) {
    parrafos.push(`Indicadores no calculables en el período (denominador cero): ${noCalculables.value.join(', ')}. No se asigna 0 %; se requiere completar registros antes de evaluar esas metas.`)
  }

  if (ds.simulado) {
    parrafos.push('Todos los números anteriores provienen de datos simulados de prueba. Sirven para validar el procedimiento de medición y la lectura del tablero, no para rendir cuentas de gestión ante la escuela.')
  }
  return parrafos
})

const dificultades = computed(() => {
  const ds = datos.value
  if (!ds) return []
  const lista = []
  const [kg, sep, tar, part] = ds.kpis

  if (tar.calculable && !tar.cumplido) {
    const linea = ds.lineasTareas.filter((l) => l.porcentaje != null).map((l) => `${l.porcentaje} %`)
    lista.push(`Cumplimiento de tareas por debajo de la meta (${tar.resultadoFormateado}).${linea.length >= 2 ? ` Evolución reciente: ${linea.join(' → ')}.` : ''} Revisar asignación de responsables y realismo de las fechas.`)
  }
  if (sep.calculable && !sep.cumplido) {
    lista.push(`Separación correcta del ${sep.resultadoFormateado}, por debajo del 80 %. Revisar cartelería con ejemplos frecuentes y realizar observación directa en los tachos del kiosco y el patio.`)
  }
  if (kg.calculable && !kg.cumplido) {
    lista.push('Recuperación por debajo de la meta mensual de 20 kg. Posibles causas: bajo volumen registrado, materiales reciclables reportados como comunes o pesajes no cargados.')
  }
  if (part.calculable && !part.cumplido) {
    lista.push(`Participación del ${part.resultadoFormateado} frente al objetivo del 70 %. Las actividades realizadas no alcanzan a involucrar al alumnado de los cursos seleccionados.`)
  }
  if (ds.registrosPeriodo.length > 0 && ds.registrosPeriodo.length < 10) {
    lista.push(`Muestra pequeña (${ds.registrosPeriodo.length} registros activos en el período): las conclusiones son frágiles; cada registro adicional pesa mucho en los porcentajes.`)
  }
  if (noCalculables.value.length > 0) {
    lista.push(`Sin datos suficientes para: ${noCalculables.value.join(', ')}.`)
  }
  if (lista.length === 0) {
    lista.push('Ninguna dificultad crítica detectada en el período; sostener el seguimiento para confirmar la tendencia.')
  }
  return lista
})

const mejoras = computed(() => {
  const ds = datos.value
  if (!ds) return []
  const lista = []
  const [kg, sep, tar, part] = ds.kpis

  if (sep.calculable && !sep.cumplido) {
    lista.push('Separación correcta: revisar señalización y cartelería con ejemplos del error más frecuente observado; campaña de 10 minutos por curso; volver a medir una semana después y al cierre del mes (acciones 1 y 2 de la sección 7.8 del informe). Comisión de Concientización con apoyo de las comisiones de Mantenimiento y Registro.')
  }
  if (part.calculable && !part.cumplido) {
    lista.push('Participación: organizar actividades breves de concientización en los recreos e invitar a los estudiantes a colaborar en tareas de clasificación y reutilización; medir al cierre del mes siguiente (acción 2 de la sección 7.8). Comisión de Concientización y Comisión de Organización.')
  }
  if (tar.calculable && !tar.cumplido) {
    lista.push('Tareas: revisar el cronograma —asignar una persona responsable y una fecha realista por tarea— y verificar semanalmente el cumplimiento con las planillas de seguimiento. Comisión de Organización con apoyo de Registro.')
  }
  if (kg.calculable && !kg.cumplido) {
    lista.push('Recuperación: acordar días fijos de recolección y un registro homogéneo de pesajes; verificar que los reciclables no se estén reportando como residuos comunes; consolidar la entrega con la cooperativa externa para que el peso sea efectivo. Comisión de Registro con apoyo de Vinculación.')
  }
  if (kg.calculable && kg.cumplido && sep.calculable && sep.cumplido) {
    lista.push('Sostén: mantener el esquema actual de recolección y revisión; documentar qué está funcionando (cartelería, horarios de recreo, referentes por curso) para replicarlo en la expansión a toda la escuela.')
  }
  if (lista.length === 0) {
    lista.push('No se proponen cambios de fondo; mantener el plan actual y revisar el tablero el mes próximo.')
  }
  return lista
})

function formatearKg(n) {
  return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(Number(n) || 0)
}

function formatearFechaLarga(fecha) {
  return fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
}

const textoEstado = (kpi) => {
  if (!kpi.calculable) return 'No calculable'
  return kpi.cumplido ? 'Cumplido' : 'Pendiente'
}

function imprimir() {
  window.print()
}
</script>

<style scoped>
.informe { width: 100%; }

.banner-simulado {
  margin: 6px 0 16px 0;
  padding: 12px 16px;
  border: 2px solid var(--aviso-borde);
  background: var(--aviso-fondo);
  color: var(--aviso-texto);
  font-weight: 800;
  font-size: 0.9rem;
  border-radius: var(--radio-campo);
}

.informe-documento {
  background: var(--fondo-tarjeta);
  border: 1px solid var(--borde);
  border-radius: var(--radio-tarjeta);
  padding: 26px 30px;
  color: var(--texto);
  font-size: 0.9rem;
  line-height: 1.5;
}
.informe-portada { border-bottom: 2px solid var(--color-verde); padding-bottom: 14px; margin-bottom: 16px; }
.informe-proyecto { font-size: 0.8rem; font-weight: 800; color: var(--color-verde); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
.informe-documento h1 { font-size: 1.55rem; margin-bottom: 12px; }
.informe-meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px 18px; }
.informe-meta div { background: var(--fondo-encabezado-tabla); border-radius: var(--radio-campo); padding: 8px 12px; }
.informe-meta dt { font-size: 0.72rem; font-weight: 800; text-transform: uppercase; color: var(--texto-suave); letter-spacing: 0.04em; }
.informe-meta dd { font-size: 0.84rem; margin: 0; }
.informe-simulado, .informe-real { font-size: 0.8rem; margin-top: 12px; font-weight: 700; color: var(--aviso-texto); }
.informe-real { color: var(--exito-texto); }

.informe-documento section { margin-bottom: 18px; }
.informe-documento h2 { font-size: 1.05rem; color: var(--color-verde-oscuro); border-bottom: 1px solid var(--borde); padding-bottom: 4px; margin-bottom: 8px; }
.informe-documento ul { padding-left: 20px; }
.informe-documento li { margin: 4px 0; }

.kpi-tabla { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
.kpi-tabla th, .kpi-tabla td { border: 1px solid var(--borde); padding: 7px 9px; vertical-align: top; text-align: left; }
.kpi-tabla thead th { background: var(--fondo-encabezado-tabla); text-transform: uppercase; font-size: 0.72rem; letter-spacing: 0.04em; color: var(--texto-suave); }
.fila-prioritario td:first-child::after { content: ' ★'; color: var(--color-verde); }
.detalle-celda { display: block; font-size: 0.72rem; color: var(--texto-suave); margin-top: 3px; font-weight: 400; }
.nota-tabla { font-size: 0.74rem; color: var(--texto-suave); margin-top: 6px; }
.informe-grafico { margin: 10px 0 16px 0; }
.interpretacion-aviso { background: var(--fondo-encabezado-tabla); border-radius: var(--radio-campo); padding: 8px 12px; font-size: 0.82rem; }
.pie-doc { font-size: 0.78rem; color: var(--texto-suave); margin-top: 8px; }
.informe-pie { border-top: 1px solid var(--borde); padding-top: 12px; font-size: 0.75rem; color: var(--texto-suave); }
.estado-carga p, .estado-error h2 { color: var(--texto-suave); }
.aviso-acceso h2 { margin-bottom: 8px; }
.aviso-acceso p { color: var(--texto-suave); margin-bottom: 12px; }

@media print {
  .informe-documento { border: none; border-radius: 0; padding: 0; font-size: 9pt; }
}
</style>
