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
        // Parse dos alimentos JSON para cada refeição
        const refeicoes = results.map(ref => {
            if (ref.alimentos_json) {
                try {
                    ref.alimentos = JSON.parse(ref.alimentos_json);
                } catch (e) {
                    ref.alimentos = [];
                }
            } else {
                ref.alimentos = [];
            }
            delete ref.alimentos_json; // Remove o campo JSON do retorno
            return ref;
        });
        res.json(refeicoes);
    });
});

app.post('/refeicoes', (req, res) => {
    const { usuario_id, nome, horario, icone, alimentos } = req.body;
    
    // Calcular total de calorias
    const totalCalorias = alimentos ? alimentos.reduce((total, alimento) => total + (alimento.calorias || 0), 0) : 0;
    const alimentosJson = alimentos ? JSON.stringify(alimentos) : '[]';
    
    db.query('INSERT INTO refeicao (usuario_id, nome, horario, icone, alimentos_json, total_calorias) VALUES (?, ?, ?, ?, ?, ?)', 
        [usuario_id, nome, horario, icone, alimentosJson, totalCalorias], (err, result) => {
        if (err) {
            console.error('Erro ao inserir refeição:', err);
            return res.status(500).json({ error: 'Erro ao criar refeição', details: err.message });
        }
        res.status(201).json({ id: result.insertId });
    });
});

app.delete('/refeicoes/:id', (req, res) => {
    db.query('DELETE FROM refeicao WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Erro ao deletar refeição', details: err.message });
        res.json({ message: 'Refeição deletada' });
    });
});

// Rota para atualizar alimentos de uma refeição
app.put('/refeicoes/:id/alimentos', (req, res) => {
    const { alimentos } = req.body;
    const totalCalorias = alimentos ? alimentos.reduce((total, alimento) => total + (alimento.calorias || 0), 0) : 0;
    const alimentosJson = alimentos ? JSON.stringify(alimentos) : '[]';
    
    db.query('UPDATE refeicao SET alimentos_json = ?, total_calorias = ? WHERE id = ?', 
        [alimentosJson, totalCalorias, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Erro ao atualizar alimentos', details: err.message });
        res.json({ message: 'Alimentos atualizados' });
    });
});

// Marcar refeição como concluída
app.post('/refeicao_usuario', (req, res) => {
    const { usuario_id, refeicao_id, data, concluida } = req.body;
    
    db.query('INSERT INTO refeicao_usuario (usuario_id, refeicao_id, data, concluida) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE concluida = ?', 
        [usuario_id, refeicao_id, data, concluida, concluida], (err, result) => {
        if (err) {
            console.error('Erro ao marcar refeição:', err);
            return res.status(500).json({ error: 'Erro ao marcar refeição', details: err.message });
        }
        res.json({ message: 'Refeição marcada' });
    });
});

