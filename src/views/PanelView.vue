<template>
  <div class="panel">
    <VistaEncabezado titulo="Panel principal" subtitulo="Resumen de actividad de la comunidad">
      <template #accion>
        <button class="btn btn-primary" @click="ir('residuo-nuevo')">Registrar residuos</button>
      </template>
    </VistaEncabezado>

    <Alerta v-if="mensaje" tipo="error" :mensaje="mensaje" />

    <div class="modo-aviso" v-if="modoDesarrollo">
      Modo desarrollo: los datos que se muestran son <strong>ficticios (de prueba)</strong>.
      Configurá Supabase para usar datos reales compartidos.
    </div>

    <div class="estadisticas-fila">
      <TarjetaStat :texto="`${kgRecuperados} kg recuperados`" />
      <TarjetaStat :texto="`${participacion} % participación`" />
      <TarjetaStat :texto="`${tareasAbiertas} tareas abiertas`" />
    </div>

    <div class="contenido-doble">
      <div class="card tarjeta-actividad">
        <h2>Actividad de hoy</h2>
        <p class="actividad-texto">{{ actividadTexto }}</p>
        <ul class="actividad-lista">
          <li v-for="r in registrosRecientes" :key="r.id">
            <span class="actividad-fecha">{{ formatearFecha(r.fecha) }}</span>
            {{ tipoNombre(r.tipoResiduo) }} · {{ Number(r.cantidadKg).toFixed(1) }} kg · {{ r.lugar }}
          </li>
          <li v-if="registrosRecientes.length === 0" class="actividad-vacia">Aún no hay registros de residuos.</li>
        </ul>
      </div>

      <TarjetaDatos titulo="Agenda próxima">
        <p v-if="agenda.length === 0" class="item-datos">No hay eventos próximos cargados.</p>
        <p v-for="item in agenda" :key="item.id" class="item-datos">
          <strong>{{ item.fecha }}</strong> {{ item.descripcion }}
        </p>
      </TarjetaDatos>
    </div>

    <div class="card accesos-rapidos">
      <div class="accesos-encabezado">
        <h2>Accesos rápidos</h2>
        <router-link :to="{ name: 'estadisticas' }" class="enlace-ver">Ver estadísticas →</router-link>
      </div>
      <div class="acciones">
        <button v-for="a in accesos" :key="a.ruta" class="accion" @click="ir(a.ruta)">
          {{ a.label }}
        </button>
      </div>
    </div>

    <div class="card indicadores-card">
      <div class="accesos-encabezado">
        <h2>Indicadores clave</h2>
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
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, inject } from 'vue'
import { useRouter } from 'vue-router'
import { estadisticasService, registrosResiduoService, tiposResiduoService, tareasService, reunionesService, entregasService } from '@/services'

import Alerta from '@/components/Alerta.vue'
import KpiCard from '@/components/KpiCard.vue'
import VistaEncabezado from '@/components/VistaEncabezado.vue'
import TarjetaStat from '@/components/TarjetaStat.vue'
import TarjetaDatos from '@/components/TarjetaDatos.vue'

const auth = inject('auth')
const router = useRouter()

const esAdmin = computed(() => auth && auth.rol === 'administrador')
const modoDesarrollo = computed(() => auth && auth.simulado)

const mensaje = ref(null)
const registrosRecientes = ref([])
const tiposResiduo = ref([])
const tarjetasKPI = ref([])
const actividadesRaw = ref([])
const reunionesRaw = ref([])
const entregasRaw = ref([])

const recuperadoKgMes = ref(0)
const participacion = ref('—')
const tareasAbiertas = ref(0)

const kgRecuperados = computed(() => Math.round(recuperadoKgMes.value))

const actividadTexto = computed(() => {
  if (registrosRecientes.value.length) {
    const ultimo = registrosRecientes.value[0]
    return `Último movimiento: ${tipoNombre(ultimo.tipoResiduo)} · ${Number(ultimo.cantidadKg).toFixed(1)} kg en ${ultimo.lugar}.`
  }
  return 'Todavía no hay movimientos registrados. Cuando se cargue el primer registro, vas a verlo acá.'
})

