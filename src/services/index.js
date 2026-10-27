/* --------------------------------------------------------------------------
   Trama - Servicios de acceso a datos
   --------------------------------------------------------------------------
   Capa única de acceso a datos. Cuando Supabase está configurado
   (VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY) consulta la base de datos
   real. Cuando no, trabaja con datos ficticios locales (src/mocks/datosPrueba.js)
   con un retraso simulado, claramente identificados como modo desarrollo.
-------------------------------------------------------------------------- */

import { supabase, tieneSupabase } from '../supabase/client'
import datosPrueba from '../mocks/datosPrueba'

const SIMULADO = !tieneSupabase

// ---------- Utilidades ----------

const demora = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms))

const clonar = (objeto) => JSON.parse(JSON.stringify(objeto))

const respuesta = (data = null, error = null, simulado = SIMULADO) => ({
  data,
  error,
  exito: !error,
  simulado,
})

const tabla = (nombre) => {
  const base = {
    perfiles: clonar(datosPrueba.PERFILES),
    comisiones: clonar(datosPrueba.COMISIONES),
    tiposResiduo: clonar(datosPrueba.TIPOS_RESIDUO),
    tachos: clonar(datosPrueba.TACHOS),
    registrosResiduo: clonar(datosPrueba.REGISTROS_RESIDUO),
    tareas: clonar(datosPrueba.TAREAS),
    campañas: clonar(datosPrueba.CAMPANIAS),
    reuniones: clonar(datosPrueba.REUNIONES),
    acuerdos: clonar(datosPrueba.ACUERDOS),
    entregas: clonar(datosPrueba.ENTREGAS),
    problemasTacho: clonar(datosPrueba.PROBLEMAS_TACHO),
    actividades: clonar(datosPrueba.ACTIVIDADES),
  }
  return base[nombre] || []
}

const indiceDe = (arreglo, id) => arreglo.findIndex((item) => item.id === id)

// ---------- Autenticación ----------

export const authService = {
  async login(email, password) {
    if (tieneSupabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) return respuesta(null, error)
      return respuesta(await obtenerPerfilDeUsuario(data.user))
    }
    await demora()
    const perfil = tabla('perfiles').find((p) => p.email === email && p.activo)
    if (!perfil) {
      return respuesta(null, { message: 'Correo o contraseña incorrectos.' })
    }
    // Modo desarrollo: cualquier contraseña funciona para cuentas de prueba.
    return respuesta({ ...perfil, token: 'modo-desarrollo-simulado' })
  },

  async register(datos) {
    if (tieneSupabase) {
      const { data, error } = await supabase.auth.signUp({
        email: datos.email,
        password: datos.password,
      })
      if (error) return respuesta(null, error)
      if (data.user) {
        await supabase.from('perfiles').insert({
          id: data.user.id,
          email: datos.email,
          nombre: datos.nombre,
          rol: datos.rol || 'integrante',
          comision: datos.comision || null,
          activo: true,
        })
      }
      return respuesta(await obtenerPerfilDeUsuario(data.user))
    }
    await demora()
    const yaExiste = tabla('perfiles').some((p) => p.email === datos.email)
    if (yaExiste) {
      return respuesta(null, { message: 'Ya existe una cuenta con ese correo.' })
    }
    const nuevo = {
      id: 'pf-nuevo-' + Date.now(),
      email: datos.email,
      nombre: datos.nombre,
      rol: datos.rol || 'integrante',
      comision: datos.comision || null,
      activo: true,
    }
    tabla('perfiles').push(nuevo)
    return respuesta(nuevo)
  },

  async logout() {
    if (tieneSupabase) {
      await supabase.auth.signOut()
    }
    return respuesta(null, null, SIMULADO)
  },

  async usuarioActual() {
    if (tieneSupabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return respuesta(null)
      return respuesta(await obtenerPerfilDeUsuario(user))
    }
    await demora()
    // En modo desarrollo no hay sesión persistente real; se informa al llamante.
    return respuesta(null, null, true)
  },
}

async function obtenerPerfilDeUsuario(user) {
  if (tieneSupabase) {
    const { data, error } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', user.id)
      .single()
    if (error) return respuesta(null, error)
    return respuesta(data)
  }
  const perfil = tabla('perfiles').find((p) => p.id === user.id)
  return respuesta(perfil || null)
}

// ---------- Perfiles (usuarios) ----------

