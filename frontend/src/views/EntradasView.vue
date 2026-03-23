<script setup>
  import { ref, computed, onMounted } from 'vue'
  import axios from 'axios'

  const titulo = ref('Nova Entrada / Calculadora')

  const nomeCliente = ref('')
  const peso = ref(0)
  const altura = ref(0)
  const largura = ref(0)
  const comprimento = ref(0)
  const materiaisDisponiveis = ref([])
  const materialSelecionado = ref(null)

  const valorCalculado = computed(() => {
    const volume = altura.value * largura.value * comprimento.value
    const custoVolume = volume * 0.01
    const custoPeso = peso.value * 0.05

    return custoVolume + custoPeso
  })

  const custoMaterial = computed(() => {
    if (!materialSelecionado.value || peso.value <= 0) return 0

    const mat = materialSelecionado.value
    let qtdTotalGramas = mat.quantidade_total

    if (mat.unidade_medida === 'kg') {
      qtdTotalGramas = mat.quantidade_total * 1000
    }

    const custoPorGrama = mat.custo_total / qtdTotalGramas
    return custoPorGrama * peso.value
  })

  const lucroEstimado = computed(() => {
    return valorCalculado.value - custoMaterial.value
  })

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const carregarMateriais = async () => {
    const res = await axios.get('http://localhost:3000/api/materiais')
    materiaisDisponiveis.value = res.data
  }

  const salvarEntrada = async () => {
    try {
      const  novaEntrada = {
        descricao: `Queima: ${nomeCliente.value}`,
        valor: valorCalculado.value,
        tipo: 'entrada',
        categoria: 'Serviço'
      }

      await axios.post('http://localhost:3000/api/transacoes', novaEntrada)

      if (materialSelecionado.value) {
        await axios.post('http://localhost:3000/api/materiais/baixa', {
          materialId: materialSelecionado.value.id,
          quantidadeUsada: peso.value
        })
      }

      alert('Entrada registrada e estoque atualizado!')

      nomeCliente.value = ''
      peso.value = 0
      altura.value = 0
      largura.value = 0
      comprimento.value = 0

    } catch(e) {
      console.error('Erro ao salvar transação:', e)
      alert('Erro ao conectar com o servidor.')
    }
  }

  onMounted(() => {
    carregarMateriais()
  })
</script>

<template>
  <div class="entradas">
    <h1>{{ titulo }}</h1>

    <div class="calculadora-card">
      <form @submit.prevent="salvarEntrada">

        <div class="form-group">
          <label for="nome">Nome do Cliente/Aluno:</label>
          <input
            type="text"
            id="nome"
            v-model="nomeCliente"
            required
            placeholder="Nome"
          />
        </div>

        <div class="dimensoes-grid">
          <div class="form-group">
            <label for="peso">Peso da peça (g)</label>
            <input
              type="number"
              id="peso"
              v-model="peso"
              min="0"
            />
          </div>
          <div class="form-group">
            <label for="material">Material Utilizado</label>
            <select id="material" v-model="materialSelecionado" required>
              <option :value="null">Selecione o Material</option>
              <option v-for="m in materiaisDisponiveis" :key="m.id" :value="m">
                {{ m.nome }} (Disponível: {{ m.quantidade_total }}{{ m.unidade_medida }})
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="altura">Altura da peça (cm)</label>
            <input
              type="number"
              id="altura"
              v-model="altura"
              min="0"
            />
          </div>
          <div class="form-group">
            <label for="largura">Largura da peça (cm)</label>
            <input
              type="number"
              id="largura"
              v-model="largura"
              min="0"
            />
          </div>
          <div class="form-group">
            <label for="comprimento">Comprimento da peça (cm)</label>
            <input
              type="number"
              id="comprimento"
              v-model="comprimento"
              min="0"
            />
          </div>
        </div>

        <div class="resultado">
          <h3> Valor sugerido: {{ formatarMoeda(valorCalculado) }}</h3>

          <div v-if="materialSelecionado" class="detalhes-lucro">
            <p>Custo do Material ({{ peso }}g): <strong>{{ formatarMoeda(custoMaterial) }}</strong></p>
            <p class="lucro-texto">Lucro Líquido Estimado: <strong>{{ formatarMoeda(lucroEstimado) }}</strong></p>
          </div>
        </div>

        <button type="submit" class="btn-salvar">Registrar Entrada</button>
      </form>
    </div>
  </div>
</template>

<style scoped>
  .entradas {
    padding: 20px;
  }

  .calculadora-card {
    background-color: #fff;
    padding: 25px;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    max-width: 600px;
    margin-top: 20px;
  }

  .form-group {
    margin-bottom: 15px;
    display: flex;
    flex-direction: column;
  }

  label {
    margin-bottom: 5px;
    font-weight: 500;
    color: #2c3e50;
  }

  input, select {
    padding: 10px;
    border: 1px solid #bdc3c7;
    border-radius: 6px;
    font-size: 1rem;
  }

  select:focus {
    outline: none;
    border-color: #3498db;
  }

  .dimensoes-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }

  .resultado {
    margin: 20px 0;
    padding: 15px;
    background-color: #f0f8ff;
    border-left: 5px solid #3498db;
    border-radius: 6px;
  }

  .resultado h3 {
    margin: 0;
    color: #2c3e50;
  }

  .btn-salvar {
    background-color: #2ecc71;
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 6px;
    font-size: 1.1rem;
    cursor: pointer;
    width: 100%;
    font-weight: bold;
  }

  .btn-salvar:hover {
    background-color: #27ae60;
  }

  .detalhes-lucro {
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px dashed #bdc3c7;
  }

  .detalhes-lucro p {
    margin: 5px 0;
    color: #7f8c8d;
    display: flex;
    justify-content: space-between;
  }

  .lucro-texto {
    color: #2ecc71 !important;
    font-size: 1.1rem;
  }
</style>