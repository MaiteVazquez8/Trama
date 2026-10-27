<template>
  <div class="panel">
    <div class="encabezado">
      <h1>Panel principal</h1>
      <p>Resumen del funcionamiento del proyecto y acceso rápido a las funciones principales.</p>
    </div>

    <Alerta v-if="mensaje" tipo="error" :mensaje="mensaje" />
    <Alerta v-if="mensajeExito" tipo="exito" :mensaje="mensajeExito" />

    <div class="modo-aviso" v-if="modoDesarrollo">
      ⚠️ Modo desarrollo: los datos que se muestran son <strong>ficticios (de prueba)</strong>.
      Configurá Supabase para usar datos reales compartidos.
    </div>

    <div class="kpis">
      <KpiCard
        v-for="kpi in tarjetasKPI"
        :key="kpi.nombre"
        :nombre="kpi.nombre"
        :valor="kpi.valor"
        :unidad="kpi.unidad"
        :meta="kpi.meta"
        :cumplido="kpi.cumplido"
        :categoria="kpi.categoria"
      />
    </div>

    <div class="bloques">
      <div class="bloque">
        <h2>Accesos rápidos</h2>
        <div class="acciones">
          <a class="accion" @click="ir('residuo-nuevo')">
            <span class="icono">♻️</span>
            <span>Registrar residuos</span>
          </a>
          <a class="accion" @click="ir('historial-residuos')">
            <span class="icono">📋</span>
            <span>Historial de residuos</span>
          </a>
          <a class="accion" @click="ir('tareas')">
            <span class="icono">📝</span>
            <span>Tareas y actividades</span>
          </a>
          <a class="accion" @click="ir('campañas')">
            <span class="icono">📢</span>
            <span>Campañas de concientización</span>
          </a>
          <a class="accion" @click="ir('entregas')">
            <span class="icono">🚚</span>
            <span>Entregas a cooperativa externa</span>
          </a>
          <a class="accion" @click="ir('estadisticas')">
            <span class="icono">📊</span>
            <span>Estadísticas y KPI</span>
          </a>
          <a class="accion" @click="ir('perfil')">
            <span class="icono">👤</span>
            <span>Mi perfil</span>
          </a>
          <a v-if="esAdmin" class="accion" @click="ir('usuarios')">
            <span class="icono">👥</span>
            <span>Gestión de usuarios</span>
          </a>
        </div>
      </div>

      <div class="bloque">
        <h2>Últimos registros de residuos</h2>
        <div class="tabla-pequena" v-if="registrosRecientes.length">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo de material</th>
                <th>Cantidad (kg)</th>
                <th>Lugar</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in registrosRecientes" :key="r.id">
                <td>{{ formatearFecha(r.fecha) }}</td>
                <td>{{ tipoNombre(r.tipoResiduo) }}</td>
                <td>{{ Number(r.cantidadKg).toFixed(1) }}</td>
                <td>{{ r.lugar }}</td>
                <td><span class="badge" :class="claseEstado(r.estado)">{{ r.estado }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="vacio" v-else>
          <p>No hay registros de residuos aún.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { inject } from 'vue'
import { estadisticasService, registrosResiduoService, tiposResiduoService } from '@/services'

import Alerta from '@/components/Alerta.vue'
import KpiCard from '@/components/KpiCard.vue'

const auth = inject('auth')
const router = useRouter()

const esAdmin = computed(() => auth && auth.rol === 'administrador')
const modoDesarrollo = computed(() => auth && auth.simulado)

const cargando = ref(false)
const mensaje = ref(null)
const mensajeExito = ref(null)
const registrosRecientes = ref([])
const tiposResiduo = ref([])

const tarjetasKPI = ref([])

onMounted(async () => {
  cargando.value = true
  try {
    const r = await estadisticasService.resumen()
    if (r.exito) {
      const d = r.datos
      tarjetasKPI.value = [
        {
          nombre: 'Materiales recuperados este mes',
          valor: d.recuperadoKgMes.toFixed(1),
          unidad: 'kg',
          meta: '≥ 20 kg / mes',
          cumplido: d.cumplimientoRecuperado,
          categoria: 'Recursos',
        },
        {
          nombre: 'Residuos correctamente separados',
          valor: d.porcentajeSeparados != null ? d.porcentajeSeparados : '—',
          unidad: '%',
          meta: '≥ 80 %',
          cumplido: d.cumplimientoSeparados,
          categoria: 'Comunidad',
        },
        {
          nombre: 'Tareas completadas a tiempo',
          valor: d.porcentajeTareas != null ? d.porcentajeTareas : '—',
          unidad: '%',
          meta: '≥ 90 %',
          cumplido: d.cumplimientoTareas,
          categoria: 'Procesos',
        },
        {
          nombre: 'Estudiantes participantes',
          valor: d.porcentajeParticipacion != null ? d.porcentajeParticipacion : '—',
          unidad: '%',
          meta: '≥ 70 %',
          cumplido: d.cumplimientoParticipacion,
          categoria: 'Personas',
        },
      ]
      mensajeExito.value = r.simulado
        ? 'Datos cargados en modo desarrollo (ficticios).'
        : 'Datos cargados desde Supabase.'
    } else {
      mensaje.value = r.error?.message || 'No se pudieron cargar las estadísticas.'
    }

    const tipos = await tiposResiduoService.listar()
    if (tipos.exito) tiposResiduo.value = tipos.data

    const listado = await registrosResiduoService.listar()
    if (listado.exito) {
      registrosRecientes.value = (listado.data || []).slice(0, 6)
    }
  } catch (e) {
    mensaje.value = 'Error de conexión al cargar el panel.'
  } finally {
    cargando.value = false
  }
})

function formatearFecha(iso) {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('es-AR')
}

function tipoNombre(id) {
  const t = tiposResiduo.value.find((x) => x.id === id)
  return t ? t.nombre : '—'
}

function claseEstado(estado) {
  return { activo: 'badge-activo', cancelado: 'badge-cancelada' }[estado] || 'badge-pendiente'
}

function ir(ruta) { router.push({ name: ruta }) }
</script>

<style scoped>
.panel { max-width: 1100px; margin: 0 auto; padding: 0 20px; }
.encabezado { margin-bottom: 24px; }
.encabezado h1 { font-size: 1.75rem; margin: 0 0 6px 0; color: var(--color-verde-oscuro); }
.encabezado p { margin: 0; color: var(--color-texto-suave); }

.kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 16px; margin-bottom: 30px; }

.bloques { display: grid; grid-template-columns: 1fr 320px; gap: 24px; }
.bloque h2 { font-size: 1.25rem; margin-bottom: 14px; color: var(--color-verde-oscuro); }

.acciones { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 10px; }
.accion {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: var(--color-blanco);
  border: 1px solid var(--color-borde);
  border-radius: 8px;
  font-size: 0.95rem;
  color: var(--color-texto);
  cursor: pointer;
  transition: all 0.2s;
}
.accion:hover { background: var(--color-gris-claro); border-color: var(--color-verde); color: var(--color-verde); }
.accion .icono { font-size: 1.25rem; }

.tabla-pequena table { width: 100%; font-size: 0.85rem; }
.tabla-pequena th { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.4px; }

.modo-aviso {
  background: #FBF0DC;
  border: 1px solid #E8C98E;
  border-radius: 6px;
  padding: 12px 16px;
  font-size: 0.9rem;
  color: #7A4F00;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 900px) {
  .bloques { grid-template-columns: 1fr; }
}
</style>
