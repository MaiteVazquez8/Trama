<template>
  <div class="usuarios">
    <div class="encabezado">
      <div>
        <h1>Gestión de usuarios</h1>
        <p>Consultá los usuarios registrados, creá cuentas nuevas y asignalas a una comisión.</p>
      </div>
      <button class="btn btn-primary" @click="toggleNuevo">
        {{ formAbierto ? 'Cancelar' : '+ Nuevo usuario' }}
      </button>
    </div>

    <Alerta v-if="error" tipo="error" :mensaje="error" />
    <Alerta v-if="exito" tipo="exito" :mensaje="exito" :duracion="4000" />

    <div class="modo-aviso" v-if="modoDesarrollo">
      ⚠️ Modo desarrollo: estas cuentas son <strong>ficticias (de prueba)</strong>.
    </div>

    <div v-if="formAbierto" class="tarjeta-form">
      <h3>Crear usuario</h3>
      <form @submit.prevent="guardarUsuario" class="formulario">
        <div class="form-row">
          <div class="grupo">
            <label class="etiqueta">Nombre <span class="requerido">*</span></label>
            <input v-model="nuevo.nombre" type="text" class="entrada" />
          </div>
          <div class="grupo">
            <label class="etiqueta">Correo electrónico <span class="requerido">*</span></label>
            <input v-model="nuevo.email" type="email" class="entrada" />
          </div>
        </div>
        <div class="form-row">
          <div class="grupo">
            <label class="etiqueta">Rol <span class="requerido">*</span></label>
            <select v-model="nuevo.rol" class="entrada" @change="rolCambiado">
              <option value="integrante">Integrante de la cooperativa</option>
              <option value="administrador">Administrador</option>
              <option value="comunidad">Comunidad educativa</option>
            </select>
          </div>
          <div class="grupo" v-if="mostrarComision">
            <label class="etiqueta">Comisión</label>
            <select v-model="nuevo.comision" class="entrada">
              <option value="">Ninguna</option>
              <option v-for="c in comisiones" :key="c.id" :value="c.id">{{ c.nombre }}</option>
            </select>
          </div>
        </div>
        <div class="grupo">
          <label class="etiqueta">Contraseña <span class="requerido">*</span></label>
          <input v-model="nuevo.password" type="password" class="entrada" />
          <span class="hint">Mínimo 6 caracteres.</span>
        </div>
        <div class="acciones">
          <button type="button" class="btn btn-outline" @click="toggleNuevo">Cancelar</button>
          <button type="submit" class="btn btn-primary">Crear usuario</button>
        </div>
      </form>
    </div>

    <table class="tabla">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Correo</th>
          <th>Rol</th>
          <th>Comisión</th>
          <th>Estado</th>
          <th class="acciones-col">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="u in usuarios" :key="u.id">
          <td>{{ u.nombre }}</td>
          <td>{{ u.email }}</td>
          <td><span class="badge" :class="claseRol(u.rol)">{{ u.rol }}</span></td>
          <td>{{ nombreComision(u.comision) }}</td>
          <td><span class="badge" :class="claseEstado(u.activo)">{{ u.activo ? 'Activo' : 'Inactivo' }}</span></td>
          <td class="acciones-col">
            <button class="btn btn-outline btn-sm" @click="editarUsuario(u)">Editar</button>
            <button class="btn btn-danger btn-sm" @click="cambiarEstadoUsuario(u)">{{ u.activo ? 'Desactivar' : 'Activar' }}</button>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="usuarios.length === 0 && !cargando" class="vacio">No hay usuarios registrados.</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { inject } from 'vue'
import { validar, requerido, emailValido, seleccionValida, contraseñaSegura } from '@/validations'
import { perfilesService, comisionesService } from '@/services'

import Alerta from '@/components/Alerta.vue'

const auth = inject('auth')
const esAdmin = computed(() => auth && auth.rol === 'administrador')
const modoDesarrollo = computed(() => auth && auth.simulado)

const cargando = ref(true)
const error = ref(null)
const exito = ref(null)
const formAbierto = ref(false)

const usuarios = ref([])
const comisiones = ref([])

const nuevo = ref({ nombre: '', email: '', rol: 'integrante', comision: '', password: '' })

const toggleNuevo = () => { formAbierto.value = !formAbierto.value }
const mostrarComision = computed(() => nuevo.value.rol === 'integrante')

const reglas = {
  nombre: [requerido],
  email: [requerido, emailValido],
  rol: [seleccionValida],
  password: [contraseñaSegura],
}

onMounted(async () => {
  const [rU, rC] = await Promise.all([perfilesService.listar(), comisionesService.listar()])
  if (rU.exito) usuarios.value = rU.data || []
  else error.value = rU.error?.message || 'No se pudieron cargar los usuarios.'
  if (rC.exito) comisiones.value = rC.data.filter((c) => c.activo)
  cargando.value = false
})

function nombreComision(id) {
  if (!id) return '—'
  const c = comisiones.value.find((x) => x.id === id)
  return c ? c.nombre : '—'
}
function claseRol(r) {
  return { administrador: 'badge-activo', integrante: 'badge-pendiente', comunidad: 'badge-pendiente' }[r] || 'badge-pendiente'
}
function claseEstado(activo) {
  return activo ? 'badge-activo' : 'badge-cancelada'
}

async function guardarUsuario() {
  const { valido } = validar(nuevo.value, reglas)
  if (!valido) { error.value = 'Completá los campos obligatorios.'; return }
  const r = await perfilesService.crear({
    nombre: nuevo.value.nombre,
    email: nuevo.value.email,
    rol: nuevo.value.rol,
    comision: nuevo.value.comision || null,
    password: nuevo.value.password,
  })
  if (r.exito) {
    usuarios.value.push(r.data)
    exito.value = 'Usuario creado correctamente.'
    toggleNuevo()
    nuevo.value = { nombre: '', email: '', rol: 'integrante', comision: '', password: '' }
  } else {
    error.value = r.error?.message || 'No se pudo crear el usuario.'
  }
}

async function editarUsuario(u) {
  const nombre = prompt('Nuevo nombre:', u.nombre)
  if (nombre === null) return
  const r = await perfilesService.actualizar(u.id, { nombre })
  if (r.exito) { u.nombre = nombre; exito.value = 'Usuario actualizado.' }
  else error.value = r.error?.message || 'No se pudo actualizar el usuario.'
}

async function cambiarEstadoUsuario(u) {
  const r = await perfilesService.actualizar(u.id, { activo: !u.activo })
  if (r.exito) {
    u.activo = !u.activo
    exito.value = `Usuario ${u.activo ? 'activado' : 'desactivado'}.`
  } else {
    error.value = r.error?.message || 'No se pudo cambiar el estado del usuario.'
  }
}
</script>

<style scoped>
.usuarios { max-width: 1000px; margin: 0 auto; padding: 0 20px; }
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
.hint { font-size: 0.8rem; color: var(--color-texto-suave); margin-top: 2px; }
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
.modo-aviso {
  background: #FBF0DC;
  border: 1px solid #E8C98E;
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 0.85rem;
  color: #7A4F00;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
@media (max-width: 600px) {
  .form-row { grid-template-columns: 1fr; }
  .encabezado { flex-direction: column; align-items: stretch; }
  .tabla { font-size: 0.75rem; }
  .tabla th, .tabla td { padding: 8px 6px; }
  .acciones-col .btn { width: auto; margin-bottom: 4px; }
}
</style>
