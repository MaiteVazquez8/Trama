<template>
  <div class="pagina-acceso">
    <div class="tarjeta-acceso">
      <div class="cabecera">
        <h2>Iniciar sesión</h2>
        <p>Volvé a la trama</p>
      </div>

      <Alerta v-if="mensajeError" tipo="error" :mensaje="mensajeError" />

      <form @submit.prevent="manejarLogin" class="formulario">
        <div class="grupo">
          <label class="etiqueta">Correo electrónico</label>
          <input
            type="email"
            v-model="form.correo"
            placeholder="nombre@escuela.edu"
            class="entrada"
          />
        </div>

        <div class="grupo">
          <label class="etiqueta">Contraseña</label>
          <input
            type="password"
            v-model="form.password"
            placeholder="••••••••"
            class="entrada"
          />
        </div>

        <div class="opciones">
          <label class="opcion">
            <input type="checkbox" v-model="recordar" />
            Recordar mi sesión
          </label>
          <a href="#" class="olvido">¿Olvidaste tu contraseña?</a>
        </div>

        <button type="submit" class="btn btn-primary btn-bloque" :disabled="cargando">
          {{ cargando ? 'Ingresando...' : 'Ingresar' }}
        </button>

        <p class="pie">
          ¿Aún no tenés cuenta?
          <router-link :to="{ name: 'registro' }">Creá tu cuenta</router-link>
        </p>
      </form>

      <p class="aviso-desarrollo" v-if="modoDesarrollo">
        Modo desarrollo: se utilizan cuentas de prueba (sin Supabase configurado).
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { inject } from 'vue'
import { validar, emailValido, requerido, contraseñaSegura } from '@/validations'
import { authService } from '@/services'

import Alerta from '@/components/Alerta.vue'

const auth = inject('auth')
const router = useRouter()

const form = ref({ correo: '', password: '' })
const recordar = ref(false)
const cargando = ref(false)
const mensajeError = ref(null)

const modoDesarrollo = computed(() => auth && auth.simulado)

const reglas = {
  correo: [requerido, emailValido],
  password: [contraseñaSegura],
}

async function manejarLogin() {
  const { valido, errores } = validar(form.value, reglas)
  if (!valido) {
    mensajeError.value = 'Corregí los errores del formulario antes de continuar.'
    return
  }

  cargando.value = true
  mensajeError.value = null
  try {
    const respuesta = await authService.login(form.value.correo, form.value.password)
    if (respuesta.exito && respuesta.data) {
      auth.setUsuario(respuesta.data)
      const redirect = router.currentRoute.value.query.redirect || 'panel'
      if (redirect.startsWith('/')) {
        router.push({ path: redirect })
      } else {
        router.push({ name: redirect })
      }
    } else {
      mensajeError.value =
        (respuesta.error && respuesta.error.message) || 'No se pudo iniciar sesión. Intentá nuevamente.'
    }
  } catch (e) {
    mensajeError.value = 'Error de conexión al iniciar sesión.'
  } finally {
    cargando.value = false
  }
}
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
  max-width: 400px;
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
.opciones { display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; }
.opcion { display: flex; align-items: center; gap: 6px; cursor: pointer; }
.olvido { color: var(--color-verde); text-decoration: underline; font-size: 0.85rem; }
.olvido:hover { opacity: 0.8; }
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
</style>
