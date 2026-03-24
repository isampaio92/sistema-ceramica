<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const transacoes = ref([])

const filtroTexto = ref('')
const filtroMes = ref('')
const filtroTipo = ref('todos')

const carregarTransacoes = async () => {
  try {
    const res = await axios.get('http://localhost:3000/api/transacoes')
    transacoes.value = res.data
  } catch (e) {
    console.error('Erro ao carregar histórico:', e)
  }
}

const excluirTransacao = async (id) => {
  if (!confirm('Deseja realmente excluir este lançamento? (Isso pode estornar materiais do estoque)')) return

  try {
    await axios.delete(`http://localhost:3000/api/transacoes/${id}`)
    transacoes.value = transacoes.value.filter(t => t.id !== id)
    alert('Excluído com sucesso!')
  } catch (e) {
    console.error('Erro ao excluir:', e)
    alert('Erro ao excluir a transação.')
  }
}

const transacoesFiltradas = computed(() => {
  return transacoes.value.filter(t => {
    const busca = filtroTexto.value.toLowerCase()
    const matchTexto = t.descricao.toLowerCase().includes(busca) || 
                       t.categoria.toLowerCase().includes(busca)
    
    const matchTipo = filtroTipo.value === 'todos' || t.tipo === filtroTipo.value

    const matchMes = !filtroMes.value || t.data.startsWith(filtroMes.value)

    return matchTexto && matchTipo && matchMes
  })
})

const formatarMoeda = (valor) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
}

const formatarData = (dataISO) => {
  if (!dataISO) return '-'
  const [ano, mes, dia] = dataISO.split('-')
  return `${dia}/${mes}/${ano}`
}

onMounted(carregarTransacoes)
</script>

<template>
  <div class="historico">
    <h1>Histórico de Transações</h1>

    <div class="filtros-card">
      <div class="filtro-group search-bar">
        <label for="busca">Pesquisar</label>
        <input 
          type="text" 
          id="busca" 
          v-model="filtroTexto" 
          placeholder="Digite um nome, material ou serviço..." 
        />
      </div>

      <div class="filtro-group">
        <label for="mes">Filtrar por Mês</label>
        <input 
          type="month" 
          id="mes" 
          v-model="filtroMes" 
        />
      </div>

      <div class="filtro-group">
        <label for="tipo">Tipo de Movimentação</label>
        <select id="tipo" v-model="filtroTipo">
          <option value="todos">Todas as Movimentações</option>
          <option value="entrada">Apenas Entradas (Receitas)</option>
          <option value="saida">Apenas Saídas (Despesas)</option>
        </select>
      </div>
    </div>

    <div class="tabela-container">
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Tipo</th>
            <th>Categoria</th>
            <th>Descrição</th>
            <th>Valor</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="transacoesFiltradas.length === 0">
            <td colspan="6" class="vazio">Nenhuma transação encontrada para estes filtros.</td>
          </tr>
          <tr v-for="t in transacoesFiltradas" :key="t.id">
            <td class="col-data">{{ formatarData(t.data) }}</td>
            <td>
              <span :class="['badge', t.tipo === 'entrada' ? 'badge-entrada' : 'badge-saida']">
                {{ t.tipo === 'entrada' ? 'Entrada' : 'Saída' }}
              </span>
            </td>
            <td>{{ t.categoria }}</td>
            <td>{{ t.descricao }}</td>
            <td :class="['valor', t.tipo === 'entrada' ? 'text-green' : 'text-red']">
              {{ formatarMoeda(t.valor) }}
            </td>
            <td>
              <button @click="excluirTransacao(t.id)" class="btn-excluir" title="Excluir Lançamento">
                🗑️
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.historico { padding: 20px; }

.filtros-card {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 25px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.filtro-group {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 200px;
}

.search-bar { flex: 2; }

label { font-size: 0.9rem; margin-bottom: 5px; color: #666; font-weight: bold; }
input, select {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  background-color: #fcfcfc;
}
input:focus, select:focus { outline: none; border-color: #3498db; }

.tabela-container { background-color: #fff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow-x: auto; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 15px 12px; text-align: left; border-bottom: 1px solid #eee; }
th { background-color: #f8f9fa; color: #34495e; font-weight: bold; }
.vazio { text-align: center; color: #7f8c8d; padding: 30px; font-style: italic; }

.col-data { color: #7f8c8d; font-size: 0.95rem; }

.badge { padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: bold; text-transform: uppercase; }
.badge-entrada { background-color: #e8f8f5; color: #27ae60; }
.badge-saida { background-color: #fdedec; color: #c0392b; }

.valor { font-weight: bold; }
.text-green { color: #27ae60; }
.text-red { color: #c0392b; }

.btn-excluir {
  background: none; border: none; cursor: pointer; font-size: 1.2rem; padding: 5px; border-radius: 4px; transition: background 0.2s;
}
.btn-excluir:hover { background-color: #ffebee; }
</style>