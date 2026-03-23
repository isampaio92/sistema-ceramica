const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const transacoesMock = [
    { id: 1, tipo: 'saida', categoria: 'Material', descricao: 'Argila Shiro 10kg', valor: 120.00, data: '2026-03-10' },
    { id: 2, tipo: 'entrada', categoria: 'Serviço', descricao: 'Queima de peças - Maria', valor: 45.50, data: '2026-03-12' },
    { id: 3, tipo: 'entrada', categoria: 'Aula', descricao: 'Mensalidade - Turma Noite', valor: 250.00, data: '2026-03-15' },
    { id: 4, tipo: 'saida', categoria: 'Custo Fixo', descricao: 'Conta de Luz do Ateliê', valor: 180.00, data: '2026-03-18' },
    { id: 5, tipo: 'entrada', categoria: 'Venda', descricao: 'Caneca de cerâmica', valor: 65.00, data: '2026-03-19' }
];

app.get('/api/transacoes', (req, res) => {
    res.json(transacoesMock);
});

app.get('/api/resumo', (req, res) => {
    const receitas = transacoesMock
        .filter(t => t.tipo === 'entrada')
        .reduce((acc, curr) => acc + curr.valor, 0);

    const despesas = transacoesMock
        .filter(t => t.tipo === 'saida')
        .reduce((acc, curr) => acc + curr.valor, 0);

    const saldo = receitas - despesas;

    res.json({ receitas, despesas, saldo });
});

app.post('/api/transacoes', (req, res) => {
    const { descricao, valor, tipo, categoria } = req.body

    const novaTransacao = {
        id: transacoesMock.length + 1,
        descricao,
        valor: parseFloat(valor),
        tipo,
        categoria,
        data: new Date().toISOString().split('T')[0]
    }

    transacoesMock.push(novaTransacao)

    console.log('Nova transação registrada:', novaTransacao)

    res.status(201).json(novaTransacao)
})

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}/api/transacoes`);
});
