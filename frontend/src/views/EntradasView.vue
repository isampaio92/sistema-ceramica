<script setup>
import { ref } from 'vue'

const titulo = ref('Nova Entrada / Calculadora')
</script>

<template>
  <div class="entradas">
    <h1>{{ titulo }}</h1>
    <p>Aqui entrará o formulário para registrar vendas e a calculadora de queimas com os coeficientes.</p>
  </div>
</template>

<style scoped>
.entradas {
  padding: 20px;
}
</style>