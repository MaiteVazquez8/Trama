<template>
  <div class="tareas">
    <VistaEncabezado titulo="Tareas" subtitulo="Organización del trabajo cotidiano">
      <template #accion>
        <button class="btn btn-primary" @click="irNueva">Nueva tarea</button>
      </template>
    </VistaEncabezado>

    <Alerta v-if="error" tipo="error" :mensaje="error" />
    <Alerta v-if="exito" tipo="exito" :mensaje="exito" :duracion="4000" />

    <div class="modo-aviso" v-if="modoDesarrollo">
      Modo desarrollo: estas tareas son <strong>ficticias (de prueba)</strong>.
    </div>

    <div class="estadisticas-fila">
      <TarjetaStat :texto="`${contarPorEstado('pendiente')} pendientes`" />
      <TarjetaStat :texto="`${contarPorEstado('completada')} completadas`" />
      <TarjetaStat :texto="`${contarPorEstado('cancelada')} canceladas`" />
    </div>

    <div class="contenido-doble tarjetas-superiores">
      <div class="card">
        <h2>Prioridades</h2>
        <ul class="prioridades-lista">
          <li v-for="t in prioridades" :key="t.id">
            {{ t.titulo }} <span class="prioridad-fecha">· {{ vencimiento(t.fecha) }}</span>
          </li>
          <li v-if="prioridades.length === 0" class="prioridad-fecha">No hay tareas pendientes.</li>
        </ul>
      </div>

      <TarjetaDatos titulo="Trabajo organizado">
        <p v-for="t in trabajoOrganizado" :key="t.id" class="item-datos">
          <strong>{{ estadoLegible(t.estado) }}</strong> {{ t.titulo }}
        </p>
        <p v-if="trabajoOrganizado.length === 0" class="item-datos">Todavía no hay tareas cargadas.</p>
      </TarjetaDatos>
    </div>

    <div class="card filtros-card">
      <div class="filtros">
        <div class="filtro">
          <label class="etiqueta">Comisión</label>
          <select v-model="filtro.comision" class="entrada">
            <option value="">Todas</option>
            <option v-for="c in comisiones" :key="c.id" :value="c.id">{{ c.nombre }}</option>
          </select>
        </div>
        <div class="filtro">
          <label class="etiqueta">Estado</label>
          <select v-model="filtro.estado" class="entrada">
            <option value="">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="completada">Completada</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
        <div class="filtro">
          <label class="etiqueta">Responsable</label>
          <select v-model="filtro.responsable" class="entrada">
            <option value="">Todos</option>
            <option v-for="p in perfilesIntegrantes" :key="p.id" :value="p.id">{{ p.nombre }}</option>
          </select>
        </div>
        <button class="btn btn-outline btn-sm" @click="limpiar">Limpiar filtros</button>
      </div>

      <div v-if="cargando" class="cargando">Cargando tareas…</div>

      <div v-else-if="tareasFiltradas.length === 0" class="vacio">
        <p>No se encontraron tareas con los filtros aplicados.</p>
        <button class="btn btn-primary" @click="limpiar">Ver todas las tareas</button>
      </div>

      <div v-else class="table-container">
        <table class="tabla">
          <thead>
            <tr>
              <th>Título</th>
              <th>Comisión</th>
              <th>Responsable</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th class="acciones-col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in tareasFiltradas" :key="t.id">
              <td>{{ t.titulo }}</td>
              <td>{{ nombreComision(t.comision) }}</td>
              <td>{{ nombreResponsable(t.responsable) }}</td>
              <td>{{ formatearFecha(t.fecha) }}</td>
              <td><span class="badge" :class="claseEstado(t.estado)">{{ t.estado }}</span></td>
              <td class="acciones-col">
                <button class="btn btn-outline btn-sm" @click="editar(t)">Editar</button>
                <button v-if="t.estado === 'pendiente'" class="btn btn-primary btn-sm" @click="completar(t)">Completar</button>
                <button v-else-if="t.estado === 'completada'" class="btn btn-outline btn-sm" @click="reabrir(t)">Reabrir</button>
                <button v-if="t.estado !== 'cancelada'" class="btn btn-danger btn-sm" @click="cancelarTarea(t)">Cancelar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { tareasService, comisionesService, perfilesService } from '@/services'

import Alerta from '@/components/Alerta.vue'
import VistaEncabezado from '@/components/VistaEncabezado.vue'
import TarjetaStat from '@/components/TarjetaStat.vue'
import TarjetaDatos from '@/components/TarjetaDatos.vue'

const auth = inject('auth')
const router = useRouter()

const modoDesarrollo = computed(() => auth && auth.simulado)

const cargando = ref(true)
const error = ref(null)
const exito = ref(null)

const filtro = ref({ comision: '', estado: '', responsable: '' })
const tareas = ref([])
const comisiones = ref([])
const perfiles = ref([])

const perfilesIntegrantes = computed(() =>
  perfiles.value.filter((p) => p.rol === 'integrante')
)

const tareasFiltradas = computed(() => {
  let lista = tareas.value
  if (filtro.value.comision) lista = lista.filter((t) => t.comision === filtro.value.comision)
  if (filtro.value.estado) lista = lista.filter((t) => t.estado === filtro.value.estado)
  if (filtro.value.responsable) lista = lista.filter((t) => t.responsable === filtro.value.responsable)
  return lista.slice().sort((a, b) => (a.fecha < b.fecha ? -1 : 1))
})