export const perfilesService = {
  async listar() {
    if (tieneSupabase) {
      const { data, error } = await supabase.from('perfiles').select('*').order('nombre')
      return respuesta(data, error)
    }
    await demora()
    return respuesta(tabla('perfiles').filter((p) => p.activo))
  },

  async obtener(id) {
    if (tieneSupabase) {
      const { data, error } = await supabase.from('perfiles').select('*').eq('id', id).single()
      return respuesta(data, error)
    }
    await demora()
    const p = tabla('perfiles').find((x) => x.id === id)
    return respuesta(p || null)
  },

  async crear(datos) {
    if (tieneSupabase) {
      const { data, error } = await supabase.from('perfiles').insert(datos).select().single()
      return respuesta(data, error)
    }
    await demora()
    const nuevo = { id: 'pf-nuevo-' + Date.now(), ...datos, activo: true }
    tabla('perfiles').push(nuevo)
    return respuesta(nuevo)
  },

  async actualizar(id, datos) {
    if (tieneSupabase) {
      const { data, error } = await supabase
        .from('perfiles')
        .update(datos)
        .eq('id', id)
        .select()
        .single()
      return respuesta(data, error)
    }
    await demora()
    const i = indiceDe(tabla('perfiles'), id)
    if (i < 0) return respuesta(null, { message: 'Usuario no encontrado.' })
    Object.assign(tabla('perfiles')[i], datos)
    return respuesta(tabla('perfiles')[i])
  },

  async desactivar(id) {
    if (tieneSupabase) {
      const { data, error } = await supabase
        .from('perfiles')
        .update({ activo: false })
        .eq('id', id)
        .select()
        .single()
      return respuesta(data, error)
    }
    await demora()
    const i = indiceDe(tabla('perfiles'), id)
    if (i < 0) return respuesta(null, { message: 'Usuario no encontrado.' })
    tabla('perfiles')[i].activo = false
    return respuesta(tabla('perfiles')[i])
  },
}

// ---------- Comisiones ----------

export const comisionesService = {
  async listar() {
    if (tieneSupabase) {
      const { data, error } = await supabase.from('comisiones').select('*').order('nombre')
      return respuesta(data, error)
    }
    await demora()
    return respuesta(tabla('comisiones').filter((c) => c.activo))
  },

  async crear(datos) {
    if (tieneSupabase) {
      const { data, error } = await supabase.from('comisiones').insert(datos).select().single()
      return respuesta(data, error)
    }
    await demora()
    const nuevo = { id: 'com-nuevo-' + Date.now(), ...datos, activo: true }
    tabla('comisiones').push(nuevo)
    return respuesta(nuevo)
  },

  async actualizar(id, datos) {
    if (tieneSupabase) {
      const { data, error } = await supabase
        .from('comisiones')
        .update(datos)
        .eq('id', id)
        .select()
        .single()
      return respuesta(data, error)
    }
    await demora()
    const i = indiceDe(tabla('comisiones'), id)
    if (i < 0) return respuesta(null, { message: 'Comisión no encontrada.' })
    Object.assign(tabla('comisiones')[i], datos)
    return respuesta(tabla('comisiones')[i])
  },

  async desactivar(id) {
    if (tieneSupabase) {
      const { data, error } = await supabase
        .from('comisiones')
        .update({ activo: false })
        .eq('id', id)
        .select()
        .single()
      return respuesta(data, error)
    }
    await demora()
    const i = indiceDe(tabla('comisiones'), id)
    if (i < 0) return respuesta(null, { message: 'Comisión no encontrada.' })
    tabla('comisiones')[i].activo = false
    return respuesta(tabla('comisiones')[i])
  },
}

// ---------- Tipos de residuo ----------

export const tiposResiduoService = {
  async listar() {
    if (tieneSupabase) {
      const { data, error } = await supabase.from('tipos_residuo').select('*').order('nombre')
      return respuesta(data, error)
    }
    await demora()
    return respuesta(tabla('tiposResiduo').filter((t) => t.categoria !== undefined))
  },
}

// ---------- Tachos ----------

