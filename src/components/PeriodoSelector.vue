<template>
  <div class="periodo-selector">
    <label class="periodo-etiqueta" :for="id">Período</label>
    <select :id="id" class="entrada periodo-select" :value="modelValue" @change="$emit('update:modelValue', $event.target.value)">
      <option v-for="clave in meses" :key="clave" :value="clave">{{ nombreMes(clave) }}</option>
      <option v-if="opcionTodos" value="todos">Todos los períodos registrados</option>
    </select>
  </div>
</template>

<script setup>
import { nombreMes } from '@/services/kpi'

const props = defineProps({
  modelValue: { type: String, required: true },
  meses: { type: Array, required: true },
  opcionTodos: { type: Boolean, default: true },
  id: { type: String, default: 'periodo-select' },
})
defineEmits(['update:modelValue'])
</script>
