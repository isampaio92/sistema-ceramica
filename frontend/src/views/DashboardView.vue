<script setup>
    import { ref, onMounted } from 'vue';
    import axios from 'axios';

    const titulo = ref('Dashboard Financeiro')

    const resumoFinanceiro = ref({
        receitas: 0,
        despesas: 0,
        saldo: 0
    })

    const carregarResumo = async () => {
        try {
            console.log('Buscando dados da API...')

            const resposta = await axios.get('http://localhost:3000/api/resumo')

            console.log('Dados recebidos com sucesso:', resposta.data)

            resumoFinanceiro.value = resposta.data

        } catch(e) {
            console.error('Erro ao buscar o resumo financeiro:', e)
        }
    }

    onMounted(() => {
        carregarResumo()
    })

</script>

<template>
    <div class="dashboard">
        <h1>{{ titulo }}</h1>

        <div class="teste-dados">
            <p><strong>Receitas</strong>: R$ {{ resumoFinanceiro.receitas }}</p>
            <p><strong>Despesas</strong>: R$ {{ resumoFinanceiro.despesas }}</p>
            <p><strong>saldo</strong>: R$ {{ resumoFinanceiro.saldo }}</p>
        </div>
    </div>
</template>

<style scoped>
    .dashboard {
        padding: 20px;
    }

    .teste-dados {
        margin-top: 20px;
        background-color: #e9ecef;
        padding: 15px;
        border-radius: 8px;
    }
</style>
