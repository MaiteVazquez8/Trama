<template>
  <div class="historial">
    <VistaEncabezado titulo="Historial" subtitulo="Movimientos y registros de la cooperativa">
      <template #accion>
        <button class="btn btn-primary" @click="exportarHistorial" :disabled="cargando || registrosFiltrados.length === 0">
          Exportar historial
        </button>
      </template>
    </VistaEncabezado>

    <Alerta v-if="error" tipo="error" :mensaje="error" />
    <Alerta v-if="exito" tipo="exito" :mensaje="exito" :duracion="4000" />

    <div class="modo-aviso" v-if="modoDesarrollo">
      Modo desarrollo: estos registros son <strong>ficticios (de prueba)</strong>.
    </div>

    <div class="estadisticas-fila">
      <TarjetaStat :texto="`${registros.length} movimientos`" />
      <TarjetaStat :texto="`${registrosEsteMes} este mes`" />
      <TarjetaStat :texto="`${porcentajeTrazables} % trazables`" />
    </div>

    <div class="contenido-doble tarjetas-superiores">
      <div class="card">
        <h2>Filtros aplicados</h2>
        <p class="filtros-resumen">{{ filtrosResumen }}</p>
        <div class="filtros">
          <div class="filtro buscar">
            <label class="etiqueta-filtro" for="hist-lugar">Buscar por lugar</label>
            <input id="hist-lugar" type="text" v-model="filtro.lugar" placeholder="Ej: patio, kiosco" />
          </div>
          <div class="filtro">
            <label class="etiqueta-filtro" for="hist-tipo">Tipo de material</label>
            <select id="hist-tipo" v-model="filtro.tipo" class="entrada-filtro">
              <option value="">Todos</option>
              <option v-for="t in tiposResiduo" :key="t.id" :value="t.id">{{ t.nombre }}</option>
            </select>
          </div>
          <div class="filtro">
            <label class="etiqueta-filtro" for="hist-estado">Estado</label>
            <select id="hist-estado" v-model="filtro.estado" class="entrada-filtro">
              <option value="">Todos</option>
              <option value="activo">Activo</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
          <div class="filtro filtro-fechas">
            <label class="etiqueta-filtro" for="hist-desde">Desde</label>
            <input id="hist-desde" type="date" v-model="filtro.desde" class="entrada-filtro" />
            <label class="etiqueta-filtro" for="hist-hasta">Hasta</label>
            <input id="hist-hasta" type="date" v-model="filtro.hasta" class="entrada-filtro" />
          </div>
          <button class="btn btn-outline btn-sm" @click="limpiarFiltros">Limpiar filtros</button>
        </div>
      </div>

      <TarjetaDatos titulo="Movimientos recientes">
        <p v-for="m in movimientosRecientes" :key="m.id" class="item-datos">
          <strong>{{ m.fecha }}</strong> {{ m.descripcion }}
        </p>
        <p v-if="movimientosRecientes.length === 0" class="item-datos">Todavía no hay movimientos.</p>
      </TarjetaDatos>
    </div>

    <div v-if="cargando" class="cargando">Cargando registros…</div>

    <div v-else-if="registrosFiltrados.length === 0" class="vacio">
      <p>No se encontraron registros con los filtros aplicados.</p>
      <button class="btn btn-primary" @click="limpiarFiltros">Ver todos los registros</button>
    </div>

    <div v-else class="table-container card tarjeta-tabla">
      <table class="tabla">
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
              <button class="btn btn-outline btn-sm" @click="editar(r)">Editar</button>
              <button v-if="r.estado === 'activo'" class="btn btn-danger btn-sm" @click="cancelar(r)">Cancelar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-if="!cargando && registrosFiltrados.length > 0" class="pie">
      Total de registros mostrados: {{ registrosFiltrados.length }}
    </p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { registrosResiduoService, tiposResiduoService, perfilesService, entregasService } from '@/services'

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

const filtro = ref({ lugar: '', tipo: '', estado: '', desde: '', hasta: '' })
const registros = ref([])
const tiposResiduo = ref([])
const perfiles = ref([])
const entregas = ref([])

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

