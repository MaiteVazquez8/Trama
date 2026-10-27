/* --------------------------------------------------------------------------
   Trama - Datos ficticios de prueba (MODO DESARROLLO / PRUEBAS)
   --------------------------------------------------------------------------
   Estos datos son SIMULADOS y se utilizan ÚNICAMENTE cuando el proyecto no
   tiene configurada una conexión con Supabase (variables de entorno
   VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY). No son datos reales y no
   deben insertarse automáticamente en un entorno productivo.

   No se usan nombres de estudiantes ni datos personales reales.
-------------------------------------------------------------------------- */

const ahora = new Date()
const mesActual = ahora.getMonth()
const añoActual = ahora.getFullYear()

function fecha(diasDesplazamiento = 0) {
  const f = new Date(añoActual, mesActual, 1 + diasDesplazamiento)
  return f.toISOString().split('T')[0]
}

function fechaHora(diasDesplazamiento = 0, horas = 10) {
  const f = new Date(añoActual, mesActual, 1 + diasDesplazamiento, horas, 30, 0)
  return f.toISOString()
}

export const TIPOS_RESIDUO = [
  { id: 'tr-1', nombre: 'Papel y cartón', categoria: 'reciclable', descripcion: 'Hojas, cajas, cuadernos, envases de cartón.' },
  { id: 'tr-2', nombre: 'Plásticos', categoria: 'reciclable', descripcion: 'Botellas, envases, bolsas plásticas.' },
  { id: 'tr-3', nombre: 'Vidrio', categoria: 'reciclable', descripcion: 'Botellas y frascos de vidrio.' },
  { id: 'tr-4', nombre: 'Metales', categoria: 'reciclable', descripcion: 'Latas, envases metálicos.' },
  { id: 'tr-5', nombre: 'Orgánico', categoria: 'compostable', descripcion: 'Restos de comida, cáscaras de fruta.' },
  { id: 'tr-6', nombre: 'Residuos comunes', categoria: 'no-reciclable', descripcion: 'Materiales que no se pueden recuperar.' },
]

export const COMISIONES = [
  { id: 'com-1', nombre: 'Organización', descripcion: 'Coordina actividades, reuniones y el funcionamiento general.', activo: true },
  { id: 'com-2', nombre: 'Concientización', descripcion: 'Desarrolla campañas y materiales informativos.', activo: true },
  { id: 'com-3', nombre: 'Mantenimiento', descripcion: 'Controla los tachos, la señalización y su estado.', activo: true },
  { id: 'com-4', nombre: 'Registro', descripcion: 'Registra los residuos y los datos del proyecto.', activo: true },
  { id: 'com-5', nombre: 'Vinculación', descripcion: 'Coordina las entregas con la cooperativa externa.', activo: true },
]

export const PERFILES = [
  { id: 'pf-1', email: 'admin@trama.edu', nombre: 'Administrador Sistema', rol: 'administrador', comision: null, activo: true },
  { id: 'pf-2', email: 'registro@trama.edu', nombre: 'Integrante Registro', rol: 'integrante', comision: 'com-4', activo: true },
  { id: 'pf-3', email: 'mantenimiento@trama.edu', nombre: 'Integrante Mantenimiento', rol: 'integrante', comision: 'com-3', activo: true },
  { id: 'pf-4', email: 'organizacion@trama.edu', nombre: 'Integrante Organización', rol: 'integrante', comision: 'com-1', activo: true },
  { id: 'pf-5', email: 'comunidad@trama.edu', nombre: 'Comunidad Educativa', rol: 'comunidad', comision: null, activo: true },
]

