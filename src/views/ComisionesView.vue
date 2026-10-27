<template>
  <div class="comisiones">
    <div class="encabezado">
      <div>
        <h1>Comisiones</h1>
        <p>Consultá las comisiones de la cooperativa y las personas que forman parte de cada una.</p>
      </div>
      <button v-if="esAdmin" class="btn btn-primary" @click="toggleNuevo">
        {{ formAbierto ? 'Cancelar' : '+ Nueva comisión' }}
      </button>
    </div>

    <Alerta v-if="error" tipo="error" :mensaje="error" />
    <Alerta v-if="exito" tipo="exito" :mensaje="exito" :duracion="4000" />

    <div v-if="formAbierto && esAdmin" class="tarjeta-form">
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
    <div v-if="comisiones.length === 0 && !cargando" class="vacio">No hay comisiones registradas.</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { inject } from 'vue'
import { validar, requerido } from '@/validations'
import { comisionesService } from '@/services'

import Alerta from '@/components/Alerta.vue'

const auth = inject('auth')
const esAdmin = computed(() => auth && auth.rol === 'administrador')

const cargando = ref(true)
const error = ref(null)
const exito = ref(null)
const formAbierto = ref(false)

const comisiones = ref([])
const nuevo = ref({ nombre: '', descripcion: '' })

const toggleNuevo = () => { formAbierto.value = !formAbierto.value }
const reglas = { nombre: [requerido] }

onMounted(async () => {
  const r = await comisionesService.listar()
  if (r.exito) comisiones.value = r.data || []
  else error.value = r.error?.message || 'No se pudieron cargar las comisiones.'
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
.comisiones { max-width: 1000px; margin: 0 auto; padding: 0 20px; }
.encabezado { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
.encabezado h1 { font-size: 1.75rem; margin: 0; color: var(--color-verde-oscuro); }
.encabezado p { margin: 4px 0 0 0; color: var(--color-texto-suave); }
.tarjeta-form { background: var(--color-blanco); border: 1px solid var(--color-borde); border-radius: 10px; padding: 20px; margin-bottom: 18px; }
.tarjeta-form h3 { margin: 0 0 14px 0; color: var(--color-verde-oscuro); }
.formulario { display: flex; flex-direction: column; gap: 14px; }
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
.acciones-col { white-space: nowrap; }
.acciones-col .btn { margin-bottom: 6px; width: 100%; }
.vacio { text-align: center; padding: 48px 24px; color: var(--color-texto-suave); }
@media (max-width: 600px) {
  .encabezado { flex-direction: column; align-items: stretch; }
  .tabla { font-size: 0.75rem; }
  .tabla th, .tabla td { padding: 8px 6px; }
  .acciones-col .btn { width: auto; margin-bottom: 4px; }
}
</style>
