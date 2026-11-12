<template>
  <div class="form-page">
    <VistaEncabezado
      :titulo="esEditar ? 'Editar tarea' : 'Nueva tarea'"
      :subtitulo="esEditar ? 'Actualizá los datos de la tarea seleccionada.' : 'Creá una tarea y asignala a una comisión y un responsable.'"
    >
      <template #accion>
        <button type="submit" form="tarea-form" class="btn btn-primary" :disabled="procesando">
          {{ procesando ? 'Guardando…' : esEditar ? 'Actualizar tarea' : 'Crear tarea' }}
        </button>
      </template>
    </VistaEncabezado>

    <Alerta v-if="errorGuardado" tipo="error" :mensaje="errorGuardado" />
    <Alerta v-if="mensajeExito" tipo="exito" :mensaje="mensajeExito" :duracion="4000" />

    <form id="tarea-form" @submit.prevent="manejarGuardar" class="card formulario" :class="{ 'en-proceso': procesando }">
      <div class="grupo">
        <label class="etiqueta">Título <span class="requerido">*</span></label>
        <input type="text" v-model="form.titulo" placeholder="Ej: Revisar estado de tachos del patio" class="entrada" :disabled="procesando" />
        <span class="error" v-if="errores.titulo">{{ errores.titulo }}</span>
      </div>

      <div class="grupo">
        <label class="etiqueta">Descripción</label>
        <textarea v-model="form.descripcion" rows="3" placeholder="Detalle de la tarea a realizar" class="entrada" :disabled="procesando"></textarea>
      </div>

      <div class="form-row">
        <div class="grupo">
          <label class="etiqueta">Comisión <span class="requerido">*</span></label>
          <select v-model="form.comision" class="entrada" :disabled="procesando">
            <option value="">Seleccioná una comisión</option>
            <option v-for="c in comisiones" :key="c.id" :value="c.id">{{ c.nombre }}</option>
          </select>
          <span class="error" v-if="errores.comision">{{ errores.comision }}</span>
        </div>

        <div class="grupo">
          <label class="etiqueta">Responsable <span class="requerido">*</span></label>
          <select v-model="form.responsable" class="entrada" :disabled="procesando">
            <option value="">Seleccioná un integrante</option>
            <option v-for="p in perfilesIntegrantes" :key="p.id" :value="p.id">{{ p.nombre }}</option>
          </select>
          <span class="error" v-if="errores.responsable">{{ errores.responsable }}</span>
        </div>
      </div>

      <div class="grupo">
        <label class="etiqueta">Fecha <span class="requerido">*</span></label>
        <input type="date" v-model="form.fecha" class="entrada" :disabled="procesando" />
        <span class="error" v-if="errores.fecha">{{ errores.fecha }}</span>
      </div>

      <div class="grupo" v-if="esEditar">
        <label class="etiqueta">Estado</label>
        <select v-model="form.estado" class="entrada" :disabled="procesando">
          <option value="pendiente">Pendiente</option>
          <option value="completada">Completada</option>
          <option value="cancelada">Cancelada</option>
        </select>
      </div>

      <div class="acciones">
        <button type="button" class="btn btn-outline" @click="volver" :disabled="procesando">Volver a tareas</button>
        <button type="submit" class="btn btn-primary" :disabled="procesando">
          {{ procesando ? 'Guardando...' : esEditar ? 'Actualizar tarea' : 'Crear tarea' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { inject } from 'vue'
import { validar, requerido, fechaValida, seleccionValida } from '@/validations'
import { tareasService, comisionesService, perfilesService } from '@/services'

import Alerta from '@/components/Alerta.vue'
import VistaEncabezado from '@/components/VistaEncabezado.vue'

const auth = inject('auth')
const router = useRouter()
const route = useRoute()

const esEditar = computed(() => !!route.params.id)
const procesando = ref(false)
const errorGuardado = ref(null)
const mensajeExito = ref(null)

const form = ref({
  titulo: '',
  descripcion: '',
  comision: '',
  responsable: '',
  fecha: '',
  estado: 'pendiente',
})
const errores = ref({})
const comisiones = ref([])
const perfiles = ref([])

const perfilesIntegrantes = computed(() =>
  perfiles.value.filter((p) => p.rol === 'integrante' && p.activo)
)

const reglas = {
  titulo: [requerido],
  comision: [seleccionValida],
  responsable: [seleccionValida],
  fecha: [fechaValida],
}

onMounted(async () => {
  const [rComisiones, rPerfiles] = await Promise.all([
    comisionesService.listar(),
    perfilesService.listar(),
  ])
  if (rComisiones.exito) comisiones.value = rComisiones.data || []
  if (rPerfiles.exito) perfiles.value = rPerfiles.data || []

  if (esEditar.value) cargarTarea(route.params.id)
})

async function cargarTarea(id) {
  // tareasService no expone obtener(id): se resuelve desde el listado.
  const r = await tareasService.listar()
  const d = r.exito ? (r.data || []).find((t) => String(t.id) === String(id)) : null
  if (r.exito && d) {
    form.value = {
      titulo: d.titulo,
      descripcion: d.descripcion || '',
      comision: d.comision,
      responsable: d.responsable,
      fecha: d.fecha,
      estado: d.estado,
    }
  } else {
    errorGuardado.value = r.error?.message || 'No se pudo cargar la tarea.'
  }
}

async function manejarGuardar() {
  const { valido, errores: errs } = validar(form.value, reglas)
  errores.value = errs
  if (!valido) return

  procesando.value = true
  errorGuardado.value = null
  mensajeExito.value = null

  try {
    const datos = {
      titulo: form.value.titulo,
      descripcion: form.value.descripcion,
      comision: form.value.comision,
      responsable: form.value.responsable,
      fecha: form.value.fecha,
      estado: form.value.estado,
    }

    let r
    if (esEditar.value) {
      r = await tareasService.actualizar(route.params.id, datos)
      if (r.exito) mensajeExito.value = 'Tarea actualizada correctamente.'
      else errorGuardado.value = r.error?.message || 'No se pudo actualizar la tarea.'
    } else {
      r = await tareasService.crear(datos)
      if (r.exito) {
        mensajeExito.value = 'Tarea creada correctamente.'
        form.value = { titulo: '', descripcion: '', comision: '', responsable: '', fecha: '', estado: 'pendiente' }
      } else {
        errorGuardado.value = r.error?.message || 'No se pudo crear la tarea.'
      }
    }
  } catch (e) {
    errorGuardado.value = 'Error de conexión al guardar la tarea.'
  } finally {
    procesando.value = false
  }
}

function volver() { router.push({ name: 'tareas' }) }
</script>

<style scoped>
.form-page { width: 100%; max-width: 760px; }

.formulario { display: flex; flex-direction: column; gap: 16px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.grupo { display: flex; flex-direction: column; gap: 6px; }
.etiqueta { font-size: 0.85rem; font-weight: 800; color: var(--texto-suave); display: flex; align-items: center; gap: 6px; }
.requerido { color: var(--error-texto); font-size: 0.8rem; }
.entrada { padding: 10px 14px; border: 1px solid var(--borde); border-radius: var(--radio-campo); font-size: 0.95rem; background: var(--fondo-tarjeta); color: var(--texto); }
.entrada:focus { outline: none; border-color: var(--verde); }
.entrada:disabled { background: var(--fondo-encabezado-tabla); cursor: not-allowed; }
textarea.entrada { resize: vertical; }
.error { color: var(--error-texto); font-size: 0.82rem; margin-top: 2px; }
.acciones { display: flex; justify-content: flex-end; gap: 10px; margin-top: 6px; }

@media (max-width: 600px) {
  .form-row { grid-template-columns: 1fr; }
  .acciones { justify-content: stretch; flex-direction: column-reverse; }
  .acciones .btn { width: 100%; }
}
</style>
