<template>
  <div class="configuracion">
    <VistaEncabezado titulo="Configuración" subtitulo="Preferencias, permisos y privacidad">
      <template #accion>
        <button class="btn btn-primary" @click="guardarPreferencias">Guardar preferencias</button>
      </template>
    </VistaEncabezado>

    <Alerta v-if="error" tipo="error" :mensaje="error" />
    <Alerta v-if="exito" tipo="exito" :mensaje="exito" :duracion="4000" />

    <div class="estadisticas-fila">
      <TarjetaStat :texto="`${avisosActivos} avisos`" />
      <TarjetaStat :texto="`${preferencias.permisos} permisos`" />
      <TarjetaStat texto="1 sesión activa" />
    </div>

    <div class="contenido-doble tarjetas-superiores">
      <form class="card preferencias-card" @submit.prevent="guardarPreferencias">
        <h2>Preferencias</h2>

        <label class="preferencia-fila">
          <span>Resumen semanal</span>
          <input type="checkbox" v-model="preferencias.resumenSemanal" />
        </label>
        <label class="preferencia-fila">
          <span>Recordatorios de tareas</span>
          <input type="checkbox" v-model="preferencias.recordatoriosTareas" />
        </label>
        <label class="preferencia-fila">
          <span>Novedades de campañas</span>
          <input type="checkbox" v-model="preferencias.novedadesCampanias" />
        </label>

        <div class="preferencia-fila preferencia-select">
          <span>Tema del sistema</span>
          <select v-model="preferencias.tema" class="entrada-select" @change="cambiarTema">
            <option value="auto">Automático</option>
            <option value="claro">Claro</option>
            <option value="oscuro">Oscuro</option>
          </select>
        </div>

        <p class="preferencias-nota">Estas preferencias se guardan en este dispositivo y no dependen del backend.</p>

        <div class="acciones">
          <button type="submit" class="btn btn-primary">Guardar preferencias</button>
        </div>
      </form>

      <TarjetaDatos titulo="Privacidad y acceso">
        <p class="item-datos"><strong>Correo</strong> {{ correoUsuario }}</p>
        <button class="accion-link" type="button" @click="solicitarCambioContrasenia">Cambiar contraseña</button>
        <button class="accion-link" type="button" @click="descargarMisDatos">Descargar mis datos</button>
        <button class="accion-link accion-peligro" type="button" @click="cerrarSesionTodos">Cerrar sesión en todos los dispositivos</button>
        <p v-if="mensajePrivacidad" class="privacidad-mensaje">{{ mensajePrivacidad }}</p>
      </TarjetaDatos>
    </div>

    <div class="modo-aviso">
      <strong>Modo de operación:</strong> {{ modoTexto }}
      <span class="detalle">{{ modoDetalle }}</span>
    </div>

    <div class="card tarjeta">
      <h3>Conexión con Supabase</h3>
      <p>Para que los registros de Trama se guarden y compartan entre usuarios y dispositivos, configurá las variables de entorno:</p>
      <ul class="vars">
        <li><strong>VITE_SUPABASE_URL</strong>: URL del proyecto de Supabase.</li>
        <li><strong>VITE_SUPABASE_ANON_KEY</strong>: clave pública (anon key) del proyecto.</li>
      </ul>
      <p class="copiar">Copiá <code>.env.example</code> a <code>.env</code> y completá los valores. Nunca subas claves secretas al repositorio.</p>
      <p class="aviso">No se incluyen claves <em>service_role</em> ni credenciales de administración en el frontend.</p>
    </div>

    <div class="card tarjeta">
      <h3>Roles y permisos (primera versión)</h3>
      <div class="table-container">
        <table class="tabla simple">
          <thead>
            <tr><th>Rol</th><th>¿Implementado?</th><th>Alcance</th></tr>
          </thead>
          <tbody>
            <tr><td>Administrador</td><td><span class="badge badge-activo">Real</span></td><td>Gestiona usuarios, comisiones y consulta todos los registros.</td></tr>
            <tr><td>Integrante de la cooperativa</td><td><span class="badge badge-activo">Real</span></td><td>Registra residuos, consulta y edita tareas, campañas, entregas y su perfil.</td></tr>
            <tr><td>Comunidad educativa</td><td><span class="badge badge-activo">Real</span></td><td>Consulta información pública (inicio, tachos, campañas, resultados).</td></tr>
          </tbody>
        </table>
      </div>
      <p class="nota">Mientras Supabase no esté configurado, el acceso funciona en modo desarrollo sin sesión persistente real.</p>
    </div>

    <div class="card tarjeta">
      <h3>Conservación del historial</h3>
      <ul class="lista-simple">
        <li><strong>Registros de residuos:</strong> se cancelan lógicamente (estado <em>cancelado</em>) en lugar de borrarse, para conservar el historial y el motivo.</li>
        <li><strong>Tareas:</strong> se cancelan lógicamente (estado <em>cancelada</em>) para conservar el registro de la actividad.</li>
        <li><strong>Usuarios y comisiones:</strong> se desactivan (no se borran) para mantener la trazabilidad de los registros asociados.</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { perfilesService } from '@/services'
