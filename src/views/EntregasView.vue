<template>
  <div class="entregas">
    <VistaEncabezado titulo="Entregas" subtitulo="Retiros coordinados con la cooperativa externa">
      <template #accion>
        <button class="btn btn-primary" @click="toggleNuevo">
          {{ formAbierto ? 'Cancelar' : 'Programar entrega' }}
        </button>
      </template>
    </VistaEncabezado>

    <Alerta v-if="error" tipo="error" :mensaje="error" />
    <Alerta v-if="exito" tipo="exito" :mensaje="exito" :duracion="4000" />

    <div class="estadisticas-fila">
      <TarjetaStat :texto="`${entregas.length} entregas`" />
      <TarjetaStat :texto="`${kgEntregados} kg`" />
      <TarjetaStat :texto="`${porcentajeConfirmadas} % confirmadas`" />
    </div>

    <div class="contenido-doble tarjetas-superiores">
      <div class="card">
        <h2>Próxima entrega</h2>
        <template v-if="proximaEntrega">
          <p class="proxima-fecha">{{ formatoFechaLarga(proximaEntrega.fecha) }}</p>
          <p class="proxima-recibido">{{ proximaEntrega.recibidoPor || 'Cooperativa externa' }}</p>
          <p class="proxima-detalle">{{ proximaEntrega.materiales }} · {{ proximaEntrega.pesoTotalKg != null ? Number(proximaEntrega.pesoTotalKg).toFixed(1) + ' kg estimados' : 'peso a confirmar' }}</p>
        </template>
        <p v-else class="proxima-detalle">No hay entregas programadas.</p>
      </div>

      <TarjetaDatos titulo="Trazabilidad">
        <p v-for="e in entregasCompletadas" :key="e.id" class="item-datos">
          <strong>{{ formatoFechaCorta(e.fecha) }}</strong> {{ e.recibidoPor || 'Entrega' }} · {{ e.pesoTotalKg != null ? Number(e.pesoTotalKg).toFixed(0) + ' kg' : 's/d' }} · Entregada
        </p>
        <p v-if="entregasCompletadas.length === 0" class="item-datos">Todavía no hay entregas completadas.</p>
      </TarjetaDatos>
    </div>

    <div v-if="formAbierto && esAdmin" class="card tarjeta-form">
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
          <span class="error" v-if="errores.pesoTotalKg">{{ errores.pesoTotalKg }}</span>
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

    <div class="table-container card tarjeta-tabla">
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
          <tr v-for="e in entregasOrdenadas" :key="e.id">
            <td>{{ formatearFecha(e.fecha) }}</td>
            <td>{{ e.materiales }}</td>
            <td>{{ e.pesoTotalKg != null ? Number(e.pesoTotalKg).toFixed(1) : '—' }}</td>
            <td>{{ e.recibidoPor }}</td>
            <td><span class="badge" :class="claseEstado(e.estado)">{{ e.estado }}</span></td>
            <td class="acciones-col">
              <button class="btn btn-outline btn-sm" @click="editarEntrega(e)">Editar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="entregas.length === 0 && !cargando" class="vacio">No hay entregas registradas.</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { validar, requerido, fechaValida } from '@/validations'
import { entregasService } from '@/services'

import Alerta from '@/components/Alerta.vue'
import VistaEncabezado from '@/components/VistaEncabezado.vue'
import TarjetaStat from '@/components/TarjetaStat.vue'
import TarjetaDatos from '@/components/TarjetaDatos.vue'

const cargando = ref(true)
const error = ref(null)
const exito = ref(null)
const formAbierto = ref(false)
const errores = ref({})

const entregas = ref([])
const nuevo = ref({ fecha: '', materiales: '', pesoTotalKg: '', recibidoPor: '', estado: 'programada' })

const toggleNuevo = () => { formAbierto.value = !formAbierto.value }

