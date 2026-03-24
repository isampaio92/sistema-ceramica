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

  const precisaFrete = ref(false)
  const cepDestino = ref('')
  const opcoesFrete = ref([])
  const freteEscolhido = ref(0)
  const carregandoFrete = ref(false)

  const valorCalculado = computed(() => {
    const volume = altura.value * largura.value * comprimento.value
    const custoVolume = volume * 0.01
    const custoPeso = peso.value * 0.05
    return custoVolume + custoPeso
  })

  const valorTotalFinal = computed(() => {
    return valorCalculado.value + freteEscolhido.value
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
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
  }

  const carregarMateriais = async () => {
    const res = await axios.get('http://localhost:3000/api/materiais')
    materiaisDisponiveis.value = res.data
  }

  const buscarFrete = async () => {
    if (!cepDestino.value || cepDestino.value.length < 8) {
      alert('Por favor, digite um CEP válido com 8 números.')
      return
    }

    carregandoFrete.value = true
    opcoesFrete.value = []
    freteEscolhido.value = 0

    try {
      let pesoKg = peso.value / 1000
      if (pesoKg < 0.3) pesoKg = 0.3 

      const res = await axios.post('http://localhost:3000/api/frete', {
        cepDestino: cepDestino.value,
        pesoKg: pesoKg
      })
      
      opcoesFrete.value = res.data
    } catch(e) {
      console.error(e)
      alert('Erro ao calcular frete com os Correios.')
    } finally {
      carregandoFrete.value = false
    }
  }

  const salvarEntrada = async () => {
    try {
      const descricaoFinal = precisaFrete.value 
        ? `Venda/Envio: ${nomeCliente.value} (Frete incluso)` 
        : `Queima/Venda: ${nomeCliente.value}`

      const novaEntrada = {
        descricao: descricaoFinal,
        valor: valorTotalFinal.value,
        tipo: 'entrada',
        categoria: precisaFrete.value ? 'Venda + Frete' : 'Serviço',
        material_id: materialSelecionado.value ? materialSelecionado.value.id : null,
        peso_usado: materialSelecionado.value ? peso.value : 0
      }

      await axios.post('http://localhost:3000/api/transacoes', novaEntrada)

      alert('Entrada registrada e estoque atualizado!')

      nomeCliente.value = ''
      peso.value = 0
      altura.value = 0
      largura.value = 0
      comprimento.value = 0
      precisaFrete.value = false
      cepDestino.value = ''
      opcoesFrete.value = []
      freteEscolhido.value = 0

    } catch(e) {
      console.error('Erro ao salvar transação:', e)
      alert('Erro ao conectar com o servidor.')
    }
  }

  onMounted(carregarMateriais)
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

          <div class="form-group checkbox-group">
            <label class="frete-toggle">
              <input type="checkbox" v-model="precisaFrete" />
                Peça será enviada por Correios
            </label>
          </div>

          <div v-if="precisaFrete" class="frete-painel">
            <div class="form-group">
              <label for="cep">CEP de Destino (Apenas números)</label>
              <div class="cep-flex">
                <input 
                  type="text" 
                  id="cep" 
                  v-model="cepDestino" 
                  placeholder="Ex: 01001000" 
                  maxlength="8"
                />
                <button type="button" @click="buscarFrete" :disabled="carregandoFrete" class="btn-buscar-frete">
                  {{ carregandoFrete ? 'Calculando...' : 'Calcular' }}
                </button>
              </div>
            </div>

            <div v-if="opcoesFrete.length > 0" class="opcoes-frete">
              <label v-for="(frete, index) in opcoesFrete" :key="index" class="frete-card">
                <input 
                  type="radio" 
                  :value="parseFloat(frete.valor.replace(',', '.'))" 
                  v-model="freteEscolhido" 
                />
                <div class="frete-info">
                  <span class="frete-tipo">{{ frete.tipo }} ({{ frete.prazo }})</span>
                  <span class="frete-valor">R$ {{ frete.valor }}</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div class="resultado">
          <h3>Valor Sugerido (Peça + Frete): {{ formatarMoeda(valorTotalFinal) }}</h3>

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

  .checkbox-group {
    margin: 20px 0;
    padding-top: 15px;
    border-top: 1px solid #eee;
  }

  .frete-toggle {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 1.1rem;
    font-weight: bold;
    color: #34495e;
    cursor: pointer;
  }

  .frete-toggle input {
    width: 20px;
    height: 20px;
    cursor: pointer;
  }

  .frete-painel {
    background-color: #f8f9fa;
    padding: 15px;
    border-radius: 8px;
    border: 1px solid #e9ecef;
    margin-bottom: 20px;
  }

  .cep-flex {
    display: flex;
    gap: 10px;
  }

  .btn-buscar-frete {
    background-color: #f39c12;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 0 20px;
    font-weight: bold;
    cursor: pointer;
    transition: 0.2s;
  }

  .btn-buscar-frete:hover { background-color: #e67e22; }
  .btn-buscar-frete:disabled { background-color: #bdc3c7; cursor: not-allowed; }

  .opcoes-frete {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 15px;
  }

  .frete-card {
    display: flex;
    align-items: center;
    gap: 15px;
    background-color: white;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    cursor: pointer;
  }

  .frete-info {
    display: flex;
    flex-direction: column;
  }

  .frete-tipo { font-weight: bold; color: #2c3e50; }
  .frete-valor { color: #2ecc71; font-weight: bold; }
</style>