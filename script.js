// ======================================================
// SCRIPT.JS - VERSÃO COMPLETA COM TODAS AS FUNCIONALIDADES
// ======================================================

console.log('🚀 Script carregado. Aguardando página...');

const HORARIOS = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
let supabaseClient;

// Configuração Supabase
const SUPABASE_URL = 'https://cpoeojhomshckphfxynp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwb2VvamhvbXNoY2twaGZ4eW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MDg4NzEsImV4cCI6MjA4MTM4NDg3MX0.RoKgWkMmaOZ142ugdn4EeqclgZpDrhKdTneWcj0Dul4';

// Número do WhatsApp da empresa
const WHATSAPP_EMPRESA = '5511967651240';

document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Página pronta.');
    
    // 1. Conecta ao Supabase
    try {
        if (!window.supabase) {
            throw new Error("Supabase JS não carregou. Verifique se o script CDN está no HTML.");
        }
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('✅ Supabase conectado:', supabaseClient);
        
        // Teste de conexão
        testarConexao();
    } catch (erro) {
        console.error('❌ Erro de conexão:', erro);
        alert("Erro de conexão com o sistema. Verifique o console (F12).");
        return;
    }

    // 2. Inicia sistema de agendamento
    iniciarSistemaAgendamento();

    // 3. Configurar botões dos cards de serviço
    configurarBotoesServico();

    // 4. Inicia Menu/Carrossel
    iniciarMenuECarrossel();
    
    // 5. Verificar se há serviço pré-selecionado na URL
    verificarServicoNaURL();
});

// Teste de conexão com o banco
async function testarConexao() {
    try {
        console.log('🔍 Testando conexão com Supabase...');
        const { data, error } = await supabaseClient
            .from('agendamentos')
            .select('count');
        
        if (error) {
            console.error('❌ Erro no teste de conexão:', error);
        } else {
            console.log('✅ Conexão OK! Tabela agendamentos acessível.');
        }
    } catch (e) {
        console.error('❌ Erro no teste:', e);
    }
}

// ========================================
// CONFIGURAR BOTÕES DOS CARDS DE SERVIÇO
// ========================================

function configurarBotoesServico() {
    const botoesAgendar = document.querySelectorAll('.btn-servico');
    
    botoesAgendar.forEach(botao => {
        botao.addEventListener('click', function(e) {
            e.preventDefault();
            
            const card = this.closest('.servico-card');
            const nomeServico = card.querySelector('.servico-content h4').textContent.trim();
            
            console.log('🎯 Serviço selecionado:', nomeServico);
            
            localStorage.setItem('servicoSelecionado', nomeServico);
            
            const secaoAgendamento = document.getElementById('agendamento');
            secaoAgendamento.scrollIntoView({ behavior: 'smooth' });
            
            setTimeout(() => {
                const selectServico = document.getElementById('service');
                if (selectServico) {
                    const opcoes = selectServico.options;
                    for (let i = 0; i < opcoes.length; i++) {
                        if (opcoes[i].value.includes(nomeServico) || opcoes[i].text.includes(nomeServico)) {
                            selectServico.selectedIndex = i;
                            selectServico.dispatchEvent(new Event('change'));
                            console.log('✅ Serviço selecionado automaticamente no formulário');
                            break;
                        }
                    }
                }
            }, 500);
        });
    });
    
    console.log('✅ Botões de serviço configurados:', botoesAgendar.length);
}

function verificarServicoNaURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const servicoURL = urlParams.get('servico');
    
    if (servicoURL) {
        localStorage.setItem('servicoSelecionado', servicoURL);
        
        setTimeout(() => {
            const selectServico = document.getElementById('service');
            if (selectServico) {
                const opcoes = selectServico.options;
                for (let i = 0; i < opcoes.length; i++) {
                    if (opcoes[i].value.includes(servicoURL)) {
                        selectServico.selectedIndex = i;
                        selectServico.dispatchEvent(new Event('change'));
                        break;
                    }
                }
            }
        }, 500);
    }
}

// ========================================
// SISTEMA DE AGENDAMENTO COMPLETO
// ========================================