// El peso es opcional: solo se valida si está completo.
const pesoOpcional = (valor) => {
  if (valor === '' || valor === null || valor === undefined) return null
  const n = Number(valor)
  if (!Number.isFinite(n)) return 'El peso debe ser un número válido.'
  if (n < 0) return 'El peso no puede ser negativo.'
  return null
}

const reglas = {
  fecha: [fechaValida],
  materiales: [requerido],
  pesoTotalKg: [pesoOpcional],
}

const hoy = new Date().toISOString().split('T')[0]

const entregasOrdenadas = computed(() => entregas.value.slice().sort((a, b) => (a.fecha < b.fecha ? 1 : -1)))
const entregasCompletadas = computed(() => entregasOrdenadas.value.filter((e) => e.estado === 'completada').slice(0, 3))
const proximaEntrega = computed(() => {
  const futuras = entregas.value.filter((e) => e.estado === 'programada' && e.fecha >= hoy)
  if (futuras.length) return futuras.slice().sort((a, b) => (a.fecha < b.fecha ? -1 : 1))[0]
  return entregasOrdenadas.value.find((e) => e.estado === 'programada') || null
})
const kgEntregados = computed(() =>
  Math.round(
    entregas.value
      .filter((e) => e.estado === 'completada')
      .reduce((suma, e) => suma + Number(e.pesoTotalKg || 0), 0)
  )
)
const porcentajeConfirmadas = computed(() => {
  if (!entregas.value.length) return 100
  const completadas = entregas.value.filter((e) => e.estado === 'completada').length
  return Math.round((completadas / entregas.value.length) * 100)
})

function formatoFechaCorta(iso) {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  return `${String(d.getDate()).padStart(2, '0')} ${d.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '').toUpperCase()}`
}

function formatoFechaLarga(iso) {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  const texto = d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function formatearFecha(iso) {
  if (!iso) return ''
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-AR')
}
function claseEstado(e) {
  return { completada: 'badge-activo', programada: 'badge-pendiente', cancelada: 'badge-cancelada' }[e] || 'badge-pendiente'
}

onMounted(async () => {
  const r = await entregasService.listar()
  if (r.exito) entregas.value = r.data || []
  else error.value = r.error?.message || 'No se pudieron cargar las entregas.'
  cargando.value = false
})

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
.entregas { width: 100%; }

.tarjetas-superiores { margin-bottom: 16px; }
.tarjetas-superiores h2 { font-size: 1.05rem; margin-bottom: 10px; }

.proxima-fecha { font-size: 1rem; font-weight: 800; }
.proxima-recibido { font-size: 1.1rem; font-weight: 800; margin: 4px 0 6px 0; }
.proxima-detalle { font-size: 0.9rem; color: var(--texto-suave); }

.tarjeta-form { margin-bottom: 16px; }
.tarjeta-form h3 { margin: 0 0 14px 0; font-size: 1.05rem; }
.formulario { display: flex; flex-direction: column; gap: 14px; }
.grupo { display: flex; flex-direction: column; gap: 6px; }
.etiqueta { font-size: 0.85rem; font-weight: 800; color: var(--texto-suave); display: flex; align-items: center; gap: 6px; }
.requerido { color: var(--error-texto); font-size: 0.8rem; }
.entrada { padding: 10px 14px; border: 1px solid var(--borde); border-radius: var(--radio-campo); font-size: 0.95rem; background: var(--fondo-tarjeta); color: var(--texto); }
.error { color: var(--error-texto); font-size: 0.82rem; margin-top: 2px; }
.acciones { display: flex; justify-content: flex-end; gap: 10px; margin-top: 6px; }

.tarjeta-tabla { padding: 0; overflow: hidden; }
.tarjeta-tabla .tabla { border: none; border-radius: 0; }
.acciones-col { white-space: nowrap; }

@media (max-width: 700px) {
  .acciones { justify-content: stretch; flex-direction: column-reverse; }
}
</style>
