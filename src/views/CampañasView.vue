<template>
  <div class="campanas">
    <VistaEncabezado titulo="Campañas" subtitulo="Acciones de concientización ambiental">
      <template #accion>
        <button class="btn btn-primary" @click="toggleNuevo">
          {{ formAbierto ? 'Cancelar' : 'Nueva campaña' }}
        </button>
      </template>
    </VistaEncabezado>

    <Alerta v-if="error" tipo="error" :mensaje="error" />
    <Alerta v-if="exito" tipo="exito" :mensaje="exito" :duracion="4000" />

    <div class="estadisticas-fila">
      <TarjetaStat :texto="`${contarPorEstado('activa')} activas`" />
      <TarjetaStat :texto="`${contarPorEstado('programada')} planificadas`" />
      <TarjetaStat :texto="`${participantesTotal} participantes`" />
    </div>

    <div class="contenido-doble tarjetas-superiores">
      <div class="card destacada-card">
        <span class="etiqueta-seccion">Campaña destacada</span>
        <h2>{{ destacada ? destacada.titulo : 'Sin campañas activas' }}</h2>
        <img class="destacada-foto" src="/img/cubiertos-descartables.webp" alt="Vasos y cubiertos descartables de un solo uso" loading="lazy" />
        <p class="destacada-caption">
          <template v-if="destacada">
            {{ formatearFecha(destacada.fechaInicio) }} al {{ formatearFecha(destacada.fechaFin) }} · {{ destacada.descripcion }} · {{ estadoLegible(destacada.estado) }}
          </template>
          <template v-else>
            Cuando se publique una campaña activa, la vas a ver acá con su seguimiento.
          </template>
        </p>
      </div>

      <TarjetaDatos titulo="Otras campañas">
        <p v-for="c in otrasCampanas" :key="c.id" class="item-datos">
          {{ c.titulo }} <span class="campania-meta">· {{ formatearFecha(c.fechaInicio) }} – {{ formatearFecha(c.fechaFin) }} · {{ estadoLegible(c.estado) }}</span>
        </p>
        <p v-if="otrasCampanas.length === 0" class="item-datos">No hay otras campañas cargadas.</p>
      </TarjetaDatos>
    </div>

    <div v-if="formAbierto" class="card tarjeta-form">
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

    <div class="table-container card tarjeta-tabla">
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
              <button class="btn btn-outline btn-sm" @click="editarCampana(c)">Editar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="campañas.length === 0 && !cargando" class="vacio">No hay campañas registradas.</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { validar, requerido, fechaValida } from '@/validations'
import { campañasService, perfilesService, actividadesService } from '@/services'

import Alerta from '@/components/Alerta.vue'
import VistaEncabezado from '@/components/VistaEncabezado.vue'
import TarjetaStat from '@/components/TarjetaStat.vue'
import TarjetaDatos from '@/components/TarjetaDatos.vue'

const auth = inject('auth')

const cargando = ref(true)
const error = ref(null)
const exito = ref(null)
const formAbierto = ref(false)

const campañas = ref([])
const perfiles = ref([])
const actividades = ref([])

const nuevo = ref({ titulo: '', descripcion: '', fechaInicio: '', fechaFin: '', estado: 'programada' })

const toggleNuevo = () => { formAbierto.value = !formAbierto.value }

const reglas = {
  titulo: [requerido],
  fechaInicio: [fechaValida],
  fechaFin: [fechaValida],
}

const contarPorEstado = (estado) => campañas.value.filter((c) => c.estado === estado).length
const participantesTotal = computed(() => actividades.value.reduce((suma, a) => suma + Number(a.participantes || 0), 0))

const destacada = computed(() => campañas.value.find((c) => c.estado === 'activa') || campañas.value[0] || null)
const otrasCampanas = computed(() => campañas.value.filter((c) => c !== destacada.value).slice(0, 3))

onMounted(async () => {
  const [rC, rP, rA] = await Promise.all([
    campañasService.listar(),
    perfilesService.listar(),
    actividadesService.listar(),
  ])
  if (rC.exito) campañas.value = rC.data || []
  else error.value = rC.error?.message || 'No se pudieron cargar las campañas.'
  if (rP.exito) perfiles.value = rP.data || []
  if (rA.exito) actividades.value = rA.data || []
  cargando.value = false
})

function formatearFecha(iso) {
  if (!iso) return ''
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-AR')
}
function estadoLegible(estado) {
  return { activa: 'En curso', programada: 'Planificada', finalizada: 'Finalizada' }[estado] || estado
}
function nombrePublicador(id) {
  const p = perfiles.value.find((x) => x.id === id)
  return p ? p.nombre : '—'
}
function claseEstado(e) {
  return { activa: 'badge-activo', programada: 'badge-pendiente', finalizada: 'badge-cancelada' }[e] || 'badge-pendiente'
}

async function guardarCampana() {
  const { valido } = validar(nuevo.value, reglas)
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
.campanas { width: 100%; }

.tarjetas-superiores { margin-bottom: 16px; }
.tarjetas-superiores h2 { font-size: 1.05rem; margin-bottom: 8px; }

.etiqueta-seccion {
  display: block;
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-verde);
  margin-bottom: 6px;
}

.destacada-card { display: flex; flex-direction: column; gap: 10px; }
.destacada-foto { width: 100%; height: 170px; object-fit: cover; border-radius: var(--radio-tarjeta); display: block; }
.destacada-caption { font-size: 0.88rem; color: var(--texto-suave); }
.campania-meta { color: var(--texto-suave); font-size: 0.8rem; }

.tarjeta-form { margin-bottom: 16px; }
.tarjeta-form h3 { margin: 0 0 14px 0; font-size: 1.05rem; }
.formulario { display: flex; flex-direction: column; gap: 14px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.grupo { display: flex; flex-direction: column; gap: 6px; }
.etiqueta { font-size: 0.85rem; font-weight: 800; color: var(--texto-suave); display: flex; align-items: center; gap: 6px; }
.requerido { color: var(--error-texto); font-size: 0.8rem; }
.entrada { padding: 10px 14px; border: 1px solid var(--borde); border-radius: var(--radio-campo); font-size: 0.95rem; background: var(--fondo-tarjeta); color: var(--texto); }
textarea.entrada { resize: vertical; }
.acciones { display: flex; justify-content: flex-end; gap: 10px; margin-top: 6px; }

.tarjeta-tabla { padding: 0; overflow: hidden; }
.tarjeta-tabla .tabla { border: none; border-radius: 0; }
.acciones-col { white-space: nowrap; }

@media (max-width: 700px) {
  .form-row { grid-template-columns: 1fr; }
  .acciones { justify-content: stretch; flex-direction: column-reverse; }
}
</style>
