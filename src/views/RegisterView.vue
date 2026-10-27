<template>
  <div class="pagina-acceso">
    <div class="tarjeta-acceso">
      <div class="cabecera">
        <h2>Registro</h2>
        <p>Sumate a Trama</p>
      </div>

      <Alerta v-if="mensajeError" tipo="error" :mensaje="mensajeError" />
      <Alerta v-if="mensajeExito" tipo="exito" :mensaje="mensajeExito" :duracion="0" />

      <form @submit.prevent="manejarRegistro" class="formulario" v-if="!registrado">
        <div class="grupo">
          <label class="etiqueta">Nombre y apellido</label>
          <input type="text" v-model="form.nombre" placeholder="Lucía Fernández" class="entrada" />
        </div>

        <div class="grupo">
          <label class="etiqueta">Correo electrónico</label>
          <input type="email" v-model="form.correo" placeholder="nombre@escuela.edu" class="entrada" />
        </div>

        <div class="grupo">
          <label class="etiqueta">Tipo de usuario</label>
          <select v-model="form.rol" class="entrada">
            <option value="integrante">Integrante de la cooperativa</option>
            <option value="comunidad">Comunidad educativa</option>
          </select>
        </div>

        <div class="grupo" v-if="form.rol === 'integrante'">
          <label class="etiqueta">Comisión</label>
          <select v-model="form.comision" class="entrada">
            <option value="">Seleccioná una comisión</option>
            <option v-for="c in comisiones" :key="c.id" :value="c.id">{{ c.nombre }}</option>
          </select>
        </div>

        <div class="grupo">
          <label class="etiqueta">Contraseña</label>
          <input type="password" v-model="form.password" placeholder="••••••••" class="entrada" />
        </div>

        <div class="grupo">
          <label class="etiqueta">Confirmar contraseña</label>
          <input type="password" v-model="form.password2" placeholder="••••••••" class="entrada" />
        </div>

        <button type="submit" class="btn btn-primary btn-bloque" :disabled="cargando">
          {{ cargando ? 'Creando cuenta...' : 'Crear mi cuenta' }}
        </button>
      </form>

      <div v-else class="exito">
        <h3>Cuenta creada</h3>
        <p>Tu cuenta fue registrada correctamente. Ya podés iniciar sesión.</p>
        <button class="btn btn-primary btn-bloque" @click="irLogin">Ir a iniciar sesión</button>
      </div>

      <p class="pie">
        Ya tenés cuenta?
        <router-link :to="{ name: 'login' }">Iniciar sesión</router-link>
      </p>

      <p class="aviso-desarrollo" v-if="modoDesarrollo">
        Modo desarrollo: los datos no se envían a un servidor real.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { inject } from 'vue'
import { validar, requerido, emailValido, contraseñaSegura } from '@/validations'
import { authService, comisionesService } from '@/services'

import Alerta from '@/components/Alerta.vue'

const auth = inject('auth')
const router = useRouter()

const comisiones = ref([])
const form = ref({
  nombre: '',
  correo: '',
  rol: 'integrante',
  comision: '',
  password: '',
  password2: '',
})
const registrado = ref(false)
const cargando = ref(false)
const mensajeError = ref(null)
const mensajeExito = ref(null)

const modoDesarrollo = computed(() => auth && auth.simulado)

async function cargarComisiones() {
  const r = await comisionesService.listar()
  if (r.exito) comisiones.value = r.data
}

const reglas = {
  nombre: [requerido],
  correo: [requerido, emailValido],
  password: [contraseñaSegura],
  password2: [requerido],
  comision: [(valor) => {
    if (form.value.rol === 'integrante' && !valor) return 'Seleccioná una comisión.'
    return null
  }],
}

async function manejarRegistro() {
  // Validación cruzada de contraseñas
  if (form.value.password !== form.value.password2) {
    mensajeError.value = 'Las contraseñas no coinciden.'
    return
  }

  const { valido, errores } = validar(form.value, reglas)
  if (!valido) {
    mensajeError.value = 'Corregí los errores del formulario antes de continuar.'
    return
  }

  cargando.value = true
  mensajeError = null
  try {
    const respuesta = await authService.register({
      nombre: form.value.nombre,
      email: form.value.correo,
      rol: form.value.rol,
      comision: form.value.comision || null,
      password: form.value.password,
    })
    if (respuesta.exito) {
      registrado.value = true
      mensajeExito.value = 'Cuenta creada correctamente.'
    } else {
      mensajeError.value = (respuesta.error && respuesta.error.message) || 'No se pudo crear la cuenta.'
    }
  } catch (e) {
    mensajeError.value = 'Error de conexión al crear la cuenta.'
  } finally {
    cargando.value = false
  }
}

function irLogin() { router.push({ name: 'login' }) }

cargarComisiones()
</script>

<style scoped>
.pagina-acceso {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 64px);
  padding: 20px;
  background-color: var(--color-crema);
}
.tarjeta-acceso {
  background: var(--color-blanco);
  border: 1px solid var(--color-borde);
  border-radius: 10px;
  padding: 32px 28px;
  width: 100%;
  max-width: 460px;
}
.cabecera { text-align: center; margin-bottom: 28px; }
.cabecera h2 { font-size: 1.5rem; margin: 0 0 6px 0; color: var(--color-verde-oscuro); }
.cabecera p { margin: 0; font-size: 1rem; opacity: 0.85; }

.formulario { display: flex; flex-direction: column; gap: 16px; }
.grupo { display: flex; flex-direction: column; gap: 6px; }
.etiqueta { font-size: 0.9rem; font-weight: 700; color: var(--color-texto-suave); }
.entrada {
  padding: 9px 12px;
  border: 1px solid var(--color-borde);
  border-radius: 6px;
  font-size: 0.95rem;
}
.btn-bloque { width: 100%; padding: 10px; font-size: 1rem; }
.pie { margin-top: 18px; text-align: center; font-size: 0.9rem; color: var(--color-texto-suave); }
.pie a { color: var(--color-verde); font-weight: 700; text-decoration: underline; }
.pie a:hover { opacity: 0.8; }
.aviso-desarrollo {
  margin-top: 16px;
  padding: 10px;
  background: #FBF0DC;
  border: 1px solid #E8C98E;
  border-radius: 6px;
  font-size: 0.8rem;
  color: #7A4F00;
  text-align: center;
}
.exito { text-align: center; }
.exito h3 { margin: 0 0 10px 0; color: var(--color-verde-oscuro); }
</style>
