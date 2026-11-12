<template>
  <div class="vista-encabezado">
    <div class="vista-encabezado-texto">
      <h1>{{ titulo }}</h1>
      <p v-if="subtitulo" class="subtitulo">{{ subtitulo }}</p>
    </div>
    <div v-if="$slots.accion" class="vista-encabezado-accion">
      <slot name="accion" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  titulo: { type: String, required: true },
  subtitulo: { type: String, default: '' },
})
</script>

<style scoped>
.vista-encabezado-accion {
  display: flex;
  align-items: center;
  gap: 10px;
}

@media (max-width: 640px) {
  .vista-encabezado-accion {
    width: 100%;
  }
  .vista-encabezado-accion :deep(.btn) {
    width: 100%;
  }
}
</style>
