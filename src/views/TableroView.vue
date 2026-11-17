<template>
  <div class="tablero">
    <VistaEncabezado
      titulo="Tablero de seguimiento"
      subtitulo="Desempeño de Trama por período · Administración y comisiones de Organización y Registro"
    >
      <template #accion>
        <router-link class="btn btn-secondary" :to="{ name: 'informe' }">Ver informe</router-link>
        <button class="btn btn-primary" :disabled="cargando" @click="actualizar">
          {{ cargando ? 'Actualizando…' : 'Actualizar' }}
        </button>
      </template>
    </VistaEncabezado>

    <Alerta v-if="error" tipo="error" :mensaje="error" />
    <div class="modo-aviso" v-if="datos && datos.simulado">
      Modo desarrollo: los datos que alimentan el tablero son <strong>ficticios (de prueba)</strong>.
    </div>

    <!-- Segunda puerta: audiencia del tablero -->
    <div v-if="!accesoPermitido" class="card aviso-acceso">
      <h2>Acceso restringido</h2>
      <p>
        El tablero está pensado para los responsables de seguimiento del proyecto:
        administración y las comisiones de <strong>Organización</strong> y <strong>Registro</strong>.
        Si sos integrante de otra comisión, el informe de tu comisión sigue estando en «Estadísticas».
      </p>
      <router-link class="btn btn-primary" :to="{ name: 'panel' }">Volver al panel</router-link>
    </div>

    <div v-else>
      <div class="tablero-controles">
        <PeriodoSelector
          v-if="datos"
          id="tablero-periodo"
          v-model="periodo"
          :meses="datos.periodosDisponibles"
          @update:modelValue="cargar"
        />
        <p class="actualizacion" v-if="datos">
          Última actualización: <strong>{{ formatearActualizacion(datos.actualizadoEn) }}</strong>.
          Los datos se actualizan al ingresar y con «Actualizar»; no es tiempo real.
        </p>
      </div>

      <!-- Estado: cargando -->
      <div v-if="cargando && !datos" class="tarjetas-carga">
        <div class="skeleton" v-for="i in 4" :key="i"></div>
      </div>

      <template v-if="datos">
        <!-- Estado: sin registros en el período -->
        <div v-if="sinRegistros" class="card estado-vacio">
          <h2>Sin registros para este período</h2>
          <p>
            No hay registros de residuos, tareas ni actividades cargados para
            <strong>{{ datos.nombrePeriodo }}</strong>. El tablero mostrará valores cuando existan
            datos cargados en el sistema; los indicadores sin denominador se informan como
            <strong>No calculable</strong>, no como 0 %.
          </p>
        </div>

        <!-- KPI -->
        <section aria-label="Indicadores" class="kpis-tablero">
          <KpiCard
            v-for="kpi in datos.kpis"
            :key="kpi.id"
            :nombre="kpi.nombre"
            :valor="kpi.resultadoFormateado"
            :unidad="kpi.unidad"
            :meta="kpi.meta"
            :cumplido="kpi.cumplido"
            :categoria="kpi.categoria"
            :periodo="kpi.periodo"
            :prioritario="kpi.prioritario"
            :calculable="kpi.calculable"
            :detalle="kpi.detalle"
          />
        </section>
        <p class="nota-prioritarios">
          Los dos indicadores <strong>prioritarios</strong> del proyecto son
          <strong>Kilogramos recuperados</strong> y <strong>Separación correcta</strong>; están
          destacados con marco verde.
        </p>

        <!-- Gráficos -->
        <div class="graficos-doble">
          <div class="card grafico-card">
            <BarrasChart
              :datos="datos.barrasMateriales"
              :periodo="datos.nombrePeriodo"
              titulo="Visualización 1 · Materiales recuperados"
            />
          </div>
          <div class="card grafico-card">
            <DonaChart
              :correctos="datos.donaSeparacion.correctos"
              :incorrectos="datos.donaSeparacion.incorrectos"
              :periodo="datos.nombrePeriodo"
              titulo="Visualización 2 · Separación correcta"
            />
          </div>
        </div>
        <div class="card grafico-card grafico-lineas">
          <LineasChart
            :datos="datos.lineasTareas"
            :periodo="'Últimos 6 meses'"
            :mes-seleccionado="datos.esTodos ? '' : datos.periodo"
            titulo="Visualización 3 · Cumplimiento de tareas"
          />
        </div>

        <!-- Tablas del período -->
        <div class="contenido-doble tablas-periodo">
          <div class="card tabla-card">
            <h2>Registros del período</h2>
            <p v-if="datos.registrosPeriodo.length === 0" class="tabla-vacia">
              Sin registros de residuos cargados en {{ datos.nombrePeriodo }}.
            </p>
            <table v-else class="tabla-ficha tabla-scroll">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Lugar</th>
                  <th>Kg</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in datos.registrosPeriodo.slice(0, 10)" :key="r.id">
                  <td>{{ formatearFecha(r.fecha) }}</td>
                  <td>{{ tipoNombre(r.tipoResiduo) }}</td>
                  <td>{{ r.lugar }}</td>
                  <td class="celda-numero">{{ Number(r.cantidadKg).toFixed(1) }}</td>
                </tr>
              </tbody>
            </table>
            <p v-if="datos.registrosPeriodo.length > 10" class="tabla-nota">
              Mostrando los 10 registros más recientes de {{ datos.registrosPeriodo.length }}.
            </p>
          </div>

          <div class="card tabla-card">
            <h2>Tareas del período</h2>
            <p v-if="datos.tareasPeriodo.length === 0" class="tabla-vacia">
              Sin tareas programadas en {{ datos.nombrePeriodo }}.
            </p>
            <table v-else class="tabla-ficha tabla-scroll">
              <thead>
                <tr>
                  <th>Vence</th>
                  <th>Tarea</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="t in datos.tareasPeriodo.slice(0, 10)" :key="t.id">
                  <td>{{ formatearFecha(t.fecha) }}</td>
                  <td>{{ t.titulo }}</td>
                  <td><span class="badge" :class="claseEstadoTarea(t.estado)">{{ t.estado }}</span></td>
                </tr>
              </tbody>
            </table>
            <p v-if="datos.tareasPeriodo.length > 10" class="tabla-nota">
              Mostrando 10 de {{ datos.tareasPeriodo.length }} tareas.
            </p>
          </div>
        </div>
      </template>

      <!-- Estado: error con reintento -->
      <div v-if="error && !datos" class="card estado-error">
        <h2>No se pudieron cargar los datos</h2>
        <p>{{ error }}</p>
        <button class="btn btn-primary" @click="actualizar">Reintentar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, inject } from 'vue'
