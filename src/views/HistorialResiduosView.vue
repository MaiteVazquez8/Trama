<template>
  <div class="historial">
    <div class="encabezado">
      <div>
        <h1>Historial de residuos</h1>
        <p>Consultá, buscá y filtrá los registros de materiales recolectados.</p>
      </div>
      <button class="btn btn-primary" @click="irNuevo">+ Nuevo registro</button>
    </div>

    <Alerta v-if="error" tipo="error" :mensaje="error" />

    <div class="modo-aviso" v-if="modoDesarrollo">
      ⚠️ Modo desarrollo: estos registros son <strong>ficticios (de prueba)</strong>.
    </div>

    <div class="filtros">
      <div class="buscar">
        <label class="etiqueta-buscar">Buscar por lugar</label>
        <input type="text" v-model="filtro.lugar" placeholder="Ej: patio, kiosco" @input="aplicarFiltros" />
      </div>
      <div class="filtro">
        <label class="etiqueta-filtro">Tipo de material</label>
        <select v-model="filtro.tipo" @change="aplicarFiltros" class="entrada-filtro">
          <option value="">Todos</option>
          <option v-for="t in tiposResiduo" :key="t.id" :value="t.id">{{ t.nombre }}</option>
        </select>
      </div>
      <div class="filtro">
        <label class="etiqueta-filtro">Estado</label>
        <select v-model="filtro.estado" @change="aplicarFiltros" class="entrada-filtro">
          <option value="">Todos</option>
          <option value="activo">Activo</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>
      <div class="filtro-fechas">
        <label class="etiqueta-filtro">Desde</label>
        <input type="date" v-model="filtro.desde" @change="aplicarFiltros" class="entrada-filtro" />
        <label class="etiqueta-filtro">Hasta</label>
        <input type="date" v-model="filtro.hasta" @change="aplicarFiltros" class="entrada-filtro" />
      </div>
      <button class="btn btn-outline btn-sm" @click="limpiarFiltros">Limpiar filtros</button>
    </div>

    <div v-if="cargando" class="cargando">Cargando registros...</div>

    <div v-else-if="registrosFiltrados.length === 0 && !cargando" class="vacio">
      <p>No se encontraron registros con los filtros aplicados.</p>
      <button class="btn btn-primary" @click="limpiarFiltros">Ver todos los registros</button>
    </div>

    <table v-else class="tabla">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Tipo de material</th>
          <th>Cantidad (kg)</th>
          <th>Lugar</th>
          <th>Registrado por</th>
          <th>Estado</th>
          <th class="acciones-col">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in registrosFiltrados" :key="r.id">
          <td>{{ formatearFecha(r.fecha) }}</td>
          <td>{{ tipoNombre(r.tipoResiduo) }}</td>
          <td>{{ Number(r.cantidadKg).toFixed(1) }}</td>
          <td>{{ r.lugar }}</td>
          <td>{{ usuarioNombre(r.registradoPor) }}</td>
          <td><span class="badge" :class="claseEstado(r.estado)">{{ r.estado }}</span></td>
          <td class="acciones-col">
            <button class="btn btn-outline btn-sm" @click="editar(r)" title="Editar">Editar</button>
            <button v-if="r.estado === 'activo'" class="btn btn-danger btn-sm" @click="cancelar(r)" title="Cancelar registro">Cancelar</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="pie" v-if="!cargando && registrosFiltrados.length > 0">
      <p>Total de registros mostrados: {{ registrosFiltrados.length }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { inject } from 'vue'
import { registrosResiduoService, tiposResiduoService, perfilesService } from '@/services'

import Alerta from '@/components/Alerta.vue'

const auth = inject('auth')
const router = useRouter()

const modoDesarrollo = computed(() => auth && auth.simulado)

const cargando = ref(true)
const error = ref(null)

const filtro = ref({ lugar: '', tipo: '', estado: '', desde: '', hasta: '' })
const registros = ref([])
const tiposResiduo = ref([])
const perfiles = ref([])

const registrosFiltrados = computed(() => {
  let lista = registros.value
  const texto = filtro.value.lugar.toLowerCase()
  if (texto) lista = lista.filter((r) => String(r.lugar).toLowerCase().includes(texto))
  if (filtro.value.tipo) lista = lista.filter((r) => r.tipoResiduo === filtro.value.tipo)
  if (filtro.value.estado) lista = lista.filter((r) => r.estado === filtro.value.estado)
  if (filtro.value.desde) lista = lista.filter((r) => r.fecha >= filtro.value.desde)
  if (filtro.value.hasta) lista = lista.filter((r) => r.fecha <= filtro.value.hasta)
  return lista.slice().sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
})

onMounted(cargarDatos)

async function cargarDatos() {
  cargando.value = true
  error.value = null
  try {
    const [rTipos, rPerfiles, rRegistros] = await Promise.all([
      tiposResiduoService.listar(),
      perfilesService.listar(),
      registrosResiduoService.listar(),
    ])
    if (rTipos.exito) tiposResiduo.value = rTipos.data
    if (rPerfiles.exito) perfiles.value = rPerfiles.data
    if (rRegistros.exito) registros.value = rRegistros.data || []
    else error.value = rRegistros.error?.message || 'No se pudieron cargar los registros.'
  } catch (e) {
    error.value = 'Error de conexión al cargar los registros.'
  } finally {
    cargando.value = false
  }
}

function aplicarFiltros() { /* reactivo por computed */ }
function limpiarFiltros() {
  filtro.value = { lugar: '', tipo: '', estado: '', desde: '', hasta: '' }
}

function formatearFecha(iso) {
  if (!iso) return ''
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-AR')
}

function tipoNombre(id) {
  const t = tiposResiduo.value.find((x) => x.id === id)
  return t ? t.nombre : '—'
}

function usuarioNombre(id) {
  const p = perfiles.value.find((x) => x.id === id)
  return p ? p.nombre : '—'
}

function claseEstado(estado) {
  return { activo: 'badge-activo', cancelado: 'badge-cancelada' }[estado] || 'badge-pendiente'
}

function irNuevo() { router.push({ name: 'residuo-nuevo' }) }

function irEditarResiduo(id) { router.push({ name: 'residuo-editar', params: { id } }) }
const editar = irEditarResiduo

async function cancelar(r) {
  if (!confirm(`¿Confirmás que deseás cancelar el registro de ${r.lugar} del ${formatearFecha(r.fecha)}?\nEl registro se mantendrá como cancelado para conservar el historial.`)) return
  const rr = await registrosResiduoService.cancelar(r.id, 'Cancelado por el usuario desde el historial')
  if (rr.exito) {
    r.estado = 'cancelado'
    r.motivoCancelacion = rr.data?.motivoCancelacion
  } else {
    error.value = rr.error?.message || 'No se pudo cancelar el registro.'
  }
}


</script>

<style scoped>
.historial { max-width: 1100px; margin: 0 auto; padding: 0 20px; }
.encabezado { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; flex-wrap: wrap; gap: 12px; }
.encabezado h1 { font-size: 1.75rem; margin: 0; color: var(--color-verde-oscuro); }
.encabezado p { margin: 4px 0 0 0; color: var(--color-texto-suave); }

.filtros { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; align-items: end; margin-bottom: 18px; }
.buscar { display: flex; flex-direction: column; gap: 6px; }
.etiqueta-buscar, .etiqueta-filtro { font-size: 0.8rem; font-weight: 700; color: var(--color-texto-suave); }
.entrada-filtro { padding: 7px 10px; border: 1px solid var(--color-borde); border-radius: 6px; font-size: 0.9rem; }
.filtro-fechas { display: flex; gap: 10px; align-items: end; flex-direction: column; }

.tabla { width: 100%; border-collapse: collapse; background: var(--color-blanco); border: 1px solid var(--color-borde); border-radius: 8px; font-size: 0.9rem; }
.tabla th, .tabla td { padding: 12px 14px; text-align: left; border-bottom: 1px solid var(--color-borde); }
.tabla th { background: var(--color-gris-claro); font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.4px; color: var(--color-texto-suave); }
.tabla tr:last-child td { border-bottom: none; }
.tabla tr:hover td { background: rgba(48, 109, 41, 0.04); }
.acciones-col { white-space: nowrap; }
.acciones-col .btn { margin-bottom: 6px; width: 100%; }

.vacio { text-align: center; padding: 48px 24px; color: var(--color-texto-suave); }
.cargando { text-align: center; padding: 24px; color: var(--color-texto-suave); font-size: 0.95rem; }
.pie { margin-top: 14px; font-size: 0.9rem; color: var(--color-texto-suave); text-align: right; }

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
