<template>
  <div class="acceso-pagina">
    <div class="acceso-panel">
      <form class="acceso-form-card" @submit.prevent="manejarLogin">
        <span class="etiqueta-seccion">Acceso a la comunidad</span>
        <h1>Bienvenido de nuevo</h1>
        <p class="acceso-subtitulo">Ingresá para continuar con tus tareas, reuniones y registros.</p>

        <Alerta v-if="mensajeError" tipo="error" :mensaje="mensajeError" />
        <Alerta v-if="mensajeInfo" tipo="info" :mensaje="mensajeInfo" :duracion="0" />

        <div class="grupo">
          <label class="etiqueta" for="login-correo">Correo electrónico</label>
          <input
            id="login-correo"
            type="email"
            v-model="form.correo"
            class="entrada"
            placeholder="nombre@institucion.edu.ar"
            autocomplete="email"
          />
        </div>

        <div class="grupo">
          <label class="etiqueta" for="login-password">Contraseña</label>
          <input
            id="login-password"
            type="password"
            v-model="form.password"
            class="entrada"
            placeholder="••••••••"
            autocomplete="current-password"
          />
        </div>

        <label class="checkbox-recuerdo">
          <input type="checkbox" v-model="recordar" />
          Recordar mi sesión en este dispositivo.
        </label>

        <button type="submit" class="btn btn-primary btn-bloque btn-lg boton-ingresar" :disabled="cargando">
          {{ cargando ? 'Ingresando…' : 'Ingresar' }}
        </button>

        <p class="acceso-alternativas">
          <button type="button" class="enlace" @click="mostrarRecuperacion">Olvidé mi contraseña</button>
          <span aria-hidden="true">·</span>
          <router-link class="enlace" :to="{ name: 'registro' }">Crear una cuenta</router-link>
        </p>

        <p class="aviso-desarrollo" v-if="modoDesarrollo">
          Modo desarrollo: se utilizan cuentas de prueba (sin Supabase configurado).
        </p>
      </form>

      <div class="acceso-lateral">
        <img class="acceso-imagen" src="/img/ropa-recibir.jpg" alt="Vecinos recibiendo ropa donada en una jornada de la cooperativa" loading="lazy" />
        <h2>Todo lo que organizamos deja una huella positiva y trazable.</h2>
        <p class="acceso-nota">Tus datos se usan únicamente para coordinar actividades dentro de Cooperativa Trama.</p>
      </div>
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
const mensajeInfo = ref(null)

const modoDesarrollo = computed(() => auth && auth.simulado)

const reglas = {
  correo: [requerido, emailValido],
  password: [contraseñaSegura],
}

function mostrarRecuperacion() {
  mensajeInfo.value =
    'La recuperación de contraseña todavía no está disponible: requiere la integración de recuperación por correo con Supabase. Mientras tanto, contactá a un administrador de la cooperativa.'
}

async function manejarLogin() {
  const { valido } = validar(form.value, reglas)
  if (!valido) {
    mensajeError.value = 'Corregí los errores del formulario antes de continuar.'
    return
  }

  cargando.value = true
  mensajeError.value = null
  mensajeInfo.value = null
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
.acceso-pagina {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 36px 20px;
  min-height: calc(100vh - 68px);
  background: var(--fondo-beige);
}

.acceso-panel {
  background: var(--fondo-crema);
  border: 1px solid var(--borde);
  border-radius: var(--radio-tarjeta);
  padding: 34px 40px;
  width: 100%;
  max-width: 1080px;
  display: grid;
  grid-template-columns: minmax(320px, 460px) 1fr;
  gap: 44px;
  align-items: center;
}

.acceso-form-card {
  background: var(--fondo-tarjeta);
  border: 1px solid var(--borde);
  border-radius: var(--radio-tarjeta);
  padding: 26px 28px;
}

.etiqueta-seccion {
  display: block;
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-verde);
  margin-bottom: 8px;
}

.acceso-form-card h1 {
  font-size: 1.8rem;
  letter-spacing: -0.02em;
  margin: 0 0 6px 0;
}

.acceso-subtitulo {
  font-size: 0.9rem;
  color: var(--texto-suave);
  margin-bottom: 18px;
}

.grupo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
}

.etiqueta {
  font-size: 0.82rem;
  font-weight: 800;
  color: var(--texto-suave);
}

.entrada {
  padding: 10px 14px;
  border: 1px solid var(--borde);
  border-radius: var(--radio-campo);
  font-size: 0.95rem;
  background: var(--fondo-tarjeta);
  color: var(--texto);
}

.entrada:focus { outline: none; border-color: var(--verde); }
.entrada::placeholder { color: #A9A894; }

.checkbox-recuerdo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--texto-suave);
  margin: 2px 0 16px 0;
  cursor: pointer;
}

.checkbox-recuerdo input {
  width: 15px;
  height: 15px;
  accent-color: var(--verde);
}

.boton-ingresar { margin-bottom: 12px; }

.acceso-alternativas {
  text-align: center;
  font-size: 0.82rem;
  color: var(--texto-suave);
  display: flex;
  justify-content: center;
  gap: 8px;
}

.enlace {
  color: var(--color-verde);
  font-weight: 700;
  text-decoration: none;
}

.enlace:hover { text-decoration: underline; }

button.enlace {
  padding: 0;
}

.aviso-desarrollo {
  margin-top: 14px;
  padding: 9px 12px;
  background: var(--aviso-fondo);
  border: 1px solid var(--aviso-borde);
  border-radius: var(--radio-campo);
  font-size: 0.78rem;
  color: var(--aviso-texto);
  text-align: center;
}

.acceso-lateral {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.acceso-imagen {
  width: 100%;
  height: 260px;
  object-fit: cover;
  border-radius: var(--radio-tarjeta);
  display: block;
}

.acceso-lateral h2 {
  font-size: 1.6rem;
  line-height: 1.15;
  letter-spacing: -0.01em;
  max-width: 420px;
}

.acceso-nota {
  font-size: 0.85rem;
  color: var(--texto-suave);
  max-width: 420px;
}

@media (max-width: 900px) {
  .acceso-pagina { padding: 20px 14px; background: var(--fondo-app); }
  .acceso-panel {
    grid-template-columns: 1fr;
    padding: 18px;
    gap: 18px;
    border: none;
    background: transparent;
  }
  .acceso-imagen { height: 190px; }
  .acceso-lateral h2 { font-size: 1.3rem; }
}
</style>
