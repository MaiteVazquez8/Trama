<template>
  <div class="acuerdos">
    <VistaEncabezado titulo="Acuerdos" subtitulo="Decisiones colectivas y seguimiento">
      <template #accion>
        <button v-if="esAdmin" class="btn btn-primary" @click="toggleNuevo">
          {{ formAbierto ? 'Cancelar' : 'Nuevo acuerdo' }}
        </button>
      </template>
    </VistaEncabezado>

    <Alerta v-if="error" tipo="error" :mensaje="error" />
    <Alerta v-if="exito" tipo="exito" :mensaje="exito" :duracion="4000" />

    <div class="estadisticas-fila">
      <TarjetaStat :texto="`${acuerdos.length} vigentes`" />
      <TarjetaStat :texto="`${enSeguimiento} con seguimiento`" />
      <TarjetaStat :texto="`${vencidos} vencidos`" />
    </div>

    <div class="contenido-doble tarjetas-superiores">
      <div class="card">
        <h2>Seguimiento colectivo</h2>
        <p class="seguimiento-texto">Cada acuerdo conserva su reunión de origen, una persona responsable y una fecha de revisión visible.</p>
        <ul class="seguimiento-lista">
          <li v-for="c in comisionesConAcuerdos" :key="c.id">
            <span class="seguimiento-nombre">{{ c.nombre }}</span>
            <span class="seguimiento-detalle">{{ acuerdosDe(c.id) }} acuerdo{{ acuerdosDe(c.id) === 1 ? '' : 's' }} a su cargo</span>
          </li>
          <li v-if="comisionesConAcuerdos.length === 0" class="seguimiento-detalle">Todavía no hay comisiones asignadas a acuerdos.</li>
        </ul>
      </div>

      <TarjetaDatos titulo="Acuerdos recientes">
        <p v-for="a in acuerdosRecientes" :key="a.id" class="item-datos">
          {{ a.tema }} <span class="acuerdo-meta">· {{ formatoFecha(a.fechaPrevista) }} · {{ estadoAcuerdo(a) }}</span>
        </p>
        <p v-if="acuerdosRecientes.length === 0" class="item-datos">Todavía no hay acuerdos registrados.</p>
      </TarjetaDatos>
    </div>

    <div v-if="formAbierto && esAdmin" class="card tarjeta-form">
      <h3>Registrar acuerdo</h3>
      <form @submit.prevent="guardarAcuerdo" class="formulario">
        <div class="grupo">
          <label class="etiqueta">Reunión</label>
          <select v-model="nuevo.reunion" class="entrada">
            <option value="">Seleccioná una reunión</option>
            <option v-for="r in reuniones" :key="r.id" :value="r.id">{{ formatearFecha(r.fecha) }} - {{ r.temas.slice(0, 40) }}</option>
          </select>
        </div>
        <div class="grupo">
          <label class="etiqueta">Tema <span class="requerido">*</span></label>
          <input v-model="nuevo.tema" type="text" placeholder="Ej: Días de retiro de materiales" class="entrada" />
        </div>
        <div class="grupo">
          <label class="etiqueta">Decisión <span class="requerido">*</span></label>
          <textarea v-model="nuevo.decision" rows="3" class="entrada"></textarea>
        </div>
        <div class="form-row">
          <div class="grupo">
            <label class="etiqueta">Responsable (comisión)</label>
            <select v-model="nuevo.responsable" class="entrada">
              <option value="">Seleccioná una comisión</option>
              <option v-for="c in comisiones" :key="c.id" :value="c.id">{{ c.nombre }}</option>
            </select>
          </div>
          <div class="grupo">
            <label class="etiqueta">Fecha prevista</label>
            <input v-model="nuevo.fechaPrevista" type="date" class="entrada" />
          </div>
        </div>
        <div class="acciones">
          <button type="button" class="btn btn-outline" @click="toggleNuevo">Cancelar</button>
          <button type="submit" class="btn btn-primary">Guardar acuerdo</button>
        </div>
      </form>
    </div>

    <div class="table-container card tarjeta-tabla">
      <table class="tabla">
        <thead>
          <tr>
            <th>Reunión</th>
            <th>Tema</th>
            <th>Decisión</th>
            <th>Responsable</th>
            <th>Fecha prevista</th>
            <th class="acciones-col">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in acuerdos" :key="a.id">
            <td>{{ nombreReunion(a.reunion) }}</td>
            <td>{{ a.tema }}</td>
            <td>{{ a.decision }}</td>
            <td>{{ nombreComision(a.responsable) }}</td>
            <td>{{ formatearFecha(a.fechaPrevista) }}</td>
            <td class="acciones-col">
              <button v-if="esAdmin" class="btn btn-outline btn-sm" @click="editarAcuerdo(a)">Editar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="acuerdos.length === 0 && !cargando" class="vacio">No hay acuerdos registrados.</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { validar, requerido } from '@/validations'
import { acuerdosService, reunionesService, comisionesService } from '@/services'

import Alerta from '@/components/Alerta.vue'
import VistaEncabezado from '@/components/VistaEncabezado.vue'
import TarjetaStat from '@/components/TarjetaStat.vue'
import TarjetaDatos from '@/components/TarjetaDatos.vue'

const auth = inject('auth')
const esAdmin = computed(() => auth && auth.rol === 'administrador')

