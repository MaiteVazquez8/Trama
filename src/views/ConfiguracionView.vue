<template>
  <div class="configuracion">
    <div class="encabezado">
      <h1>Configuración</h1>
      <p>Opciones de la cuenta y configuración del sistema.</p>
    </div>

    <Alerta v-if="error" tipo="error" :mensaje="error" />

    <div class="modo-aviso">
      <strong>Modo de operación:</strong> {{ modoTexto }}
      <span class="detalle">{{ modoDetalle }}</span>
    </div>

    <div class="tarjeta">
      <h3>Conexión con Supabase</h3>
      <p>Para que los registros de Trama se guarden y compartan entre usuarios y dispositivos, configurá las variables de entorno:</p>
      <ul class="vars">
        <li><strong>VITE_SUPABASE_URL</strong>: URL del proyecto de Supabase.</li>
        <li><strong>VITE_SUPABASE_ANON_KEY</strong>: clave pública (anon key) del proyecto.</li>
      </ul>
      <p class="copiar">Copiá <code>.env.example</code> a <code>.env</code> y completá los valores. Nunca subas claves secretas al repositorio.</p>
      <p class="aviso">No se incluyen claves <em>service_role</em> ni credenciales de administración en el frontend.</p>
    </div>

    <div class="tarjeta">
      <h3>Roles y permisos (primera versión)</h3>
      <table class="tabla">
        <thead>
          <tr><th>Rol</th><th>¿Implementado?</th><th>Alcance</th></tr>
        </thead>
        <tbody>
          <tr><td>Administrador</td><td><span class="badge badge-activo">Real</span></td><td>Gestiona usuarios, comisiones y consulta todos los registros.</td></tr>
          <tr><td>Integrante de la cooperativa</td><td><span class="badge badge-activo">Real</span></td><td>Registra residuos, consulta y edita tareas, campañas, entregas y su perfil.</td></tr>
          <tr><td>Comunidad educativa</td><td><span class="badge badge-activo">Real</span></td><td>Consulta información pública (inicio, tachos, campañas, resultados).</td></tr>
        </tbody>
      </table>
      <p class="nota">Mientras Supabase no esté configurado, el acceso funciona en modo desarrollo sin sesión persistente real.</p>
    </div>

    <div class="tarjeta">
      <h3>Conservación del historial</h3>
      <ul>
        <li><strong>Registros de residuos:</strong> se cancelan lógicamente (estado <em>cancelado</em>) en lugar de borrarse, para conservar el historial y el motivo.</li>
        <li><strong>Tareas:</strong> se cancelan lógicamente (estado <em>cancelada</em>) para conservar el registro de la actividad.</li>
        <li><strong>Usuarios y comisiones:</strong> se desactivan (no se borran) para mantener la trazabilidad de los registros asociados.</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, computed } from 'vue'

const auth = inject('auth')

const error = ref(null)

const modoTexto = computed(() => (auth && auth.simulado ? 'Desarrollo' : 'Producción'))
const modoDetalle = computed(() => {
  if (auth && auth.simulado) {
    return 'Datos ficticios locales. No hay persistencia real ni autenticación con Supabase.'
  }
  return 'Datos persistidos en Supabase. Autenticación y autorización activas.'
})
</script>

<style scoped>
.configuracion { max-width: 900px; margin: 0 auto; padding: 0 20px; }
.encabezado { margin-bottom: 22px; }
.encabezado h1 { font-size: 1.75rem; margin: 0 0 6px 0; color: var(--color-verde-oscuro); }
.encabezado p { margin: 0; color: var(--color-texto-suave); }

.modo-aviso {
  background: #FBF0DC;
  border: 1px solid #E8C98E;
  border-radius: 6px;
  padding: 12px 16px;
  font-size: 0.9rem;
  color: #7A4F00;
  margin-bottom: 20px;
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}
.detalle { font-weight: 400; opacity: 0.85; }

.tarjeta { background: var(--color-blanco); border: 1px solid var(--color-borde); border-radius: 10px; padding: 22px; margin-bottom: 18px; }
.tarjeta h3 { margin: 0 0 12px 0; color: var(--color-verde-oscuro); }
.tarjeta p { margin: 0 0 10px 0; color: var(--color-texto-suave); font-size: 0.95rem; }
.vars { margin: 8px 0 12px 0; padding-left: 18px; color: var(--color-texto-suave); }
.vars li { margin-bottom: 6px; font-size: 0.95rem; }
.copiar { margin-top: 8px; font-size: 0.85rem; color: var(--color-texto-suave); }
.copiar code { background: #F2EEE0; padding: 2px 6px; border-radius: 4px; }
.aviso { font-size: 0.85rem; font-style: italic; color: var(--color-texto-suave); margin-top: 6px; }

.tabla { width: 100%; border-collapse: collapse; background: var(--color-blanco); border: 1px solid var(--color-borde); border-radius: 8px; font-size: 0.9rem; margin-top: 10px; }
.tabla th, .tabla td { padding: 12px 14px; text-align: left; border-bottom: 1px solid var(--color-borde); }
.tabla th { background: var(--color-gris-claro); font-weight: 700; font-size: 0.8rem; text-transform: uppercase; color: var(--color-texto-suave); }
.tabla tr:last-child td { border-bottom: none; }

.nota { font-size: 0.85rem; color: var(--color-texto-suave); margin-top: 10px; }
</style>
