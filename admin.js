// ========================================
// 1. SEGURANÇA SIMPLES - SENHA FIXA
// ========================================
const SENHA_CORRETA = "admin123"; // SENHA FÁCIL
let tentativas = 0;
const MAX_TENTATIVAS = 3;

function verificarSenha() {
    if (tentativas >= MAX_TENTATIVAS) {
        alert("Muitas tentativas erradas. Redirecionando...");
        window.location.href = "index.html";
        return false;
    }
    
    const senhaDigitada = prompt(`Digite a senha de administrador (Tentativa ${tentativas + 1}/${MAX_TENTATIVAS}):`);
    
    if (!senhaDigitada) {
        window.location.href = "index.html";
        return false;
    }
    
    // COMPARAÇÃO DIRETA - SEM HASH
    if (senhaDigitada === SENHA_CORRETA) {
        return true;
    } else {
        tentativas++;
        alert("Senha incorreta!");
        return verificarSenha();
    }
}

// Verificar senha ao carregar
if (!verificarSenha()) {
    window.location.href = "index.html";
}

// ========================================
// 2. CONFIGURAÇÃO SUPABASE
// ========================================
const SUPABASE_URL = 'https://cpoeojhomshckphfxynp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwb2VvamhvbXNoY2twaGZ4eW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MDg4NzEsImV4cCI6MjA4MTM4NDg3MX0.RoKgWkMmaOZ142ugdn4EeqclgZpDrhKdTneWcj0Dul4';

let supabase;
try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log("✅ Admin: Supabase conectado!");
} catch (err) {
    console.error("❌ Admin: Erro ao conectar Supabase:", err);
    document.body.innerHTML = '<div style="padding: 20px; color: red;">Erro de conexão com o banco de dados.</div>';
}

// ========================================
// 3. LÓGICA DO PAINEL ADMIN
// ========================================
const listaCorpo = document.getElementById('lista-corpo');
const loading = document.getElementById('loading');
const tabela = document.getElementById('tabela-agendamentos');
const statsDiv = document.createElement('div'); // Para estatísticas

// Adicionar estatísticas ao header
const headerAdmin = document.querySelector('.header-admin');
if (headerAdmin) {
    statsDiv.className = 'admin-stats';
    headerAdmin.appendChild(statsDiv);
}

async function carregarAgenda() {
    try {
        loading.textContent = 'Carregando agendamentos...';
        
        // Buscar todos os agendamentos, ordenados por data
        const { data: agendamentos, error } = await supabase
            .from('agendamentos')
            .select('*')
            .order('data_agendamento', { ascending: false })
            .order('horario', { ascending: true });

        if (error) throw error;

        // Calcular estatísticas
        calcularEstatisticas(agendamentos);
        
        // Renderizar tabela
        renderizarTabela(agendamentos);

    } catch (err) {
        console.error('Erro ao carregar agenda:', err);
        loading.innerHTML = `<span style="color: red;">Erro: ${err.message}</span>`;
    }
}

function calcularEstatisticas(agendamentos) {
    if (!agendamentos || agendamentos.length === 0) {
        statsDiv.innerHTML = '<small>Nenhum agendamento</small>';
        return;
    }
    
    const hoje = new Date().toISOString().split('T')[0];
    
    // Agendamentos de hoje
    const hojeCount = agendamentos.filter(a => a.data_agendamento === hoje).length;
    
    // Agendamentos desta semana
    const umaSemanaAtras = new Date();
    umaSemanaAtras.setDate(umaSemanaAtras.getDate() - 7);
    const semanaCount = agendamentos.filter(a => new Date(a.data_agendamento) >= umaSemanaAtras).length;
    
    // Serviços mais populares
    const servicosCount = {};
    agendamentos.forEach(a => {
        servicosCount[a.servico] = (servicosCount[a.servico] || 0) + 1;
    });
    const servicoMaisPopular = Object.entries(servicosCount).sort((a, b) => b[1] - a[1])[0];
    
    statsDiv.innerHTML = `
        <div style="display: flex; gap: 15px; font-size: 0.9rem; color: #666;">
            <span>📅 Hoje: <strong>${hojeCount}</strong></span>
            <span>📊 Semana: <strong>${semanaCount}</strong></span>
            <span>⭐ Popular: <strong>${servicoMaisPopular ? servicoMaisPopular[0] : '-'}</strong></span>
            <span>👥 Total: <strong>${agendamentos.length}</strong></span>
        </div>
    `;
}