import { obtenerTemaPreferido, guardarTema } from '@/utils/tema'

import Alerta from '@/components/Alerta.vue'
import VistaEncabezado from '@/components/VistaEncabezado.vue'
import TarjetaStat from '@/components/TarjetaStat.vue'
import TarjetaDatos from '@/components/TarjetaDatos.vue'

const auth = inject('auth')
const router = useRouter()

const error = ref(null)
const exito = ref(null)
const mensajePrivacidad = ref(null)

const preferencias = ref({
  resumenSemanal: true,
  recordatoriosTareas: true,
  novedadesCampanias: false,
  tema: obtenerTemaPreferido(),
  permisos: 2,
})

const CLAVE_PREF = 'trama-preferencias'

onMounted(() => {
  try {
    const guardadas = localStorage.getItem(CLAVE_PREF)
    if (guardadas) {
      const parsed = JSON.parse(guardadas)
      preferencias.value = { ...preferencias.value, ...parsed, permisos: preferencias.value.permisos }
    }
  } catch (e) {
    // Preferencias no disponibles: se usan los valores por defecto.
  }
})

const avisosActivos = computed(() =>
  [preferencias.value.resumenSemanal, preferencias.value.recordatoriosTareas, preferencias.value.novedadesCampanias]
    .filter(Boolean).length
)

const modoTexto = computed(() => (auth && auth.simulado ? 'Desarrollo' : 'Producción'))
const modoDetalle = computed(() => {
  if (auth && auth.simulado) {
    return 'Datos ficticios locales. No hay persistencia real ni autenticación con Supabase.'
  }
  return 'Datos persistidos en Supabase. Autenticación y autorización activas.'
})

const correoUsuario = computed(() => (auth && auth.usuario && auth.usuario.email) || 'Sin sesión')

function cambiarTema() {
  guardarTema(preferencias.value.tema)
}

function guardarPreferencias() {
  try {
    const { resumenSemanal, recordatoriosTareas, novedadesCampanias, tema } = preferencias.value
    localStorage.setItem(CLAVE_PREF, JSON.stringify({ resumenSemanal, recordatoriosTareas, novedadesCampanias, tema }))
    guardarTema(tema)
    exito.value = 'Preferencias guardadas en este dispositivo.'
  } catch (e) {
    error.value = 'No se pudieron guardar las preferencias en este dispositivo.'
  }
}

function solicitarCambioContrasenia() {
  mensajePrivacidad.value =
    'El cambio de contraseña requiere la integración de recuperación por correo con Supabase. Contactá a un administrador de la cooperativa.'
}

