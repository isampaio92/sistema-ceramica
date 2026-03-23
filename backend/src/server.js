const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.resolve(__dirname, 'database.sqlite'));

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS transacoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tipo TEXT,
            categoria TEXT,
            descricao TEXT,
            valor REAL,
            data TEXT
        )
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS materiais (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT,
            quantidade_total REAL,
            unidade_medida TEXT,
            custo_total REAL
        )
    `);
});

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
    db.all("SELECT * FROM transacoes ORDER BY data DESC", [], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ erro: 'Erro ao buscar dados no banco.' });
        }

        res.json(rows)
    });
});

app.get('/api/resumo', (req, res) => {
    const query = `
        SELECT
            SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END) as receitas,
            SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END) as despesas
        FROM transacoes    
    `;

    db.get(query, [], (err, row) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ erro: 'Erro ao calcular resumo.' });
        }

        const receitas = row.receitas || 0;
        const despesas = row.despesas || 0;
        const saldo = receitas - despesas;

        res.json({ receitas, despesas, saldo });
    });
});

app.post('/api/transacoes', (req, res) => {
    const { descricao, valor, tipo, categoria } = req.body
    const data = new Date().toISOString().split('T')[0]
    
    const query = `INSERT INTO transacoes (tipo, categoria, descricao, valor, data) 
                   VALUES (?, ?, ?, ?, ?)`;

    db.run(query, [tipo, categoria, descricao, valor, data], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ erro: 'Erro ao salvar no banco.' });
        }

        res.status(201).json({ id: this.lastID, descricao, valor });
    });
});

app.delete('/api/transacoes/:id', (req, res) => {
    const { id } = req.params;

    db.run("DELETE FROM transacoes WHERE id = ?", id, function(err) {
        if (err) {
            console.error(err.message)
            return res.status(404).json({ erro: 'Transação não encontrada.' });
        }

        res.json({ mensagem: 'Excluído com sucesso' });
    });
});

app.post('/api/materiais', (req, res) => {
    const { nome, quantidade_total, unidade_medida, custo_total } = req.body;
    const query = `INSERT INTO materiais (nome, quantidade_total, unidade_medida, custo_total) VALUES (?, ?, ?, ?)`;

    db.run(query, [nome, quantidade_total, unidade_medida, custo_total], function(err) {
        if (err) {
            console.error('Erro do SQLite:', err.message);
            return res.status(500).json({ erro: err.message });
        }
        res.status(201).json({ id: this.lastID });
    });
});

app.get('/api/materiais', (req, res) => {
    db.all("SELECT * FROM materiais", [], (err, rows) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json(rows);
    });
});

app.post('/api/materiais/baixa', (req, res) => {
    const { materialId, quantidadeUsada } = req.body;

    db.get("SELECT unidade_medida FROM materiais WHERE id = ?", [materialId], (err, row) => {
        if (err) return res.status(500).json({ erro: err.message });
        if (!row) return res.status(404).json({ erro: 'Material não encontrado' });

        let quantidadeDescontar = parseFloat(quantidadeUsada);

        if (row.unidade_medida === 'kg') {
            quantidadeDescontar = quantidadeDescontar/ 1000;
        }

        const query = `UPDATE materiais
                       SET quantidade_total = quantidade_total - ?
                       WHERE id = ?`;

        db.run(query, [quantidadeDescontar, materialId], function(err) {
            if (err) return res.status(500).json({ erro: err.message });
            res.json({ mensagem: 'Baixa de estoque realizada com sucesso' });
        })
    })
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}/api/transacoes`);
});