function renderizarTabela(agendamentos) {
    loading.style.display = 'none';
    tabela.style.display = 'table';
    listaCorpo.innerHTML = '';

    if (!agendamentos || agendamentos.length === 0) {
        listaCorpo.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #666;">
                    📭 Nenhum agendamento encontrado
                </td>
            </tr>
        `;
        return;
    }

    // Agrupar por data
    const agendamentosPorData = {};
    agendamentos.forEach(agendamento => {
        const data = agendamento.data_agendamento;
        if (!agendamentosPorData[data]) {
            agendamentosPorData[data] = [];
        }
        agendamentosPorData[data].push(agendamento);
    });

    // Ordenar datas (mais recente primeiro)
    const datasOrdenadas = Object.keys(agendamentosPorData).sort((a, b) => new Date(b) - new Date(a));

    // Renderizar cada grupo
    datasOrdenadas.forEach((data, indexGrupo) => {
        const agendamentosDoDia = agendamentosPorData[data];
        const dataFormatada = formatarData(data);
        
        // Adicionar cabeçalho do grupo
        const headerRow = document.createElement('tr');
        headerRow.className = 'data-group-header';
        headerRow.innerHTML = `
            <td colspan="6" style="background-color: #f0f7ff; font-weight: bold; padding: 10px;">
                📅 ${dataFormatada} (${agendamentosDoDia.length} agendamento${agendamentosDoDia.length > 1 ? 's' : ''})
            </td>
        `;
        listaCorpo.appendChild(headerRow);
        
        // Adicionar cada agendamento do dia
        agendamentosDoDia.forEach((agendamento, index) => {
            const tr = document.createElement('tr');
            tr.className = index % 2 === 0 ? 'even' : 'odd';
            
            // Formatar telefone
            const telefoneFormatado = formatarTelefone(agendamento.telefone);
            const zapLink = `https://wa.me/55${agendamento.telefone.replace(/\D/g, '')}`;
            
            // Status (passado/futuro)
            const hoje = new Date().toISOString().split('T')[0];
            const isPassado = new Date(agendamento.data_agendamento) < new Date(hoje);
            const statusClass = isPassado ? 'status-passado' : 'status-futuro';
            const statusText = isPassado ? 'Realizado' : 'Agendado';
            
            tr.innerHTML = `
                <td data-label="Horário">
                    <strong>${agendamento.horario}</strong>
                    <br><small class="${statusClass}">${statusText}</small>
                </td>
                <td data-label="Cliente">
                    <strong>${agendamento.nome}</strong>
                    ${agendamento.mensagem ? `<br><small title="${agendamento.mensagem}">📝 Obs</small>` : ''}
                </td>
                <td data-label="Serviço">${agendamento.servico}</td>
                <td data-label="Contato">
                    <a href="${zapLink}" target="_blank" class="btn-zap" title="Abrir WhatsApp">
                        <i class="fab fa-whatsapp"></i> ${telefoneFormatado}
                    </a>
                </td>
                <td data-label="Data">${formatarData(agendamento.data_agendamento)}</td>
                <td data-label="Ações">
                    <button class="btn-delete" onclick="deletarAgendamento(${agendamento.id}, '${agendamento.nome}')" title="Excluir agendamento">
                        🗑️ Excluir
                    </button>
                    ${!isPassado ? `
                    <button class="btn-reminder" onclick="enviarLembrete(${agendamento.id}, '${agendamento.telefone}', '${agendamento.data_agendamento}', '${agendamento.horario}')" title="Enviar lembrete">
                        🔔 Lembrete
                    </button>
                    ` : ''}
                </td>
            `;
            listaCorpo.appendChild(tr);
        });
    });
}

// Funções auxiliares
function formatarData(dataString) {
    const [ano, mes, dia] = dataString.split('-');
    return `${dia}/${mes}/${ano}`;
}

function formatarTelefone(telefone) {
    const nums = telefone.replace(/\D/g, '');
    if (nums.length === 11) {
        return `(${nums.substring(0, 2)}) ${nums.substring(2, 7)}-${nums.substring(7)}`;
    } else if (nums.length === 10) {
        return `(${nums.substring(0, 2)}) ${nums.substring(2, 6)}-${nums.substring(6)}`;
    }
    return telefone;
}

