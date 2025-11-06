function getCurrentUser() {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
}

async function assertAdminOrRedirect() {
    const me = getCurrentUser();
    if (!me) { window.location.href = './login.html'; return false; }
    try {
        const res = await fetch(`http://localhost:3022/usuario/${me.id}`);
        const data = await res.json();
        if (!res.ok || data.role !== 'admin') {
            alert('Acesso restrito a administradores.');
            window.location.href = './index.html';
            return false;
        }
        return true;
    } catch (e) {
        console.error(e);
        alert('Erro ao validar acesso.');
        window.location.href = './index.html';
        return false;
    }
}

async function carregarUsuarios(filtro = '') {
    const me = getCurrentUser();
    const grid = document.getElementById('users-grid');
    grid.innerHTML = 'Carregando...';
    try {
        const res = await fetch(`http://localhost:3022/usuarios?admin_id=${me.id}`);
        const users = await res.json();
        let lista = Array.isArray(users) ? users : [];
        if (filtro) {
            const f = filtro.toLowerCase();
            lista = lista.filter(u => (u.nome||'').toLowerCase().includes(f) || (u.email||'').toLowerCase().includes(f));
        }
        grid.innerHTML = '';
        if (lista.length === 0) {
            grid.innerHTML = '<div style="color:#555;">Nenhum usuário encontrado.</div>';
            return;
        }
        lista.forEach(u => grid.appendChild(renderUsuarioItem(u)));
    } catch (e) {
        console.error('Erro ao carregar usuários:', e);
        grid.innerHTML = '<div style="color:#c00;">Erro ao carregar usuários.</div>';
    }
}

function renderUsuarioItem(u) {
    const item = document.createElement('div');
    item.style.padding = '12px';
    item.style.border = '1px solid #ddd';
    item.style.borderRadius = '10px';
    item.style.background = '#fff';
    item.style.display = 'flex';
    item.style.justifyContent = 'space-between';
    item.style.alignItems = 'center';
    item.innerHTML = `
        <div>
            <div style="font-weight:600;">${u.nome || 'Sem nome'}</div>
            <div style="font-size:12px; color:#666;">${u.email || '-'}</div>
        </div>
        <div style="display:flex; gap:12px; align-items:center;">
            <div style="font-size:12px; color:#333; text-align:right;">
                <div>Gênero: ${u.genero || '-'}</div>
                <div>Nasc.: ${u.data_nascimento ? u.data_nascimento.substring(0,10) : '-'}</div>
                <div>Função: <span style="font-weight:600;">${u.role}</span></div>
            </div>
            <button class="salvar-btn" style="padding:8px 12px;" data-id="${u.id}">Editar</button>
        </div>
    `;
    item.querySelector('button').addEventListener('click', () => abrirModalEditar(u));
    return item;
}

let usuarioEditando = null;

function abrirModalEditar(u) {
    usuarioEditando = u;
    document.getElementById('e_nome').value = u.nome || '';
    document.getElementById('e_email').value = u.email || '';
    document.getElementById('e_data').value = u.data_nascimento ? u.data_nascimento.substring(0,10) : '';
    document.getElementById('e_genero').value = u.genero || '';
    document.getElementById('e_role').value = u.role || 'user';
    document.getElementById('e_bio').value = u.bio || '';
    document.getElementById('modal-editar').style.display = 'flex';
}

function fecharModalEditar() {
    document.getElementById('modal-editar').style.display = 'none';
    usuarioEditando = null;
}

async function salvarEdicao() {
    if (!usuarioEditando) return;
    const payload = {
        nome: document.getElementById('e_nome').value,
        email: document.getElementById('e_email').value,
        data_nascimento: document.getElementById('e_data').value || null,
        genero: document.getElementById('e_genero').value || null,
        role: document.getElementById('e_role').value,
        bio: document.getElementById('e_bio').value
    };
    try {
        const res = await fetch(`http://localhost:3022/usuario/${usuarioEditando.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) {
            alert('Erro ao salvar: ' + (data.error || 'Erro desconhecido'));
            return;
        }
        fecharModalEditar();
        carregarUsuarios(document.getElementById('busca').value.trim());
    } catch (e) {
        console.error('Erro ao salvar edição:', e);
        alert('Erro ao conectar ao servidor.');
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    document.getElementById('voltar-index').addEventListener('click', () => {
        window.location.href = './index.html';
    });
    document.getElementById('btn-cancelar').addEventListener('click', fecharModalEditar);
    document.getElementById('modal-editar').addEventListener('click', (e) => {
        if (e.target.id === 'modal-editar') fecharModalEditar();
    });
    document.getElementById('btn-salvar').addEventListener('click', (e) => {
        e.preventDefault();
        salvarEdicao();
    });
    document.getElementById('busca').addEventListener('input', (e) => {
        carregarUsuarios(e.target.value.trim());
    });

    const ok = await assertAdminOrRedirect();
    if (!ok) return;
    carregarUsuarios();
});


