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

app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));