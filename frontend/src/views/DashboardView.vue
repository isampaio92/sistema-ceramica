<script setup>
    import { ref } from 'vue'

    const titulo = ref('Dashboard Financeiro')
</script>

<template>
    <div class="dashboard">
        <h1>{{ titulo }}</h1>
        <p>Aqui entrarão os card de resumo e os gráficos do Chart.js</p>
    </div>
</template>

<style scoped>
    .dashboard {
        padding: 20px;
    }
</style>
