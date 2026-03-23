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
    })
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
    })
})

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}/api/transacoes`);
});
