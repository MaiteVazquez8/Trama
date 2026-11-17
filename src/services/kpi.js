/* --------------------------------------------------------------------------
   Trama - Cálculo compartido de KPI y visualizaciones
   --------------------------------------------------------------------------
   ÚNICA fuente de cálculo. La utilizan Estadísticas, Tablero e Informe para
   que los números de las tres vistas nunca difieran entre sí.
-------------------------------------------------------------------------- */
import {
  registrosResiduoService,
  tareasService,
  actividadesService,
  entregasService,
  tiposResiduoService,
} from './index'

export const REFERENCIA_ESTUDIANTES = 40
export const META_KG_RECUPERADOS = 20
export const META_SEPARACION = 80
export const META_TAREAS = 90
export const META_PARTICIPACION = 70

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
  'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

export function nombreMes(clave) {
  const [anio, mes] = String(clave).split('-').map(Number)
  if (!anio || !mes) return String(clave)
  const nombre = MESES[mes - 1]
  return `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} ${anio}`
}

export function mesDeFecha(fechaIso) {
  return fechaIso ? String(fechaIso).slice(0, 7) : null
}

export function listarMeses(fechas) {
  const set = new Set()
  for (const f of fechas) {
    const clave = mesDeFecha(f)
    if (clave) set.add(clave)
  }
  return [...set].sort().reverse()
}