const agenda = computed(() => {
  const items = []
  const fmt = (iso) => {
    if (!iso) return ''
    const fecha = new Date(iso.length > 10 ? iso : iso + 'T00:00:00')
    return `${String(fecha.getDate()).padStart(2, '0')} ${fecha.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '').toUpperCase()}`
  }
  for (const r of reunionesRaw.value.slice(0, 2)) {
    items.push({ id: `re-${r.id}`, fecha: fmt(r.fecha), descripcion: `Reunión · ${r.asistentes || 'sin confirmación'}` })
  }
  for (const e of entregasRaw.value.filter((x) => x.estado === 'programada').slice(0, 2)) {
    items.push({ id: `en-${e.id}`, fecha: fmt(e.fecha), descripcion: `Entrega cooperativa · ${e.materiales || 'materiales a confirmar'}` })
  }
  return items.slice(0, 3)
})

const accesos = computed(() => {
  const base = [
    { ruta: 'residuo-nuevo', label: 'Registrar residuos' },
    { ruta: 'historial-residuos', label: 'Historial de residuos' },
    { ruta: 'tareas', label: 'Tareas y actividades' },
    { ruta: 'campañas', label: 'Campañas de concientización' },
    { ruta: 'entregas', label: 'Entregas a cooperativa externa' },
    { ruta: 'tachos', label: 'Tachos' },
    { ruta: 'perfil', label: 'Mi perfil' },
  ]
  if (esAdmin.value) base.push({ ruta: 'usuarios', label: 'Gestión de usuarios' })
  return base
})

onMounted(async () => {
  try {
    const [r, tipos, listado, tareas, reuniones, entregas] = await Promise.all([
      estadisticasService.resumen(),
      tiposResiduoService.listar(),
      registrosResiduoService.listar(),
      tareasService.listar(),
      reunionesService.listar(),
      entregasService.listar(),
    ])

    if (r.exito) {
      const d = r.datos
      recuperadoKgMes.value = d.recuperadoKgMes || 0
      participacion.value = d.porcentajeParticipacion != null ? d.porcentajeParticipacion : '—'
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
    } else {
      mensaje.value = r.error?.message || 'No se pudieron cargar las estadísticas.'
    }

    if (tipos.exito) tiposResiduo.value = tipos.data
    if (listado.exito) registrosRecientes.value = (listado.data || []).slice(0, 4)
    if (tareas.exito) tareasAbiertas.value = (tareas.data || []).filter((t) => t.estado === 'pendiente').length
    if (reuniones.exito) reunionesRaw.value = reuniones.data || []
    if (entregas.exito) entregasRaw.value = entregas.data || []
  } catch (e) {
    mensaje.value = 'Error de conexión al cargar el panel.'
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

function ir(ruta) { router.push({ name: ruta }) }
</script>

<style scoped>
.panel { width: 100%; }

.tarjeta-actividad h2,
.accesos-rapidos h2,
.indicadores-card h2 {
  font-size: 1.05rem;
  margin-bottom: 10px;
}

.actividad-texto {
  font-size: 0.92rem;
  color: var(--texto-suave);
  margin-bottom: 12px;
}

.actividad-lista {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.88rem;
}

.actividad-lista li {
  border-top: 1px solid var(--borde);
  padding-top: 8px;
}

.actividad-lista .actividad-fecha {
  display: inline-block;
  min-width: 74px;
  font-weight: 800;
  font-size: 0.75rem;
  color: var(--texto-suave);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.actividad-vacia { color: var(--texto-suave); border-top: none; padding-top: 0; }

.accesos-rapidos,
.indicadores-card {
  margin-top: 16px;
}

.accesos-encabezado {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.accesos-encabezado h2 { margin-bottom: 0; }

.enlace-ver {
  color: var(--color-verde);
  font-weight: 800;
  font-size: 0.88rem;
}

.enlace-ver:hover { text-decoration: underline; }

.acciones {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.accion {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  background: var(--fondo-crema);
  border: 1px solid var(--borde);
  border-radius: var(--radio-pill);
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--texto);
  transition: all 0.2s;
}

.accion:hover { border-color: var(--verde); color: var(--color-verde); }

.kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 12px;
}
</style>
