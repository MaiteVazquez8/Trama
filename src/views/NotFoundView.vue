<template>
  <div class="not-found">
    <h1>Página no encontrada</h1>
    <p>La pantalla que buscás no existe en el sistema de Trama.</p>
    <button class="btn btn-primary" @click="irInicio">Volver al inicio</button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
function irInicio() { router.push({ name: 'inicio' }) }
</script>

<style scoped>
.not-found { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 70vh; text-align: center; }
.not-found h1 { font-size: 2rem; color: var(--color-verde-oscuro); margin-bottom: 12px; }
</style>