export function mesActualClave() {
  const ahora = new Date()
  return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`
}

export function ultimosMeses(cantidad = 6) {
  const resultado = []
  const ahora = new Date()
  for (let i = cantidad - 1; i >= 0; i--) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1)
    resultado.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return resultado
}

export function filtrarPorPeriodo(lista, periodo, campo = 'fecha') {
  if (!periodo || periodo === 'todos') return [...lista]
  return lista.filter((item) => mesDeFecha(item[campo]) === periodo)
}

export function soloActivos(lista) {
  return lista.filter((r) => r.estado === 'activo')
}

export function calcularRecuperado(registrosActivos) {
  const porMaterial = new Map()
  let totalKg = 0
  for (const r of registrosActivos) {
    const kg = Number(r.cantidadKg || 0)
    if (r.tipoResiduo === 'tr-6') continue
    totalKg += kg
    porMaterial.set(r.tipoResiduo, (porMaterial.get(r.tipoResiduo) || 0) + kg)
  }
  return { totalKg, porMaterial }
}

export function calcularSeparacion(registrosActivos) {
  const total = registrosActivos.length
  const correctos = registrosActivos.filter((r) => r.tipoResiduo !== 'tr-6').length
  const porcentaje = total > 0 ? Math.round((correctos / total) * 100) : null
  return { correctos, total, porcentaje }
}

export function tareasVigentes(tareas) {
  return tareas.filter((t) => t.estado !== 'cancelada' && t.estado !== 'cancelado')
}

export function calcularCumplimientoTareas(tareas) {
  const vigentes = tareasVigentes(tareas)
  const total = vigentes.length
  const completadas = vigentes.filter((t) => t.estado === 'completada').length
  const porcentaje = total > 0 ? Math.round((completadas / total) * 100) : null
  return { completadas, total, porcentaje }
}

export function evolucionTareasPorMes(tareas, meses) {
  return meses.map((clave) => {
    const tareasMes = tareasVigentes(tareas).filter((t) => mesDeFecha(t.fecha) === clave)
    const total = tareasMes.length
    const completadas = tareasMes.filter((t) => t.estado === 'completada').length
    const porcentaje = total > 0 ? Math.round((completadas / total) * 100) : null
    return { mes: clave, completadas, total, porcentaje }
  })
}

export function calcularParticipacion(actividades) {
  const participantes = actividades.reduce((suma, a) => suma + Number(a.participantes || 0), 0)
  const porcentaje = REFERENCIA_ESTUDIANTES > 0
    ? Math.round((participantes / REFERENCIA_ESTUDIANTES) * 100)
    : null
  return { participantes, porcentaje, referencia: REFERENCIA_ESTUDIANTES }
}

export function calcularKgEntregados(entregas) {
  return entregas
    .filter((e) => e.estado === 'completada' && e.pesoTotalKg)
    .reduce((suma, e) => suma + Number(e.pesoTotalKg), 0)
}

/* Carga unificada de datos desde la MISMA capa de servicios del sistema */
export async function cargarDatosPeriodo(periodo) {
  const [rRegistros, rTareas, rActividades, rEntregas, rTipos] = await Promise.all([
    registrosResiduoService.listar(),
    tareasService.listar(),
    actividadesService.listar(),
    entregasService.listar(),
    tiposResiduoService.listar(),
  ])

  for (const r of [rRegistros, rTareas, rActividades, rEntregas, rTipos]) {
    if (!r.exito) {
      const mensaje = r.error?.message || 'No se pudieron cargar los datos.'
      return { exito: false, error: mensaje }
    }
  }

  const registros = soloActivos(rRegistros.data || [])
  const tareas = rTareas.data || []
  const actividades = rActividades.data || []
  const entregas = rEntregas.data || []
  const tipos = rTipos.data || []

  const simulado = Boolean(rRegistros.simulado || rTareas.simulado || rActividades.simulado
    || rEntregas.simulado || rTipos.simulado)

  const periodosDisponibles = listarMeses([
    ...registros.map((r) => r.fecha),
    ...tareas.map((t) => t.fecha),
    ...actividades.map((a) => a.fecha),
  ])
  if (!periodosDisponibles.includes(mesActualClave())) {
    periodosDisponibles.unshift(mesActualClave())
  }

  const periodoEfectivo = periodo || mesActualClave()
  const esTodos = periodoEfectivo === 'todos'
  const registrosPeriodo = filtrarPorPeriodo(registros, esTodos ? 'todos' : periodoEfectivo)
  const tareasPeriodo = filtrarPorPeriodo(tareas, esTodos ? 'todos' : periodoEfectivo)
  const actividadesPeriodo = filtrarPorPeriodo(actividades, esTodos ? 'todos' : periodoEfectivo)
  const historicoMeses = ultimosMeses(6)

  return construirResultados({
    periodo: esTodos ? 'todos' : periodoEfectivo,
    registrosTodos: registros,
    registrosPeriodo,
    tareas,
    tareasPeriodo,
    actividadesPeriodo,
    entregas,
    tipos,
    simulado,
    historicoMeses,
    periodosDisponibles,
  })
}

function construirResultados(ctx) {
  const {
    periodo,
    registrosTodos,
    registrosPeriodo,
    tareas,
    tareasPeriodo,
    actividadesPeriodo,
    entregas,
    tipos,
    simulado,
    historicoMeses,
    periodosDisponibles,
  } = ctx

  const nombrePorId = new Map(tipos.map((t) => [t.id, t.nombre]))
  const nombreMaterial = (id) => nombrePorId.get(id) || id
  const esTodos = periodo === 'todos'

  // KPI 1 — materiales recuperados
  const { totalKg, porMaterial } = calcularRecuperado(registrosPeriodo)
  const mesesConRecuperacion = esTodos
    ? new Set(registrosTodos.filter((r) => r.tipoResiduo !== 'tr-6').map((r) => mesDeFecha(r.fecha))).size || 1
    : 1
  const kgPromedioMensual = esTodos ? totalKg / mesesConRecuperacion : totalKg
  const cumplidoRecuperado = kgPromedioMensual >= META_KG_RECUPERADOS

  // KPI 2 — separación correcta
  const { correctos, total: totalRevisados, porcentaje: porcentajeSeparados } =
    calcularSeparacion(registrosPeriodo)
  const cumplimientoSeparados = porcentajeSeparados != null
    && porcentajeSeparados >= META_SEPARACION

  // KPI 3 — tareas completadas a tiempo
  const { completadas, total: totalTareas, porcentaje: porcentajeTareas } =
    calcularCumplimientoTareas(tareasPeriodo)
  const cumplimientoTareas = porcentajeTareas != null && porcentajeTareas >= META_TAREAS

  // KPI 4 — participación (meta mensual; en período agregado no aplica)
  const { participantes, porcentaje: participacionMensual, referencia } =
    calcularParticipacion(actividadesPeriodo)
  let porcentajeParticipacion = participacionMensual
  let cumplimientoParticipacion = participacionMensual != null
    && participacionMensual >= META_PARTICIPACION
  let calculableParticipacion = participacionMensual != null
  let detalleParticipacion = actividadesPeriodo.length > 0
    ? `${participantes} participantes acumulados en ${actividadesPeriodo.length} actividad${actividadesPeriodo.length !== 1 ? 'es' : ''} ÷ ${referencia} estudiantes de referencia.`
    : 'Sin actividades registradas en el período.'
  if (esTodos) {
    porcentajeParticipacion = null
    cumplimientoParticipacion = false
    calculableParticipacion = false
    detalleParticipacion = `${participantes} participaciones acumuladas en todo el período. La meta (≥ ${META_PARTICIPACION} % sobre ${referencia} estudiantes) es mensual y no aplica a un período agregado.`
  }

  // Gráfico de barras — kg por material reciclable
  const barrasMateriales = [...porMaterial.entries()]
    .map(([id, kg]) => ({ id, material: nombreMaterial(id), kg: Math.round(kg * 10) / 10 }))
    .sort((a, b) => b.kg - a.kg)

  // Gráfico de dona — separación correcta
  const donaSeparacion = {
    correctos,
    incorrectos: totalRevisados - correctos,
    total: totalRevisados,
    porcentaje: porcentajeSeparados,
  }

  // Gráfico de líneas — evolución de cumplimiento de tareas (6 meses)
  const lineasTareas = evolucionTareasPorMes(tareas, historicoMeses)

  const kpis = [
    {
      id: 'kg',
      nombre: 'Kilogramos de materiales reciclables recuperados',
      resultado: Math.round(kgPromedioMensual * 10) / 10,
      resultadoFormateado: `${Math.round(kgPromedioMensual * 10) / 10} kg`,
      unidad: esTodos ? 'kg / mes (promedio)' : 'kg',
      meta: `≥ ${META_KG_RECUPERADOS} kg por mes`,
      metaValor: META_KG_RECUPERADOS,
      periodo,
      cumplido: cumplidoRecuperado,
      calculable: true,
      detalle: esTodos
        ? `${Math.round(totalKg * 10) / 10} kg en total ÷ ${mesesConRecuperacion} ${mesesConRecuperacion !== 1 ? 'meses con' : 'mes con'} registros.`
        : 'Suma de los registros activos reciclables del período.',
      prioritario: true,
      categoria: 'Financiero o de recursos',
    },
    {
      id: 'separacion',
      nombre: 'Porcentaje de residuos correctamente separados',
      resultado: porcentajeSeparados,
      resultadoFormateado: porcentajeSeparados != null ? `${porcentajeSeparados} %` : 'No calculable',
      unidad: '%',
      meta: `≥ ${META_SEPARACION} %`,
      metaValor: META_SEPARACION,
      periodo,
      cumplido: cumplimientoSeparados,
      calculable: porcentajeSeparados != null,
      detalle: totalRevisados > 0
        ? `${correctos} de ${totalRevisados} registros revisados correctos.`
        : 'Sin registros revisados en el período: no hay denominador para calcular el porcentaje.',
      prioritario: true,
      categoria: 'Usuarios o comunidad',
    },
    {
      id: 'tareas',
      nombre: 'Porcentaje de tareas completadas a tiempo',
      resultado: porcentajeTareas,
      resultadoFormateado: porcentajeTareas != null ? `${porcentajeTareas} %` : 'No calculable',
      unidad: '%',
      meta: `≥ ${META_TAREAS} %`,
      metaValor: META_TAREAS,
      periodo,
      cumplido: cumplimientoTareas,
      calculable: porcentajeTareas != null,
      detalle: totalTareas > 0
        ? `${completadas} de ${totalTareas} tareas programadas completadas (excluye canceladas).`
        : 'No hay tareas programadas en el período.',
      prioritario: false,
      categoria: 'Procesos',
    },
    {
      id: 'participacion',
      nombre: 'Porcentaje de estudiantes que participan',
      resultado: porcentajeParticipacion,
      resultadoFormateado: porcentajeParticipacion != null ? `${porcentajeParticipacion} %` : 'No calculable',
      unidad: '%',
      meta: `≥ ${META_PARTICIPACION} %`,
      metaValor: META_PARTICIPACION,
      periodo,
      cumplido: cumplimientoParticipacion,
      calculable: calculableParticipacion,
      detalle: detalleParticipacion,
      prioritario: false,
      categoria: 'Personas',
    },
  ]

  return {
    exito: true,
    simulado,
    periodo,
    esTodos,
    nombrePeriodo: esTodos ? 'Todos los períodos registrados' : nombreMes(periodo),
    periodosDisponibles,
    kpis,
    barrasMateriales,
    donaSeparacion,
    lineasTareas,
    registrosPeriodo,
    tareasPeriodo,
    actividadesPeriodo,
    entregas,
    tipos,
    kgEntregados: calcularKgEntregados(entregas),
    actualizadoEn: new Date(),
  }
}
