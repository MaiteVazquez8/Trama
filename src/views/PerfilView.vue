<template>
  <div class="perfil">
    <div class="encabezado">
      <h1>Mi perfil</h1>
      <p>Consultá y modificá los datos de tu cuenta.</p>
    </div>

    <Alerta v-if="error" tipo="error" :mensaje="error" />
    <Alerta v-if="exito" tipo="exito" :mensaje="exito" :duracion="4000" />

    <div class="tarjeta-perfil">
      <div class="avatar">👤</div>
      <div class="datos">
        <h2>{{ usuario.nombre }}</h2>
        <p class="email">{{ usuario.email }}</p>
        <p class="rol"><strong>Rol:</strong> {{ usuario.rol }}</p>
        <p class="comision"><strong>Comisión:</strong> {{ usuario.comision ? nombreComision(usuario.comision) : 'Sin comisión asignada' }}</p>
        <p class="estado"><strong>Estado:</strong> {{ usuario.activo ? 'Activo' : 'Inactivo' }}</p>
      </div>
    </div>

    <div class="tarjeta-form" v-if="editable">
      <h3>Editar datos de la cuenta</h3>
      <form @submit.prevent="guardarCambios" class="formulario">
        <div class="grupo">
          <label class="etiqueta">Nombre <span class="requerido">*</span></label>
          <input v-model="form.nombre" type="text" class="entrada" />
        </div>
        <div class="grupo">
          <label class="etiqueta">Correo electrónico <span class="requerido">*</span></label>
          <input v-model="form.email" type="email" class="entrada" />
        </div>
        <div class="acciones">
          <button type="submit" class="btn btn-primary">Guardar cambios</button>
        </div>
      </form>
    </div>

    <div class="tarjeta-form" v-if="modoDesarrollo">
      <h3>Información de sesión (modo desarrollo)</h3>
      <p>No hay una sesión real persistente. Al recargar la página se perderá el usuario logueado hasta que se configure Supabase.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { inject } from 'vue'
import { validar, requerido, emailValido } from '@/validations'
import { perfilesService, comisionesService } from '@/services'

import Alerta from '@/components/Alerta.vue'

const auth = inject('auth')
const modoDesarrollo = computed(() => auth && auth.simulado)
const editable = computed(() => auth && auth.autenticado && (auth.rol === 'administrador' || auth.rol === 'integrante'))

const cargando = ref(true)
const error = ref(null)
const exito = ref(null)

const usuario = ref({})
const form = ref({ nombre: '', email: '' })
const comisiones = ref([])

onMounted(async () => {
  const [rU, rC] = await Promise.all([perfilesService.listar(), comisionesService.listar()])
  if (rU.exito && auth && auth.usuario) {
    const u = rU.data.find((p) => p.id === auth.usuario.id) || auth.usuario
    usuario.value = u
    form.value = { nombre: u.nombre, email: u.email }
  } else {
    error.value = rU.error?.message || 'No se pudo cargar el perfil.'
  }
  if (rC.exito) comisiones.value = rC.data || []
  cargando.value = false
})

function nombreComision(id) {
  const c = comisiones.value.find((x) => x.id === id)
  return c ? c.nombre : '—'
}

async function guardarCambios() {
  const { valido } = validar(form.value, { nombre: [requerido], email: [requerido, emailValido] })
  if (!valido) { error.value = 'Corregí los errores del formulario.'; return }
  const id = usuario.value.id
  const r = await perfilesService.actualizar(id, { nombre: form.value.nombre, email: form.value.email })
  if (r.exito) {
    usuario.value.nombre = form.value.nombre
    usuario.value.email = form.value.email
    exito.value = 'Datos actualizados correctamente.'
  } else {
    error.value = r.error?.message || 'No se pudo actualizar el perfil.'
  }
}
</script>

<style scoped>
.perfil { max-width: 700px; margin: 0 auto; padding: 0 20px; }
.encabezado { margin-bottom: 22px; }
.encabezado h1 { font-size: 1.75rem; margin: 0 0 6px 0; color: var(--color-verde-oscuro); }
.encabezado p { margin: 0; color: var(--color-texto-suave); }

.tarjeta-perfil { background: var(--color-blanco); border: 1px solid var(--color-borde); border-radius: 12px; padding: 28px 24px; display: flex; align-items: center; gap: 20px; margin-bottom: 22px; }
.avatar { width: 56px; height: 56px; background: var(--color-verde); color: var(--color-blanco); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; flex-shrink: 0; }
.datos h2 { margin: 0 0 6px 0; font-size: 1.5rem; color: var(--color-verde-oscuro); }
.datos p { margin: 4px 0; font-size: 0.95rem; color: var(--color-texto-suave); }
.datos .email { color: var(--color-texto-suave); opacity: 0.9; }

.tarjeta-form { background: var(--color-blanco); border: 1px solid var(--color-borde); border-radius: 10px; padding: 20px; }
.tarjeta-form h3 { margin: 0 0 14px 0; color: var(--color-verde-oscuro); }
.formulario { display: flex; flex-direction: column; gap: 14px; }
.grupo { display: flex; flex-direction: column; gap: 6px; }
.etiqueta { font-size: 0.9rem; font-weight: 700; color: var(--color-texto-suave); display: flex; align-items: center; gap: 6px; }
.requerido { color: var(--color-error); font-size: 0.85rem; }
.entrada { padding: 9px 12px; border: 1px solid var(--color-borde); border-radius: 6px; font-size: 0.95rem; }
.error { color: var(--color-error); font-size: 0.85rem; margin-top: 2px; }
.acciones { display: flex; justify-content: flex-end; margin-top: 6px; }
.btn { padding: 10px 18px; font-size: 0.95rem; }
</style>
