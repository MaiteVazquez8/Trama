<template>
  <div class="form-page">
    <div class="encabezado">
      <h1>{{ esEditar ? 'Editar registro de residuos' : 'Registrar residuos' }}</h1>
      <p>{{ esEditar ? 'Actualizá los datos del registro seleccionado.' : 'Cargá la información sobre los materiales recolectados.' }}</p>
    </div>

    <Alerta v-if="errorGuardado" tipo="error" :mensaje="errorGuardado" />
    <Alerta v-if="mensajeExito" tipo="exito" :mensaje="mensajeExito" :duracion="4000" />

    <form @submit.prevent="manejarGuardar" class="formulario" :class="{ 'en-proceso': procesando }">
      <div class="form-row">
        <div class="grupo">
          <label class="etiqueta">Tipo de residuo <span class="requerido">*</span></label>
          <select v-model="form.tipoResiduo" class="entrada" :disabled="procesando">
            <option value="">Seleccioná un tipo de material</option>
            <option v-for="t in tiposResiduo" :key="t.id" :value="t.id">{{ t.nombre }}</option>
          </select>
          <span class="error" v-if="errores.tipoResiduo">{{ errores.tipoResiduo }}</span>
        </div>

        <div class="grupo">
          <label class="etiqueta">Cantidad (kg) <span class="requerido">*</span></label>
          <input type="number" step="0.01" min="0" v-model.number="form.cantidadKg" placeholder="Ej: 3.5" class="entrada" :disabled="procesando" />
          <span class="error" v-if="errores.cantidadKg">{{ errores.cantidadKg }}</span>
        </div>
      </div>

      <div class="form-row">
        <div class="grupo">
          <label class="etiqueta">Lugar de recolección <span class="requerido">*</span></label>
          <input type="text" v-model="form.lugar" placeholder="Ej: Patio central, Pasillo planta baja" class="entrada" :disabled="procesando" />
          <span class="error" v-if="errores.lugar">{{ errores.lugar }}</span>
        </div>

        <div class="grupo">
          <label class="etiqueta">Fecha <span class="requerido">*</span></label>
          <input type="date" v-model="form.fecha" class="entrada" :disabled="procesando" :max="fechaMax" />
          <span class="error" v-if="errores.fecha">{{ errores.fecha }}</span>
        </div>
      </div>

      <div class="grupo">
        <label class="etiqueta">Registrado por</label>
        <input type="text" :value="usuarioNombre" class="entrada" readonly />
      </div>

      <div class="acciones">
        <button type="button" class="btn btn-outline" @click="volver" :disabled="procesando">Volver al historial</button>
        <button type="submit" class="btn btn-primary" :disabled="procesando">
          {{ procesando ? 'Guardando...' : esEditar ? 'Actualizar registro' : 'Registrar residuos' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { inject } from 'vue'
import { validar, requerido, numeroPositivo, fechaValida, seleccionValida } from '@/validations'
import { registrosResiduoService, tiposResiduoService } from '@/services'

import Alerta from '@/components/Alerta.vue'

const auth = inject('auth')
const router = useRouter()
const route = useRoute()

const esEditar = computed(() => !!route.params.id)
const procesando = ref(false)
const errorGuardado = ref(null)
const mensajeExito = ref(null)

const form = ref({
  tipoResiduo: '',
  cantidadKg: '',
  lugar: '',
  fecha: '',
})
const errores = ref({})
const tiposResiduo = ref([])

const fechaMax = computed(() => new Date().toISOString().split('T')[0])

const usuarioNombre = computed(() => (auth && auth.usuario ? auth.usuario.nombre : '—'))

const reglas = {
  tipoResiduo: [seleccionValida],
  cantidadKg: [numeroPositivo],
  lugar: [requerido],
  fecha: [fechaValida],
}

onMounted(async () => {
  const r = await tiposResiduoService.listar()
  if (r.exito) tiposResiduo.value = r.data

  if (esEditar.value) {
    cargarRegistro(route.params.id)
  }
})

async function cargarRegistro(id) {
  const r = await registrosResiduoService.obtener(id)
  if (r.exito && r.data) {
    const d = r.data
    form.value = {
      tipoResiduo: d.tipoResiduo,
      cantidadKg: d.cantidadKg,
      lugar: d.lugar,
      fecha: d.fecha,
    }
  } else {
    errorGuardado.value = r.error?.message || 'No se pudo cargar el registro.'
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
    if (esEditar.value) {
      const r = await registrosResiduoService.actualizar(route.params.id, {
        tipoResiduo: form.value.tipoResiduo,
        cantidadKg: Number(form.value.cantidadKg),
        lugar: form.value.lugar,
        fecha: form.value.fecha,
      })
      if (r.exito) {
        mensajeExito.value = 'Registro actualizado correctamente.'
      } else {
        errorGuardado.value = r.error?.message || 'No se pudo actualizar el registro.'
      }
    } else {
      const r = await registrosResiduoService.crear({
        tipoResiduo: form.value.tipoResiduo,
        cantidadKg: Number(form.value.cantidadKg),
        lugar: form.value.lugar,
        fecha: form.value.fecha,
        registradoPor: auth && auth.usuario ? auth.usuario.id : 'desconocido',
      })
      if (r.exito) {
        mensajeExito.value = 'Registro de residuos guardado correctamente.'
        form.value = { tipoResiduo: '', cantidadKg: '', lugar: '', fecha: '' }
      } else {
        errorGuardado.value = r.error?.message || 'No se pudo guardar el registro.'
      }
    }
  } catch (e) {
    errorGuardado.value = 'Error de conexión al guardar el registro.'
  } finally {
    procesando.value = false
  }
}

function volver() { router.push({ name: 'historial-residuos' }) }
</script>

<style scoped>
.form-page { max-width: 640px; margin: 0 auto; padding: 0 20px; }
.encabezado { margin-bottom: 24px; }
.encabezado h1 { font-size: 1.75rem; margin: 0 0 6px 0; color: var(--color-verde-oscuro); }
.encabezado p { margin: 0; color: var(--color-texto-suave); }

.formulario { background: var(--color-blanco); border: 1px solid var(--color-borde); border-radius: 10px; padding: 24px; display: flex; flex-direction: column; gap: 18px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.grupo { display: flex; flex-direction: column; gap: 6px; }
.etiqueta { font-size: 0.9rem; font-weight: 700; color: var(--color-texto-suave); display: flex; align-items: center; gap: 6px; }
.requerido { color: var(--color-error); font-size: 0.85rem; }
.entrada { padding: 9px 12px; border: 1px solid var(--color-borde); border-radius: 6px; font-size: 0.95rem; background: var(--color-blanco); }
.entrada:disabled { background: #F2EEE0; cursor: not-allowed; }
.error { color: var(--color-error); font-size: 0.85rem; margin-top: 2px; }
.acciones { display: flex; justify-content: flex-end; gap: 10px; margin-top: 4px; }
.btn { padding: 10px 18px; font-size: 0.95rem; }

@media (max-width: 600px) {
  .form-row { grid-template-columns: 1fr; }
}
</style>
