<script setup>
  import { ref, onMounted } from 'vue'
  import axios from 'axios'

  const transacoes = ref([])

  const carregarHistorico = async () => {
    try {
      const resposta = await axios.get('http://localhost:3000/api/transacoes')
      transacoes.value = resposta.data

    } catch(e) {
      console.error('Erro ao buscar histórico:', e)
    }
  }

  const excluirItem = async (id) => {
    console.log('Tentando excluir o ID:', id)

    if (!confirm('Tem certeza que deseja excluir este registro?')) return

    try {
      await axios.delete(`http://localhost:3000/api/transacoes/${id}`)

      transacoes.value = transacoes.value.filter(item => item.id !== id)

    } catch(e) {
      console.error('Erro ao excluir:', e)
      alert('Erro ao excluir o registro.')
    }
  }

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
  }

  const formatarData = (dataStr) => {
    const [ano, mes, dia] = dataStr.split('-')
    return `${dia}/${mes}/${ano}`
  }

  onMounted(() => {
    carregarHistorico()
  })

</script>

<template>
  <div class="historico">
    <header class="header">
      <h1>Histórico de Transações</h1>
      <p>Confira todas as entradas e saídas registradas.</p>
    </header>

    <div class="tabela-container">
      <table class="tabela-financeira">
        <thead>
          <tr>
            <th>Data</th>
            <th>Descrição</th>
            <th>Categoria</th>
            <th>Valor</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in transacoes" :key="item.dia" :class="item.tipo">
            <td>{{ formatarData(item.data) }}</td>
            <td>{{ item.descricao }}</td>
            <td><span class="tag">{{ item.categoria }}</span></td>
            <td class="valor-celula">
              {{ item.tipo == 'saida' ? '-' : '' }} {{ formatarMoeda(item.valor) }}
            </td>
            <td>
              <button @click="excluirItem(item.id)" class="btn-excluir">
                🗑️
              </button>
            </td>
          </tr>
          <tr v-if="transacoes.length === 0">
            <td colspan="4" style="text-align: center; padding: 20px;">Nenhuma transação encontrada.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
  .tabela-container {
    background-color: #fff;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    margin-top: 20px;
  }

  .tabela-financeira {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }

  .tabela-financeira th {
    background-color: #f8f9fa;
    padding: 15px;
    color: #7f8c8d;
    font-weight: 600;
    border-bottom: 2px solid #eee;
  }

  .tabela-financeira td {
    padding: 15px;
    border-bottom: 1px solid #eee;
    color: #2c3e50;
  }

  tr.entrada .valor-celula {
    color: #2ecc71;
    font-weight: bold;
  }

  tr.saida .valor-celula {
    color: #e74c3c;
    font-weight: bold;
  }

  .tag {
    background-color: #ecf0f1;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.85rem;
    color: #7f8c8d;
  }

  .btn-excluir {
    bottom: none;
    border: none;
    cursor: pointer;
    font-size: 1.2rem;
    padding: 5px;
    border-radius: 4px;
    transition: background 0.2s;
  }

  .btn-excluir:hover {
    background: #ffebee;
  }
</style>