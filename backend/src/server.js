const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { calcularPrecoPrazo } = require('correios-brasil');

const db = new sqlite3.Database(path.resolve(__dirname, 'database.sqlite'));

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS transacoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tipo TEXT,
            categoria TEXT,
            descricao TEXT,
            valor REAL,
            data TEXT,
            material_id INTEGER, 
            peso_usado REAL
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
    
    db.run(`
        CREATE TABLE IF NOT EXISTS custos_fixos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            descricao TEXT,
            valor REAL,
            dia_vencimento INTEGER
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
    const { descricao, valor, tipo, categoria, material_id, peso_usado } = req.body;
    const data = new Date().toISOString().split('T')[0];
    
    const query = `INSERT INTO transacoes (tipo, categoria, descricao, valor, data, material_id, peso_usado) 
                   VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.run(query, [tipo, categoria, descricao, valor, data, material_id || null, peso_usado || null], function(err) {
        if (err) return res.status(500).json({ erro: err.message });
        
        if (material_id && peso_usado) {
            db.get("SELECT unidade_medida FROM materiais WHERE id = ?", [material_id], (err, row) => {
                if (row) {
                    let qtdDescontar = parseFloat(peso_usado);
                    if (row.unidade_medida === 'kg') qtdDescontar = qtdDescontar / 1000;
                    db.run("UPDATE materiais SET quantidade_total = quantidade_total - ? WHERE id = ?", [qtdDescontar, material_id]);
                }
            });
        }

        res.status(201).json({ id: this.lastID, descricao, valor });
    });
});

app.delete('/api/transacoes/:id', (req, res) => {
    const { id } = req.params;

    db.get("SELECT * FROM transacoes WHERE id = ?", [id], (err, transacao) => {
        if (err || !transacao) return res.status(404).json({ erro: 'Transação não encontrada.' });

        db.run("DELETE FROM transacoes WHERE id = ?", [id], function(errDel) {
            if (errDel) return res.status(500).json({ erro: errDel.message });

            if (transacao.categoria === 'Material' && transacao.descricao.startsWith('Compra de insumo:')) {
                const nomeMaterial = transacao.descricao.split('Compra de insumo: ')[1].split(' (')[0].trim();
                db.run("DELETE FROM materiais WHERE nome = ?", [nomeMaterial]);
            }

            if (transacao.tipo === 'entrada' && transacao.material_id && transacao.peso_usado) {
                db.get("SELECT unidade_medida FROM materiais WHERE id = ?", [transacao.material_id], (errM, row) => {
                    if (row) {
                        let qtdDevolver = parseFloat(transacao.peso_usado);
                        if (row.unidade_medida === 'kg') qtdDevolver = qtdDevolver / 1000;
                        db.run("UPDATE materiais SET quantidade_total = quantidade_total + ? WHERE id = ?", [qtdDevolver, transacao.material_id]);
                    }
                });
            }

            res.json({ mensagem: 'Transação excluída e estoque atualizado se necessário!' });
        });
    });
});

app.post('/api/frete', async (req, res) => {
    const { cepDestino, pesoKg } = req.body;

    let args = {
        sCepOrigem: '20040000',
        sCepDestino: cepDestino.replace(/\D/g, ''),
        nVlPeso: pesoKg.toString(),
        nCdFormato: '1',
        nVlComprimento: '20',
        nVlAltura: '20',
        nVlLargura: '20',
        nCdServico: ['04014', '04510'],
        nVlDiametro: '0',
    };

    try {
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000));
        
        const resultados = await Promise.race([calcularPrecoPrazo(args), timeout]);
        
        const fretesFormatados = resultados.map(frete => ({
            tipo: frete.Codigo === '04014' ? 'SEDEX' : 'PAC',
            valor: frete.Valor,
            prazo: frete.PrazoEntrega + ' dias úteis',
        }));

        res.json(fretesFormatados);
    } catch (error) {
        console.error('API dos Correios instável/lenta:', error.message);
        res.json([
            { tipo: 'PAC (Sistema Offline)', valor: '28,50', prazo: '8 dias úteis' },
            { tipo: 'SEDEX (Sistema Offline)', valor: '49,90', prazo: '3 dias úteis' }
        ]);
    }
});

