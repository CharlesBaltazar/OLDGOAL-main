// Função para cadastrar usuário
async function cadastrarUsuario(event) {
    event.preventDefault();
    
    const nomeInput = document.querySelector('.name-reg input');
    const generoSelecionado = document.querySelector('.gender-select button.selected');
    const dataNascimentoInput = document.querySelector('.agr-reg input[type="date"]');
    const emailInput = document.querySelector('.email-reg input');
    const senhaInput = document.querySelector('.password-reg input');

    if (!nomeInput || !dataNascimentoInput || !emailInput || !senhaInput) {
        console.error('Elementos do formulário não encontrados');
        return;
    }

    const nome = nomeInput.value;
    const genero = generoSelecionado?.textContent.toLowerCase();
    const data_nascimento = dataNascimentoInput.value;
    const email = emailInput.value;
    const senha = senhaInput.value;

    if (!nome || !genero || !data_nascimento || !email || !senha) {
        alert('Por favor, preencha todos os campos!');
        return;
    }

    try {
        const response = await fetch('http://localhost:3022/cadastro', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nome, genero, data_nascimento, email, senha })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Cadastro realizado com sucesso!');
            window.location.href = './login.html';
        } else {
            alert(data.error || 'Erro ao cadastrar usuário');
            if (data.details) {
                console.error('Detalhes do erro:', data.details);
            }
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao conectar com o servidor. Verifique se o servidor está rodando.');
    }
}

// Função para fazer login
async function fazerLogin(event) {
    event.preventDefault();
    
    const emailInput = document.querySelector('.email-log input');
    const senhaInput = document.querySelector('.password-log input');

    if (!emailInput || !senhaInput) {
        console.error('Elementos do formulário não encontrados');
        return;
    }

    const email = emailInput.value;
    const senha = senhaInput.value;

    if (!email || !senha) {
        alert('Por favor, preencha todos os campos!');
        return;
    }

    try {
        const response = await fetch('http://localhost:3022/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, senha })
        });

        const data = await response.json();

        if (response.ok) {
            // Salvar informações do usuário no localStorage
            localStorage.setItem('user', JSON.stringify(data.user));
            alert('Login realizado com sucesso!');
            window.location.href = './index.html'; // Redirecionar para a página inicial
        } else {
            alert(data.error || 'Email ou senha incorretos');
            if (data.details) {
                console.error('Detalhes do erro:', data.details);
            }
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao conectar com o servidor. Verifique se o servidor está rodando.');
    }
}

// Adicionar eventos aos botões
document.addEventListener('DOMContentLoaded', () => {
    // Seleção de gênero
    const genderButtons = document.querySelectorAll('.gender-select button');
    if (genderButtons.length > 0) {
        genderButtons.forEach(button => {
            button.addEventListener('click', () => {
                genderButtons.forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected');
            });
        });
    }

    // Formulário de cadastro
    const cadastroForm = document.querySelector('.register-container');
    if (cadastroForm) {
        cadastroForm.addEventListener('submit', cadastrarUsuario);
    }

    // Formulário de login
    const loginForm = document.querySelector('.login-container');
    if (loginForm) {
        loginForm.addEventListener('submit', fazerLogin);
    }
});
