/* --------------------------------------------------------------------------
   Trama - Validaciones de formularios (español)
   --------------------------------------------------------------------------
   Funciones puras que devuelven un mensaje de error o null si el campo es
   válido. Se combinan por campo en cada formulario.
-------------------------------------------------------------------------- */

export const requerido = (valor, campo = 'Este campo') => {
  if (valor === null || valor === undefined) return `${campo} es obligatorio.`
  if (typeof valor === 'string' && valor.trim() === '') return `${campo} es obligatorio.`
  if (Array.isArray(valor) && valor.length === 0) return `${campo} es obligatorio.`
  return null
}

export const numeroPositivo = (valor, campo = 'La cantidad') => {
  const req = requerido(valor, campo)
  if (req) return req
  const n = Number(valor)
  if (!Number.isFinite(n)) return `${campo} debe ser un número válido.`
  if (n < 0) return `${campo} no puede ser negativo.`
  if (n === 0) return `${campo} debe ser mayor que cero.`
  return null
}

export const numeroNoNegativo = (valor, campo = 'La cantidad') => {
  const req = requerido(valor, campo)
  if (req) return req
  const n = Number(valor)
  if (!Number.isFinite(n)) return `${campo} debe ser un número válido.`
  if (n < 0) return `${campo} no puede ser negativo.`
  return null
}

export const fechaValida = (valor, campo = 'La fecha') => {
  const req = requerido(valor, campo)
  if (req) return req
  const partes = String(valor).split('-')
  if (partes.length !== 3) return `${campo} no tiene un formato válido.`
  const fecha = new Date(`${partes[0]}-${partes[1]}-${partes[2]}T00:00:00`)
  if (isNaN(fecha.getTime())) return `${campo} no es una fecha válida.`
  return null
}

export const emailValido = (valor, campo = 'El correo electrónico') => {
  const req = requerido(valor, campo)
  if (req) return req
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!re.test(String(valor).toLowerCase())) return `Ingresá un ${campo.toLowerCase()} válido.`
  return null
}

export const contraseñaSegura = (valor, campo = 'La contraseña') => {
  const req = requerido(valor, campo)
  if (req) return req
  if (String(valor).length < 6) return `${campo} debe tener al menos 6 caracteres.`
  return null
}

export const seleccionValida = (valor, campo = 'La selección') => {
  const req = requerido(valor, campo)
  if (req) return req
  if (String(valor).trim() === '') return `Seleccioná una opción válida para ${campo.toLowerCase()}.`
  return null
}

/* Valida un formulario completo.
   `reglas` es un objeto { campo: [funcionValidacion, ...] }
   Devuelve { valido: boolean, errores: { campo: mensaje } }

   Cada función de validación recibe (valor, etiqueta). Antes se pasaba el objeto
   `datos` completo como segundo argumento, y como las funciones esperan ahí el
   NOMBRE del campo, los mensajes salían como "[object Object] es obligatorio.".
   Mapa de etiquetas en español para que los mensajes sean legibles. */
const ETIQUETAS = {
  tipoResiduo: 'El tipo de residuo',
  cantidadKg: 'El peso (kg)',
  lugar: 'El origen',
  fecha: 'La fecha',
  correo: 'El correo electrónico',
  email: 'El correo electrónico',
  password: 'La contraseña',
  titulo: 'El título',
  descripcion: 'La descripción',
  responsable: 'El responsable',
  comision: 'La comisión',
  tema: 'El tema',
  participantes: 'La cantidad de participantes',
  nombre: 'El nombre',
  ubicacion: 'La ubicación',
  materiales: 'Los materiales',
  fechaPrevista: 'La fecha prevista',
}

export function validar(datos, reglas) {
  const errores = {}
  for (const campo in reglas) {
    const etiqueta = ETIQUETAS[campo] || campo
    for (const regla of reglas[campo]) {
      const mensaje = regla(datos[campo], etiqueta)
      if (mensaje) {
        errores[campo] = mensaje
        break
      }
    }
  }
  return { valido: Object.keys(errores).length === 0, errores }
}
