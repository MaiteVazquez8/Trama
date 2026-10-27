<template>
  <div class="entregas">
    <div class="encabezado">
      <div>
        <h1>Entregas</h1>
        <p>Registrá y consultá las entregas de materiales realizadas a la cooperativa externa.</p>
      </div>
      <button v-if="esAdmin" class="btn btn-primary" @click="toggleNuevo">
        {{ formAbierto ? 'Cancelar' : '+ Nueva entrega' }}
      </button>
    </div>

    <Alerta v-if="error" tipo="error" :mensaje="error" />
    <Alerta v-if="exito" tipo="exito" :mensaje="exito" :duracion="4000" />

    <div v-if="formAbierto && esAdmin" class="tarjeta-form">
      <h3>Registrar entrega</h3>
      <form @submit.prevent="guardarEntrega" class="formulario">
        <div class="grupo">
          <label class="etiqueta">Fecha <span class="requerido">*</span></label>
          <input v-model="nuevo.fecha" type="date" class="entrada" />
        </div>
        <div class="grupo">
          <label class="etiqueta">Materiales <span class="requerido">*</span></label>
          <input v-model="nuevo.materiales" type="text" placeholder="Ej: Papel y cartón, plásticos" class="entrada" />
        </div>
        <div class="grupo">
          <label class="etiqueta">Peso total (kg)</label>
          <input v-model.number="nuevo.pesoTotalKg" type="number" step="0.01" min="0" placeholder="Ej: 22.5" class="entrada" />
          <span class="error" v-if="errores.peso">{{ errores.peso }}</span>
        </div>
        <div class="grupo">
          <label class="etiqueta">Recibido por</label>
          <input v-model="nuevo.recibidoPor" type="text" placeholder="Ej: Cooperativa externa - Reciclado Norte" class="entrada" />
        </div>
        <div class="grupo">
          <label class="etiqueta">Estado</label>
          <select v-model="nuevo.estado" class="entrada">
            <option value="programada">Programada</option>
            <option value="completada">Completada</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
        <div class="acciones">
          <button type="button" class="btn btn-outline" @click="toggleNuevo">Cancelar</button>
          <button type="submit" class="btn btn-primary">Guardar entrega</button>
        </div>
      </form>
    </div>

    <table class="tabla">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Materiales</th>
          <th>Peso (kg)</th>
          <th>Recibido por</th>
          <th>Estado</th>
          <th class="acciones-col">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="e in entregas" :key="e.id">
          <td>{{ formatearFecha(e.fecha) }}</td>
          <td>{{ e.materiales }}</td>
          <td>{{ e.pesoTotalKg != null ? Number(e.pesoTotalKg).toFixed(1) : '—' }}</td>
          <td>{{ e.recibidoPor }}</td>
          <td><span class="badge" :class="claseEstado(e.estado)">{{ e.estado }}</span></td>
          <td class="acciones-col">
            <button v-if="esAdmin" class="btn btn-outline btn-sm" @click="editarEntrega(e)">Editar</button>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="entregas.length === 0 && !cargando" class="vacio">No hay entregas registradas.</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { inject } from 'vue'
import { validar, requerido, fechaValida, numeroNoNegativo } from '@/validations'
import { entregasService } from '@/services'

import Alerta from '@/components/Alerta.vue'

const auth = inject('auth')
const esAdmin = computed(() => auth && auth.rol === 'administrador')

const cargando = ref(true)
const error = ref(null)
const exito = ref(null)
const formAbierto = ref(false)

const entregas = ref([])
const nuevo = ref({ fecha: '', materiales: '', pesoTotalKg: '', recibidoPor: '', estado: 'programada' })

const toggleNuevo = () => { formAbierto.value = !formAbierto.value }
const reglas = { fecha: [fechaValida], materiales: [requerido], peso: [numeroNoNegativo] }

onMounted(async () => {
  const r = await entregasService.listar()
  if (r.exito) entregas.value = r.data || []
  else error.value = r.error?.message || 'No se pudieron cargar las entregas.'
  cargando.value = false
})

function formatearFecha(iso) {
  if (!iso) return ''
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-AR')
}
function claseEstado(e) {
  return { completada: 'badge-activo', programada: 'badge-pendiente', cancelada: 'badge-cancelada' }[e] || 'badge-pendiente'
}

async function guardarEntrega() {
  const { valido, errores: errs } = validar(nuevo.value, reglas)
  errores.value = errs
  if (!valido) { error.value = 'Completá los campos obligatorios.'; return }
  const r = await entregasService.crear({
    fecha: nuevo.value.fecha,
    materiales: nuevo.value.materiales,
    pesoTotalKg: nuevo.value.pesoTotalKg !== '' ? Number(nuevo.value.pesoTotalKg) : null,
    recibidoPor: nuevo.value.recibidoPor,
    estado: nuevo.value.estado,
  })
  if (r.exito) {
    entregas.value.push(r.data)
    exito.value = 'Entrega registrada correctamente.'
    toggleNuevo()
    nuevo.value = { fecha: '', materiales: '', pesoTotalKg: '', recibidoPor: '', estado: 'programada' }
  } else {
    error.value = r.error?.message || 'No se pudo registrar la entrega.'
  }
}

async function editarEntrega(e) {
  const recibido = prompt('Recibido por:', e.recibidoPor)
  if (recibido === null) return
  const r = await entregasService.actualizar(e.id, { recibidoPor: recibido })
  if (r.exito) { e.recibidoPor = recibido; exito.value = 'Entrega actualizada.' }
  else error.value = r.error?.message || 'No se pudo actualizar la entrega.'
}
</script>

<style scoped>
.entregas { max-width: 1000px; margin: 0 auto; padding: 0 20px; }
.encabezado { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
.encabezado h1 { font-size: 1.75rem; margin: 0; color: var(--color-verde-oscuro); }
.encabezado p { margin: 4px 0 0 0; color: var(--color-texto-suave); }
.tarjeta-form { background: var(--color-blanco); border: 1px solid var(--color-borde); border-radius: 10px; padding: 20px; margin-bottom: 18px; }
.tarjeta-form h3 { margin: 0 0 14px 0; color: var(--color-verde-oscuro); }
.formulario { display: flex; flex-direction: column; gap: 14px; }
.grupo { display: flex; flex-direction: column; gap: 6px; }
.etiqueta { font-size: 0.9rem; font-weight: 700; color: var(--color-texto-suave); display: flex; align-items: center; gap: 6px; }
.requerido { color: var(--color-error); font-size: 0.85rem; }
.entrada { padding: 9px 12px; border: 1px solid var(--color-borde); border-radius: 6px; font-size: 0.95rem; }
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
  .encabezado { flex-direction: column; align-items: stretch; }
  .tabla { font-size: 0.75rem; }
  .tabla th, .tabla td { padding: 8px 6px; }
}
</style>