const cargando = ref(true)
const error = ref(null)
const exito = ref(null)
const formAbierto = ref(false)

const acuerdos = ref([])
const reuniones = ref([])
const comisiones = ref([])

const nuevo = ref({ reunion: '', tema: '', decision: '', responsable: '', fechaPrevista: '' })

const toggleNuevo = () => { formAbierto.value = !formAbierto.value }
const reglas = { tema: [requerido], decision: [requerido] }

const hoy = new Date().toISOString().split('T')[0]
const enSeguimiento = computed(() => acuerdos.value.filter((a) => a.fechaPrevista && a.fechaPrevista >= hoy).length)
const vencidos = computed(() => acuerdos.value.filter((a) => a.fechaPrevista && a.fechaPrevista < hoy).length)

const acuerdosRecientes = computed(() => acuerdos.value.slice(0, 4))
const acuerdosDe = (id) => acuerdos.value.filter((a) => a.responsable === id).length
const comisionesConAcuerdos = computed(() => comisiones.value.filter((c) => acuerdosDe(c.id) > 0))

function estadoAcuerdo(a) {
  if (!a.fechaPrevista) return 'Sin fecha'
  return a.fechaPrevista >= hoy ? 'En curso' : 'Vencido'
}

function formatoFecha(iso) {
  if (!iso) return 'sin fecha'
  const d = new Date(iso + 'T00:00:00')
  return `${String(d.getDate()).padStart(2, '0')} ${d.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '').toUpperCase()}`
}

onMounted(async () => {
  const [rA, rR, rC] = await Promise.all([
    acuerdosService.listar(),
    reunionesService.listar(),
    comisionesService.listar(),
  ])
  if (rA.exito) acuerdos.value = rA.data || []
  else error.value = rA.error?.message || 'No se pudieron cargar los acuerdos.'
  if (rR.exito) reuniones.value = rR.data || []
  if (rC.exito) comisiones.value = rC.data || []
  cargando.value = false
})

function formatearFecha(iso) {
  if (!iso) return ''
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-AR')
}
function nombreReunion(id) {
  const r = reuniones.value.find((x) => x.id === id)
  return r ? `${formatearFecha(r.fecha)}` : '—'
}
function nombreComision(id) {
  const c = comisiones.value.find((x) => x.id === id)
  return c ? c.nombre : '—'
}

async function guardarAcuerdo() {
  const { valido } = validar(nuevo.value, reglas)
  if (!valido) { error.value = 'Completá los campos obligatorios.'; return }
  const r = await acuerdosService.crear({ ...nuevo.value })
  if (r.exito) {
    acuerdos.value.push(r.data)
    exito.value = 'Acuerdo registrado correctamente.'
    toggleNuevo()
    nuevo.value = { reunion: '', tema: '', decision: '', responsable: '', fechaPrevista: '' }
  } else {
    error.value = r.error?.message || 'No se pudo guardar el acuerdo.'
  }
}

async function editarAcuerdo(a) {
  const decision = prompt('Nueva decisión:', a.decision)
  if (decision === null) return
  const r = await acuerdosService.actualizar(a.id, { decision })
  if (r.exito) { a.decision = decision; exito.value = 'Acuerdo actualizado.' }
  else error.value = r.error?.message || 'No se pudo actualizar el acuerdo.'
}
</script>

<style scoped>
.acuerdos { width: 100%; }

.tarjetas-superiores { margin-bottom: 16px; }
.tarjetas-superiores h2 { font-size: 1.05rem; margin-bottom: 8px; }

.seguimiento-texto { font-size: 0.95rem; color: var(--texto-suave); margin-bottom: 12px; }
.seguimiento-lista { display: flex; flex-direction: column; gap: 8px; font-size: 0.9rem; }
.seguimiento-lista li { border-top: 1px solid var(--borde); padding-top: 8px; display: flex; justify-content: space-between; gap: 12px; align-items: baseline; }
.seguimiento-lista li:first-child { border-top: none; padding-top: 0; }
.seguimiento-nombre { font-weight: 800; }
.seguimiento-detalle { color: var(--texto-suave); font-size: 0.85rem; }
.acuerdo-meta { color: var(--texto-suave); font-size: 0.8rem; }

.tarjeta-form { margin-bottom: 16px; }
.tarjeta-form h3 { margin: 0 0 14px 0; font-size: 1.05rem; }
.formulario { display: flex; flex-direction: column; gap: 14px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.grupo { display: flex; flex-direction: column; gap: 6px; }
.etiqueta { font-size: 0.85rem; font-weight: 800; color: var(--texto-suave); display: flex; align-items: center; gap: 6px; }
.requerido { color: var(--error-texto); font-size: 0.8rem; }
.entrada { padding: 10px 14px; border: 1px solid var(--borde); border-radius: var(--radio-campo); font-size: 0.95rem; background: var(--fondo-tarjeta); color: var(--texto); }
textarea.entrada { resize: vertical; }
.acciones { display: flex; justify-content: flex-end; gap: 10px; margin-top: 6px; }

.tarjeta-tabla { padding: 0; overflow: hidden; }
.tarjeta-tabla .tabla { border: none; border-radius: 0; }
.acciones-col { white-space: nowrap; }

@media (max-width: 700px) {
  .form-row { grid-template-columns: 1fr; }
  .acciones { justify-content: stretch; flex-direction: column-reverse; }
}
</style>
