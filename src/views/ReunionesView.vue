<template>
  <div class="reuniones">
    <div class="encabezado">
      <div>
        <h1>Reuniones</h1>
        <p>Consultá las reuniones realizadas y las próximas reuniones programadas.</p>
      </div>
      <button v-if="esAdmin" class="btn btn-primary" @click="toggleNuevo">
        {{ formAbierto ? 'Cancelar' : '+ Nueva reunión' }}
      </button>
    </div>

    <Alerta v-if="error" tipo="error" :mensaje="error" />
    <Alerta v-if="exito" tipo="exito" :mensaje="exito" :duracion="4000" />

    <div v-if="formAbierto && esAdmin" class="tarjeta-form">
      <h3>Registrar reunión</h3>
      <form @submit.prevent="guardarReunion" class="formulario">
        <div class="grupo">
          <label class="etiqueta">Fecha <span class="requerido">*</span></label>
          <input v-model="nuevo.fecha" type="date" class="entrada" />
        </div>
        <div class="grupo">
          <label class="etiqueta">Temas tratados <span class="requerido">*</span></label>
          <textarea v-model="nuevo.temas" rows="3" class="entrada"></textarea>
        </div>
        <div class="grupo">
          <label class="etiqueta">Personas que participaron</label>
          <input v-model="nuevo.asistentes" type="text" class="entrada" />
        </div>
        <div class="acciones">
          <button type="button" class="btn btn-outline" @click="toggleNuevo">Cancelar</button>
          <button type="submit" class="btn btn-primary">Registrar reunión</button>
        </div>
      </form>
    </div>

    <table class="tabla">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Temas tratados</th>
          <th>Participantes</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in reuniones" :key="r.id">
          <td>{{ formatearFecha(r.fecha) }}</td>
          <td>{{ r.temas }}</td>
          <td>{{ r.asistentes || '—' }}</td>
        </tr>
      </tbody>
    </table>
    <div v-if="reuniones.length === 0 && !cargando" class="vacio">No hay reuniones registradas.</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { inject } from 'vue'
import { validar, requerido, fechaValida } from '@/validations'
import { reunionesService } from '@/services'

import Alerta from '@/components/Alerta.vue'

const auth = inject('auth')
const esAdmin = computed(() => auth && auth.rol === 'administrador')

const cargando = ref(true)
const error = ref(null)
const exito = ref(null)
const formAbierto = ref(false)

const reuniones = ref([])
const nuevo = ref({ fecha: '', temas: '', asistentes: '' })

const toggleNuevo = () => { formAbierto.value = !formAbierto.value }
const reglas = { fecha: [fechaValida], temas: [requerido] }

onMounted(async () => {
  const r = await reunionesService.listar()
  if (r.exito) reuniones.value = r.data || []
  else error.value = r.error?.message || 'No se pudieron cargar las reuniones.'
  cargando.value = false
})

function formatearFecha(iso) {
  if (!iso) return ''
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-AR')
}

async function guardarReunion() {
  const { valido } = validar(nuevo.value, reglas)
  if (!valido) { error.value = 'Completá los campos obligatorios.'; return }
  const r = await reunionesService.crear({ fecha: nuevo.value.fecha, temas: nuevo.value.temas, asistentes: nuevo.value.asistentes })
  if (r.exito) {
    reuniones.value.push(r.data)
    exito.value = 'Reunión registrada correctamente.'
    toggleNuevo()
    nuevo.value = { fecha: '', temas: '', asistentes: '' }
  } else {
    error.value = r.error?.message || 'No se pudo registrar la reunión.'
  }
}
</script>

<style scoped>
.reuniones { max-width: 1000px; margin: 0 auto; padding: 0 20px; }
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
textarea.entrada { resize: vertical; }
.acciones { display: flex; justify-content: flex-end; gap: 10px; margin-top: 6px; }
.btn { padding: 10px 18px; font-size: 0.95rem; }
.tabla { width: 100%; border-collapse: collapse; background: var(--color-blanco); border: 1px solid var(--color-borde); border-radius: 8px; font-size: 0.9rem; margin-top: 8px; }
.tabla th, .tabla td { padding: 12px 14px; text-align: left; border-bottom: 1px solid var(--color-borde); }
.tabla th { background: var(--color-gris-claro); font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.4px; color: var(--color-texto-suave); }
.tabla tr:last-child td { border-bottom: none; }
.vacio { text-align: center; padding: 48px 24px; color: var(--color-texto-suave); }
@media (max-width: 600px) {
  .encabezado { flex-direction: column; align-items: stretch; }
  .tabla { font-size: 0.75rem; }
  .tabla th, .tabla td { padding: 8px 6px; }
}
</style>