function iniciarSistemaAgendamento() {
    const inputData = document.getElementById('date');
    const inputHorario = document.getElementById('time');
    const inputTelefone = document.getElementById('phone');
    const form = document.getElementById('contactForm');
    const selectServico = document.getElementById('service');
    const priceDisplay = document.getElementById('price-display');

    console.log('📋 Elementos do formulário:', {
        inputData: !!inputData,
        inputHorario: !!inputHorario,
        inputTelefone: !!inputTelefone,
        form: !!form,
        selectServico: !!selectServico
    });

    if (inputTelefone) {
        inputTelefone.addEventListener('input', function(e) {
            let valor = e.target.value.replace(/\D/g, '');
            
            if (valor.length <= 11) {
                valor = valor.replace(/^(\d{2})(\d)/g, '($1) $2');
                valor = valor.replace(/(\d)(\d{4})$/, '$1-$2');
            }
            
            e.target.value = valor;
        });
        console.log('✅ Máscara de telefone ativada');
    }

    if (selectServico && priceDisplay) {
        selectServico.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            const price = selectedOption.getAttribute('data-price');
            
            if (price && price !== 'consulta') {
                priceDisplay.innerHTML = `💰 Valor: <strong>R$ ${price}</strong>`;
            } else if (price === 'consulta') {
                priceDisplay.innerHTML = `📞 Entre em contato para consultar valores`;
            } else {
                priceDisplay.innerHTML = '';
            }
        });
        console.log('✅ Exibição de preços ativada');
    }

    if (inputData) {
        const hoje = new Date().toISOString().split('T')[0];
        inputData.setAttribute('min', hoje);
        
        inputData.addEventListener('change', function() {
            const dataSelecionada = this.value;
            console.log('📅 Data selecionada:', dataSelecionada);
            if (dataSelecionada) {
                carregarHorariosDisponiveis(dataSelecionada);
            }
        });
        console.log('✅ Campo de data configurado (min:', hoje, ')');
    }

    if (form) {
        form.addEventListener('submit', enviarAgendamento);
        console.log('✅ Formulário de agendamento vinculado');
    }
}

// Carregar horários disponíveis para uma data
async function carregarHorariosDisponiveis(dataSelecionada) {
    const selectHorario = document.getElementById('time');
    
    if (!selectHorario) {
        console.error('❌ Select de horário não encontrado!');
        return;
    }

    selectHorario.disabled = false;
    selectHorario.innerHTML = '<option value="">⏳ Carregando horários...</option>';

    try {
        console.log('🔍 Buscando horários para:', dataSelecionada);

        const dataObj = new Date(dataSelecionada + 'T00:00:00');
        const diaSemana = dataObj.getDay();
        
        // Verifica dias de funcionamento: 0=Dom, 1=Seg -> Fechado
        if (diaSemana === 0 || diaSemana === 1) {
            const diaExtenso = diaSemana === 0 ? 'domingos' : 'segundas-feiras';
            selectHorario.innerHTML = `<option value="">🚫 Fechado às ${diaExtenso}</option>`;
            selectHorario.disabled = true;
            console.log(`⚠️ Dia selecionado (${diaExtenso}) - fechado`);
            return;
        }

        // Busca horários já agendados
        const { data: agendamentos, error } = await supabaseClient
            .from('agendamentos')
            .select('horario')
            .eq('data', dataSelecionada);

        if (error) {
            console.error('❌ Erro ao buscar agendamentos:', error);
            throw error;
        }

        console.log('📊 Agendamentos encontrados:', agendamentos);

        const horariosOcupados = (agendamentos || []).map(item => item.horario);
        console.log('🔒 Horários ocupados:', horariosOcupados);

        selectHorario.innerHTML = '<option value="">Selecione um horário</option>';

        let temDisponivel = false;
        HORARIOS.forEach(hora => {
            if (!horariosOcupados.includes(hora)) {
                const option = document.createElement('option');
                option.value = hora;
                option.textContent = hora;
                selectHorario.appendChild(option);
                temDisponivel = true;
            }
        });

        if (!temDisponivel) {
            selectHorario.innerHTML = '<option value="">❌ Sem horários disponíveis</option>';
            selectHorario.disabled = true;
            console.log('⚠️ Nenhum horário disponível para esta data');
        } else {
            console.log('✅ Horários carregados com sucesso');
        }

    } catch (erro) {
        console.error('❌ Erro ao carregar horários:', erro);
        selectHorario.innerHTML = '<option value="">❌ Erro ao carregar. Tente novamente.</option>';
        selectHorario.disabled = true;
    }
}

