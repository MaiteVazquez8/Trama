<template>
  <div class="tachos">
    <div class="encabezado">
      <div>
        <h1>Tachos</h1>
        <p>Consultá los tachos disponibles, su ubicación y el tipo de residuos que corresponde colocar en cada uno.</p>
      </div>
      <button v-if="esAdmin" class="btn btn-primary" @click="toggleNuevo">
        {{ formularioAbierto ? 'Cancelar' : '+ Nuevo tacho' }}
      </button>
    </div>

    <Alerta v-if="error" tipo="error" :mensaje="error" />
    <Alerta v-if="exito" tipo="exito" :mensaje="exito" :duracion="4000" />

    <div v-if="formularioAbierto && esAdmin" class="tarjeta-form">
      <h3>Registrar tacho</h3>
      <form @submit.prevent="guardarTacho" class="formulario">
        <div class="form-row">
          <div class="grupo">
            <label class="etiqueta">Nombre del tacho <span class="requerido">*</span></label>
            <input v-model="nuevo.nombre" type="text" placeholder="Ej: Tacho Patio - Papel y cartón" class="entrada" />
          </div>
          <div class="grupo">
            <label class="etiqueta">Ubicación <span class="requerido">*</span></label>
            <input v-model="nuevo.ubicacion" type="text" placeholder="Ej: Patio central" class="entrada" />
          </div>
        </div>
        <div class="grupo">
          <label class="etiqueta">Tipo de residuo <span class="requerido">*</span></label>
          <select v-model="nuevo.tipoResiduo" class="entrada">
            <option value="">Seleccioná un tipo de material</option>
            <option v-for="t in tiposResiduo" :key="t.id" :value="t.id">{{ t.nombre }}</option>
          </select>
        </div>
        <div class="acciones">
          <button type="button" class="btn btn-outline" @click="toggleNuevo">Cancelar</button>
          <button type="submit" class="btn btn-primary">Guardar tacho</button>
        </div>
      </form>
    </div>

    <table class="tabla">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Ubicación</th>
          <th>Tipo de residuo</th>
          <th>Estado</th>
          <th class="acciones-col">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="t in tachos" :key="t.id">
          <td>{{ t.nombre }}</td>
          <td>{{ t.ubicacion }}</td>
          <td>{{ tipoNombre(t.tipoResiduo) }}</td>
          <td><span class="badge badge-activo">{{ t.activo ? 'Activo' : 'Inactivo' }}</span></td>
          <td class="acciones-col">
            <button v-if="esAdmin" class="btn btn-outline btn-sm" @click="editarTacho(t)">Editar</button>
            <button v-if="esAdmin" class="btn btn-danger btn-sm" @click="cambiarEstadoTacho(t)">{{ t.activo ? 'Desactivar' : 'Activar' }}</button>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="tachos.length === 0 && !cargando" class="vacio">No hay tachos registrados.</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { inject } from 'vue'
import { validar, requerido, seleccionValida } from '@/validations'
import { tachosService, tiposResiduoService } from '@/services'

import Alerta from '@/components/Alerta.vue'

const auth = inject('auth')
const esAdmin = computed(() => auth && auth.rol === 'administrador')

const cargando = ref(true)
const error = ref(null)
const exito = ref(null)
const formularioAbierto = ref(false)

const tachos = ref([])
const tiposResiduo = ref([])

const nuevo = ref({ nombre: '', ubicacion: '', tipoResiduo: '' })

const toggleNuevo = () => { formularioAbierto.value = !formularioAbierto.value }

const reglas = {
  nombre: [requerido],
  ubicacion: [requerido],
  tipoResiduo: [seleccionValida],
}

onMounted(async () => {
  const [rTachos, rTipos] = await Promise.all([
    tachosService.listar(),
    tiposResiduoService.listar(),
  ])
  if (rTachos.exito) tachos.value = rTachos.data || []
  else error.value = rTachos.error?.message || 'No se pudieron cargar los tachos.'
  if (rTipos.exito) tiposResiduo.value = rTipos.data || []
  cargando.value = false
})

function tipoNombre(id) {
  const t = tiposResiduo.value.find((x) => x.id === id)
  return t ? t.nombre : '—'
}

async function guardarTacho() {
  const { valido, errores } = validar(nuevo.value, reglas)
  if (!valido) { error.value = 'Completá todos los campos obligatorios.'; return }
  const r = await tachosService.crear({
    nombre: nuevo.value.nombre,
    ubicacion: nuevo.value.ubicacion,
    tipoResiduo: nuevo.value.tipoResiduo,
  })
  if (r.exito) {
    tachos.value.push(r.data)
    exito.value = 'Tacho registrado correctamente.'
    toggleNuevo()
    nuevo.value = { nombre: '', ubicacion: '', tipoResiduo: '' }
  } else {
    error.value = r.error?.message || 'No se pudo registrar el tacho.'
  }
}

async function editarTacho(t) {
  const nombre = prompt('Nuevo nombre del tacho:', t.nombre)
  if (nombre === null) return
  const r = await tachosService.actualizar(t.id, { nombre })
  if (r.exito) { t.nombre = nombre; exito.value = 'Tacho actualizado.' }
  else error.value = r.error?.message || 'No se pudo actualizar el tacho.'
}

async function cambiarEstadoTacho(t) {
  const r = await tachosService.actualizar(t.id, { activo: !t.activo })
  if (r.exito) {
    t.activo = !t.activo
    exito.value = `Tacho ${t.activo ? 'activado' : 'desactivado'}.`
  } else {
    error.value = r.error?.message || 'No se pudo cambiar el estado del tacho.'
  }
}
</script>

<style scoped>
.tachos { max-width: 1000px; margin: 0 auto; padding: 0 20px; }
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
.error { color: var(--color-error); font-size: 0.85rem; margin-top: 2px; }
.acciones { display: flex; justify-content: flex-end; gap: 10px; margin-top: 6px; }
.btn { padding: 10px 18px; font-size: 0.95rem; }

.tabla { width: 100%; border-collapse: collapse; background: var(--color-blanco); border: 1px solid var(--color-borde); border-radius: 8px; font-size: 0.9rem; margin-top: 8px; }
.tabla th, .tabla td { padding: 12px 14px; text-align: left; border-bottom: 1px solid var(--color-borde); }
.tabla th { background: var(--color-gris-claro); font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.4px; color: var(--color-texto-suave); }
.tabla tr:last-child td { border-bottom: none; }
.tabla tr:hover td { background: rgba(48, 109, 41, 0.04); }
.acciones-col { white-space: nowrap; }
.acciones-col .btn { margin-bottom: 6px; width: 100%; }

.vacio { text-align: center; padding: 48px 24px; color: var(--color-texto-suave); }

@media (max-width: 600px) {
  .form-row { grid-template-columns: 1fr; }
  .encabezado { flex-direction: column; align-items: stretch; }
  .tabla { font-size: 0.75rem; }
  .tabla th, .tabla td { padding: 8px 6px; }
  .acciones-col .btn { width: auto; margin-bottom: 4px; }
}
</style>