// ========================================
// 4. FUNÇÕES GLOBAIS (disponíveis no window)
// ========================================
window.deletarAgendamento = async function(id, nome) {
    if (!confirm(`Tem certeza que deseja excluir o agendamento de ${nome}?`)) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('agendamentos')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
        
        // Feedback visual
        showNotification(`✅ Agendamento de ${nome} excluído com sucesso!`, 'success');
        
        // Recarregar lista
        setTimeout(() => carregarAgenda(), 500);
        
    } catch (err) {
        console.error('Erro ao excluir:', err);
        showNotification(`❌ Erro ao excluir: ${err.message}`, 'error');
    }
}

window.enviarLembrete = function(id, telefone, data, hora) {
    const dataBr = formatarData(data);
    const mensagem = `🔔 Lembrete: Seu agendamento na Vida Espaço Estética é amanhã (${dataBr}) às ${hora}. Confirmar presença?`;
    
    const zapLink = `https://wa.me/55${telefone.replace(/\D/g, '')}?text=${encodeURIComponent(mensagem)}`;
    
    if (confirm(`Enviar lembrete para este cliente?\n\nData: ${dataBr}\nHora: ${hora}\n\nA mensagem será enviada via WhatsApp.`)) {
        window.open(zapLink, '_blank');
        showNotification('✅ Lembrete enviado via WhatsApp!', 'success');
    }
}

