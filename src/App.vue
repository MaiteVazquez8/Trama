<template>
  <component :is="layoutActual">
    <AlertaGlobal />
    <router-view v-slot="{ Component }">
      <component :is="Component" />
    </router-view>
  </component>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import AppLayout from './components/layout/AppLayout.vue'
import PublicLayout from './components/layout/PublicLayout.vue'
import AlertaGlobal from './components/AlertaGlobal.vue'

const route = useRoute()

const layoutActual = computed(() => (route.meta.publica ? PublicLayout : AppLayout))
</script>
