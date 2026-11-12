<template>
  <div class="tachos">
    <VistaEncabezado titulo="Tachos" subtitulo="Puntos de separación dentro de la institución">
      <template #accion>
        <button v-if="esAdmin" class="btn btn-primary" @click="toggleNuevo">
          {{ formularioAbierto ? 'Cancelar' : 'Agregar tacho' }}
        </button>
      </template>
    </VistaEncabezado>

    <Alerta v-if="error" tipo="error" :mensaje="error" />
    <Alerta v-if="exito" tipo="exito" :mensaje="exito" :duracion="4000" />

    <div class="estadisticas-fila">
      <TarjetaStat :texto="`${tachos.length} puntos`" />
      <TarjetaStat :texto="`${operativos} operativos`" />
      <TarjetaStat :texto="`${porRevisar} por revisar`" />
    </div>

    <div class="contenido-doble tarjetas-superiores">
      <div class="card puntos-card">
        <h2>Puntos de separación</h2>
        <img class="puntos-foto" src="/img/tachos.webp" alt="Tachos de colores para separar residuos: amarillo, verde y azul" loading="lazy" />
        <ul class="puntos-lista">
          <li v-for="t in tachos.slice(0, 4)" :key="t.id">
            {{ t.nombre }} <span class="punto-detalle">· {{ t.ubicacion }} · {{ t.activo ? 'Operativo' : 'Sin operar' }}</span>
          </li>
          <li v-if="tachos.length === 0" class="punto-detalle">Todavía no hay tachos registrados.</li>
        </ul>
      </div>

      <TarjetaDatos titulo="Mantenimiento">
        <p v-for="p in problemas" :key="p.id" class="item-datos">
          <strong>{{ formatoFecha(p.fecha) }}</strong> {{ p.descripcion }}
        </p>
        <p v-if="problemas.length === 0" class="item-datos">No hay mantenimientos pendientes.</p>
      </TarjetaDatos>
    </div>

    <div v-if="formularioAbierto && esAdmin" class="card tarjeta-form">
      <h3>Registrar tacho</h3>
      <form @submit.prevent="guardarTacho" class="formulario">
        <div class="form-row">
          <div class="grupo">
            <label class="etiqueta">Nombre del tacho <span class="requerido">*</span></label>
            <input v-model="nuevo.nombre" type="text" placeholder="Ej: Tacho Patio - Papel y cartón" class="entrada" />
          </div>
          <div class="grupo">
            <label class="etiqueta">Ubicación <span class="requerido">*</span></label>
            <input v-model="nuevo.ubicacion" type="text" placeholder="Ej: Patio central" class="entrada" />
          </div>
        </div>
        <div class="grupo">
          <label class="etiqueta">Tipo de residuo <span class="requerido">*</span></label>
          <select v-model="nuevo.tipoResiduo" class="entrada">
            <option value="">Seleccioná un tipo de material</option>
            <option v-for="t in tiposResiduo" :key="t.id" :value="t.id">{{ t.nombre }}</option>
          </select>
        </div>
        <div class="acciones">
          <button type="button" class="btn btn-outline" @click="toggleNuevo">Cancelar</button>
          <button type="submit" class="btn btn-primary">Guardar tacho</button>
        </div>
      </form>
    </div>

    <div class="table-container card tarjeta-tabla">
      <table class="tabla">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Ubicación</th>
            <th>Tipo de residuo</th>
            <th>Estado</th>
            <th class="acciones-col">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in tachos" :key="t.id">
            <td>{{ t.nombre }}</td>
            <td>{{ t.ubicacion }}</td>
            <td>{{ tipoNombre(t.tipoResiduo) }}</td>
            <td><span class="badge" :class="t.activo ? 'badge-activo' : 'badge-cancelada'">{{ t.activo ? 'Activo' : 'Inactivo' }}</span></td>
            <td class="acciones-col">
              <button v-if="esAdmin" class="btn btn-outline btn-sm" @click="editarTacho(t)">Editar</button>
              <button v-if="esAdmin" class="btn btn-danger btn-sm" @click="cambiarEstadoTacho(t)">{{ t.activo ? 'Desactivar' : 'Activar' }}</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="tachos.length === 0 && !cargando" class="vacio">No hay tachos registrados.</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { validar, requerido, seleccionValida } from '@/validations'
import { tachosService, tiposResiduoService, problemasTachoService } from '@/services'

import Alerta from '@/components/Alerta.vue'
import VistaEncabezado from '@/components/VistaEncabezado.vue'
import TarjetaStat from '@/components/TarjetaStat.vue'
import TarjetaDatos from '@/components/TarjetaDatos.vue'

const auth = inject('auth')
const esAdmin = computed(() => auth && auth.rol === 'administrador')

const cargando = ref(true)
const error = ref(null)
const exito = ref(null)
const formularioAbierto = ref(false)

const tachos = ref([])
const tiposResiduo = ref([])
const problemas = ref([])