async function descargarMisDatos() {
  if (!auth || !auth.usuario) {
    mensajePrivacidad.value = 'No hay una sesión activa para exportar.'
    return
  }
  let perfil = auth.usuario
  try {
    const r = await perfilesService.listar()
    if (r.exito) {
      perfil = (r.data || []).find((p) => p.id === auth.usuario.id) || auth.usuario
    }
  } catch (e) {
    // Se exporta la sesión local si el servicio no responde.
  }
  const datos = {
    exportedAt: new Date().toISOString(),
    perfil: {
      id: perfil.id,
      nombre: perfil.nombre,
      email: perfil.email,
      rol: perfil.rol,
      comision: perfil.comision,
      activo: perfil.activo,
    },
  }
  const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'trama-mis-datos.json'
  a.click()
  URL.revokeObjectURL(url)
  mensajePrivacidad.value = 'Se descargó un archivo JSON con los datos de tu perfil.'
}

async function cerrarSesionTodos() {
  try {
    const { services } = await import('@/services')
    await services.authService.logout() // supabase-js cierra la sesión global por defecto
  } catch (e) {
    // Se continúa con el cierre local igualmente.
  }
  if (auth && auth.limpiar) auth.limpiar()
  mensajePrivacidad.value = null
  router.push({ name: 'login' })
}
</script>

<style scoped>
.configuracion { width: 100%; }

.tarjetas-superiores { margin-bottom: 16px; }
.tarjetas-superiores h2 { font-size: 1.05rem; margin-bottom: 10px; }

.preferencias-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preferencia-fila {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 4px;
  border-bottom: 1px solid var(--borde);
  font-size: 0.95rem;
  color: var(--texto);
}

.preferencia-fila:last-of-type {
  border-bottom: none;
}

.preferencia-fila input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: var(--verde);
}

.preferencia-select select {
  min-width: 160px;
}

.entrada-select {
  padding: 8px 12px;
  border: 1px solid var(--borde);
  border-radius: var(--radio-campo);
  background: var(--fondo-tarjeta);
  color: var(--texto);
  font-size: 0.92rem;
}

.preferencias-nota {
  font-size: 0.8rem;
  color: var(--texto-suave);
  margin-top: 4px;
}

.acciones {
  display: flex;
  justify-content: flex-end;
  margin-top: 6px;
}

.accion-link {
  text-align: left;
  padding: 10px 4px;
  border-bottom: 1px solid var(--borde);
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--color-verde);
}

.accion-link:hover {
  text-decoration: underline;
}

.accion-peligro {
  color: var(--error-texto);
}

.privacidad-mensaje {
  font-size: 0.82rem;
  color: var(--texto-suave);
  padding-top: 6px;
}

.modo-aviso {
  background: var(--aviso-fondo);
  border: 1px solid var(--aviso-borde);
  border-radius: var(--radio-campo);
  padding: 12px 16px;
  font-size: 0.88rem;
  color: var(--aviso-texto);
  margin-bottom: 16px;
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}

.detalle { font-weight: 400; opacity: 0.85; }

.tarjeta { margin-bottom: 16px; }
.tarjeta h3 { margin: 0 0 12px 0; font-size: 1.02rem; }
.tarjeta p { margin: 0 0 10px 0; color: var(--texto-suave); font-size: 0.92rem; }
.vars { margin: 8px 0 12px 0; padding-left: 18px; color: var(--texto-suave); }
.vars li { margin-bottom: 6px; font-size: 0.92rem; }
.copiar { margin-top: 8px; font-size: 0.85rem; color: var(--texto-suave); }
.copiar code { background: var(--fondo-encabezado-tabla); padding: 2px 6px; border-radius: 4px; }
.aviso { font-size: 0.85rem; font-style: italic; color: var(--texto-suave); margin-top: 6px; }

.lista-simple { padding-left: 18px; color: var(--texto-suave); font-size: 0.92rem; }
.lista-simple li { margin-bottom: 6px; }

.tabla.simple { font-size: 0.88rem; }

.nota { font-size: 0.85rem; color: var(--texto-suave); margin-top: 10px; }
</style>