// ========================================
// 5. FUNÇÕES DE NOTIFICAÇÃO
// ========================================
function showNotification(mensagem, tipo = 'info') {
    // Remover notificação anterior
    const notifAnterior = document.querySelector('.admin-notification');
    if (notifAnterior) notifAnterior.remove();
    
    // Criar nova notificação
    const notificacao = document.createElement('div');
    notificacao.className = `admin-notification ${tipo}`;
    notificacao.innerHTML = `
        <span>${mensagem}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    
    // Estilos
    notificacao.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-width: 300px;
        max-width: 500px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    // Cores por tipo
    if (tipo === 'success') {
        notificacao.style.backgroundColor = '#28a745';
    } else if (tipo === 'error') {
        notificacao.style.backgroundColor = '#dc3545';
    } else {
        notificacao.style.backgroundColor = '#17a2b8';
    }
    
    // Botão fechar
    const btnFechar = notificacao.querySelector('button');
    btnFechar.style.cssText = `
        background: transparent;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        margin-left: 15px;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background 0.2s;
    `;
    btnFechar.onmouseover = function() {
        this.style.backgroundColor = 'rgba(255,255,255,0.2)';
    };
    btnFechar.onmouseout = function() {
        this.style.backgroundColor = 'transparent';
    };
    
    // Animação CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeOut {
            to { opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notificacao);
    
    // Auto-remover após 5 segundos
    setTimeout(() => {
        if (notificacao.parentElement) {
            notificacao.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => notificacao.remove(), 300);
        }
    }, 5000);
}

// ========================================
// 6. FILTROS E BUSCA (EXTRA)
// ========================================
function adicionarFiltros() {
    const filtrosHTML = `
        <div style="margin-bottom: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
            <input type="date" id="filter-date" placeholder="Filtrar por data" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            <input type="text" id="filter-name" placeholder="Buscar por nome" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px; flex: 1;">
            <select id="filter-service" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                <option value="">Todos os serviços</option>
                <option value="Limpeza de Pele">Limpeza de Pele</option>
                <option value="Massagem Relaxante">Massagem Relaxante</option>
                <option value="Drenagem Linfática">Drenagem Linfática</option>
                <option value="Endermoterapia">Endermoterapia</option>
                <option value="Peeling de Diamante">Peeling de Diamante</option>
                <option value="Depilação a Laser">Depilação a Laser</option>
                <option value="Remoção de Verrugas">Remoção de Verrugas</option>
                <option value="Spa dos Pés">Spa dos Pés</option>
                <option value="Protocolo de Emagrecimento">Protocolo de Emagrecimento</option>
            </select>
            <button onclick="aplicarFiltros()" style="padding: 8px 15px; background: var(--primary-dark); color: white; border: none; border-radius: 4px; cursor: pointer;">
                🔍 Filtrar
            </button>
            <button onclick="limparFiltros()" style="padding: 8px 15px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">
                🗑️ Limpar
            </button>
        </div>
    `;
    
    const container = document.querySelector('.admin-container');
    const tabela = document.getElementById('tabela-agendamentos');
    if (container && tabela) {
        tabela.insertAdjacentHTML('beforebegin', filtrosHTML);
    }
}

window.aplicarFiltros = function() {
    // Implementação básica de filtro
    const filtroData = document.getElementById('filter-date')?.value;
    const filtroNome = document.getElementById('filter-name')?.value.toLowerCase();
    const filtroServico = document.getElementById('filter-service')?.value;
    
    const linhas = document.querySelectorAll('#lista-corpo tr:not(.data-group-header)');
    
    linhas.forEach(linha => {
        const colunas = linha.querySelectorAll('td');
        const data = colunas[4]?.textContent.split(' ')[0];
        const nome = colunas[1]?.querySelector('strong')?.textContent.toLowerCase();
        const servico = colunas[2]?.textContent;
        
        let mostrar = true;
        
        if (filtroData && data !== formatarData(filtroData)) mostrar = false;
        if (filtroNome && (!nome || !nome.includes(filtroNome))) mostrar = false;
        if (filtroServico && servico !== filtroServico) mostrar = false;
        
        linha.style.display = mostrar ? '' : 'none';
    });
    
    // Também esconder cabeçalhos de grupo vazios
    document.querySelectorAll('.data-group-header').forEach(header => {
        const nextRow = header.nextElementSibling;
        if (!nextRow || nextRow.style.display === 'none') {
            header.style.display = 'none';
        } else {
            header.style.display = '';
        }
    });
}

window.limparFiltros = function() {
    document.getElementById('filter-date').value = '';
    document.getElementById('filter-name').value = '';
    document.getElementById('filter-service').value = '';
    
    document.querySelectorAll('#lista-corpo tr').forEach(tr => {
        tr.style.display = '';
    });
}

// ========================================
// 7. INICIALIZAÇÃO
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('👑 Painel Admin iniciado');
    
    // Adicionar botão de exportar
    const header = document.querySelector('.header-admin');
    if (header) {
        const btnExport = document.createElement('button');
        btnExport.innerHTML = '📥 Exportar CSV';
        btnExport.onclick = exportarCSV;
        btnExport.style.cssText = `
            padding: 8px 15px;
            background: #28a745;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-left: 10px;
        `;
        header.appendChild(btnExport);
    }
    
    // Carregar dados
    carregarAgenda();
    
    // Adicionar filtros
    adicionarFiltros();
    
    // Atualizar a cada 30 segundos
    setInterval(carregarAgenda, 30000);
});

// ========================================
// 8. EXPORTAÇÃO CSV
// ========================================
async function exportarCSV() {
    try {
        const { data: agendamentos, error } = await supabase
            .from('agendamentos')
            .select('*')
            .order('data_agendamento', { ascending: false });
            
        if (error) throw error;
        
        if (!agendamentos || agendamentos.length === 0) {
            showNotification('❌ Nenhum dado para exportar', 'error');
            return;
        }
        
        // Cabeçalhos
        const headers = ['Data', 'Horário', 'Nome', 'Telefone', 'Serviço', 'Mensagem', 'Criado em'];
        
        // Linhas
        const linhas = agendamentos.map(ag => [
            formatarData(ag.data_agendamento),
            ag.horario,
            `"${ag.nome.replace(/"/g, '""')}"`,
            ag.telefone,
            `"${ag.servico.replace(/"/g, '""')}"`,
            `"${(ag.mensagem || '').replace(/"/g, '""')}"`,
            new Date(ag.criado_em).toLocaleString('pt-BR')
        ]);
        
        // Criar CSV
        const csvContent = [
            headers.join(','),
            ...linhas.map(row => row.join(','))
        ].join('\n');
        
        // Baixar
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `agendamentos_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('✅ CSV exportado com sucesso!', 'success');
        
    } catch (err) {
        console.error('Erro ao exportar CSV:', err);
        showNotification(`❌ Erro ao exportar: ${err.message}`, 'error');
    }
}