export const tachosService = {
  async listar() {
    if (tieneSupabase) {
      const { data, error } = await supabase.from('tachos').select('*, tipos_residuo(*)').order('ubicacion')
      return respuesta(data, error)
    }
    await demora()
    const lista = tabla('tachos').filter((t) => t.activo).map((t) => {
      const tipo = tabla('tiposResiduo').find((x) => x.id === t.tipoResiduo)
      return { ...t, tipos_residuo: tipo || null }
    })
    return respuesta(lista)
  },

  async crear(datos) {
    if (tieneSupabase) {
      const { data, error } = await supabase.from('tachos').insert(datos).select().single()
      return respuesta(data, error)
    }
    await demora()
    const nuevo = { id: 'ta-nuevo-' + Date.now(), ...datos, activo: true }
    tabla('tachos').push(nuevo)
    return respuesta(nuevo)
  },

  async actualizar(id, datos) {
    if (tieneSupabase) {
      const { data, error } = await supabase.from('tachos').update(datos).eq('id', id).select().single()
      return respuesta(data, error)
    }
    await demora()
    const i = indiceDe(tabla('tachos'), id)
    if (i < 0) return respuesta(null, { message: 'Tacho no encontrado.' })
    Object.assign(tabla('tachos')[i], datos)
    return respuesta(tabla('tachos')[i])
  },
}

// ---------- Registros de residuos (consoft delete / cancelación) ----------

