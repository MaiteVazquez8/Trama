<template>
  <div class="perfil">
    <VistaEncabezado titulo="Perfil" subtitulo="Datos personales y participación">
      <template #accion>
        <button v-if="editable" type="submit" form="perfil-form" class="btn btn-primary">Guardar cambios</button>
      </template>
    </VistaEncabezado>

    <Alerta v-if="error" tipo="error" :mensaje="error" />
    <Alerta v-if="exito" tipo="exito" :mensaje="exito" :duracion="4000" />

    <div class="estadisticas-fila">
      <TarjetaStat :texto="`${comisionesAsignadas} ${comisionesAsignadas === 1 ? 'comisión' : 'comisiones'}`" />
      <TarjetaStat :texto="`${tareasTotal} tareas`" />
      <TarjetaStat :texto="`${tareasCompletadas} completadas`" />
    </div>

    <div class="contenido-doble">
      <form id="perfil-form" class="card perfil-card" @submit.prevent="guardarCambios">
        <div class="perfil-identidad">
          <img class="perfil-avatar" src="/img/perfil.png" :alt="`Avatar de ${usuario.nombre || 'usuario'}`" />
          <div>
            <h2>{{ usuario.nombre }}</h2>
            <p class="perfil-rol">{{ rolLegible(usuario.rol) }} · {{ usuario.activo === false ? 'Inactivo' : 'Miembro activo' }}</p>
          </div>
        </div>

        <div class="grupo">
          <label class="etiqueta" for="perfil-nombre">Nombre <span class="requerido">*</span></label>
          <input id="perfil-nombre" v-model="form.nombre" type="text" class="entrada" :disabled="!editable" />
        </div>
        <div class="grupo">
          <label class="etiqueta" for="perfil-email">Correo electrónico <span class="requerido">*</span></label>
          <input id="perfil-email" v-model="form.email" type="email" class="entrada" :disabled="!editable" />
        </div>

        <div class="acciones">
          <button type="submit" class="btn btn-primary" :disabled="!editable">Guardar cambios</button>
        </div>
      </form>

      <TarjetaDatos titulo="Datos personales">
        <p class="item-datos"><strong>Correo</strong> {{ usuario.email }}</p>
        <p class="item-datos"><strong>Rol</strong> {{ rolLegible(usuario.rol) }}</p>
        <p class="item-datos"><strong>Comisiones</strong> {{ usuario.comision ? nombreComision(usuario.comision) : 'Sin comisión asignada' }}</p>
        <p class="item-datos"><strong>Estado</strong> {{ usuario.activo === false ? 'Inactivo' : 'Activo' }}</p>
      </TarjetaDatos>
    </div>

    <div class="card sesion-card" v-if="modoDesarrollo">
      <h3>Información de sesión (modo desarrollo)</h3>
      <p>No hay una sesión real persistente. Al recargar la página se perderá el usuario logueado hasta que se configure Supabase.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, inject } from 'vue'
import { validar, requerido, emailValido } from '@/validations'
import { perfilesService, comisionesService, tareasService } from '@/services'

import Alerta from '@/components/Alerta.vue'
import VistaEncabezado from '@/components/VistaEncabezado.vue'
import TarjetaStat from '@/components/TarjetaStat.vue'
import TarjetaDatos from '@/components/TarjetaDatos.vue'

const auth = inject('auth')
const modoDesarrollo = computed(() => auth && auth.simulado)
const editable = computed(() => auth && auth.autenticado && (auth.rol === 'administrador' || auth.rol === 'integrante'))

const error = ref(null)
const exito = ref(null)

const usuario = ref({})
const form = ref({ nombre: '', email: '' })
const comisiones = ref([])
const tareas = ref([])

const comisionesAsignadas = computed(() => (usuario.value.comision ? 1 : 0))
const tareasUsuario = computed(() =>
  auth && auth.usuario ? tareas.value.filter((t) => t.responsable === auth.usuario.id) : []
)
const tareasTotal = computed(() => tareasUsuario.value.length)
const tareasCompletadas = computed(() => tareasUsuario.value.filter((t) => t.estado === 'completada').length)

onMounted(async () => {
  const [rU, rC, rT] = await Promise.all([
    perfilesService.listar(),
    comisionesService.listar(),
    tareasService.listar(),
  ])
  if (rU.exito && auth && auth.usuario) {
    const u = rU.data.find((p) => p.id === auth.usuario.id) || auth.usuario
    usuario.value = u
    form.value = { nombre: u.nombre, email: u.email }
  } else if (auth && auth.usuario) {
    usuario.value = auth.usuario
    form.value = { nombre: auth.usuario.nombre, email: auth.usuario.email }
  } else {
    error.value = rU.error?.message || 'No se pudo cargar el perfil.'
  }
  if (rC.exito) comisiones.value = rC.data || []
  if (rT.exito) tareas.value = rT.data || []
})

function nombreComision(id) {
  const c = comisiones.value.find((x) => x.id === id)
  return c ? c.nombre : '—'
}

function rolLegible(rol) {
  return { administrador: 'Administración', integrante: 'Integrante de la cooperativa', comunidad: 'Comunidad educativa' }[rol] || rol || '—'
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
.perfil { width: 100%; }

.perfil-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.perfil-identidad {
  display: flex;
  align-items: center;
  gap: 18px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--borde);
}

.perfil-avatar {
  width: 92px;
  height: 92px;
  object-fit: cover;
  object-position: center 12%;
  border-radius: 50%;
  border: 3px solid var(--borde);
  background: var(--fondo-crema);
  flex-shrink: 0;
}

.perfil-identidad h2 { font-size: 1.4rem; letter-spacing: -0.01em; }
.perfil-rol { font-size: 0.88rem; color: var(--texto-suave); margin-top: 4px; }

.grupo { display: flex; flex-direction: column; gap: 6px; }
.etiqueta { font-size: 0.85rem; font-weight: 800; color: var(--texto-suave); }
.requerido { color: var(--error-texto); font-size: 0.8rem; }
.entrada { padding: 10px 14px; border: 1px solid var(--borde); border-radius: var(--radio-campo); font-size: 0.95rem; background: var(--fondo-tarjeta); color: var(--texto); }
.entrada:focus { outline: none; border-color: var(--verde); }
.entrada:disabled { background: var(--fondo-encabezado-tabla); cursor: not-allowed; }
.acciones { display: flex; justify-content: flex-end; }

.sesion-card { margin-top: 16px; }
.sesion-card h3 { font-size: 1.02rem; margin-bottom: 8px; }
.sesion-card p { font-size: 0.9rem; color: var(--texto-suave); }

@media (max-width: 600px) {
  .perfil-identidad { flex-direction: column; align-items: flex-start; gap: 10px; }
}
</style>
