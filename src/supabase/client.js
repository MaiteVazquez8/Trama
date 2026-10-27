import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const tieneSupabase = Boolean(url && anonKey)

export const supabase = tieneSupabase
  ? createClient(url, anonKey)
  : null

if (!tieneSupabase) {
  // Mensaje solo para desarrolladores en consola. No se expone al usuario final como error de sistema.
  console.warn(
    '[Trama] Variables de entorno de Supabase no configuradas (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). ' +
    'El sistema funcionará en modo desarrollo con datos ficticios locales. No persistirá datos reales.'
  )
}

export { url, anonKey }
