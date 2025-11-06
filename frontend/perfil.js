// Funções utilitárias
function getUserId() {
    const user = JSON.parse(localStorage.getItem('user'));
    return user ? user.id : null;
}

function getUserData() {
    const user = JSON.parse(localStorage.getItem('user'));
    return user || null;
}

// Carregar dados do usuário
async function carregarDadosUsuario() {
    const usuario_id = getUserId();
    if (!usuario_id) {
        console.log('Usuário não logado');
        window.location.href = './login.html';
        return;
    }
    
    try {
        const res = await fetch(`http://localhost:3022/usuario/${usuario_id}`);
        const usuario = await res.json();
        
        if (res.ok) {
            preencherFormulario(usuario);
            calcularDiasCadastrado(usuario.data_nascimento);
        } else {
            console.error('Erro ao carregar dados do usuário:', usuario.error);
        }
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
    }
}

// Preencher formulário com dados do usuário
function preencherFormulario(usuario) {
    document.getElementById('nome').value = usuario.nome || '';
    document.getElementById('email').value = usuario.email || '';
    document.getElementById('data_nascimento').value = usuario.data_nascimento || '';
    document.getElementById('bio').value = usuario.bio || '';
    
    // Selecionar gênero
    if (usuario.genero) {
        const genderButtons = document.querySelectorAll('.gender-btn');
        genderButtons.forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.value === usuario.genero) {
                btn.classList.add('selected');
            }
        });
    }
}

// Calcular dias cadastrado
function calcularDiasCadastrado(dataNascimento) {
    if (!dataNascimento) return;
    
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    const diffTime = Math.abs(hoje - nascimento);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    document.getElementById('dias-cadastrado').textContent = diffDays;
}

// Carregar estatísticas do usuário
async function carregarEstatisticas() {
    const usuario_id = getUserId();
    if (!usuario_id) return;
    
    try {
        // Buscar total de refeições
        const refeicoesRes = await fetch(`http://localhost:3022/refeicoes?usuario_id=${usuario_id}`);
        const refeicoes = await refeicoesRes.json();
        document.getElementById('total-refeicoes').textContent = refeicoes.length;
        
        // Calcular total de calorias de todas as refeições
        const totalCalorias = refeicoes.reduce((total, ref) => total + (ref.total_calorias || 0), 0);
        document.getElementById('total-calorias').textContent = totalCalorias;
        
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

// Salvar perfil
async function salvarPerfil() {
    const usuario_id = getUserId();
    if (!usuario_id) return;
    
    const formData = new FormData(document.getElementById('perfil-form'));
    const generoSelecionado = document.querySelector('.gender-btn.selected');
    
    const dados = {
        nome: formData.get('nome'),
        email: formData.get('email'),
        data_nascimento: formData.get('data_nascimento'),
        genero: generoSelecionado ? generoSelecionado.dataset.value : null,
        bio: formData.get('bio')
    };
    
    // Validar senhas se fornecidas
    const senhaAtual = formData.get('senha_atual');
    const novaSenha = formData.get('nova_senha');
    const confirmarSenha = formData.get('confirmar_senha');
    
    if (novaSenha || confirmarSenha) {
        if (!senhaAtual) {
            alert('Para alterar a senha, você deve informar a senha atual.');
            return;
        }
        if (novaSenha !== confirmarSenha) {
            alert('As novas senhas não coincidem.');
            return;
        }
        dados.senha_atual = senhaAtual;
        dados.nova_senha = novaSenha;
    }
    
    try {
        const res = await fetch(`http://localhost:3022/usuario/${usuario_id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });
        
        const resultado = await res.json();
        
        if (res.ok) {
            // Atualizar dados no localStorage
            const userData = getUserData();
            if (userData) {
                userData.nome = dados.nome;
                userData.email = dados.email;
                localStorage.setItem('user', JSON.stringify(userData));
            }
            
            mostrarModalConfirmacao();
        } else {
            alert('Erro ao salvar perfil: ' + (resultado.error || 'Erro desconhecido'));
        }
    } catch (error) {
        console.error('Erro ao salvar perfil:', error);
        alert('Erro ao conectar com o servidor. Tente novamente.');
    }
}

// Mostrar modal de confirmação
function mostrarModalConfirmacao() {
    document.getElementById('modal-confirmacao').style.display = 'flex';
}

// Fechar modal
function fecharModal() {
    document.getElementById('modal-confirmacao').style.display = 'none';
}

// Logout
function logout() {
    localStorage.removeItem('user');
    window.location.href = './login.html';
}

// Excluir conta
async function excluirConta() {
    const usuario_id = getUserId();
    if (!usuario_id) return;

    const confirmar = confirm('Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.');
    if (!confirmar) return;

    try {
        const res = await fetch(`http://localhost:3022/usuario/${usuario_id}`, {
            method: 'DELETE'
        });
        const data = await res.json();
        if (res.ok) {
            alert('Conta excluída com sucesso.');
            localStorage.removeItem('user');
            window.location.href = './login.html';
        } else {
            alert('Erro ao excluir conta: ' + (data.error || 'Erro desconhecido'));
        }
    } catch (error) {
        console.error('Erro ao excluir conta:', error);
        alert('Erro ao conectar com o servidor. Tente novamente.');
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Botão voltar
    document.querySelector('.voltar-btn').onclick = () => {
        window.location.href = './index.html';
    };
    
    // Botão salvar
    document.getElementById('salvar-btn').onclick = (e) => {
        e.preventDefault();
        salvarPerfil();
    };

	// Botão sair (logout)
	document.getElementById('logout-btn').onclick = (e) => {
		e.preventDefault();
		logout();
	};

	// Botão excluir conta
	document.getElementById('excluir-btn').onclick = async (e) => {
		e.preventDefault();
		await excluirConta();
	};
    
    // Seleção de gênero
    const genderButtons = document.querySelectorAll('.gender-btn');
    genderButtons.forEach(button => {
        button.addEventListener('click', () => {
            genderButtons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
        });
    });
    
    // Carregar dados iniciais
    carregarDadosUsuario();
    carregarEstatisticas();
});

// Fechar modal ao clicar fora
document.getElementById('modal-confirmacao').addEventListener('click', function(e) {
    if (e.target === this) {
        fecharModal();
    }
});