const registrosEsteMes = computed(() => {
  const ahora = new Date()
  const prefijo = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`
  return registros.value.filter((r) => String(r.fecha || '').startsWith(prefijo)).length
})

const porcentajeTrazables = computed(() => {
  if (!registros.value.length) return 100
  const activos = registros.value.filter((r) => r.estado === 'activo').length
  return Math.round((activos / registros.value.length) * 100)
})

const filtrosResumen = computed(() => {
  const partes = []
  partes.push(filtro.value.tipo ? `Tipo: ${tipoNombre(filtro.value.tipo)}` : 'Todos los tipos')
  if (filtro.value.desde || filtro.value.hasta) {
    partes.push(`Desde ${formatearFecha(filtro.value.desde) || '…'} hasta ${formatearFecha(filtro.value.hasta) || '…'}`)
  } else {
    partes.push('Últimos 30 días')
  }
  partes.push(filtro.value.lugar ? `Lugar: ${filtro.value.lugar}` : 'Toda la comunidad')
  if (filtro.value.estado) partes.push(`Estado: ${filtro.value.estado}`)
  return partes.join(' · ')
})

const movimientosRecientes = computed(() => {
  const items = []
  for (const r of registros.value.slice(0, 6)) {
    items.push({
      id: `rr-${r.id}`,
      fecha: fechaHora(r.creadoEn || r.fecha),
      descripcion: `Registro ${Number(r.cantidadKg).toFixed(1)} kg de ${tipoNombre(r.tipoResiduo).toLowerCase()}`,
      orden: r.creadoEn || r.fecha || '',
    })
  }
  for (const e of entregas.value.slice(0, 3)) {
    items.push({
      id: `en-${e.id}`,
      fecha: fechaHora(e.creadoEn || e.fecha),
      descripcion: `Entrega ${e.estado === 'completada' ? 'confirmada' : e.estado} · ${e.recibidoPor || ''}`.trim(),
      orden: e.creadoEn || e.fecha || '',
    })
  }
  return items.sort((a, b) => (a.orden < b.orden ? 1 : -1)).slice(0, 4)
})

onMounted(cargarDatos)

async function cargarDatos() {
  cargando.value = true
  error.value = null
  try {
    const [rTipos, rPerfiles, rRegistros, rEntregas] = await Promise.all([
      tiposResiduoService.listar(),
      perfilesService.listar(),
      registrosResiduoService.listar(),
      entregasService.listar(),
    ])
    if (rTipos.exito) tiposResiduo.value = rTipos.data
    if (rPerfiles.exito) perfiles.value = rPerfiles.data
    if (rRegistros.exito) registros.value = rRegistros.data || []
    else error.value = rRegistros.error?.message || 'No se pudieron cargar los registros.'
    if (rEntregas.exito) entregas.value = rEntregas.data || []
  } catch (e) {
    error.value = 'Error de conexión al cargar los registros.'
  } finally {
    cargando.value = false
  }
}

function limpiarFiltros() {
  filtro.value = { lugar: '', tipo: '', estado: '', desde: '', hasta: '' }
}

function formatearFecha(iso) {
  if (!iso) return ''
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-AR')
}

function fechaHora(iso) {
  if (!iso) return ''
  const d = new Date(iso.length > 10 ? iso : iso + 'T00:00:00')
  const fecha = `${String(d.getDate()).padStart(2, '0')} ${d.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '').toUpperCase()}`
  if (iso.length > 10) {
    const hora = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })
    return `${fecha} ${hora}`
  }
  return fecha
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

function editar(r) {
  router.push({ name: 'residuo-editar', params: { id: r.id } })
}

async function cancelar(r) {
  if (!confirm(`¿Confirmás que deseás cancelar el registro de ${r.lugar} del ${formatearFecha(r.fecha)}?\nEl registro se mantendrá como cancelado para conservar el historial.`)) return
  const rr = await registrosResiduoService.cancelar(r.id, 'Cancelado por el usuario desde el historial')
  if (rr.exito) {
    r.estado = 'cancelado'
  } else {
    error.value = rr.error?.message || 'No se pudo cancelar el registro.'
  }
}

function exportarHistorial() {
  const encabezados = ['Fecha', 'Tipo', 'Cantidad (kg)', 'Lugar', 'Registrado por', 'Estado']
  const filas = registrosFiltrados.value.map((r) => [
    formatearFecha(r.fecha),
    tipoNombre(r.tipoResiduo),
    Number(r.cantidadKg).toFixed(1).replace('.', ','),
    r.lugar,
    usuarioNombre(r.registradoPor),
    r.estado,
  ])
  const escapar = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csv = [encabezados, ...filas].map((f) => f.map(escapar).join(';')).join('\r\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'trama-historial-residuos.csv'
  a.click()
  URL.revokeObjectURL(url)
  exito.value = 'Historial exportado como CSV.'
}
</script>

<style scoped>
.historial { width: 100%; }

.tarjetas-superiores { margin-bottom: 16px; }
.tarjetas-superiores h2 { font-size: 1.05rem; margin-bottom: 10px; }

.filtros-resumen {
  font-size: 0.92rem;
  color: var(--texto);
  padding-bottom: 12px;
  border-bottom: 1px solid var(--borde);
  margin-bottom: 12px;
}

.filtros { display: flex; flex-wrap: wrap; gap: 10px; align-items: end; }
.filtro { display: flex; flex-direction: column; gap: 6px; }
.buscar { flex: 1 1 180px; }
.filtro input, .entrada-filtro {
  padding: 9px 12px;
  border: 1px solid var(--borde);
  border-radius: var(--radio-campo);
  font-size: 0.92rem;
  background: var(--fondo-tarjeta);
  color: var(--texto);
}
.etiqueta-filtro { font-size: 0.78rem; font-weight: 800; color: var(--texto-suave); }
.filtro-fechas { flex-direction: row; gap: 8px; align-items: end; flex-wrap: wrap; }
.filtro-fechas .etiqueta-filtro { align-self: center; }

.cargando { text-align: center; padding: 24px; color: var(--texto-suave); font-size: 0.95rem; }

.tarjeta-tabla { padding: 0; overflow: hidden; }
.tarjeta-tabla .tabla { border: none; border-radius: 0; }
.acciones-col { white-space: nowrap; }
.acciones-col .btn { margin-bottom: 6px; width: 100%; }

.pie { margin-top: 14px; font-size: 0.88rem; color: var(--texto-suave); text-align: right; }

@media (max-width: 700px) {
  .acciones-col .btn { width: auto; margin-bottom: 4px; }
}
</style>
