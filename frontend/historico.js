// Funções utilitárias
function getUserId() {
    const user = JSON.parse(localStorage.getItem('user'));
    return user ? user.id : null;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function formatTime(timeString) {
    return timeString.slice(0, 5);
}

// Carregar histórico de refeições
async function carregarHistorico(data = null) {
    const usuario_id = getUserId();
    if (!usuario_id) {
        console.log('Usuário não logado');
        return;
    }
    
    const dataFiltro = data || new Date().toISOString().slice(0, 10);
    
    try {
        const res = await fetch(`http://localhost:3022/historico?usuario_id=${usuario_id}&data=${dataFiltro}`);
        const historico = await res.json();
        
        console.log('Histórico carregado:', historico);
        
        // Atualizar estatísticas
        atualizarEstatisticas(historico);
        
        // Renderizar lista
        renderizarListaHistorico(historico);
        
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        document.getElementById('historico-list').innerHTML = 
            '<div class="erro-mensagem">Erro ao carregar histórico. Tente novamente.</div>';
    }
}

// Atualizar estatísticas
function atualizarEstatisticas(historico) {
    const totalCalorias = historico.reduce((total, item) => total + (item.total_calorias || 0), 0);
    const totalRefeicoes = historico.length;
    
    document.getElementById('total-calorias').textContent = totalCalorias;
    document.getElementById('total-refeicoes').textContent = totalRefeicoes;
    
    // Atualizar data selecionada
    const dataSelecionada = historico.length > 0 ? formatDate(historico[0].data) : 'Nenhuma';
    document.getElementById('data-selecionada').textContent = dataSelecionada;
}

// Renderizar lista do histórico
function renderizarListaHistorico(historico) {
    const list = document.getElementById('historico-list');
    
    if (historico.length === 0) {
        list.innerHTML = `
            <div class="sem-dados">
                <i class="fa-solid fa-calendar-xmark"></i>
                <h3>Nenhuma refeição concluída nesta data</h3>
                <p>As refeições aparecerão aqui quando forem marcadas como concluídas.</p>
            </div>
        `;
        return;
    }
    
    list.innerHTML = '';
    
    historico.forEach(item => {
        const card = document.createElement('div');
        card.className = 'historico-card';
        
        // Parse dos alimentos se existirem
        let alimentos = [];
        if (item.alimentos_json) {
            try {
                alimentos = JSON.parse(item.alimentos_json);
            } catch (e) {
                alimentos = [];
            }
        }
        
        card.innerHTML = `
            <div class="historico-card-header">
                <div class="refeicao-info">
                    <h3>${item.nome}</h3>
                    <div class="horario-info">
                        <i class="fa-solid fa-clock"></i>
                        <span>${formatTime(item.horario)}</span>
                    </div>
                </div>
                <div class="calorias-info">
                    <div class="calorias-valor">${item.total_calorias || 0}</div>
                    <div class="calorias-label">kcal</div>
                </div>
            </div>
            
            <div class="historico-card-content">
                <div class="alimentos-preview">
                    <i class="fa-solid fa-utensils"></i>
                    <span>${alimentos.length} alimento${alimentos.length !== 1 ? 's' : ''}</span>
                </div>
                <div class="data-info">
                    <i class="fa-solid fa-calendar"></i>
                    <span>Concluída em ${formatDate(item.data)}</span>
                </div>
            </div>
            
            <div class="historico-card-actions">
                <button class="ver-detalhes-btn">
                    <i class="fa-solid fa-eye"></i>
                    VER DETALHES
                </button>
            </div>
        `;
        
        // Event listener para ver detalhes
        card.querySelector('.ver-detalhes-btn').addEventListener('click', () => {
            abrirModalDetalhes(item, alimentos);
        });
        
        list.appendChild(card);
    });
}

// Abrir modal com detalhes da refeição
function abrirModalDetalhes(refeicao, alimentos) {
    const modal = document.getElementById('modal-historico');
    const detalhes = document.getElementById('modal-detalhes-historico');
    
    detalhes.innerHTML = `
        <div class="modal-header">
            <h2>${refeicao.nome}</h2>
            <div class="modal-info">
                <span class="horario-modal">
                    <i class="fa-solid fa-clock"></i>
                    ${formatTime(refeicao.horario)}
                </span>
                <span class="data-modal">
                    <i class="fa-solid fa-calendar"></i>
                    ${formatDate(refeicao.data)}
                </span>
            </div>
        </div>
        
        <div class="modal-content-detalhes">
            <div class="calorias-total-modal">
                <div class="calorias-numero">${refeicao.total_calorias || 0}</div>
                <div class="calorias-texto">calorias totais</div>
            </div>
            
            <div class="alimentos-lista-modal">
                <h3>Alimentos consumidos:</h3>
                ${alimentos.length > 0 ? `
                    <ul class="alimentos-lista">
                        ${alimentos.map(alimento => `
                            <li class="alimento-item-modal">
                                <span class="alimento-nome">${alimento.nome}</span>
                                <span class="alimento-quantidade">${alimento.quantidade}</span>
                                <span class="alimento-calorias">${alimento.calorias} kcal</span>
                            </li>
                        `).join('')}
                    </ul>
                ` : '<p class="sem-alimentos">Nenhum alimento registrado</p>'}
            </div>
        </div>
    `;
    
    // Fechar modal
    document.querySelector('.close-modal').onclick = () => modal.style.display = 'none';
    modal.style.display = 'flex';
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Botão voltar
    document.querySelector('.voltar-btn').onclick = () => {
        window.location.href = './index.html';
    };
    
    // Filtro por data
    const dataInput = document.getElementById('data-filtro');
    const filtrarBtn = document.getElementById('filtrar-btn');
    
    // Definir data padrão como hoje
    dataInput.value = new Date().toISOString().slice(0, 10);
    
    filtrarBtn.onclick = () => {
        const dataSelecionada = dataInput.value;
        if (dataSelecionada) {
            carregarHistorico(dataSelecionada);
        }
    };
    
    // Carregar histórico inicial
    carregarHistorico();
});

// Fechar modal ao clicar fora
document.getElementById('modal-historico').addEventListener('click', function(e) {
    if (e.target === this) {
        this.style.display = 'none';
    }
});
