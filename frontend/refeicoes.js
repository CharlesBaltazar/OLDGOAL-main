// Funções utilitárias
function getUserId() {
    const user = JSON.parse(localStorage.getItem('user'));
    return user ? user.id : null;
}

function getToday() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
}

// Carregar refeições do usuário
async function carregarRefeicoes() {
    const usuario_id = getUserId();
    if (!usuario_id) {
        console.log('Usuário não logado:', localStorage.getItem('user'));
        return;
    }
    const res = await fetch(`http://localhost:3022/refeicoes?usuario_id=${usuario_id}`);
    const refeicoes = await res.json();
    
    const list = document.getElementById('refeicoes-list');
    list.innerHTML = '';
    if (refeicoes.length === 0) {
        list.innerHTML = '<div style="color:#0F87BA; text-align:center; margin-top:30px;">Nenhuma refeição cadastrada para este usuário.</div>';
        return;
    }
    for (const ref of refeicoes) {
        // Os alimentos agora vêm diretamente da refeição
        const alimentos = ref.alimentos || [];
        const totalCal = ref.total_calorias || 0;
        
        // Buscar se concluída
        const concluidaRes = await fetch(`http://localhost:3022/refeicao_usuario?usuario_id=${usuario_id}&refeicao_id=${ref.id}&data=${getToday()}`);
        const concluidaData = await concluidaRes.json();
        const concluida = concluidaData.concluida === 1;
        
        // Montar card visual amigável
        const card = document.createElement('div');
        card.className = 'refeicao-card';
        card.innerHTML = `
            <div class="refeicao-info">
                <div class="refeicao-nome">${ref.nome}</div>
                <div class="refeicao-horario">${ref.horario.slice(0,5)}</div>
                <div class="refeicao-calorias">${totalCal}Kcal</div>
                <div class="refeicao-alimentos-list">
                    ${alimentos.length > 0 ? alimentos.map(a => `<div class='alimento-list-item'>${a.nome} <span style='color:#0F87BA99;'>${a.quantidade}</span> <span style='color:#0F87BA99;'>${a.calorias}Kcal</span></div>`).join('') : '<span style="color:#0F87BA99;">Nenhum alimento cadastrado</span>'}
                </div>
            </div>
            <img class="refeicao-icone" src="./assets/${ref.icone || 'icone1.png'}" alt="icone">
            <div class="refeicao-actions">
                <label>Concluir Refeição <input type="checkbox" class="concluir-checkbox" ${concluida ? 'checked' : ''}></label>
            </div>
        `;
        // Checkbox handler
        card.querySelector('.concluir-checkbox').addEventListener('change', async (e) => {
            try {
                const response = await fetch('http://localhost:3022/refeicao_usuario', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        usuario_id,
                        refeicao_id: ref.id,
                        data: getToday(),
                        concluida: e.target.checked ? 1 : 0
                    })
                });
                
                if (response.ok) {
                    await atualizarCaloriasDia();
                    // Atualizar localStorage para sincronizar com a página principal
                    const caloriasAtuais = localStorage.getItem('calorias_dia') || '0';
                    localStorage.setItem('calorias_dia', caloriasAtuais);
                } else {
                    console.error('Erro ao marcar refeição como concluída');
                    // Reverter o checkbox se houve erro
                    e.target.checked = !e.target.checked;
                }
            } catch (error) {
                console.error('Erro ao marcar refeição:', error);
                // Reverter o checkbox se houve erro
                e.target.checked = !e.target.checked;
            }
        });
        // Abrir modal ao clicar no card (exceto no checkbox)
        card.addEventListener('click', function(e) {
            if (e.target.classList.contains('concluir-checkbox')) return;
            abrirModalRefeicao(ref, alimentos);
        });
        list.appendChild(card);
    }
    atualizarCaloriasDia();
}

// Modal de detalhes/edição de refeição
function abrirModalRefeicao(ref, alimentos) {
    const modal = document.getElementById('modal-refeicao');
    const detalhes = document.getElementById('modal-detalhes');
    detalhes.innerHTML = `
        <h2>${ref.nome} <span style="font-size:18px; color:#0F87BA;">(${ref.horario.slice(0,5)})</span></h2>
        <img class="refeicao-icone" src="./assets/${ref.icone || 'icone1.png'}" alt="icone" style="margin-bottom:10px;">
        <ul>
            ${alimentos.map((a, index) => `<li>${a.nome} (${a.quantidade}) - ${a.calorias}Kcal <button class='delete-btn' data-index='${index}'>Remover</button></li>`).join('')}
        </ul>
        <button class='delete-refeicao-btn'>Excluir Refeição</button>
    `;
    // Remover alimento
    detalhes.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = async function() {
            const index = parseInt(btn.dataset.index);
            const novosAlimentos = alimentos.filter((_, i) => i !== index);
            
            await fetch(`http://localhost:3022/refeicoes/${ref.id}/alimentos`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ alimentos: novosAlimentos })
            });
            modal.style.display = 'none';
            carregarRefeicoes();
        };
    });
    // Excluir refeição
    detalhes.querySelector('.delete-refeicao-btn').onclick = async function() {
        if (confirm('Tem certeza que deseja excluir esta refeição?')) {
            await fetch(`http://localhost:3022/refeicoes/${ref.id}`, { method: 'DELETE' });
            modal.style.display = 'none';
            carregarRefeicoes();
        }
    };
    // Fechar modal
    document.querySelector('.close-modal').onclick = () => modal.style.display = 'none';
    modal.style.display = 'flex';
}

// Atualizar calorias totais do dia
async function atualizarCaloriasDia() {
    const usuario_id = getUserId();
    if (!usuario_id) return;
    
    try {
        const res = await fetch(`http://localhost:3022/calorias_dia?usuario_id=${usuario_id}&data=${getToday()}`);
        const data = await res.json();
        const totalCalorias = data.total_calorias || 0;
        localStorage.setItem('calorias_dia', totalCalorias);
        
        // Se estivermos na página principal, atualizar a exibição
        if (window.location.pathname.includes('index.html')) {
            const calorieElement = document.querySelector('.calorie-value');
            if (calorieElement) {
                calorieElement.textContent = totalCalorias.toString().padStart(4, '0');
            }
        }
    } catch (error) {
        console.error('Erro ao atualizar calorias do dia:', error);
    }
}

// Navegação
window.onload = () => {
    document.querySelector('.montar-btn').onclick = () => window.location.href = './montar_refeicao.html';
    document.querySelector('.voltar-btn').onclick = () => {
        // Atualizar calorias antes de voltar
        atualizarCaloriasDia();
        window.location.href = './index.html';
    };
    document.querySelector('.finalizar-btn').onclick = () => {
        alert('Dia finalizado! Calorias consumidas: ' + (localStorage.getItem('calorias_dia') || '0') + ' kcal');
    };
    
    // Se refeicao_criada, recarregar lista e remover flag
    if (localStorage.getItem('refeicao_criada')) {
        localStorage.removeItem('refeicao_criada');
        carregarRefeicoes();
    } else {
        carregarRefeicoes();
    }
}; 