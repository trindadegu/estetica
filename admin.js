// ========================================
// ADMIN.JS - VERSÃO CORRIGIDA E COMPLETA
// ========================================

// 1. SEGURANÇA
const SENHA_CORRETA = "admin123";
let tentativas = 0;
const MAX_TENTATIVAS = 3;

function verificarSenha() {
    if (sessionStorage.getItem('adminLogado') === 'true') return true;

    if (tentativas >= MAX_TENTATIVAS) {
        alert("Muitas tentativas erradas. Redirecionando...");
        window.location.href = "index.html";
        return false;
    }
    
    const senhaDigitada = prompt(`Digite a senha de administrador:`);
    
    if (!senhaDigitada) {
        window.location.href = "index.html";
        return false;
    }
    
    if (senhaDigitada === SENHA_CORRETA) {
        sessionStorage.setItem('adminLogado', 'true');
        return true;
    } else {
        tentativas++;
        alert("Senha incorreta!");
        return verificarSenha();
    }
}

if (!verificarSenha()) {
    throw new Error("Acesso negado");
}

// 2. CONFIGURAÇÃO SUPABASE
const SUPABASE_CONFIG = {
    url: 'https://cpoeojhomshckphfxynp.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwb2VvamhvbXNoY2twaGZ4eW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MDg4NzEsImV4cCI6MjA4MTM4NDg3MX0.RoKgWkMmaOZ142ugdn4EeqclgZpDrhKdTneWcj0Dul4'
};

const supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);

// Variável global para armazenar os dados originais
let todosAgendamentos = [];

// ========================================
// LÓGICA DO ADMIN
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Painel Admin carregado');
    carregarAgendamentos();

    // Event Listeners para botões
    document.getElementById('btn-atualizar').addEventListener('click', carregarAgendamentos);
    document.getElementById('btn-logout').addEventListener('click', () => {
        sessionStorage.removeItem('adminLogado');
        window.location.href = 'index.html';
    });

    // Event Listeners para filtros
    document.getElementById('filtro-data').addEventListener('change', aplicarFiltros);
    document.getElementById('filtro-servico').addEventListener('change', aplicarFiltros);
});

async function carregarAgendamentos() {
    const tbody = document.getElementById('lista-corpo');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Carregando...</td></tr>';

    try {
        const { data, error } = await supabaseClient
            .from('agendamentos')
            .select('*')
            .order('data', { ascending: false })
            .order('horario', { ascending: false });

        if (error) throw error;

        todosAgendamentos = data || [];
        
        console.log('📊 Total de agendamentos:', todosAgendamentos.length);
        
        // Popula o select de serviços
        popularFiltroServicos(todosAgendamentos);
        
        document.getElementById('total-records').textContent = todosAgendamentos.length;
        updateTime();
        
        // Renderiza a tabela inicial
        aplicarFiltros();

    } catch (e) {
        console.error('❌ Erro ao carregar:', e);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Erro ao carregar dados: ' + e.message + '</td></tr>';
    }
}

// Função para preencher o dropdown de serviços dinamicamente
function popularFiltroServicos(dados) {
    const select = document.getElementById('filtro-servico');
    const servicosUnicos = [...new Set(dados.map(item => item.servico))].sort();
    const valorAtual = select.value;

    // Mantém a primeira opção "Todos" e adiciona o resto
    select.innerHTML = '<option value="">Todos os serviços</option>';
    
    servicosUnicos.forEach(servico => {
        const option = document.createElement('option');
        option.value = servico;
        option.textContent = servico;
        select.appendChild(option);
    });

    // Tenta restaurar a seleção anterior se ainda existir
    if (servicosUnicos.includes(valorAtual)) {
        select.value = valorAtual;
    }
}

function aplicarFiltros() {
    const dataFiltro = document.getElementById('filtro-data').value;
    const servicoFiltro = document.getElementById('filtro-servico').value;
    
    const dadosFiltrados = todosAgendamentos.filter(ag => {
        const matchData = dataFiltro ? ag.data === dataFiltro : true;
        const matchServico = servicoFiltro ? ag.servico === servicoFiltro : true;
        return matchData && matchServico;
    });

    renderizarTabela(dadosFiltrados);
}

function renderizarTabela(dados) {
    const tbody = document.getElementById('lista-corpo');
    const contadorFiltrado = document.getElementById('contador-filtrado');
    
    tbody.innerHTML = '';
    contadorFiltrado.textContent = dados.length;

    if (dados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 30px; color: #999;">Nenhum agendamento encontrado com esses filtros.</td></tr>';
        return;
    }

    dados.forEach(ag => {
        const dataObj = new Date(ag.data + 'T00:00:00');
        const dataF = dataObj.toLocaleDateString('pt-BR');
        
        // Formatar telefone para o link do WhatsApp (apenas números)
        const telefoneLimpo = ag.telefone.replace(/\D/g, '');
        const linkWhatsapp = `https://wa.me/55${telefoneLimpo}`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td data-label="Nome"><strong>${ag.nome}</strong></td>
            <td data-label="Serviço">${ag.servico}</td>
            <td data-label="Contato">
                ${ag.telefone}
                <a href="${linkWhatsapp}" target="_blank" class="btn-whatsapp" title="Abrir WhatsApp">
                    <i class="fab fa-whatsapp"></i>
                </a>
            </td>
            <td data-label="Data/Hora">${dataF} às ${ag.horario}</td>
            <td data-label="Ações">
                <button class="btn-delete" onclick="deletarAgendamento(${ag.id})">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Função Global para o botão onclick funcionar
window.deletarAgendamento = async function(id) {
    if (confirm('Tem certeza que deseja excluir este agendamento?')) {
        try {
            const { error } = await supabaseClient
                .from('agendamentos')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            
            alert('✅ Agendamento excluído com sucesso!');
            carregarAgendamentos(); // Recarrega tudo
        } catch (e) {
            console.error('❌ Erro ao excluir:', e);
            alert('❌ Erro ao excluir: ' + e.message);
        }
    }
}

function updateTime() {
    const now = new Date();
    document.getElementById('current-time').textContent = now.toLocaleTimeString('pt-BR');
}