/* Preferencia de tema de la interfaz (claro / oscuro / automático).
   Se guarda en localStorage y se aplica en <html data-theme>. */

const CLAVE = 'trama-tema'

export function obtenerTemaPreferido() {
  try {
    return localStorage.getItem(CLAVE) || 'auto'
  } catch (e) {
    return 'auto'
  }
}

function temaDelSistema() {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro'
  }
  return 'claro'
}

export function aplicarTema(preferencia) {
  const efectivo = preferencia === 'auto' ? temaDelSistema() : preferencia
  document.documentElement.setAttribute('data-theme', efectivo === 'oscuro' ? 'dark' : 'light')
  return efectivo
}

export function guardarTema(preferencia) {
  try {
    localStorage.setItem(CLAVE, preferencia)
  } catch (e) {
    // Sin almacenamiento disponible: se aplica solo para esta sesión.
  }
  return aplicarTema(preferencia)
}

export function iniciarTema() {
  const preferencia = obtenerTemaPreferido()
  aplicarTema(preferencia)
  if (typeof window !== 'undefined' && window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (obtenerTemaPreferido() === 'auto') aplicarTema('auto')
    })
  }
}