export const TACHOS = [
  { id: 'ta-1', nombre: 'Tacho Patio - Papel y cartón', ubicacion: 'Patio central', tipoResiduo: 'tr-1', activo: true },
  { id: 'ta-2', nombre: 'Tacho Pasillo - Plásticos', ubicacion: 'Pasillo planta baja', tipoResiduo: 'tr-2', activo: true },
  { id: 'ta-3', nombre: 'Tacho Kiosco - Residuos comunes', ubicacion: 'Cerca del kiosco', tipoResiduo: 'tr-6', activo: true },
  { id: 'ta-4', nombre: 'Tacho Taller - Metales', ubicacion: 'Taller escolar', tipoResiduo: 'tr-4', activo: true },
]

export const REGISTROS_RESIDUO = [
  { id: 'rr-1', tipoResiduo: 'tr-1', cantidadKg: 12.5, lugar: 'Patio central', fecha: fecha(-5), registradoPor: 'pf-2', estado: 'activo', creadoEn: fechaHora(-5) },
  { id: 'rr-2', tipoResiduo: 'tr-2', cantidadKg: 8.0, lugar: 'Pasillo planta baja', fecha: fecha(-4), registradoPor: 'pf-2', estado: 'activo', creadoEn: fechaHora(-4) },
  { id: 'rr-3', tipoResiduo: 'tr-6', cantidadKg: 5.5, lugar: 'Cerca del kiosco', fecha: fecha(-3), registradoPor: 'pf-2', estado: 'activo', creadoEn: fechaHora(-3) },
  { id: 'rr-4', tipoResiduo: 'tr-1', cantidadKg: 6.2, lugar: 'Patio central', fecha: fecha(-2), registradoPor: 'pf-2', estado: 'activo', creadoEn: fechaHora(-2) },
  { id: 'rr-5', tipoResiduo: 'tr-4', cantidadKg: 3.0, lugar: 'Taller escolar', fecha: fecha(-1), registradoPor: 'pf-2', estado: 'activo', creadoEn: fechaHora(-1) },
  { id: 'rr-6', tipoResiduo: 'tr-2', cantidadKg: 7.5, lugar: 'Pasillo planta baja', fecha: fecha(0), registradoPor: 'pf-2', estado: 'activo', creadoEn: fechaHora(0) },
  { id: 'rr-7', tipoResiduo: 'tr-1', cantidadKg: 4.0, lugar: 'Patio central', fecha: fecha(-10), registradoPor: 'pf-2', estado: 'cancelado', creadoEn: fechaHora(-10), canceladoEn: fechaHora(-8), motivoCancelacion: 'Registro duplicado por error de captura' },
  { id: 'rr-8', tipoResiduo: 'tr-5', cantidadKg: 2.5, lugar: 'Comedor', fecha: fecha(-6), registradoPor: 'pf-2', estado: 'activo', creadoEn: fechaHora(-6) },
]

export const TAREAS = [
  { id: 'ta-1', titulo: 'Revisar estado de tachos del patio', descripcion: 'Verificar que los tachos estén en su lugar y con carteles visibles.', comision: 'com-3', responsable: 'pf-3', fecha: fecha(2), estado: 'pendiente', creadoEn: fechaHora(-3) },
  { id: 'ta-2', titulo: 'Registro semanal de residuos', descripcion: 'Cargar las cantidades recolectadas durante la semana.', comision: 'com-4', responsable: 'pf-2', fecha: fecha(5), estado: 'pendiente', creadoEn: fechaHora(-5) },
  { id: 'ta-3', titulo: 'Campaña de concientización en cursos', descripcion: 'Explicar el funcionamiento de los tachos en 3 cursos.', comision: 'com-2', responsable: 'pf-2', fecha: fecha(-1), estado: 'completada', creadoEn: fechaHora(-10) },
  { id: 'ta-4', titulo: 'Coordinar entrega a cooperativa externa', descripcion: 'Acordar día de retiro de materiales acumulados.', comision: 'com-5', responsable: 'pf-4', fecha: fecha(10), estado: 'pendiente', creadoEn: fechaHora(-2) },
  { id: 'ta-5', titulo: 'Reparar cartel del tacho de plásticos', descripcion: 'El cartel está roto; reimprimir y colocar.', comision: 'com-3', responsable: 'pf-3', fecha: fecha(-8), estado: 'cancelada', creadoEn: fechaHora(-15), canceladoEn: fechaHora(-12), motivoCancelacion: 'Se resolvió con cartel de repuesto' },
]

