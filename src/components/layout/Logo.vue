<template>
  <component :is="tag" class="logo" :class="[`logo-${tamano}`, `logo-${tema}`, `logo-${variante}`]" v-bind="attrs">
    <img v-if="variante !== 'wordmark'" class="logo-isotipo" :src="isotipoSrc" alt="Trama - isotipo" />
    <span v-if="variante !== 'isotipo'" class="logo-texto">
      <span class="logo-nombre">TRAMA</span>
      <span v-if="tagline" class="logo-tagline">COOPERATIVA EDUCATIVA</span>
    </span>
  </component>
</template>

<script setup>
import { computed, useAttrs } from 'vue'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  // crema = para fondos oscuros (isotipo #FBF5DD) | blanco | beige | verde (#306D29) | verde-oscuro (#0D530E)
  tema: { type: String, default: 'verde' },
  // apilado = isotipo al lado del texto | isotipo = solo isotipo | wordmark = solo texto
  variante: { type: String, default: 'apilado' },
  tamano: { type: String, default: 'md' }, // sm | md | lg | xl
  tagline: { type: Boolean, default: true },
  asLink: { type: Boolean, default: false },
})

const attrs = useAttrs()
const tag = computed(() => (props.asLink ? 'a' : 'span'))

const isotipoSrc = computed(() => {
  const mapa = {
    crema: '/logos/tacho-crema.png',
    blanco: '/logos/tacho-blanco.png',
    beige: '/logos/tacho-beige.png',
    verde: '/logos/tacho-verde.png',
    'verde-oscuro': '/logos/tacho-verde-oscuro.png',
    negro: '/logos/tacho-negro.png',
  }
  return mapa[props.tema] || mapa.verde
})
</script>

<style scoped>
.logo {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  line-height: 1;
}

.logo-isotipo {
  display: block;
  width: auto;
}

.logo-texto {
  display: inline-flex;
  flex-direction: column;
  gap: 3px;
  white-space: nowrap;
}

.logo-nombre {
  font-weight: 900;
  letter-spacing: 0.18em;
}

.logo-tagline {
  font-weight: 700;
  letter-spacing: 0.22em;
  font-size: 0.58em;
  opacity: 0.85;
}

/* Tamaños */
.logo-sm .logo-isotipo { height: 24px; }
.logo-sm .logo-nombre { font-size: 1.05rem; }
.logo-md .logo-isotipo { height: 40px; }
.logo-md .logo-nombre { font-size: 1.45rem; }
.logo-lg .logo-isotipo { height: 56px; }
.logo-lg .logo-nombre { font-size: 1.9rem; }
.logo-xl .logo-isotipo { height: 92px; }

/* Colores */
.logo-crema .logo-nombre, .logo-crema .logo-tagline { color: #FBF5DD; }
.logo-blanco .logo-nombre, .logo-blanco .logo-tagline { color: #FFFFFF; }
.logo-beige .logo-nombre, .logo-beige .logo-tagline { color: #E7E1B1; }
.logo-verde .logo-nombre { color: #306D29; }
.logo-verde .logo-tagline { color: #5F5F52; }
.logo-verde-oscuro .logo-nombre { color: #0D530E; }
.logo-verde-oscuro .logo-tagline { color: #3F4A35; }
.logo-negro .logo-nombre, .logo-negro .logo-tagline { color: #000000; }

/* En tema oscuro, el wordmark verde usa tono crema para contraste */
[data-theme="dark"] .logo-verde .logo-nombre { color: #FBF5DD; }
[data-theme="dark"] .logo-verde .logo-tagline { color: #A9A894; }
[data-theme="dark"] .logo-verde-oscuro .logo-nombre { color: #FBF5DD; }
[data-theme="dark"] .logo-verde-oscuro .logo-tagline { color: #A9A894; }
</style>
