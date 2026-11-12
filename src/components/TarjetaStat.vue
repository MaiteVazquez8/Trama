<template>
  <div class="tarjeta-stat">
    <span class="stat-texto"><slot>{{ texto }}</slot></span>
  </div>
</template>

<script setup>
defineProps({
  texto: { type: String, default: '' },
})
</script>