// Enviar agendamento (igual ao original, sem alterações além do já existente)
async function enviarAgendamento(e) {
    e.preventDefault();
    
    console.log('📝 Iniciando processo de agendamento...');
    
    const nome = document.getElementById('name').value.trim();
    const telefone = document.getElementById('phone').value;
    const servico = document.getElementById('service').value;
    const data = document.getElementById('date').value;
    const horario = document.getElementById('time').value;
    const mensagem = document.getElementById('message') ? document.getElementById('message').value.trim() : '';

    console.log('📋 Dados do formulário:', {
        nome,
        telefone,
        servico,
        data,
        horario,
        mensagem
    });

    if (!nome || !telefone || !servico || !data || !horario) {
        alert("⚠️ Preencha todos os campos obrigatórios!");
        console.log('❌ Validação falhou - campos obrigatórios vazios');
        return;
    }

    const btnSubmit = e.target.querySelector('button[type="submit"]');
    const textoOriginal = btnSubmit.innerHTML;
    
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '⏳ Enviando...';

    try {
        console.log('🚀 Enviando para o Supabase...');
        
        const dadosAgendamento = {
            nome: nome,
            telefone: telefone,
            servico: servico,
            data: data,
            horario: horario
        };

        console.log('📦 Objeto a ser inserido:', dadosAgendamento);

        const { data: resultado, error } = await supabaseClient
            .from('agendamentos')
            .insert([dadosAgendamento])
            .select();

        console.log('📡 Resposta do Supabase:', { resultado, error });

        if (error) {
            console.error('❌ Erro do Supabase:', error);
            throw error;
        }

        console.log('✅ Agendamento inserido com sucesso!', resultado);

        const dataFormatada = new Date(data + 'T00:00:00').toLocaleDateString('pt-BR');

        localStorage.removeItem('servicoSelecionado');

        const mensagemWhatsApp = `Olá! Acabei de agendar:\n\n` +
            `👤 Nome: ${nome}\n` +
            `📅 Data: ${dataFormatada}\n` +
            `⏰ Horário: ${horario}\n` +
            `💆 Serviço: ${servico}\n\n` +
            `Aguardo a confirmação! 😊`;

        const mensagemCodificada = encodeURIComponent(mensagemWhatsApp);
        const linkWhatsApp = `https://wa.me/${WHATSAPP_EMPRESA}?text=${mensagemCodificada}`;

        console.log('📱 Redirecionando para WhatsApp...');

        alert(`✅ Agendamento confirmado!\n\n📅 Data: ${dataFormatada}\n⏰ Horário: ${horario}\n💆 Serviço: ${servico}\n\nVocê será redirecionado para o WhatsApp para confirmar!`);
        
        window.open(linkWhatsApp, '_blank');
        
        setTimeout(() => {
            window.location.reload();
        }, 2000);

    } catch (erro) {
        console.error('❌ Erro completo:', erro);
        console.error('❌ Detalhes do erro:', {
            message: erro.message,
            details: erro.details,
            hint: erro.hint,
            code: erro.code
        });
        
        let mensagemErro = "❌ Erro ao realizar agendamento.";
        
        if (erro.code === '23505') {
            mensagemErro = "❌ Este horário já foi agendado! Por favor, escolha outro horário.";
        } else if (erro.message) {
            mensagemErro = `❌ Erro: ${erro.message}`;
        }
        
        alert(mensagemErro + "\n\nPor favor, tente novamente ou entre em contato pelo WhatsApp.");
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = textoOriginal;
    }
}

// ========================================
// MENU MOBILE E CARROSSEL (inalterados)
// ========================================

function iniciarMenuECarrossel() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            hamburger.classList.toggle('active');
        });

        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
            });
        });
        console.log('✅ Menu mobile configurado');
    }

    iniciarCarrossel();
}

function iniciarCarrossel() {
    const slides = document.querySelectorAll('.carrossel-slide');
    const btnPrev = document.querySelector('.carrossel-prev');
    const btnNext = document.querySelector('.carrossel-next');
    
    if (!slides.length) {
        console.log('⚠️ Nenhum slide de carrossel encontrado');
        return;
    }

    let currentSlide = 0;

    function mostrarSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        slides[index].classList.add('active');
    }

    function proximoSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        mostrarSlide(currentSlide);
    }

    function slideAnterior() {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        mostrarSlide(currentSlide);
    }

    if (btnNext) {
        btnNext.addEventListener('click', proximoSlide);
    }

    if (btnPrev) {
        btnPrev.addEventListener('click', slideAnterior);
    }

    setInterval(proximoSlide, 5000);
    mostrarSlide(0);

    console.log('✅ Carrossel iniciado com', slides.length, 'slides');
}

window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');
        const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);

        if (navLink && scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
            navLink.classList.add('active');
        }
    });
});

console.log('✅ Script completamente inicializado!');