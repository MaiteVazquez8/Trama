<template>
  <div class="form-page">
    <VistaEncabezado
      :titulo="esEditar ? 'Editar registro de residuos' : 'Registro de residuos'"
      :subtitulo="esEditar ? 'Actualizá los datos del registro seleccionado.' : 'Carga y seguimiento de materiales recuperados'"
    >
      <template #accion>
        <button type="submit" form="residuo-form" class="btn btn-primary" :disabled="procesando">
          {{ procesando ? 'Guardando…' : 'Guardar registro' }}
        </button>
      </template>
    </VistaEncabezado>

    <Alerta v-if="errorGuardado" tipo="error" :mensaje="errorGuardado" />
    <Alerta v-if="mensajeExito" tipo="exito" :mensaje="mensajeExito" :duracion="4000" />

    <div class="estadisticas-fila">
      <TarjetaStat :texto="`${kgEsteMes} kg este mes`" />
      <TarjetaStat :texto="`${totalRegistros} registros`" />
      <TarjetaStat :texto="`${porcentajeCarton} % cartón`" />
    </div>

    <div class="contenido-doble">
      <form id="residuo-form" @submit.prevent="manejarGuardar" class="card formulario" :class="{ 'en-proceso': procesando }">
        <h2>{{ esEditar ? 'Editar registro' : 'Nuevo registro' }}</h2>

        <div class="grupo">
          <label class="etiqueta">Tipo de residuo <span class="requerido">*</span></label>
          <select v-model="form.tipoResiduo" class="entrada" :disabled="procesando">
            <option value="">Seleccioná un tipo de material</option>
            <option v-for="t in tiposResiduo" :key="t.id" :value="t.id">{{ t.nombre }}</option>
          </select>
          <span class="error" v-if="errores.tipoResiduo">{{ errores.tipoResiduo }}</span>
        </div>

        <div class="form-row">
          <div class="grupo">
            <label class="etiqueta">Peso (kg) <span class="requerido">*</span></label>
            <input type="number" step="0.01" min="0" v-model.number="form.cantidadKg" placeholder="18,5" class="entrada" :disabled="procesando" />
            <span class="error" v-if="errores.cantidadKg">{{ errores.cantidadKg }}</span>
          </div>

          <div class="grupo">
            <label class="etiqueta">Fecha <span class="requerido">*</span></label>
            <input type="date" v-model="form.fecha" class="entrada" :disabled="procesando" :max="fechaMax" />
            <span class="error" v-if="errores.fecha">{{ errores.fecha }}</span>
          </div>
        </div>

        <div class="grupo">
          <label class="etiqueta">Origen <span class="requerido">*</span></label>
          <input type="text" v-model="form.lugar" placeholder="Ej: Edificio principal" class="entrada" :disabled="procesando" />
          <span class="error" v-if="errores.lugar">{{ errores.lugar }}</span>
        </div>

        <div class="grupo">
          <label class="etiqueta">Registrado por</label>
          <input type="text" :value="usuarioNombre" class="entrada" readonly />
        </div>

        <div class="acciones">
          <button type="button" class="btn btn-outline" @click="volver" :disabled="procesando">Volver al historial</button>
          <button type="submit" class="btn btn-primary" :disabled="procesando">
            {{ procesando ? 'Guardando…' : esEditar ? 'Actualizar registro' : 'Guardar registro' }}
          </button>
        </div>
      </form>

      <TarjetaDatos titulo="Registros recientes">
        <p v-for="r in registrosRecientes" :key="r.id" class="item-datos">
          <strong>{{ formatoFecha(r.fecha) }}</strong> {{ tipoNombre(r.tipoResiduo) }} · {{ Number(r.cantidadKg).toFixed(1) }} kg · {{ estadoLegible(r.estado) }}
        </p>
        <p v-if="registrosRecientes.length === 0" class="item-datos">Todavía no hay registros.</p>
      </TarjetaDatos>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { inject } from 'vue'
import { validar, requerido, numeroPositivo, fechaValida, seleccionValida } from '@/validations'
import { registrosResiduoService, tiposResiduoService, estadisticasService } from '@/services'

import Alerta from '@/components/Alerta.vue'
import VistaEncabezado from '@/components/VistaEncabezado.vue'
import TarjetaStat from '@/components/TarjetaStat.vue'
import TarjetaDatos from '@/components/TarjetaDatos.vue'

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
const registrosRecientes = ref([])
const totalRegistros = ref(0)
const kgEsteMes = ref(0)
const porcentajeCarton = ref(0)

const fechaMax = computed(() => new Date().toISOString().split('T')[0])

const usuarioNombre = computed(() => (auth && auth.usuario ? auth.usuario.nombre : '—'))

const reglas = {
  tipoResiduo: [seleccionValida],
  cantidadKg: [numeroPositivo],
  lugar: [requerido],
  fecha: [fechaValida],
}

onMounted(async () => {
  const [rTipos, rResumen, rListado] = await Promise.all([
    tiposResiduoService.listar(),
    estadisticasService.resumen(),
    registrosResiduoService.listar(),
  ])
  if (rTipos.exito) tiposResiduo.value = rTipos.data
  if (rResumen.exito) {
    const d = rResumen.datos
    kgEsteMes.value = Math.round(d.recuperadoKgMes || 0)
    totalRegistros.value = d.totalRegistros || 0
  }
  if (rListado.exito) {
    const lista = rListado.data || []
    const activos = lista.filter((r) => r.estado === 'activo')
    registrosRecientes.value = activos.slice(0, 3)
    const deCarton = activos.filter((r) => r.tipoResiduo === 'tr-1').length
    porcentajeCarton.value = activos.length ? Math.round((deCarton / activos.length) * 100) : 0
  }

  if (esEditar.value) {
    cargarRegistro(route.params.id)
  }
})

function tipoNombre(id) {
  const t = tiposResiduo.value.find((x) => x.id === id)
  return t ? t.nombre : '—'
}

function estadoLegible(estado) {
  return estado === 'activo' ? 'Activo' : 'Cancelado'
}

function formatoFecha(iso) {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  return `${String(d.getDate()).padStart(2, '0')} ${d.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '').toUpperCase()}`
}

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
  errorGuardado.value = null
  mensajeExito.value = null

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
.form-page { width: 100%; }

.formulario {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.formulario h2 { font-size: 1.05rem; }

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.grupo { display: flex; flex-direction: column; gap: 6px; }
.etiqueta { font-size: 0.85rem; font-weight: 800; color: var(--texto-suave); display: flex; align-items: center; gap: 6px; }
.requerido { color: var(--error-texto); font-size: 0.8rem; }
.entrada { padding: 10px 14px; border: 1px solid var(--borde); border-radius: var(--radio-campo); font-size: 0.95rem; background: var(--fondo-tarjeta); color: var(--texto); }
.entrada:focus { outline: none; border-color: var(--verde); }
.entrada:disabled, .entrada[readonly] { background: var(--fondo-encabezado-tabla); cursor: not-allowed; }
.error { color: var(--error-texto); font-size: 0.82rem; margin-top: 2px; }
.acciones { display: flex; justify-content: flex-end; gap: 10px; margin-top: 4px; }

@media (max-width: 600px) {
  .form-row { grid-template-columns: 1fr; }
  .acciones { justify-content: stretch; flex-direction: column-reverse; }
  .acciones .btn { width: 100%; }
}
</style>
