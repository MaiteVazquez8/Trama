<template>
  <div class="not-found">
    <img class="not-found-logo" src="/logos/tacho-verde.png" alt="" width="72" height="auto" />
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
.not-found { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 70vh; text-align: center; gap: 10px; }
.not-found-logo { margin-bottom: 4px; }
.not-found h1 { font-size: 1.8rem; color: var(--texto); }
.not-found p { color: var(--texto-suave); margin-bottom: 8px; }
</style>
