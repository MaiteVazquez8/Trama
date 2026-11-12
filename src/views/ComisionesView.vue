<template>
  <div class="comisiones">
    <VistaEncabezado titulo="Comisiones" subtitulo="Equipos de trabajo y responsabilidades">
      <template #accion>
        <button v-if="esAdmin" class="btn btn-primary" @click="toggleNuevo">
          {{ formAbierto ? 'Cancelar' : 'Nueva comisión' }}
        </button>
      </template>
    </VistaEncabezado>

    <Alerta v-if="error" tipo="error" :mensaje="error" />
    <Alerta v-if="exito" tipo="exito" :mensaje="exito" :duracion="4000" />

    <div class="estadisticas-fila">
      <TarjetaStat :texto="`${comisiones.length} comisiones`" />
      <TarjetaStat :texto="`${integrantes} integrantes`" />
      <TarjetaStat :texto="`${tareas} tareas`" />
    </div>

    <div class="contenido-doble tarjetas-superiores">
      <div class="card">
        <h2>Equipos en actividad</h2>
        <ul class="equipos-lista">
          <li v-for="c in comisiones" :key="c.id">
            <span class="equipo-nombre">{{ c.nombre }}</span>
            <span class="equipo-detalle">{{ integrantesDe(c.id) }} integrantes · {{ resumen(c.descripcion) }}</span>
          </li>
          <li v-if="comisiones.length === 0" class="equipo-detalle">Todavía no hay comisiones cargadas.</li>
        </ul>
      </div>

      <TarjetaDatos titulo="Próximas reuniones">
        <p v-for="r in proximasReuniones" :key="r.id" class="item-datos">
          <strong>{{ formatoFecha(r.fecha) }}</strong> {{ r.temas }}
        </p>
        <p v-if="proximasReuniones.length === 0" class="item-datos">No hay reuniones cargadas.</p>
      </TarjetaDatos>
    </div>

    <div v-if="formAbierto && esAdmin" class="card tarjeta-form">
      <h3>Crear comisión</h3>
      <form @submit.prevent="guardarComision" class="formulario">
        <div class="grupo">
          <label class="etiqueta">Nombre <span class="requerido">*</span></label>
          <input v-model="nuevo.nombre" type="text" placeholder="Ej: Organización" class="entrada" />
        </div>
        <div class="grupo">
          <label class="etiqueta">Descripción</label>
          <textarea v-model="nuevo.descripcion" rows="3" placeholder="Responsabilidades de la comisión" class="entrada"></textarea>
        </div>
        <div class="acciones">
          <button type="button" class="btn btn-outline" @click="toggleNuevo">Cancelar</button>
          <button type="submit" class="btn btn-primary">Crear comisión</button>
        </div>
      </form>
    </div>

    <div class="table-container card tarjeta-tabla">
      <table class="tabla">
        <thead>
          <tr>
            <th>Comisión</th>
            <th>Función / Descripción</th>
            <th>Estado</th>
            <th class="acciones-col">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in comisiones" :key="c.id">
            <td>{{ c.nombre }}</td>
            <td>{{ c.descripcion || '—' }}</td>
            <td><span class="badge" :class="claseEstado(c.activo)">{{ c.activo ? 'Activa' : 'Inactiva' }}</span></td>
            <td class="acciones-col">
              <button v-if="esAdmin" class="btn btn-outline btn-sm" @click="editarComision(c)">Editar</button>
              <button v-if="esAdmin" class="btn btn-danger btn-sm" @click="cambiarEstadoComision(c)">{{ c.activo ? 'Desactivar' : 'Activar' }}</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="comisiones.length === 0 && !cargando" class="vacio">No hay comisiones registradas.</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { validar, requerido } from '@/validations'
import { comisionesService, perfilesService, tareasService, reunionesService } from '@/services'

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

const comisiones = ref([])
const perfiles = ref([])
const tareas = ref(0)
const reuniones = ref([])
const nuevo = ref({ nombre: '', descripcion: '' })

const toggleNuevo = () => { formAbierto.value = !formAbierto.value }
const reglas = { nombre: [requerido] }

const integrantes = computed(() => perfiles.value.filter((p) => p.rol === 'integrante').length)
const integrantesDe = (id) => perfiles.value.filter((p) => p.comision === id).length

const proximasReuniones = computed(() =>
  [...reuniones.value]
    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
    .slice(0, 3)
)

function resumen(descripcion) {
  if (!descripcion) return 'Equipo de trabajo'
  return descripcion.split('.')[0].split(',')[0].trim()
}

function formatoFecha(iso) {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  return `${String(d.getDate()).padStart(2, '0')} ${d.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '').toUpperCase()}`
}

onMounted(async () => {
  const [rC, rP, rT, rR] = await Promise.all([
    comisionesService.listar(),
    perfilesService.listar(),
    tareasService.listar(),
    reunionesService.listar(),
  ])
  if (rC.exito) comisiones.value = rC.data || []
  else error.value = rC.error?.message || 'No se pudieron cargar las comisiones.'
  if (rP.exito) perfiles.value = rP.data || []
  if (rT.exito) tareas.value = (rT.data || []).length
  if (rR.exito) reuniones.value = rR.data || []
  cargando.value = false
})

function claseEstado(activo) {
  return activo ? 'badge-activo' : 'badge-cancelada'
}

async function guardarComision() {
  const { valido } = validar(nuevo.value, reglas)
  if (!valido) { error.value = 'El nombre es obligatorio.'; return }
  const r = await comisionesService.crear({ nombre: nuevo.value.nombre, descripcion: nuevo.value.descripcion })
  if (r.exito) {
    comisiones.value.push(r.data)
    exito.value = 'Comisión creada correctamente.'
    toggleNuevo()
    nuevo.value = { nombre: '', descripcion: '' }
  } else {
    error.value = r.error?.message || 'No se pudo crear la comisión.'
  }
}

async function editarComision(c) {
  const nombre = prompt('Nuevo nombre:', c.nombre)
  if (nombre === null) return
  const r = await comisionesService.actualizar(c.id, { nombre })
  if (r.exito) { c.nombre = nombre; exito.value = 'Comisión actualizada.' }
  else error.value = r.error?.message || 'No se pudo actualizar la comisión.'
}

async function cambiarEstadoComision(c) {
  const r = await comisionesService.actualizar(c.id, { activo: !c.activo })
  if (r.exito) {
    c.activo = !c.activo
    exito.value = `Comisión ${c.activo ? 'activada' : 'desactivada'}.`
  } else {
    error.value = r.error?.message || 'No se pudo cambiar el estado de la comisión.'
  }
}
</script>

<style scoped>
.comisiones { width: 100%; }

.tarjetas-superiores { margin-bottom: 16px; }
.tarjetas-superiores h2 { font-size: 1.05rem; margin-bottom: 8px; }

.equipos-lista { display: flex; flex-direction: column; gap: 8px; }
.equipos-lista li { border-top: 1px solid var(--borde); padding-top: 8px; font-size: 0.9rem; }
.equipos-lista li:first-child { border-top: none; padding-top: 0; }
.equipo-nombre { font-weight: 800; margin-right: 6px; }
.equipo-detalle { color: var(--texto-suave); font-size: 0.85rem; }

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
.acciones-col { white-space: nowrap; }
.acciones-col .btn { margin-bottom: 6px; width: 100%; }

@media (max-width: 700px) {
  .acciones-col .btn { width: auto; margin-bottom: 4px; }
  .acciones { justify-content: stretch; flex-direction: column-reverse; }
}
</style>
