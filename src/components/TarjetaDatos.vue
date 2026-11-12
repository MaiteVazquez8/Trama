<template>
  <div class="tarjeta-datos">
    <h2>{{ titulo }}</h2>
    <div class="tarjeta-datos-cuerpo">
      <slot />
    </div>
    <p class="datos-actualizados">Datos actualizados · {{ fechaActualizacion }}</p>
  </div>
</template>

<script setup>
defineProps({
  titulo: { type: String, required: true },
})

const ahora = new Date()
const hora = ahora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })
const fechaActualizacion = `Hoy, ${hora}`
</script>

<style scoped>
.tarjeta-datos-cuerpo {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
