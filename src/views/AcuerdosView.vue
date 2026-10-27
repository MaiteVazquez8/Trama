<template>
  <div class="acuerdos">
    <div class="encabezado">
      <div>
        <h1>Acuerdos</h1>
        <p>Consultá los acuerdos tomados durante las reuniones, junto con las tareas que surgieron de ellos.</p>
      </div>
      <button v-if="esAdmin" class="btn btn-primary" @click="toggleNuevo">
        {{ formAbierto ? 'Cancelar' : '+ Nuevo acuerdo' }}
      </button>
    </div>

    <Alerta v-if="error" tipo="error" :mensaje="error" />
    <Alerta v-if="exito" tipo="exito" :mensaje="exito" :duracion="4000" />

    <div v-if="formAbierto && esAdmin" class="tarjeta-form">
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
    <div v-if="acuerdos.length === 0 && !cargando" class="vacio">No hay acuerdos registrados.</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { inject } from 'vue'
import { validar, requerido } from '@/validations'
import { acuerdosService, reunionesService, comisionesService } from '@/services'

import Alerta from '@/components/Alerta.vue'

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

onMounted(async () => {
  const [rA, rR, rC] = await Promise.all([acuerdosService.listar(), reunionesService.listar(), comisionesService.listar()])
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
.acuerdos { max-width: 1000px; margin: 0 auto; padding: 0 20px; }
.encabezado { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
.encabezado h1 { font-size: 1.75rem; margin: 0; color: var(--color-verde-oscuro); }
.encabezado p { margin: 4px 0 0 0; color: var(--color-texto-suave); }
.tarjeta-form { background: var(--color-blanco); border: 1px solid var(--color-borde); border-radius: 10px; padding: 20px; margin-bottom: 18px; }
.tarjeta-form h3 { margin: 0 0 14px 0; color: var(--color-verde-oscuro); }
.formulario { display: flex; flex-direction: column; gap: 14px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.grupo { display: flex; flex-direction: column; gap: 6px; }
.etiqueta { font-size: 0.9rem; font-weight: 700; color: var(--color-texto-suave); display: flex; align-items: center; gap: 6px; }
.requerido { color: var(--color-error); font-size: 0.85rem; }
.entrada { padding: 9px 12px; border: 1px solid var(--color-borde); border-radius: 6px; font-size: 0.95rem; }
textarea.entrada { resize: vertical; }
.error { color: var(--color-error); font-size: 0.85rem; margin-top: 2px; }
.acciones { display: flex; justify-content: flex-end; gap: 10px; margin-top: 6px; }
.btn { padding: 10px 18px; font-size: 0.95rem; }
.tabla { width: 100%; border-collapse: collapse; background: var(--color-blanco); border: 1px solid var(--color-borde); border-radius: 8px; font-size: 0.9rem; margin-top: 8px; }
.tabla th, .tabla td { padding: 12px 14px; text-align: left; border-bottom: 1px solid var(--color-borde); }
.tabla th { background: var(--color-gris-claro); font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.4px; color: var(--color-texto-suave); }
.tabla tr:last-child td { border-bottom: none; }
.acciones-col { white-space: nowrap; }
.vacio { text-align: center; padding: 48px 24px; color: var(--color-texto-suave); }
@media (max-width: 600px) {
  .form-row { grid-template-columns: 1fr; }
  .encabezado { flex-direction: column; align-items: stretch; }
  .tabla { font-size: 0.75rem; }
  .tabla th, .tabla td { padding: 8px 6px; }
}
</style>
