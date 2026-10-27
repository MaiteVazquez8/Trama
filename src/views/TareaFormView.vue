<template>
  <div class="form-page">
    <div class="encabezado">
      <h1>{{ esEditar ? 'Editar tarea' : 'Nueva tarea' }}</h1>
      <p>{{ esEditar ? 'Actualizá los datos de la tarea seleccionada.' : 'Creá una tarea y asignala a una comisión y un responsable.' }}</p>
    </div>

    <Alerta v-if="errorGuardado" tipo="error" :mensaje="errorGuardado" />
    <Alerta v-if="mensajeExito" tipo="exito" :mensaje="mensajeExito" :duracion="4000" />

    <form @submit.prevent="manejarGuardar" class="formulario" :class="{ 'en-proceso': procesando }">
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
  const r = await tareasService.obtener(id)
  if (r.exito && r.data) {
    const d = r.data
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
  errorGuardado = null
  mensajeExito = null

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
.form-page { max-width: 640px; margin: 0 auto; padding: 0 20px; }
.encabezado { margin-bottom: 24px; }
.encabezado h1 { font-size: 1.75rem; margin: 0 0 6px 0; color: var(--color-verde-oscuro); }
.encabezado p { margin: 0; color: var(--color-texto-suave); }

.formulario { background: var(--color-blanco); border: 1px solid var(--color-borde); border-radius: 10px; padding: 24px; display: flex; flex-direction: column; gap: 16px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.grupo { display: flex; flex-direction: column; gap: 6px; }
.etiqueta { font-size: 0.9rem; font-weight: 700; color: var(--color-texto-suave); display: flex; align-items: center; gap: 6px; }
.requerido { color: var(--color-error); font-size: 0.85rem; }
.entrada { padding: 9px 12px; border: 1px solid var(--color-borde); border-radius: 6px; font-size: 0.95rem; background: var(--color-blanco); }
.entrada:disabled { background: #F2EEE0; cursor: not-allowed; }
textarea.entrada { resize: vertical; }
.error { color: var(--color-error); font-size: 0.85rem; margin-top: 2px; }
.acciones { display: flex; justify-content: flex-end; gap: 10px; margin-top: 6px; }
.btn { padding: 10px 18px; font-size: 0.95rem; }

@media (max-width: 600px) {
  .form-row { grid-template-columns: 1fr; }
}
</style>
