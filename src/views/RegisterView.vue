<template>
  <div class="acceso-pagina">
    <div class="acceso-panel">
      <form class="acceso-form-card" @submit.prevent="manejarRegistro" v-if="!registrado">
        <span class="etiqueta-seccion">Nueva participación</span>
        <h1>Creá tu cuenta</h1>
        <p class="acceso-subtitulo">Completá tus datos para sumarte a la organización de Trama.</p>

        <Alerta v-if="mensajeError" tipo="error" :mensaje="mensajeError" />

        <div class="grupo">
          <label class="etiqueta" for="reg-nombre">Nombre y apellido</label>
          <input id="reg-nombre" type="text" v-model="form.nombre" class="entrada" placeholder="Ej. Ana Pérez" autocomplete="name" />
        </div>

        <div class="grupo">
          <label class="etiqueta" for="reg-correo">Correo electrónico</label>
          <input id="reg-correo" type="email" v-model="form.correo" class="entrada" placeholder="nombre@institucion.edu.ar" autocomplete="email" />
        </div>

        <div class="grupo">
          <label class="etiqueta" for="reg-rol">Rol en la comunidad</label>
          <select id="reg-rol" v-model="form.rol" class="entrada">
            <option value="" disabled>Seleccionar rol</option>
            <option value="integrante">Integrante de la cooperativa</option>
            <option value="comunidad">Comunidad educativa</option>
          </select>
        </div>

        <div class="grupo" v-if="form.rol === 'integrante'">
          <label class="etiqueta" for="reg-comision">Comisión</label>
          <select id="reg-comision" v-model="form.comision" class="entrada">
            <option value="">Seleccioná una comisión</option>
            <option v-for="c in comisiones" :key="c.id" :value="c.id">{{ c.nombre }}</option>
          </select>
        </div>

        <div class="grupo">
          <label class="etiqueta" for="reg-password">Contraseña</label>
          <input id="reg-password" type="password" v-model="form.password" class="entrada" placeholder="••••••••" autocomplete="new-password" />
        </div>

        <div class="grupo">
          <label class="etiqueta" for="reg-password2">Repetir contraseña</label>
          <input id="reg-password2" type="password" v-model="form.password2" class="entrada" placeholder="••••••••" autocomplete="new-password" />
        </div>

        <label class="aceitacion" :class="{ 'aceitacion-error': aceptarError }">
          <input type="checkbox" v-model="form.aceptaAcuerdo" />
          <span>Acepto el acuerdo de participación y la política de privacidad.</span>
        </label>
        <p v-if="aceptarError" class="error-consentimiento">Para crear tu cuenta tenés que aceptar el acuerdo de participación.</p>

        <button type="submit" class="btn btn-primary btn-bloque btn-lg boton-ingresar" :disabled="cargando">
          {{ cargando ? 'Creando cuenta…' : 'Crear cuenta' }}
        </button>

        <p class="acceso-alternativas">
          ¿Ya tenés cuenta?
          <router-link class="enlace" :to="{ name: 'login' }">Iniciar sesión</router-link>
        </p>

        <p class="aviso-desarrollo" v-if="modoDesarrollo">
          Modo desarrollo: los datos no se envían a un servidor real.
        </p>
      </form>

      <div v-else class="acceso-form-card exito-card">
        <span class="etiqueta-seccion">Nueva participación</span>
        <h1>Cuenta creada</h1>
        <p class="acceso-subtitulo">Tu cuenta fue registrada correctamente. Ya podés iniciar sesión.</p>
        <button class="btn btn-primary btn-bloque btn-lg" @click="irLogin">Ir a iniciar sesión</button>
      </div>

      <div class="acceso-lateral">
        <img class="acceso-imagen" src="/img/reciclaje2.webp" alt="Vecinos cargando bolsones de materiales reciclables durante una entrega comunitaria" loading="lazy" />
        <h2>Tu participación empieza con un dato y crece con cada acción compartida.</h2>
        <p class="acceso-nota">Tus datos se usan únicamente para coordinar actividades dentro de Cooperativa Trama.</p>
      </div>
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
  rol: '',
  comision: '',
  password: '',
  password2: '',
  aceptaAcuerdo: true,
})
const registrado = ref(false)
const cargando = ref(false)
const mensajeError = ref(null)
const aceptarError = ref(false)

const modoDesarrollo = computed(() => auth && auth.simulado)

async function cargarComisiones() {
  const r = await comisionesService.listar()
  if (r.exito) comisiones.value = r.data
}

const reglas = {
  nombre: [requerido],
  correo: [requerido, emailValido],
  rol: [requerido],
  password: [contraseñaSegura],
  password2: [requerido],
  comision: [(valor) => {
    if (form.value.rol === 'integrante' && !valor) return 'Seleccioná una comisión.'
    return null
  }],
}

async function manejarRegistro() {
  aceptarError.value = !form.value.aceptaAcuerdo
  if (form.value.password !== form.value.password2) {
    mensajeError.value = 'Las contraseñas no coinciden.'
    return
  }

  const { valido } = validar(form.value, reglas)
  if (!valido || aceptarError.value) {
    mensajeError.value = valido ? null : 'Corregí los errores del formulario antes de continuar.'
    return
  }

  cargando.value = true
  mensajeError.value = null
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
  grid-template-columns: minmax(340px, 470px) 1fr;
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
  margin-bottom: 12px;
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

.aceitacion {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 0.82rem;
  color: var(--texto-suave);
  background: var(--fondo-crema);
  border: 1px solid var(--borde);
  border-radius: var(--radio-campo);
  padding: 10px 12px;
  margin: 2px 0 6px 0;
  cursor: pointer;
}

.aceitacion input {
  margin-top: 2px;
  width: 16px;
  height: 16px;
  accent-color: var(--verde);
}

.aceitacion-error { border-color: var(--error-texto); }

.error-consentimiento {
  font-size: 0.78rem;
  color: var(--error-texto);
  margin: 0 0 8px 2px;
}

.boton-ingresar { margin-bottom: 12px; }

.acceso-alternativas {
  text-align: center;
  font-size: 0.85rem;
  color: var(--texto-suave);
  display: flex;
  justify-content: center;
  gap: 8px;
  align-items: baseline;
}

.enlace {
  color: var(--color-verde);
  font-weight: 700;
  text-decoration: none;
}

.enlace:hover { text-decoration: underline; }

.aviso-desarrollo {
  margin-top: 12px;
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

.exito-card { max-width: 470px; }

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