import { cargarDatosPeriodo, mesActualClave } from '@/services/kpi'

import Alerta from '@/components/Alerta.vue'
import KpiCard from '@/components/KpiCard.vue'
import VistaEncabezado from '@/components/VistaEncabezado.vue'
import BarrasChart from '@/components/charts/BarrasChart.vue'
import DonaChart from '@/components/charts/DonaChart.vue'
import LineasChart from '@/components/charts/LineasChart.vue'
import PeriodoSelector from '@/components/PeriodoSelector.vue'

const auth = inject('auth')

const COMISIONES_SEGUIMIENTO = ['com-1', 'com-4'] // Organización y Registro

const datos = ref(null)
const error = ref(null)
const cargando = ref(false)
const periodo = ref(mesActualClave())

const accesoPermitido = computed(() => {
  const u = auth && auth.usuario
  if (!u) return false
  if (u.rol === 'administrador') return true
  return COMISIONES_SEGUIMIENTO.includes(u.comision)
})

const sinRegistros = computed(() => {
  if (!datos.value) return false
  return datos.value.registrosPeriodo.length === 0
    && datos.value.tareasPeriodo.length === 0
    && datos.value.actividadesPeriodo.length === 0
})

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
      error.value = r.error || 'No se pudieron cargar los datos.'
      datos.value = null
    }
  } catch (e) {
    error.value = 'Error de conexión al cargar el tablero.'
    datos.value = null
  } finally {
    cargando.value = false
  }
}

function actualizar() {
  cargar(periodo.value)
}

function formatearFecha(iso) {
  if (!iso) return '—'
  const d = new Date(`${String(iso).slice(0, 10)}T00:00:00`)
  return d.toLocaleDateString('es-AR')
}

function formatearActualizacion(fecha) {
  if (!fecha) return '—'
  const d = fecha instanceof Date ? fecha : new Date(fecha)
  return d.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
}

function tipoNombre(id) {
  const t = datos.value && datos.value.tipos.find((x) => x.id === id)
  return t ? t.nombre : id
}

function claseEstadoTarea(estado) {
  if (estado === 'completada') return 'badge-activo'
  if (estado === 'cancelada') return 'badge-cancelada'
  return 'badge-pendiente'
}
</script>

<style scoped>
.tablero { width: 100%; }

.tablero-controles { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; margin: 4px 0 14px 0; }
.actualizacion { font-size: 0.82rem; color: var(--texto-suave); }

.kpis-tablero { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 14px; }
.nota-prioritarios { margin: 10px 0 4px 0; font-size: 0.82rem; color: var(--texto-suave); }

.graficos-doble { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 14px; margin: 14px 0; }
.grafico-card h2 { font-size: 1rem; margin-bottom: 8px; }
.grafico-lineas { margin-bottom: 16px; }

.tablas-periodo { gap: 14px; }
.tabla-card h2 { font-size: 1rem; margin-bottom: 8px; }
.tabla-scroll { font-size: 0.82rem; }
.tabla-scroll th { text-align: left; padding: 6px 8px; border-bottom: 2px solid var(--borde-fuerte); font-size: 0.78rem; color: var(--texto-suave); text-transform: uppercase; letter-spacing: 0.04em; }
.tabla-scroll td { padding: 6px 8px; border-bottom: 1px solid var(--borde); vertical-align: middle; }
.tabla-vacia { color: var(--texto-suave); font-size: 0.88rem; padding: 12px 0; }
.tabla-nota { font-size: 0.74rem; color: var(--texto-suave); margin-top: 6px; }
.celda-numero { text-align: right; font-variant-numeric: tabular-nums; }

.tarjetas-carga { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 14px; }
.skeleton { height: 140px; border-radius: var(--radio-tarjeta); background: var(--fondo-encabezado-tabla); animation: pulso 1.3s ease-in-out infinite; }
@keyframes pulso { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }

.estado-vacio h2, .estado-error h2 { font-size: 1.05rem; margin-bottom: 8px; }
.estado-vacio p, .estado-error p { color: var(--texto-suave); font-size: 0.9rem; margin-bottom: 10px; }
.aviso-acceso h2 { margin-bottom: 8px; }
.aviso-acceso p { color: var(--texto-suave); margin-bottom: 12px; }

@media (max-width: 560px) {
  .tablero-controles { flex-direction: column; align-items: stretch; }
}
</style>
