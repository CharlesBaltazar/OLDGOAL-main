// Utilitários
function getUserId() {
    const user = JSON.parse(localStorage.getItem('user'));
    return user ? user.id : null;
}

// Estado temporário
let alimentos = [];
let iconeSelecionado = 'icone1.png';

// Seleção de ícone
const iconeBtns = document.querySelectorAll('.icone-btn');
iconeBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        iconeBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        iconeSelecionado = btn.querySelector('img').getAttribute('src').split('/').pop();
    });
});
// Seleciona o primeiro por padrão
iconeBtns[0].classList.add('selected');

// Adicionar alimento
function atualizarListaAlimentos() {
    const list = document.getElementById('alimentos-list');
    list.innerHTML = '';
    let total = 0;
    alimentos.forEach((a, i) => {
        total += Number(a.calorias) || 0;
        const div = document.createElement('div');
        div.className = 'alimento-item';
        div.innerHTML = `<span class="alimento-nome">${a.nome}</span> <span>${a.quantidade}</span> <span class="alimento-calorias">${a.calorias}Kcal</span> <button type="button" class="remover-alimento" data-i="${i}">x</button>`;
        list.appendChild(div);
    });
    document.getElementById('calorias-totais').textContent = `Calorias atuais da sua refeição: ${total}Kcal`;
    // Remover alimento
    document.querySelectorAll('.remover-alimento').forEach(btn => {
        btn.onclick = () => {
            alimentos.splice(Number(btn.dataset.i), 1);
            atualizarListaAlimentos();
        };
    });
}

document.getElementById('adicionar-alimento').onclick = function(e) {
    e.preventDefault();
    const nome = document.getElementById('nome-alimento').value.trim();
    const quantidade = document.getElementById('quantidade-alimento').value.trim();
    const calorias = document.getElementById('calorias-alimento').value.trim();
    if (!nome || !quantidade || !calorias) return;
    alimentos.push({ nome, quantidade, calorias });
    document.getElementById('nome-alimento').value = '';
    document.getElementById('quantidade-alimento').value = '';
    document.getElementById('calorias-alimento').value = '';
    atualizarListaAlimentos();
};

// Submeter refeição
const form = document.getElementById('form-refeicao');
form.onsubmit = async function(e) {
    e.preventDefault();
    const usuario_id = getUserId();
    const nome = document.getElementById('nome-refeicao').value.trim();
    const horario = document.getElementById('horario-refeicao').value;
    if (!usuario_id || !nome || !horario || !iconeSelecionado || alimentos.length === 0) {
        alert('Preencha todos os campos e adicione pelo menos um alimento!');
        return;
    }
    // Criar refeição com alimentos
    const res = await fetch('http://localhost:3022/refeicoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            usuario_id, 
            nome, 
            horario, 
            icone: iconeSelecionado,
            alimentos: alimentos
        })
    });
    const data = await res.json();
    
    if (res.ok) {
        alert('Refeição criada com sucesso!');
        localStorage.setItem('refeicao_criada', '1');
        window.location.href = './refeicoes.html';
    } else {
        alert('Erro ao criar refeição: ' + (data.error || 'Erro desconhecido'));
    }
};

document.querySelector('.voltar-btn').onclick = () => window.location.href = './refeicoes.html'; 