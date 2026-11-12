<template>
  <div class="usuarios">
    <VistaEncabezado titulo="Usuarios" subtitulo="Personas, roles y participación">
      <template #accion>
        <button v-if="esAdmin" class="btn btn-primary" @click="toggleNuevo">
          {{ formAbierto ? 'Cancelar' : 'Invitar persona' }}
        </button>
      </template>
    </VistaEncabezado>

    <Alerta v-if="error" tipo="error" :mensaje="error" />
    <Alerta v-if="exito" tipo="exito" :mensaje="exito" :duracion="4000" />

    <div class="modo-aviso" v-if="modoDesarrollo">
      Modo desarrollo: estas cuentas son <strong>ficticias (de prueba)</strong>.
    </div>

    <div class="estadisticas-fila">
      <TarjetaStat :texto="`${usuarios.length} personas`" />
      <TarjetaStat :texto="`${porcentajeActivas} % activas`" />
      <TarjetaStat :texto="`${comisiones.length} comisiones`" />
    </div>

    <div class="contenido-doble tarjetas-superiores">
      <div class="card">
        <h2>Participación por rol</h2>
        <p class="participacion-linea">
          Integrantes {{ conteoRol('integrante') }} · Administración {{ conteoRol('administrador') }} · Comunidad {{ conteoRol('comunidad') }}
        </p>
        <p class="participacion-nota">Solo las cuentas activas se muestran en el listado. La autorización real se aplica con las políticas RLS de Supabase.</p>
      </div>

      <TarjetaDatos titulo="Personas recientes">
        <p v-for="u in personasRecientes" :key="u.id" class="item-datos">
          {{ u.nombre }} · {{ rolLegible(u.rol) }} · {{ u.activo ? 'Activa' : 'Inactiva' }}
        </p>
        <p v-if="personasRecientes.length === 0" class="item-datos">Todavía no hay personas registradas.</p>
      </TarjetaDatos>
    </div>

    <div v-if="formAbierto && esAdmin" class="card tarjeta-form">
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
          <span class="hint">Mínimo 6 caracteres. En modo desarrollo la contraseña no se valida con un servidor.</span>
        </div>
        <div class="acciones">
          <button type="button" class="btn btn-outline" @click="toggleNuevo">Cancelar</button>
          <button type="submit" class="btn btn-primary">Crear usuario</button>
        </div>
      </form>
    </div>

    <div class="table-container card tarjeta-tabla">
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
            <td><span class="badge" :class="claseRol(u.rol)">{{ rolLegible(u.rol) }}</span></td>
            <td>{{ nombreComision(u.comision) }}</td>
            <td><span class="badge" :class="claseEstado(u.activo)">{{ u.activo ? 'Activo' : 'Inactivo' }}</span></td>
            <td class="acciones-col">
              <button class="btn btn-outline btn-sm" @click="editarUsuario(u)">Editar</button>
              <button class="btn btn-danger btn-sm" @click="cambiarEstadoUsuario(u)">{{ u.activo ? 'Desactivar' : 'Activar' }}</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="usuarios.length === 0 && !cargando" class="vacio">No hay usuarios registrados.</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { validar, requerido, emailValido, seleccionValida, contraseñaSegura } from '@/validations'
import { perfilesService, comisionesService } from '@/services'

import Alerta from '@/components/Alerta.vue'
import VistaEncabezado from '@/components/VistaEncabezado.vue'
import TarjetaStat from '@/components/TarjetaStat.vue'
import TarjetaDatos from '@/components/TarjetaDatos.vue'

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
const rolCambiado = () => { if (nuevo.value.rol !== 'integrante') nuevo.value.comision = '' }

const porcentajeActivas = computed(() => {
  if (!usuarios.value.length) return 0
  const activas = usuarios.value.filter((u) => u.activo).length
  return Math.round((activas / usuarios.value.length) * 100)
})

const conteoRol = (rol) => usuarios.value.filter((u) => u.rol === rol).length
const personasRecientes = computed(() => usuarios.value.slice(0, 4))

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
  if (rC.exito) comisiones.value = (rC.data || []).filter((c) => c.activo)
  cargando.value = false
})

function nombreComision(id) {
  if (!id) return '—'
  const c = comisiones.value.find((x) => x.id === id)
  return c ? c.nombre : '—'
}

function rolLegible(rol) {
  return { administrador: 'Administración', integrante: 'Integrante', comunidad: 'Comunidad' }[rol] || rol
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
.usuarios { width: 100%; }

.tarjetas-superiores { margin-bottom: 16px; }
.tarjetas-superiores h2 { font-size: 1.05rem; margin-bottom: 8px; }

.participacion-linea { font-size: 0.95rem; font-weight: 700; margin-bottom: 6px; }
.participacion-nota { font-size: 0.82rem; color: var(--texto-suave); }

.tarjeta-form { margin-bottom: 16px; }
.tarjeta-form h3 { margin: 0 0 14px 0; font-size: 1.05rem; }
.formulario { display: flex; flex-direction: column; gap: 14px; }
.grupo { display: flex; flex-direction: column; gap: 6px; }
.etiqueta { font-size: 0.85rem; font-weight: 800; color: var(--texto-suave); display: flex; align-items: center; gap: 6px; }
.requerido { color: var(--error-texto); font-size: 0.8rem; }
.entrada { padding: 10px 14px; border: 1px solid var(--borde); border-radius: var(--radio-campo); font-size: 0.95rem; background: var(--fondo-tarjeta); color: var(--texto); }
.hint { font-size: 0.78rem; color: var(--texto-suave); margin-top: 2px; }
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