export const registrosResiduoService = {
  async listar(filtros = {}) {
    if (tieneSupabase) {
      let consulta = supabase.from('registros_residuo').select('*, perfiles(*), tipos_residuo(*)')
      if (filtros.tipo) consulta = consulta.eq('tipo_residuo', filtros.tipo)
      if (filtros.lugar) consulta = consulta.ilike('lugar', `%${filtros.lugar}%`)
      if (filtros.estado) consulta = consulta.eq('estado', filtros.estado)
      if (filtros.desde) consulta = consulta.gte('fecha', filtros.desde)
      if (filtros.hasta) consulta = consulta.lte('fecha', filtros.hasta)
      const { data, error } = await consulta.order('fecha', { ascending: false })
      return respuesta(data, error)
    }
    await demora()
    let lista = tabla('registrosResiduo').map((r) => {
      const tipo = tabla('tiposResiduo').find((x) => x.id === r.tipoResiduo)
      const perfil = tabla('perfiles').find((x) => x.id === r.registradoPor)
      return { ...r, tipos_residuo: tipo || null, perfiles: perfil || null }
    })
    if (filtros.tipo) lista = lista.filter((r) => r.tipoResiduo === filtros.tipo)
    if (filtros.lugar) {
      const texto = String(filtros.lugar).toLowerCase()
      lista = lista.filter((r) => String(r.lugar).toLowerCase().includes(texto))
    }
    if (filtros.estado) lista = lista.filter((r) => r.estado === filtros.estado)
    if (filtros.desde) lista = lista.filter((r) => r.fecha >= filtros.desde)
    if (filtros.hasta) lista = lista.filter((r) => r.fecha <= filtros.hasta)
    lista.sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
    return respuesta(lista)
  },

  async obtener(id) {
    if (tieneSupabase) {
      const { data, error } = await supabase
        .from('registros_residuo')
        .select('*, perfiles(*), tipos_residuo(*)')
        .eq('id', id)
        .single()
      return respuesta(data, error)
    }
    await demora()
    const r = tabla('registrosResiduo').find((x) => x.id === id)
    return respuesta(r || null)
  },

  async crear(datos) {
    if (tieneSupabase) {
      const { data, error } = await supabase.from('registros_residuo').insert(datos).select().single()
      return respuesta(data, error)
    }
    await demora()
    const nuevo = {
      id: 'rr-nuevo-' + Date.now(),
      ...datos,
      estado: 'activo',
      creadoEn: new Date().toISOString(),
    }
    tabla('registrosResiduo').push(nuevo)
    return respuesta(nuevo)
  },

  async actualizar(id, datos) {
    if (tieneSupabase) {
      const { data, error } = await supabase
        .from('registros_residuo')
        .update(datos)
        .eq('id', id)
        .select()
        .single()
      return respuesta(data, error)
    }
    await demora()
    const i = indiceDe(tabla('registrosResiduo'), id)
    if (i < 0) return respuesta(null, { message: 'Registro no encontrado.' })
    Object.assign(tabla('registrosResiduo')[i], datos)
    return respuesta(tabla('registrosResiduo')[i])
  },

  async cancelar(id, motivo) {
    if (tieneSupabase) {
      const { data, error } = await supabase
        .from('registros_residuo')
        .update({ estado: 'cancelado', motivo_cancelacion: motivo, cancelado_en: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      return respuesta(data, error)
    }
    await demora()
    const i = indiceDe(tabla('registrosResiduo'), id)
    if (i < 0) return respuesta(null, { message: 'Registro no encontrado.' })
    tabla('registrosResiduo')[i].estado = 'cancelado'
    tabla('registrosResiduo')[i].motivoCancelacion = motivo
    tabla('registrosResiduo')[i].canceladoEn = new Date().toISOString()
    return respuesta(tabla('registrosResiduo')[i])
  },
}

// ---------- Tareas ----------

export const tareasService = {
  async listar(filtros = {}) {
    if (tieneSupabase) {
      let consulta = supabase.from('tareas').select('*, perfiles(*), comisiones(*)')
      if (filtros.comision) consulta = consulta.eq('comision', filtros.comision)
      if (filtros.estado) consulta = consulta.eq('estado', filtros.estado)
      if (filtros.responsable) consulta = consulta.eq('responsable', filtros.responsable)
      const { data, error } = await consulta.order('fecha', { ascending: true })
      return respuesta(data, error)
    }
    await demora()
    let lista = tabla('tareas').map((t) => {
      const perfil = tabla('perfiles').find((x) => x.id === t.responsable)
      const comision = tabla('comisiones').find((x) => x.id === t.comision)
      return { ...t, perfiles: perfil || null, comisiones: comision || null }
    })
    if (filtros.comision) lista = lista.filter((t) => t.comision === filtros.comision)
    if (filtros.estado) lista = lista.filter((t) => t.estado === filtros.estado)
    if (filtros.responsable) lista = lista.filter((t) => t.responsable === filtros.responsable)
    lista.sort((a, b) => (a.fecha < b.fecha ? -1 : 1))
    return respuesta(lista)
  },

  async crear(datos) {
    if (tieneSupabase) {
      const { data, error } = await supabase.from('tareas').insert(datos).select().single()
      return respuesta(data, error)
    }
    await demora()
    const nuevo = { id: 'ta-nueva-' + Date.now(), ...datos, creadoEn: new Date().toISOString() }
    tabla('tareas').push(nuevo)
    return respuesta(nuevo)
  },

  async actualizar(id, datos) {
    if (tieneSupabase) {
      const { data, error } = await supabase.from('tareas').update(datos).eq('id', id).select().single()
      return respuesta(data, error)
    }
    await demora()
    const i = indiceDe(tabla('tareas'), id)
    if (i < 0) return respuesta(null, { message: 'Tarea no encontrada.' })
    Object.assign(tabla('tareas')[i], datos)
    return respuesta(tabla('tareas')[i])
  },

  async cancelar(id, motivo) {
    if (tieneSupabase) {
      const { data, error } = await supabase
        .from('tareas')
        .update({ estado: 'cancelada', motivo_cancelacion: motivo, cancelado_en: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      return respuesta(data, error)
    }
    await demora()
    const i = indiceDe(tabla('tareas'), id)
    if (i < 0) return respuesta(null, { message: 'Tarea no encontrada.' })
    tabla('tareas')[i].estado = 'cancelada'
    tabla('tareas')[i].motivoCancelacion = motivo
    tabla('tareas')[i].canceladoEn = new Date().toISOString()
    return respuesta(tabla('tareas')[i])
  },
}

// ---------- Campañas ----------

export const campañasService = {
  async listar() {
    if (tieneSupabase) {
      const { data, error } = await supabase.from('campañas').select('*, perfiles(*)').order('fecha_inicio', { ascending: false })
      return respuesta(data, error)
    }
    await demora()
    const lista = tabla('campañas').map((c) => {
      const perfil = tabla('perfiles').find((x) => x.id === c.publicadoPor)
      return { ...c, perfiles: perfil || null }
    })
    return respuesta(lista)
  },

  async crear(datos) {
    if (tieneSupabase) {
      const { data, error } = await supabase.from('campañas').insert(datos).select().single()
      return respuesta(data, error)
    }
    await demora()
    const nuevo = { id: 'ca-nueva-' + Date.now(), ...datos, creadoEn: new Date().toISOString() }
    tabla('campañas').push(nuevo)
    return respuesta(nuevo)
  },

  async actualizar(id, datos) {
    if (tieneSupabase) {
      const { data, error } = await supabase.from('campañas').update(datos).eq('id', id).select().single()
      return respuesta(data, error)
    }
    await demora()
    const i = indiceDe(tabla('campañas'), id)
    if (i < 0) return respuesta(null, { message: 'Campaña no encontrada.' })
    Object.assign(tabla('campañas')[i], datos)
    return respuesta(tabla('campañas')[i])
  },
}

// ---------- Reuniones y acuerdos ----------

export const reunionesService = {
  async listar() {
    if (tieneSupabase) {
      const { data, error } = await supabase.from('reuniones').select('*').order('fecha', { ascending: false })
      return respuesta(data, error)
    }
    await demora()
    return respuesta(tabla('reuniones'))
  },

  async crear(datos) {
    if (tieneSupabase) {
      const { data, error } = await supabase.from('reuniones').insert(datos).select().single()
      return respuesta(data, error)
    }
    await demora()
    const nuevo = { id: 're-nueva-' + Date.now(), ...datos, creadoEn: new Date().toISOString() }
    tabla('reuniones').push(nuevo)
    return respuesta(nuevo)
  },
}

export const acuerdosService = {
  async listar() {
    if (tieneSupabase) {
      const { data, error } = await supabase.from('acuerdos').select('*').order('creado_en', { ascending: false })
      return respuesta(data, error)
    }
    await demora()
    return respuesta(tabla('acuerdos'))
  },

  async crear(datos) {
    if (tieneSupabase) {
      const { data, error } = await supabase.from('acuerdos').insert(datos).select().single()
      return respuesta(data, error)
    }
    await demora()
    const nuevo = { id: 'ac-nuevo-' + Date.now(), ...datos, creadoEn: new Date().toISOString() }
    tabla('acuerdos').push(nuevo)
    return respuesta(nuevo)
  },

  async actualizar(id, datos) {
    if (tieneSupabase) {
      const { data, error } = await supabase.from('acuerdos').update(datos).eq('id', id).select().single()
      return respuesta(data, error)
    }
    await demora()
    const i = indiceDe(tabla('acuerdos'), id)
    if (i < 0) return respuesta(null, { message: 'Acuerdo no encontrado.' })
    Object.assign(tabla('acuerdos')[i], datos)
    return respuesta(tabla('acuerdos')[i])
  },
}

// ---------- Entregas ----------

export const entregasService = {
  async listar() {
    if (tieneSupabase) {
      const { data, error } = await supabase.from('entregas').select('*').order('fecha', { ascending: false })
      return respuesta(data, error)
    }
    await demora()
    return respuesta(tabla('entregas'))
  },

  async crear(datos) {
    if (tieneSupabase) {
      const { data, error } = await supabase.from('entregas').insert(datos).select().single()
      return respuesta(data, error)
    }
    await demora()
    const nuevo = { id: 'en-nuevo-' + Date.now(), ...datos, creadoEn: new Date().toISOString() }
    tabla('entregas').push(nuevo)
    return respuesta(nuevo)
  },

  async actualizar(id, datos) {
    if (tieneSupabase) {
      const { data, error } = await supabase.from('entregas').update(datos).eq('id', id).select().single()
      return respuesta(data, error)
    }
    await demora()
    const i = indiceDe(tabla('entregas'), id)
    if (i < 0) return respuesta(null, { message: 'Entrega no encontrada.' })
    Object.assign(tabla('entregas')[i], datos)
    return respuesta(tabla('entregas')[i])
  },
}

// ---------- Problemas de tacho ----------

export const problemasTachoService = {
  async listar() {
    if (tieneSupabase) {
      const { data, error } = await supabase.from('problemas_tacho').select('*, tachos(*), perfiles(*)').order('fecha', { ascending: false })
      return respuesta(data, error)
    }
    await demora()
    const lista = tabla('problemasTacho').map((p) => {
      const tacho = tabla('tachos').find((x) => x.id === p.tacho)
      const perfil = tabla('perfiles').find((x) => x.id === p.reportadoPor)
      return { ...p, tachos: tacho || null, perfiles: perfil || null }
    })
    return respuesta(lista)
  },

  async crear(datos) {
    if (tieneSupabase) {
      const { data, error } = await supabase.from('problemas_tacho').insert(datos).select().single()
      return respuesta(data, error)
    }
    await demora()
    const nuevo = { id: 'pr-nuevo-' + Date.now(), ...datos, estado: 'abierto', creadoEn: new Date().toISOString() }
    tabla('problemasTacho').push(nuevo)
    return respuesta(nuevo)
  },

  async actualizar(id, datos) {
    if (tieneSupabase) {
      const { data, error } = await supabase.from('problemas_tacho').update(datos).eq('id', id).select().single()
      return respuesta(data, error)
    }
    await demora()
    const i = indiceDe(tabla('problemasTacho'), id)
    if (i < 0) return respuesta(null, { message: 'Problema no encontrado.' })
    Object.assign(tabla('problemasTacho')[i], datos)
    return respuesta(tabla('problemasTacho')[i])
  },
}

// ---------- Actividades (participación) ----------

export const actividadesService = {
  async listar() {
    if (tieneSupabase) {
      const { data, error } = await supabase.from('actividades').select('*, perfiles(*)').order('fecha', { ascending: false })
      return respuesta(data, error)
    }
    await demora()
    const lista = tabla('actividades').map((a) => {
      const perfil = tabla('perfiles').find((x) => x.id === a.creadoPor)
      return { ...a, perfiles: perfil || null }
    })
    return respuesta(lista)
  },

  async crear(datos) {
    if (tieneSupabase) {
      const { data, error } = await supabase.from('actividades').insert(datos).select().single()
      return respuesta(data, error)
    }
    await demora()
    const nuevo = { id: 'ac-nueva-' + Date.now(), ...datos, creadoEn: new Date().toISOString() }
    tabla('actividades').push(nuevo)
    return respuesta(nuevo)
  },
}

// ---------- Estadísticas / KPI ----------

export const estadisticasService = {
  async resumen() {
    const registros = await this.registros()
    const tareas = await this.tareas()
    const actividades = await this.actividades()
    const entregas = await this.entregas()

    const recuperadoMes = registros
      .filter((r) => r.estado === 'activo')
      .reduce((suma, r) => suma + Number(r.cantidadKg || 0), 0)

    const totalResiduos = registros.filter((r) => r.estado === 'activo').length
    const correctamenteSeparados = registros.filter(
      (r) => r.estado === 'activo' && r.tipoResiduo !== 'tr-6'
    ).length
    const porcentajeSeparados =
      totalResiduos > 0 ? Math.round((correctamenteSeparados / totalResiduos) * 100) : null

    const tareasTotal = tareas.length
    const tareasTiempo = tareas.filter((t) => t.estado === 'completada').length
    const porcentajeTareas =
      tareasTotal > 0 ? Math.round((tareasTiempo / tareasTotal) * 100) : null

    const participantesTotal = actividades.reduce((suma, a) => suma + Number(a.participantes || 0), 0)
    const totalEstudiantesReferencia = 40 // referencia del curso seleccionado (documento KPI)
    const porcentajeParticipacion =
      totalEstudiantesReferencia > 0
        ? Math.round((participantesTotal / totalEstudiantesReferencia) * 100)
        : null

    const kgEntregados = entregas
      .filter((e) => e.estado === 'completada' && e.pesoTotalKg)
      .reduce((suma, e) => suma + Number(e.pesoTotalKg), 0)

    return {
      datos: {
        recuperadoKgMes: recuperadoMes,
        metaRecuperado: 20,
        cumplimientoRecuperado: recuperadoMes >= 20,
        porcentajeSeparados,
        metaSeparados: 80,
        cumplimientoSeparados: porcentajeSeparados != null && porcentajeSeparados >= 80,
        porcentajeTareas,
        metaTareas: 90,
        cumplimientoTareas: porcentajeTareas != null && porcentajeTareas >= 90,
        porcentajeParticipacion,
        metaParticipacion: 70,
        cumplimientoParticipacion: porcentajeParticipacion != null && porcentajeParticipacion >= 70,
        kgEntregados,
        totalRegistros: totalResiduos,
        totalTareas: tareasTotal,
      },
      simulado: SIMULADO,
      error: null,
    }
  },

  async registros() {
    const r = await registrosResiduoService.listar()
    return r.data || []
  },
  async tareas() {
    const r = await tareasService.listar()
    return r.data || []
  },
  async actividades() {
    const r = await actividadesService.listar()
    return r.data || []
  },
  async entregas() {
    const r = await entregasService.listar()
    return r.data || []
  },
}
