<script setup>
    import { ref, onMounted } from 'vue';
    import axios from 'axios';

    const titulo = ref('Dashboard Financeiro')

    const resumoFinanceiro = ref({
        receitas: 0,
        despesas: 0,
        saldo: 0
    })

    const formatarMoeda = (valor) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor)
    }

    const carregarResumo = async () => {
        try {
            const resposta = await axios.get('http://localhost:3000/api/resumo')
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
        <header class="dashboard-header">
            <h1>{{ titulo }}</h1>
            <p>Resumo das movimentações</p>
        </header>

        <section class="cards-container">
            <div class="card receita">
                <h3>Receitas</h3>
                <p class="valor">{{ formatarMoeda(resumoFinanceiro.receitas) }}</p>
            </div>

            <div class="card despesa">
                <h3>Despesas</h3>
                <p class="valor">{{ formatarMoeda(resumoFinanceiro.despesas) }}</p>
            </div>

            <div class="card saldo" :class="{ 'saldo-negativo': resumoFinanceiro.saldo < 0 }">
                <h3>Saldo Atual</h3>
                <p class="valor">{{ formatarMoeda(resumoFinanceiro.saldo) }}</p>
            </div>
        </section>

        <section class="graficos-container">

        </section>

    </div>
</template>

<style scoped>
    .dashboard {
        padding: 20px;
    }

    .dashboard-header {
        margin-bottom: 30px;
    }

    .dashboard-header h1 {
        margin: 0;
        color: #2c3e50;
    }

    .dashboard-header p {
        color: #7f8c8d;
        margin-top: 5px;
    }

    .cards-container {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        margin-bottom: 40px;
    }

    .card {
        background-color: #fff;
        padding: 25px;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        display: flex;
        flex-direction: column;
        justify-content: center;
        border-left: 5px solid #bdc3c7;
    }

    .card h3 {
        margin: 0;
        font-size: 1.1rem;
        color: #7f8c8d;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .card .valor {
        margin: 10px 0 0 0;
        font-size: 2rem;
        font-weight: bold;
        color: #2c3e50;
    }

    .card.receita {
        border-left-color: #2ecc71;
    }

    .card.despesa {
        border-left-color: #e74c3c;
    }

    .card.saldo {
        border-left-color: #3498db;
        background-color: #f0f8ff;
    }

    .card.saldo.saldo-negativo {
        border-left-color: #e74c3c;
        background-color: #f0f8ff;
    }
</style>
