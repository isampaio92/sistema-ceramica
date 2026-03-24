<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const descricao = ref('')
const valor = ref(0)
const diaVencimento = ref(1)
const custos = ref([])

const carregarCustos = async () => {
  try {
    const res = await axios.get('http://localhost:3000/api/custos-fixos')
    custos.value = res.data
  } catch (e) {
    console.error('Erro ao carregar custos fixos:', e)
  }
}

const salvarCusto = async () => {
  try {
    const novo = {
      descricao: descricao.value,
      valor: valor.value,
      dia_vencimento: diaVencimento.value
    }
    await axios.post('http://localhost:3000/api/custos-fixos', novo)
    
    descricao.value = ''
    valor.value = 0
    diaVencimento.value = 1
    carregarCustos()
    alert('Custo Fixo cadastrado!')
  } catch (e) {
    alert('Erro ao salvar custo fixo')
  }
}

const excluirCusto = async (id) => {
  if (!confirm('Tem certeza que deseja excluir este custo fixo?')) return

  try {
    await axios.delete(`http://localhost:3000/api/custos-fixos/${id}`)
    
    custos.value = custos.value.filter(c => c.id !== id)
  } catch (e) {
    console.error('Erro ao excluir:', e)
    alert('Erro ao excluir o registro.')
  }
}

const lancarPagamento = async (id, nomeCusto) => {
  if (!confirm(`Deseja lançar o pagamento de "${nomeCusto}" no financeiro agora?`)) return

  try {
    await axios.post(`http://localhost:3000/api/custos-fixos/${id}/lancar`)
    alert('Despesa registrada no Histórico e no Dashboard!')
  } catch (e) {
    console.error('Erro ao lançar pagamento:', e)
    alert('Erro ao registrar no financeiro.')
  }
}

const formatarMoeda = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

onMounted(carregarCustos)
</script>

<template>
  <div class="custos-fixos">
    <h1>Contas e Custos Fixos</h1>

    <div class="form-card">
      <form @submit.prevent="salvarCusto">
        <div class="row">
          <div class="group">
            <label for="descricao">Descrição (Ex: Aluguel, Luz, Internet)</label>
            <input type="text" id="descricao" v-model="descricao" required />
          </div>
        </div>

        <div class="row grid-2">
          <div class="group">
            <label for="valor">Valor Mensal Previsto</label>
            <input type="number" id="valor" v-model="valor" step="0.01" required />
          </div>
          <div class="group">
            <label for="diaVencimento">Dia do Vencimento</label>
            <input type="number" id="diaVencimento" v-model="diaVencimento" min="1" max="31" required />
          </div>
        </div>
        <button type="submit" class="btn-add">Cadastrar Custo Fixo</button>
      </form>
    </div>

    <div class="tabela-container">
      <table>
        <thead>
          <tr>
            <th>Descrição</th>
            <th>Vencimento</th>
            <th>Valor</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in custos" :key="c.id">
            <td>{{ c.descricao }}</td>
            <td>Dia {{ c.dia_vencimento }}</td>
            <td>{{ formatarMoeda(c.valor) }}</td>
            <td>
              <button @click="lancarPagamento(c.id, c.descricao)" class="btn-lancar">
                Lançar Pagamento Mês Atual
              </button>
              <button @click="excluirCusto(c.id)" class="btn-excluir" title="Excluir">
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
.form-card { background-color: #fff; padding: 20px; border-radius: 8px; margin-bottom: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
.row { margin-bottom: 15px; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
.group { display: flex; flex-direction: column; }
label { font-size: 0.9rem; margin-bottom: 5px; color: #666; }
input { padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
.btn-add { background-color: #3498db; color: #fff; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; }
.tabela-container { background-color: #fff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
th { background-color: #f9f9f9; color: #7f8c8d; }

.btn-lancar {
  background-color: #e67e22;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background-color 0.2s;
}
.btn-lancar:hover { background-color: #d35400; }

.btn-excluir {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 5px;
  border-radius: 4px;
  transition: background 0.2s;
  margin-left: 10px; /* Dá um espacinho do botão de lançar */
}
.btn-excluir:hover { background-color: #ffebee; }
</style>