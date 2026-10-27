<template>
  <nav class="app-navbar">
    <button class="btn-menu" @click="toggleMenu" aria-label="Abrir menú">
      ☰
    </button>
    <div class="navbar-title">TRAMA · Gestión de la cooperativa</div>

    <div class="navbar-actions">
      <span v-if="usuario" class="usuario">{{ usuario }}</span>
      <button class="btn btn-outline btn-sm" @click="irLogin">
        {{ autenticado ? 'Mi cuenta' : 'Iniciar sesión' }}
      </button>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { inject } from 'vue'

const auth = inject('auth')
const router = useRouter()

const emit = defineEmits(['toggle-menu'])

const autenticado = computed(() => auth && auth.autenticado)
const usuario = computed(() => (auth && auth.usuario ? auth.usuario.nombre : null))

function toggleMenu() {
  emit('toggle-menu')
}

function irLogin() {
  if (autenticado.value) {
    router.push({ name: 'perfil' })
  } else {
    router.push({ name: 'login' })
  }
}
</script>

<style scoped>
.btn-menu { display: none; }
.usuario {
  font-size: 0.85rem;
  opacity: 0.9;
  margin-right: 8px;
  white-space: nowrap;
}
@media (max-width: 900px) {
  .btn-menu { display: flex; }
  .usuario { display: none; }
}
</style>
