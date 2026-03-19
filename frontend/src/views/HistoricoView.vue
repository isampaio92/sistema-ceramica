<script setup>
import { ref } from 'vue'

const titulo = ref('Histórico de Transações')
</script>

<template>
  <div class="historico">
    <h1>{{ titulo }}</h1>
    <p>Aqui entrará a tabela listando todas as movimentações e os filtros.</p>
  </div>
</template>

<style scoped>
.historico {
  padding: 20px;
}
</style>