const contarPorEstado = (estado) => tareas.value.filter((t) => t.estado === estado).length

const prioridades = computed(() =>
  tareas.value
    .filter((t) => t.estado === 'pendiente')
    .slice()
    .sort((a, b) => (a.fecha < b.fecha ? -1 : 1))
    .slice(0, 3)
)

const trabajoOrganizado = computed(() =>
  tareas.value
    .slice()
    .sort((a, b) => ((a.creadoEn || '') < (b.creadoEn || '') ? 1 : -1))
    .slice(0, 3)
)

onMounted(cargarDatos)

async function cargarDatos() {
  cargando.value = true
  error.value = null
  try {
    const [rTareas, rComisiones, rPerfiles] = await Promise.all([
      tareasService.listar(),
      comisionesService.listar(),
      perfilesService.listar(),
    ])
    if (rTareas.exito) tareas.value = rTareas.data || []
    else error.value = rTareas.error?.message || 'No se pudieron cargar las tareas.'
    if (rComisiones.exito) comisiones.value = rComisiones.data || []
    if (rPerfiles.exito) perfiles.value = rPerfiles.data || []
  } catch (e) {
    error.value = 'Error de conexión al cargar las tareas.'
  } finally {
    cargando.value = false
  }
}

function limpiar() { filtro.value = { comision: '', estado: '', responsable: '' } }

function formatearFecha(iso) {
  if (!iso) return ''
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-AR')
}

function vencimiento(iso) {
  if (!iso) return 'sin fecha'
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const fecha = new Date(iso + 'T00:00:00')
  const diff = Math.round((fecha - hoy) / 86400000)
  if (diff < 0) return 'vencida'
  if (diff === 0) return 'vence hoy'
  if (diff === 1) return 'vence mañana'
  return `vence el ${formatearFecha(iso)}`
}

function estadoLegible(estado) {
  return { pendiente: 'Pendiente', completada: 'Completada', cancelada: 'Cancelada' }[estado] || estado
}

function nombreComision(id) {
  const c = comisiones.value.find((x) => x.id === id)
  return c ? c.nombre : '—'
}

function nombreResponsable(id) {
  const p = perfiles.value.find((x) => x.id === id)
  return p ? p.nombre : '—'
}

function claseEstado(estado) {
  return { pendiente: 'badge-pendiente', completada: 'badge-activo', cancelada: 'badge-cancelada' }[estado] || 'badge-pendiente'
}

function irNueva() { router.push({ name: 'tarea-nuevo' }) }
function editar(t) { router.push({ name: 'tarea-editar', params: { id: t.id } }) }

async function completar(t) {
  const r = await tareasService.actualizar(t.id, { estado: 'completada' })
  if (r.exito) {
    t.estado = 'completada'
    exito.value = 'Tarea marcada como completada.'
  } else {
    error.value = r.error?.message || 'No se pudo completar la tarea.'
  }
}

async function reabrir(t) {
  const r = await tareasService.actualizar(t.id, { estado: 'pendiente' })
  if (r.exito) {
    t.estado = 'pendiente'
    exito.value = 'Tarea reabierta.'
  } else {
    error.value = r.error?.message || 'No se pudo reabrir la tarea.'
  }
}

async function cancelarTarea(t) {
  if (!confirm(`¿Confirmás cancelar la tarea "${t.titulo}"? Se mantendrá como cancelada para conservar el historial.`)) return
  const r = await tareasService.cancelar(t.id, 'Cancelada desde el listado de tareas')
  if (r.exito) {
    t.estado = 'cancelada'
    exito.value = 'Tarea cancelada.'
  } else {
    error.value = r.error?.message || 'No se pudo cancelar la tarea.'
  }
}
</script>

<style scoped>
.tareas { width: 100%; }

.tarjetas-superiores { margin-bottom: 16px; }
.tarjetas-superiores h2 { font-size: 1.05rem; margin-bottom: 8px; }

.prioridades-lista { display: flex; flex-direction: column; gap: 8px; font-size: 0.9rem; }
.prioridades-lista li { border-top: 1px solid var(--borde); padding-top: 8px; }
.prioridades-lista li:first-child { border-top: none; padding-top: 0; }
.prioridad-fecha { color: var(--texto-suave); font-size: 0.8rem; }

.filtros-card { padding: 18px 20px; }
.filtros { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; align-items: end; margin-bottom: 16px; }
.filtro { display: flex; flex-direction: column; gap: 6px; }
.etiqueta { font-size: 0.8rem; font-weight: 800; color: var(--texto-suave); }
.entrada { padding: 9px 12px; border: 1px solid var(--borde); border-radius: var(--radio-campo); font-size: 0.92rem; background: var(--fondo-tarjeta); color: var(--texto); }

.cargando { text-align: center; padding: 24px; color: var(--texto-suave); font-size: 0.95rem; }

.acciones-col { white-space: nowrap; }
.acciones-col .btn { margin-bottom: 6px; width: 100%; }

@media (max-width: 700px) {
  .acciones-col .btn { width: auto; margin-bottom: 4px; }
}
</style>