// Buscar refeições concluídas do dia e calorias totais
app.get('/calorias_dia', (req, res) => {
    const { usuario_id, data } = req.query;
    
    const sql = `SELECT SUM(r.total_calorias) as total_calorias FROM refeicao_usuario ru
        JOIN refeicao r ON ru.refeicao_id = r.id
        WHERE ru.usuario_id = ? AND ru.data = ? AND ru.concluida = 1`;
    
    db.query(sql, [usuario_id, data], (err, results) => {
        if (err) {
            console.error('Erro ao buscar calorias:', err);
            return res.status(500).json({ error: 'Erro ao buscar calorias', details: err.message });
        }
        
        const totalCalorias = results[0].total_calorias || 0;
        res.json({ total_calorias: totalCalorias });
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

// Rota para buscar histórico de refeições concluídas
app.get('/historico', (req, res) => {
    const { usuario_id, data } = req.query;
    
    const sql = `
        SELECT 
            r.id,
            r.nome,
            r.horario,
            r.icone,
            r.alimentos_json,
            r.total_calorias,
            ru.data,
            ru.concluida
        FROM refeicao_usuario ru
        JOIN refeicao r ON ru.refeicao_id = r.id
        WHERE ru.usuario_id = ? AND ru.data = ? AND ru.concluida = 1
        ORDER BY r.horario ASC
    `;
    
    db.query(sql, [usuario_id, data], (err, results) => {
        if (err) {
            console.error('Erro ao buscar histórico:', err);
            return res.status(500).json({ error: 'Erro ao buscar histórico', details: err.message });
        }
        
        // Parse dos alimentos JSON para cada refeição
        const historico = results.map(item => {
            if (item.alimentos_json) {
                try {
                    item.alimentos = JSON.parse(item.alimentos_json);
                } catch (e) {
                    item.alimentos = [];
                }
            } else {
                item.alimentos = [];
            }
            delete item.alimentos_json;
            return item;
        });
        
        res.json(historico);
    });
});

// Rotas de perfil do usuário
app.get('/usuario/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT id, nome, email, genero, data_nascimento, bio, role FROM usuario WHERE id = ?', [id], (err, results) => {
        if (err) {
            console.error('Erro ao buscar usuário:', err);
            return res.status(500).json({ error: 'Erro ao buscar dados do usuário', details: err.message });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        
        res.json(results[0]);
    });
});

app.put('/usuario/:id', (req, res) => {
    const { id } = req.params;
    const { nome, email, genero, data_nascimento, bio, role, senha_atual, nova_senha } = req.body;
    
    // Verificar se a senha atual está correta (se fornecida)
    if (senha_atual && nova_senha) {
        db.query('SELECT senha FROM usuario WHERE id = ?', [id], (err, results) => {
            if (err) {
                console.error('Erro ao verificar senha:', err);
                return res.status(500).json({ error: 'Erro ao verificar senha', details: err.message });
            }
            
            if (results.length === 0) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }
            
            if (results[0].senha !== senha_atual) {
                return res.status(400).json({ error: 'Senha atual incorreta' });
            }
            
            // Atualizar com nova senha
            atualizarUsuario(id, { nome, email, genero, data_nascimento, bio, role, senha: nova_senha }, res);
        });
    } else {
        // Atualizar sem alterar senha
        atualizarUsuario(id, { nome, email, genero, data_nascimento, bio, role }, res);
    }
});

function atualizarUsuario(id, dados, res) {
    const campos = [];
    const valores = [];
    
    if (dados.nome) {
        campos.push('nome = ?');
        valores.push(dados.nome);
    }
    if (dados.email) {
        campos.push('email = ?');
        valores.push(dados.email);
    }
    if (dados.genero) {
        campos.push('genero = ?');
        valores.push(dados.genero);
    }
    if (dados.data_nascimento) {
        campos.push('data_nascimento = ?');
        valores.push(dados.data_nascimento);
    }
    if (dados.bio !== undefined) {
        campos.push('bio = ?');
        valores.push(dados.bio);
    }
    if (dados.role) {
        campos.push('role = ?');
        valores.push(dados.role);
    }
    if (dados.senha) {
        campos.push('senha = ?');
        valores.push(dados.senha);
    }
    
    if (campos.length === 0) {
        return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }
    
    valores.push(id);
    const sql = `UPDATE usuario SET ${campos.join(', ')} WHERE id = ?`;
    
    db.query(sql, valores, (err, result) => {
        if (err) {
            console.error('Erro ao atualizar usuário:', err);
            return res.status(500).json({ error: 'Erro ao atualizar perfil', details: err.message });
        }
        
        res.json({ message: 'Perfil atualizado com sucesso' });
    });
}

// Excluir conta do usuário
app.delete('/usuario/:id', (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ error: 'ID do usuário é obrigatório' });
    }

    db.query('DELETE FROM usuario WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error('Erro ao excluir usuário:', err);
            return res.status(500).json({ error: 'Erro ao excluir conta', details: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        res.json({ message: 'Conta excluída com sucesso' });
    });
});

// Listar todos os usuários (somente admin)
app.get('/usuarios', (req, res) => {
    const { admin_id } = req.query;
    if (!admin_id) {
        return res.status(400).json({ error: 'admin_id é obrigatório' });
    }

    db.query('SELECT role FROM usuario WHERE id = ?', [admin_id], (err, results) => {
        if (err) {
            console.error('Erro ao verificar papel do usuário:', err);
            return res.status(500).json({ error: 'Erro interno', details: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Administrador não encontrado' });
        }
        if (results[0].role !== 'admin') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const sql = 'SELECT id, nome, email, genero, data_nascimento, role FROM usuario ORDER BY id ASC';
        db.query(sql, (err2, users) => {
            if (err2) {
                console.error('Erro ao listar usuários:', err2);
                return res.status(500).json({ error: 'Erro ao listar usuários', details: err2.message });
            }
            res.json(users);
        });
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