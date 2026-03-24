<script setup>
    import { ref, onMounted } from 'vue'
    import axios from 'axios'

    const nome = ref('')
    const quantidade = ref(0)
    const unidade = ref('g')
    const custo = ref(0)
    const materiais = ref([])

    const carregarMateriais= async () => {
        try {
            const res = await axios.get('http://localhost:3000/api/materiais')
            materiais.value = res.data

        } catch(e) {
            console.error('Erro ao carregar estoque:', e)
        }
    }

    const salvarMaterial = async () => {
        try {
            const novo = {
                nome: nome.value,
                quantidade_total: quantidade.value,
                unidade_medida: unidade.value,
                custo_total: custo.value
            }
            await axios.post('http://localhost:3000/api/materiais', novo)

            nome.value = ''
            quantidade.value = 0
            custo.value = 0
            carregarMateriais()
            alert('Material cadastrado!')

        } catch(e) {
            alert('Erro ao salvar material')
        }
    }

    const excluirMaterial = async (id) => {
        if (!confirm('Tem certeza que deseja excluir este material?')) return

        try {
            await axios.delete(`http://localhost:3000/api/materiais/${id}`)
            materiais.value = materiais.value.filter(m => m.id !== id)
        } catch (e) {
            console.error('Erro ao excluir:', e)
            alert('Erro ao excluir o registro.')
        }
    }

    const formatarMoeda = (valor) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
    }

    onMounted(carregarMateriais)
</script>

<template>
    <div class="estoque">
        <h1>Gestão de Estoque (Materiais)</h1>

        <div class="form-card">
            <form @submit.prevent="salvarMaterial">
                <div class="row">
                    <div class="group">
                        <label for="nome">Material</label>
                        <input
                            type="text"
                            id="nome"
                            v-model="nome"
                            required
                        />
                    </div>
                </div>

                <div class="row grid-3">
                    <div class="group">
                        <label for="quantidade">Quantidade</label>
                        <input
                            type="number"
                            id="quantidade"
                            v-model="quantidade"
                            step="0.01"
                            required
                        />
                    </div>
                    <div class="group">
                        <label for="unidade">Unidade</label>
                        <select id="unidade" v-model="unidade">
                            <option value="g">Gramas (g)</option>
                            <option value="kg">Quilos (kg)</option>
                            <option value="ml">Mililitros (ml)</option>
                        </select>
                    </div>
                    <div class="group">
                        <label for="custo">Custo Total</label>
                        <input
                            type="number"
                            id="custo"
                            v-model="custo"
                            step="0.01"
                            required
                        />
                    </div>
                </div>
                <button type="submit" class="btn-add">Cadastrar Material</button>
            </form>
        </div>

        <div class="tabela-container">
            <table>
                <thead>
                    <tr>
                        <th>Material</th>
                        <th>Qtd. Total</th>
                        <th>Custo Total</th>
                        <th>Custo Unitário</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="m in materiais" :key="m.id">
                        <td>{{ m.nome }}</td>
                        <td>{{ m.quantidade_total }} {{ m.unidade_medida }}</td>
                        <td>{{ formatarMoeda(m.custo_total) }}</td>
                        <td>{{ formatarMoeda(m.custo_total / m.quantidade_total) }} / {{ m.unidade_medida }}</td>
                        <td>
                            <button @click="excluirMaterial(m.id)" class="btn-excluir" title="Excluir">
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
    .form-card {
        background-color: #fff;
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 30px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }

    .row {
        margin-bottom: 15px;
    }

    .grid-3 {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr;
        gap: 15px;
    }

    .group {
        display: flex;
        flex-direction: column;
    }

    label {
        font-size: 0.9rem;
        margin-bottom: 5px;
        color: #666;
    }

    input,
    select {
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
    }

    .btn-add {
        background-color: #3498db;
        color: #fff;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
    }

    .tabela-container {
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }

    table {
        width: 100%;
        border-collapse: collapse;
    }

    th, td {
        padding: 12px;
        text-align: left;
        border-bottom: 1px solid #eee;
    }

    th {
        background-color: #f9f9f9;
        color: #7f8c8d;
    }

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