export const CAMPANIAS = [
  { id: 'ca-1', titulo: 'Separa bien tu residuo', descripcion: 'Campaña informativa sobre qué va en cada tacho.', fechaInicio: fecha(-15), fechaFin: fecha(15), estado: 'activa', publicadoPor: 'pf-4', creadoEn: fechaHora(-20) },
  { id: 'ca-2', titulo: 'Menos residuos mezclados', descripcion: 'Concientización sobre la reducción de residuos comunes.', fechaInicio: fecha(1), fechaFin: fecha(20), estado: 'programada', publicadoPor: 'pf-4', creadoEn: fechaHora(-5) },
]

export const REUNIONES = [
  { id: 're-1', fecha: fecha(-20), temas: 'Organización de comisiones y cronograma mensual.', asistentes: '4 integrantes', creadoEn: fechaHora(-21) },
  { id: 're-2', fecha: fecha(-10), temas: 'Revisión de registros de residuos y primeros KPI.', asistentes: '5 integrantes', creadoEn: fechaHora(-11) },
]

export const ACUERDOS = [
  { id: 'ac-1', reunion: 're-1', tema: 'Días de retiro de materiales', decision: 'Los martes y viernes por la mañana.', responsable: 'com-5', fechaPrevista: fecha(8), creadoEn: fechaHora(-20) },
  { id: 'ac-2', reunion: 're-2', tema: 'Señalización de tachos', decision: 'Reforzar carteles con ejemplos de residuos.', responsable: 'com-2', fechaPrevista: fecha(12), creadoEn: fechaHora(-10) },
]

export const ENTREGAS = [
  { id: 'en-1', fecha: fecha(-7), materiales: 'Papel y cartón, plásticos', pesoTotalKg: 22.0, recibidoPor: 'Cooperativa externa - Reciclado Norte', estado: 'completada', creadoEn: fechaHora(-8) },
  { id: 'en-2', fecha: fecha(12), materiales: 'Metales', pesoTotalKg: null, recibidoPor: 'Pendiente de confirmar', estado: 'programada', creadoEn: fechaHora(-2) },
]

export const PROBLEMAS_TACHO = [
  { id: 'pr-1', tacho: 'ta-2', tipo: 'lleno', descripcion: 'El tacho de plásticos está lleno y debe vaciarse.', reportadoPor: 'pf-3', fecha: fecha(-3), estado: 'abierto', creadoEn: fechaHora(-3) },
  { id: 'pr-2', tacho: 'ta-3', tipo: 'roto', descripcion: 'La tapa del tacho de residuos comunes está rota.', reportadoPor: 'pf-3', fecha: fecha(-12), estado: 'cerrado', creadoEn: fechaHora(-13), resueltoEn: fechaHora(-10) },
]

export const ACTIVIDADES = [
  { id: 'ac-1', titulo: 'Taller de separación en 5°A', tipo: 'concientizacion', fecha: fecha(-12), participantes: 25, creadoPor: 'pf-4', creadoEn: fechaHora(-14) },
  { id: 'ac-2', titulo: 'Recolección semanal del patio', tipo: 'recoleccion', fecha: fecha(-5), participantes: 4, creadoPor: 'pf-2', creadoEn: fechaHora(-7) },
]

export default {
  TIPOS_RESIDUO,
  COMISIONES,
  PERFILES,
  TACHOS,
  REGISTROS_RESIDUO,
  TAREAS,
  CAMPANIAS,
  REUNIONES,
  ACUERDOS,
  ENTREGAS,
  PROBLEMAS_TACHO,
  ACTIVIDADES,
}
