<template>
  <div class="tareas">
    <div class="encabezado">
      <div>
        <h1>Tareas</h1>
        <p>Creá, asigná y consultá las tareas de las comisiones.</p>
      </div>
      <button class="btn btn-primary" @click="irNueva">+ Nueva tarea</button>
    </div>

    <Alerta v-if="error" tipo="error" :mensaje="error" />
    <Alerta v-if="exito" tipo="exito" :mensaje="exito" :duracion="4000" />

    <div class="modo-aviso" v-if="modoDesarrollo">
      ⚠️ Modo desarrollo: estas tareas son <strong>ficticias (de prueba)</strong>.
    </div>

    <div class="filtros">
      <div class="filtro">
        <label class="etiqueta">Comisión</label>
        <select v-model="filtro.comision" @change="aplicar" class="entrada">
          <option value="">Todas</option>
          <option v-for="c in comisiones" :key="c.id" :value="c.id">{{ c.nombre }}</option>
        </select>
      </div>
      <div class="filtro">
        <label class="etiqueta">Estado</label>
        <select v-model="filtro.estado" @change="aplicar" class="entrada">
          <option value="">Todos</option>
          <option value="pendiente">Pendiente</option>
          <option value="completada">Completada</option>
          <option value="cancelada">Cancelada</option>
        </select>
      </div>
      <div class="filtro">
        <label class="etiqueta">Responsable</label>
        <select v-model="filtro.responsable" @change="aplicar" class="entrada">
          <option value="">Todos</option>
          <option v-for="p in perfilesIntegrantes" :key="p.id" :value="p.id">{{ p.nombre }}</option>
        </select>
      </div>
      <button class="btn btn-outline btn-sm" @click="limpiar">Limpiar filtros</button>
    </div>

    <div v-if="cargando" class="cargando">Cargando tareas...</div>

    <div v-else-if="tareasFiltradas.length === 0" class="vacio">
      <p>No se encontraron tareas con los filtros aplicados.</p>
      <button class="btn btn-primary" @click="limpiar">Ver todas las tareas</button>
    </div>

    <table v-else class="tabla">
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
            <button class="btn btn-outline btn-sm" @click="editar(t)" title="Editar">Editar</button>
            <button v-if="t.estado === 'pendiente'" class="btn btn-primary btn-sm" @click="completar(t)" title="Marcar como completada">Completar</button>
            <button v-else-if="t.estado === 'completada'" class="btn btn-outline btn-sm" @click="reabrir(t)" title="Reabrir">Reabrir</button>
            <button v-if="t.estado !== 'cancelada'" class="btn btn-danger btn-sm" @click="cancelarTarea(t)" title="Cancelar">Cancelar</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { inject } from 'vue'
import { tareasService, comisionesService, perfilesService } from '@/services'

import Alerta from '@/components/Alerta.vue'

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

function aplicar() { /* reactivo */ }
function limpiar() { filtro.value = { comision: '', estado: '', responsable: '' } }

function formatearFecha(iso) {
  if (!iso) return ''
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-AR')
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
.tareas { max-width: 1100px; margin: 0 auto; padding: 0 20px; }
.encabezado { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
.encabezado h1 { font-size: 1.75rem; margin: 0; color: var(--color-verde-oscuro); }
.encabezado p { margin: 4px 0 0 0; color: var(--color-texto-suave); }

.filtros { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 12px; align-items: end; margin-bottom: 16px; }
.filtro { display: flex; flex-direction: column; gap: 6px; }
.etiqueta { font-size: 0.8rem; font-weight: 700; color: var(--color-texto-suave); }
.entrada { padding: 7px 10px; border: 1px solid var(--color-borde); border-radius: 6px; font-size: 0.9rem; }

.tabla { width: 100%; border-collapse: collapse; background: var(--color-blanco); border: 1px solid var(--color-borde); border-radius: 8px; font-size: 0.9rem; }
.tabla th, .tabla td { padding: 12px 14px; text-align: left; border-bottom: 1px solid var(--color-borde); }
.tabla th { background: var(--color-gris-claro); font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.4px; color: var(--color-texto-suave); }
.tabla tr:last-child td { border-bottom: none; }
.tabla tr:hover td { background: rgba(48, 109, 41, 0.04); }
.acciones-col { white-space: nowrap; }
.acciones-col .btn { margin-bottom: 6px; width: 100%; }

.vacio { text-align: center; padding: 48px 24px; color: var(--color-texto-suave); }
.cargando { text-align: center; padding: 24px; color: var(--color-texto-suave); font-size: 0.95rem; }

.modo-aviso {
  background: #FBF0DC;
  border: 1px solid #E8C98E;
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 0.85rem;
  color: #7A4F00;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 700px) {
  .tabla { font-size: 0.75rem; }
  .tabla th, .tabla td { padding: 8px 6px; }
  .encabezado { flex-direction: column; align-items: stretch; }
  .acciones-col .btn { width: auto; margin-bottom: 4px; }
  .filtros { grid-template-columns: 1fr 1fr; }
}
</style>
