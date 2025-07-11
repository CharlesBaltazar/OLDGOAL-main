const express = require("express");
const app = express();
const port = 3022;
const db = require("./db_config");
const cors = require("cors");

app.use(express.json());
app.use(cors());

// Rota de cadastro
app.post('/cadastro', (req, res) => {
    const { nome, genero, data_nascimento, email, senha } = req.body;
    
    // Validar dados
    if (!nome || !genero || !data_nascimento || !email || !senha) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    const query = 'INSERT INTO usuario (nome, genero, data_nascimento, email, senha) VALUES (?, ?, ?, ?, ?)';
    
    db.query(query, [nome, genero, data_nascimento, email, senha], (err, results) => {
        if (err) {
            console.error('Erro ao cadastrar:', err);
            return res.status(500).json({ 
                error: 'Erro ao cadastrar usuário',
                details: err.message 
            });
        }
        res.status(201).json({ message: 'Usuário cadastrado com sucesso' });
    });
});

// Rota de login
app.post('/login', (req, res) => {
    const { email, senha } = req.body;
    
    if (!email || !senha) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }
    
    const query = 'SELECT * FROM usuario WHERE email = ? AND senha = ?';
    
    db.query(query, [email, senha], (err, results) => {
        if (err) {
            console.error('Erro ao fazer login:', err);
            return res.status(500).json({ 
                error: 'Erro ao fazer login',
                details: err.message 
            });
        }
        
        if (results.length > 0) {
            res.json({ 
                message: 'Login realizado com sucesso',
                user: {
                    id: results[0].id,
                    nome: results[0].nome,
                    email: results[0].email
                }
            });
        } else {
            res.status(401).json({ error: 'Email ou senha incorretos' });
        }
    });
});

// Rotas de refeições
app.get('/refeicoes', (req, res) => {
    const { usuario_id } = req.query;
    db.query('SELECT * FROM refeicao WHERE usuario_id = ?', [usuario_id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Erro ao buscar refeições', details: err.message });
        res.json(results);
    });
});

app.post('/refeicoes', (req, res) => {
    const { usuario_id, nome, horario, icone } = req.body;
    db.query('INSERT INTO refeicao (usuario_id, nome, horario, icone) VALUES (?, ?, ?, ?)', [usuario_id, nome, horario, icone], (err, result) => {
        if (err) return res.status(500).json({ error: 'Erro ao criar refeição', details: err.message });
        res.status(201).json({ id: result.insertId });
    });
});

app.delete('/refeicoes/:id', (req, res) => {
    db.query('DELETE FROM refeicao WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Erro ao deletar refeição', details: err.message });
        res.json({ message: 'Refeição deletada' });
    });
});

// Rotas de alimentos
app.get('/alimentos', (req, res) => {
    const { refeicao_id } = req.query;
    db.query('SELECT * FROM alimento WHERE refeicao_id = ?', [refeicao_id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Erro ao buscar alimentos', details: err.message });
        res.json(results);
    });
});

app.post('/alimentos', (req, res) => {
    const { refeicao_id, nome, quantidade, calorias } = req.body;
    db.query('INSERT INTO alimento (refeicao_id, nome, quantidade, calorias) VALUES (?, ?, ?, ?)', [refeicao_id, nome, quantidade, calorias], (err, result) => {
        if (err) return res.status(500).json({ error: 'Erro ao adicionar alimento', details: err.message });
        res.status(201).json({ id: result.insertId });
    });
});

app.delete('/alimentos/:id', (req, res) => {
    db.query('DELETE FROM alimento WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Erro ao deletar alimento', details: err.message });
        res.json({ message: 'Alimento deletado' });
    });
});

// Marcar refeição como concluída
app.post('/refeicao_usuario', (req, res) => {
    const { usuario_id, refeicao_id, data, concluida } = req.body;
    db.query('INSERT INTO refeicao_usuario (usuario_id, refeicao_id, data, concluida) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE concluida = ?', [usuario_id, refeicao_id, data, concluida, concluida], (err) => {
        if (err) return res.status(500).json({ error: 'Erro ao marcar refeição', details: err.message });
        res.json({ message: 'Refeição marcada' });
    });
});

// Buscar refeições concluídas do dia e calorias totais
app.get('/calorias_dia', (req, res) => {
    const { usuario_id, data } = req.query;
    const sql = `SELECT SUM(a.calorias) as total_calorias FROM refeicao_usuario ru
        JOIN alimento a ON ru.refeicao_id = a.refeicao_id
        WHERE ru.usuario_id = ? AND ru.data = ? AND ru.concluida = 1`;
    db.query(sql, [usuario_id, data], (err, results) => {
        if (err) return res.status(500).json({ error: 'Erro ao buscar calorias', details: err.message });
        res.json({ total_calorias: results[0].total_calorias || 0 });
    });
});

// Rota para saber se uma refeição está concluída para o usuário no dia
app.get('/refeicao_usuario', (req, res) => {
    const { usuario_id, refeicao_id, data } = req.query;
    db.query('SELECT concluida FROM refeicao_usuario WHERE usuario_id = ? AND refeicao_id = ? AND data = ?', [usuario_id, refeicao_id, data], (err, results) => {
        if (err) return res.status(500).json({ error: 'Erro ao buscar status da refeição', details: err.message });
        if (results.length > 0) {
            res.json({ concluida: results[0].concluida });
        } else {
            res.json({ concluida: 0 });
        }
    });
});

// Rota para debug: listar todas as refeições
app.get('/todas_refeicoes', (req, res) => {
    db.query('SELECT * FROM refeicao', (err, results) => {
        if (err) return res.status(500).json({ error: 'Erro ao buscar todas as refeições', details: err.message });
        res.json(results);
    });
});

app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));