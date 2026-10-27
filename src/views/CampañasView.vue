<template>
  <div class="campanas">
    <div class="encabezado">
      <div>
        <h1>Campañas</h1>
        <p>Consultá las campañas de concientización realizadas por la cooperativa.</p>
      </div>
      <button v-if="esAdmin" class="btn btn-primary" @click="toggleNuevo">
        {{ formAbierto ? 'Cancelar' : '+ Nueva campaña' }}
      </button>
    </div>

    <Alerta v-if="error" tipo="error" :mensaje="error" />
    <Alerta v-if="exito" tipo="exito" :mensaje="exito" :duracion="4000" />

    <div v-if="formAbierto && esAdmin" class="tarjeta-form">
      <h3>Publicar campaña</h3>
      <form @submit.prevent="guardarCampana" class="formulario">
        <div class="grupo">
          <label class="etiqueta">Título <span class="requerido">*</span></label>
          <input v-model="nuevo.titulo" type="text" placeholder="Ej: Separa bien tu residuo" class="entrada" />
        </div>
        <div class="grupo">
          <label class="etiqueta">Descripción</label>
          <textarea v-model="nuevo.descripcion" rows="3" class="entrada"></textarea>
        </div>
        <div class="form-row">
          <div class="grupo">
            <label class="etiqueta">Fecha de inicio <span class="requerido">*</span></label>
            <input v-model="nuevo.fechaInicio" type="date" class="entrada" />
          </div>
          <div class="grupo">
            <label class="etiqueta">Fecha de fin <span class="requerido">*</span></label>
            <input v-model="nuevo.fechaFin" type="date" class="entrada" />
          </div>
        </div>
        <div class="grupo">
          <label class="etiqueta">Estado</label>
          <select v-model="nuevo.estado" class="entrada">
            <option value="programada">Programada</option>
            <option value="activa">Activa</option>
            <option value="finalizada">Finalizada</option>
          </select>
        </div>
        <div class="acciones">
          <button type="button" class="btn btn-outline" @click="toggleNuevo">Cancelar</button>
          <button type="submit" class="btn btn-primary">Publicar campaña</button>
        </div>
      </form>
    </div>

    <table class="tabla">
      <thead>
        <tr>
          <th>Título</th>
          <th>Descripción</th>
          <th>Período</th>
          <th>Estado</th>
          <th>Publicado por</th>
          <th class="acciones-col">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="c in campañas" :key="c.id">
          <td>{{ c.titulo }}</td>
          <td>{{ c.descripcion }}</td>
          <td>{{ formatearFecha(c.fechaInicio) }} al {{ formatearFecha(c.fechaFin) }}</td>
          <td><span class="badge" :class="claseEstado(c.estado)">{{ c.estado }}</span></td>
          <td>{{ nombrePublicador(c.publicadoPor) }}</td>
          <td class="acciones-col">
            <button v-if="esAdmin" class="btn btn-outline btn-sm" @click="editarCampana(c)">Editar</button>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="campañas.length === 0 && !cargando" class="vacio">No hay campañas registradas.</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { inject } from 'vue'
import { validar, requerido, fechaValida } from '@/validations'
import { campañasService, perfilesService } from '@/services'

import Alerta from '@/components/Alerta.vue'

const auth = inject('auth')
const esAdmin = computed(() => auth && auth.rol === 'administrador')

const cargando = ref(true)
const error = ref(null)
const exito = ref(null)
const formAbierto = ref(false)

const campañas = ref([])
const perfiles = ref([])

const nuevo = ref({ titulo: '', descripcion: '', fechaInicio: '', fechaFin: '', estado: 'programada' })

const toggleNuevo = () => { formAbierto.value = !formAbierto.value }

const reglas = {
  titulo: [requerido],
  fechaInicio: [fechaValida],
  fechaFin: [fechaValida],
}

onMounted(async () => {
  const [rC, rP] = await Promise.all([campañasService.listar(), perfilesService.listar()])
  if (rC.exito) campañas.value = rC.data || []
  else error.value = rC.error?.message || 'No se pudieron cargar las campañas.'
  if (rP.exito) perfiles.value = rP.data || []
  cargando.value = false
})

function formatearFecha(iso) {
  if (!iso) return ''
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-AR')
}
function nombrePublicador(id) {
  const p = perfiles.value.find((x) => x.id === id)
  return p ? p.nombre : '—'
}
function claseEstado(e) {
  return { activa: 'badge-activo', programada: 'badge-pendiente', finalizada: 'badge-cancelada' }[e] || 'badge-pendiente'
}

async function guardarCampana() {
  const { valido, errores } = validar(nuevo.value, reglas)
  if (!valido) { error.value = 'Completá los campos obligatorios.'; return }
  const datos = { ...nuevo.value, publicadoPor: (auth && auth.usuario ? auth.usuario.id : '') }
  const r = await campañasService.crear(datos)
  if (r.exito) {
    campañas.value.push(r.data)
    exito.value = 'Campaña publicada correctamente.'
    toggleNuevo()
    nuevo.value = { titulo: '', descripcion: '', fechaInicio: '', fechaFin: '', estado: 'programada' }
  } else {
    error.value = r.error?.message || 'No se pudo publicar la campaña.'
  }
}

async function editarCampana(c) {
  const titulo = prompt('Nuevo título:', c.titulo)
  if (titulo === null) return
  const r = await campañasService.actualizar(c.id, { titulo })
  if (r.exito) { c.titulo = titulo; exito.value = 'Campaña actualizada.' }
  else error.value = r.error?.message || 'No se pudo actualizar la campaña.'
}
</script>

<style scoped>
.campanas { max-width: 1000px; margin: 0 auto; padding: 0 20px; }
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
.tabla tr:hover td { background: rgba(48, 109, 41, 0.04); }
.acciones-col { white-space: nowrap; }
.vacio { text-align: center; padding: 48px 24px; color: var(--color-texto-suave); }
@media (max-width: 600px) {
  .form-row { grid-template-columns: 1fr; }
  .encabezado { flex-direction: column; align-items: stretch; }
  .tabla { font-size: 0.75rem; }
  .tabla th, .tabla td { padding: 8px 6px; }
}
</style>