const nuevo = ref({ nombre: '', ubicacion: '', tipoResiduo: '' })

const toggleNuevo = () => { formularioAbierto.value = !formularioAbierto.value }

const reglas = {
  nombre: [requerido],
  ubicacion: [requerido],
  tipoResiduo: [seleccionValida],
}

const operativos = computed(() => tachos.value.filter((t) => t.activo).length)
const porRevisar = computed(() => problemas.value.filter((p) => p.estado === 'abierto').length)

function formatoFecha(iso) {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const diff = Math.round((hoy - d) / 86400000)
  if (diff === 0) return 'HOY'
  if (diff === 1) return 'AYER'
  return `${String(d.getDate()).padStart(2, '0')} ${d.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '').toUpperCase()}`
}

onMounted(async () => {
  const [rTachos, rTipos, rProblemas] = await Promise.all([
    tachosService.listar(),
    tiposResiduoService.listar(),
    problemasTachoService.listar(),
  ])
  if (rTachos.exito) tachos.value = rTachos.data || []
  else error.value = rTachos.error?.message || 'No se pudieron cargar los tachos.'
  if (rTipos.exito) tiposResiduo.value = rTipos.data || []
  if (rProblemas.exito) problemas.value = (rProblemas.data || []).filter((p) => p.estado === 'abierto')
  cargando.value = false
})

function tipoNombre(id) {
  const t = tiposResiduo.value.find((x) => x.id === id)
  return t ? t.nombre : '—'
}

async function guardarTacho() {
  const { valido } = validar(nuevo.value, reglas)
  if (!valido) { error.value = 'Completá todos los campos obligatorios.'; return }
  const r = await tachosService.crear({
    nombre: nuevo.value.nombre,
    ubicacion: nuevo.value.ubicacion,
    tipoResiduo: nuevo.value.tipoResiduo,
  })
  if (r.exito) {
    tachos.value.push(r.data)
    exito.value = 'Tacho registrado correctamente.'
    toggleNuevo()
    nuevo.value = { nombre: '', ubicacion: '', tipoResiduo: '' }
  } else {
    error.value = r.error?.message || 'No se pudo registrar el tacho.'
  }
}

async function editarTacho(t) {
  const nombre = prompt('Nuevo nombre del tacho:', t.nombre)
  if (nombre === null) return
  const r = await tachosService.actualizar(t.id, { nombre })
  if (r.exito) { t.nombre = nombre; exito.value = 'Tacho actualizado.' }
  else error.value = r.error?.message || 'No se pudo actualizar el tacho.'
}

async function cambiarEstadoTacho(t) {
  const r = await tachosService.actualizar(t.id, { activo: !t.activo })
  if (r.exito) {
    t.activo = !t.activo
    exito.value = `Tacho ${t.activo ? 'activado' : 'desactivado'}.`
  } else {
    error.value = r.error?.message || 'No se pudo cambiar el estado del tacho.'
  }
}
</script>

<style scoped>
.tachos { width: 100%; }

.tarjetas-superiores { margin-bottom: 16px; }
.tarjetas-superiores h2 { font-size: 1.05rem; margin-bottom: 10px; }

.puntos-card { display: flex; flex-direction: column; gap: 10px; }
.puntos-foto { width: 100%; height: 170px; object-fit: cover; border-radius: var(--radio-tarjeta); display: block; }
.puntos-lista { display: flex; flex-direction: column; gap: 6px; font-size: 0.9rem; }
.puntos-lista li { border-top: 1px solid var(--borde); padding-top: 6px; }
.puntos-lista li:first-child { border-top: none; padding-top: 0; }
.punto-detalle { color: var(--texto-suave); font-size: 0.82rem; }

.tarjeta-form { margin-bottom: 16px; }
.tarjeta-form h3 { margin: 0 0 14px 0; font-size: 1.05rem; }
.formulario { display: flex; flex-direction: column; gap: 14px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.grupo { display: flex; flex-direction: column; gap: 6px; }
.etiqueta { font-size: 0.85rem; font-weight: 800; color: var(--texto-suave); display: flex; align-items: center; gap: 6px; }
.requerido { color: var(--error-texto); font-size: 0.8rem; }
.entrada { padding: 10px 14px; border: 1px solid var(--borde); border-radius: var(--radio-campo); font-size: 0.95rem; background: var(--fondo-tarjeta); color: var(--texto); }
.acciones { display: flex; justify-content: flex-end; gap: 10px; margin-top: 6px; }

.tarjeta-tabla { padding: 0; overflow: hidden; }
.tarjeta-tabla .tabla { border: none; border-radius: 0; }
.acciones-col { white-space: nowrap; }
.acciones-col .btn { margin-bottom: 6px; width: 100%; }

@media (max-width: 700px) {
  .form-row { grid-template-columns: 1fr; }
  .acciones-col .btn { width: auto; margin-bottom: 4px; }
  .acciones { justify-content: stretch; flex-direction: column-reverse; }
}
</style>