app.post('/api/materiais', (req, res) => {
    const { nome, quantidade_total, unidade_medida, custo_total } = req.body;
    const queryMaterial = `INSERT INTO materiais (nome, quantidade_total, unidade_medida, custo_total) VALUES (?, ?, ?, ?)`;

    db.run(queryMaterial, [nome, quantidade_total, unidade_medida, custo_total], function(err) {
        if (err) return res.status(500).json({ erro: err.message });

        const materialId = this.lastID;
        const dataAtual = new Date().toISOString().split('T')[0];
        
        const descricaoFinanceiro = `Compra de insumo: ${nome} (${quantidade_total}${unidade_medida})`;
        const queryTransacao = `INSERT INTO transacoes (tipo, categoria, descricao, valor, data) VALUES (?, ?, ?, ?, ?)`;
        
        db.run(queryTransacao, ['saida', 'Material', descricaoFinanceiro, custo_total, dataAtual], function(errTransacao) {
            if (errTransacao) console.error('Erro na transação:', errTransacao.message);
            res.status(201).json({ id: materialId, mensagem: 'Material e despesa criados com sucesso!' });
        });
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

app.delete('/api/materiais/:id', (req, res) => {
    const { id } = req.params;
    
    db.get("SELECT * FROM materiais WHERE id = ?", [id], (err, material) => {
        if (err || !material) return res.status(404).json({ erro: 'Material não encontrado.' });

        const buscaDescricao = `Compra de insumo: ${material.nome}%`;

        db.run("DELETE FROM transacoes WHERE descricao LIKE ? AND categoria = 'Material'", [buscaDescricao], () => {
            
            db.run("DELETE FROM materiais WHERE id = ?", [id], (errM) => {
                if (errM) return res.status(500).json({ erro: errM.message });
                res.json({ mensagem: 'Material e transação excluídos do sistema!' });
            });
        });
    });
});

app.get('/api/custos-fixos', (req, res) => {
    db.all("SELECT * FROM custos_fixos ORDER BY dia_vencimento ASC", [], (err, rows) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json(rows);
    });
});

app.post('/api/custos-fixos', (req, res) => {
    const { descricao, valor, dia_vencimento } = req.body;
    const query = `INSERT INTO custos_fixos (descricao, valor, dia_vencimento) VALUES (?, ?, ?)`;

    db.run(query, [descricao, valor, dia_vencimento], function(err) {
        if (err) return res.status(500).json({ erro: err.message });
        res.status(201).json({ id: this.lastID });
    });
});

app.post('/api/custos-fixos/:id/lancar', (req, res) => {
    const { id } = req.params;

    db.get("SELECT * FROM custos_fixos WHERE id = ?", [id], (err, custo) => {
        if (err) return res.status(500).json({ erro: err.message });
        if (!custo) return res.status(404).json({ erro: 'Custo fixo não encontrado' });

        const dataAtual = new Date().toISOString().split('T')[0];
        const descricaoFinanceiro = `Custo Fixo: ${custo.descricao}`;
        
        const queryTransacao = `INSERT INTO transacoes (tipo, categoria, descricao, valor, data) 
                                VALUES (?, ?, ?, ?, ?)`;

        db.run(queryTransacao, ['saida', 'Custo Fixo', descricaoFinanceiro, custo.valor, dataAtual], function(errTransacao) {
            if (errTransacao) return res.status(500).json({ erro: errTransacao.message });
            
            res.status(201).json({ mensagem: 'Custo fixo lançado no financeiro com sucesso!' });
        });
    });
});

app.delete('/api/custos-fixos/:id', (req, res) => {
    const { id } = req.params;

    db.get("SELECT * FROM custos_fixos WHERE id = ?", [id], (err, custo) => {
        if (err || !custo) return res.status(404).json({ erro: 'Custo não encontrado.' });

        const descricaoFinanceiro = `Custo Fixo: ${custo.descricao}`;

        // Apaga todos os lançamentos passados no histórico com esse nome
        db.run("DELETE FROM transacoes WHERE descricao = ? AND categoria = 'Custo Fixo'", [descricaoFinanceiro], () => {
            // Depois apaga o custo fixo da tabela
            db.run("DELETE FROM custos_fixos WHERE id = ?", [id], (errC) => {
                if (errC) return res.status(500).json({ erro: errC.message });
                res.json({ mensagem: 'Custo fixo e histórico excluídos!' });
            });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}/api/transacoes`);
});
