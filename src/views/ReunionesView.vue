<template>
  <div class="reuniones">
    <VistaEncabezado titulo="Reuniones" subtitulo="Agenda, asistencia y próximos encuentros">
      <template #accion>
        <button v-if="esAdmin" class="btn btn-primary" @click="toggleNuevo">
          {{ formAbierto ? 'Cancelar' : 'Agendar reunión' }}
        </button>
      </template>
    </VistaEncabezado>

    <Alerta v-if="error" tipo="error" :mensaje="error" />
    <Alerta v-if="exito" tipo="exito" :mensaje="exito" :duracion="4000" />

    <div class="estadisticas-fila">
      <TarjetaStat :texto="`${reuniones.length} reuniones`" />
      <TarjetaStat :texto="`${asistentesTotal} asistentes`" />
      <TarjetaStat :texto="`${acuerdos.length} acuerdos derivados`" />
    </div>

    <div class="contenido-doble tarjetas-superiores">
      <div class="card">
        <h2>Próximo encuentro</h2>
        <template v-if="proximaReunion">
          <p class="proxima-fecha">{{ formatoFechaLarga(proximaReunion.fecha) }}</p>
          <p class="proxima-temas">{{ proximaReunion.temas }}</p>
          <p class="proxima-asistentes">{{ proximaReunion.asistentes || 'Sin confirmación de asistentes' }}</p>
        </template>
        <p v-else class="proxima-asistentes">No hay reuniones programadas.</p>
      </div>

      <TarjetaDatos titulo="Agenda">
        <p v-for="a in agenda" :key="a.id" class="item-datos">
          <strong>{{ formatoFechaCorta(a.fechaPrevista) }}</strong> {{ a.tema }} <span class="agenda-estado">· {{ a.responsable ? nombreResponsable(a.responsable) : '' }}</span>
        </p>
        <p v-if="agenda.length === 0" class="item-datos">No hay temas agendados.</p>
      </TarjetaDatos>
    </div>

    <div v-if="formAbierto && esAdmin" class="card tarjeta-form">
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
          <input v-model="nuevo.asistentes" type="text" class="entrada" placeholder="Ej: 5 integrantes" />
        </div>
        <div class="acciones">
          <button type="button" class="btn btn-outline" @click="toggleNuevo">Cancelar</button>
          <button type="submit" class="btn btn-primary">Registrar reunión</button>
        </div>
      </form>
    </div>

    <div class="table-container card tarjeta-tabla">
      <table class="tabla">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Temas tratados</th>
            <th>Participantes</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in reunionesOrdenadas" :key="r.id">
            <td>{{ formatearFecha(r.fecha) }}</td>
            <td>{{ r.temas }}</td>
            <td>{{ r.asistentes || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="reuniones.length === 0 && !cargando" class="vacio">No hay reuniones registradas.</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { validar, requerido, fechaValida } from '@/validations'
import { reunionesService, acuerdosService, comisionesService } from '@/services'

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

const reuniones = ref([])
const acuerdos = ref([])
const comisiones = ref([])
const nuevo = ref({ fecha: '', temas: '', asistentes: '' })

const toggleNuevo = () => { formAbierto.value = !formAbierto.value }
const reglas = { fecha: [fechaValida], temas: [requerido] }

const reunionesOrdenadas = computed(() =>
  reuniones.value.slice().sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
)

const proximaReunion = computed(() => {
  const hoy = new Date().toISOString().split('T')[0]
  const futuras = reuniones.value.filter((r) => r.fecha >= hoy).sort((a, b) => (a.fecha < b.fecha ? -1 : 1))
  return futuras[0] || reunionesOrdenadas.value[0] || null
})

const agenda = computed(() =>
  acuerdos.value.slice().sort((a, b) => (a.fechaPrevista < b.fechaPrevista ? -1 : 1)).slice(0, 3)
)

const asistentesTotal = computed(() =>
  reuniones.value.reduce((suma, r) => {
    const match = String(r.asistentes || '').match(/\d+/)
    return suma + (match ? Number(match[0]) : 0)
  }, 0)
)

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

function nombreResponsable(id) {
  const c = comisiones.value.find((x) => x.id === id)
  return c ? c.nombre : ''
}

onMounted(async () => {
  const [r, rA, rC] = await Promise.all([
    reunionesService.listar(),
    acuerdosService.listar(),
    comisionesService.listar(),
  ])
  if (r.exito) reuniones.value = r.data || []
  else error.value = r.error?.message || 'No se pudieron cargar las reuniones.'
  if (rA.exito) acuerdos.value = rA.data || []
  if (rC.exito) comisiones.value = rC.data || []
  cargando.value = false
})

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
.reuniones { width: 100%; }

.tarjetas-superiores { margin-bottom: 16px; }
.tarjetas-superiores h2 { font-size: 1.05rem; margin-bottom: 10px; }

.proxima-fecha { font-size: 1rem; font-weight: 800; margin-bottom: 4px; }
.proxima-temas { font-size: 1.15rem; font-weight: 800; line-height: 1.25; margin-bottom: 8px; }
.proxima-asistentes { font-size: 0.88rem; color: var(--texto-suave); }
.agenda-estado { color: var(--texto-suave); font-size: 0.8rem; }

.tarjeta-form { margin-bottom: 16px; }
.tarjeta-form h3 { margin: 0 0 14px 0; font-size: 1.05rem; }
.formulario { display: flex; flex-direction: column; gap: 14px; }
.grupo { display: flex; flex-direction: column; gap: 6px; }
.etiqueta { font-size: 0.85rem; font-weight: 800; color: var(--texto-suave); display: flex; align-items: center; gap: 6px; }
.requerido { color: var(--error-texto); font-size: 0.8rem; }
.entrada { padding: 10px 14px; border: 1px solid var(--borde); border-radius: var(--radio-campo); font-size: 0.95rem; background: var(--fondo-tarjeta); color: var(--texto); }
textarea.entrada { resize: vertical; }
.acciones { display: flex; justify-content: flex-end; gap: 10px; margin-top: 6px; }

.tarjeta-tabla { padding: 0; overflow: hidden; }
.tarjeta-tabla .tabla { border: none; border-radius: 0; }

@media (max-width: 700px) {
  .acciones { justify-content: stretch; flex-direction: column-reverse; }
}
</style>
