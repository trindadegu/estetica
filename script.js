// ========================================
// 1. CONFIGURAÇÃO SUPABASE
// ========================================
const SUPABASE_URL = 'https://cpoeojhomshckphfxynp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwb2VvamhvbXNoY2twaGZ4eW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MDg4NzEsImV4cCI6MjA4MTM4NDg3MX0.RoKgWkMmaOZ142ugdn4EeqclgZpDrhKdTneWcj0Dul4';

// Variável global para o cliente Supabase
let supabase = null;

// Horários disponíveis
const HORARIOS_PADRAO = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

// ========================================
// 2. INICIALIZAÇÃO GERAL
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Site Vida Espaço Estética carregado. Iniciando scripts...');
    
    // Iniciar todos os componentes
    initCarrossel();
    initMenuHamburger();
    initNavbarScroll();
    initSmoothScroll();
    initMapFix();
    initImageFix();
    initCounters();
    initIntersectionObserver();
    
    // Iniciar Supabase
    initSupabase();
    
    // Configurar data mínima no formulário
    const dateInput = document.getElementById('date');
    if (dateInput) {
        const hoje = new Date();
        const hojeFormatado = hoje.toISOString().split('T')[0];
        dateInput.setAttribute('min', hojeFormatado);
        dateInput.value = hojeFormatado;
        
        // Iniciar sistema de agendamento após carregar a data
        setTimeout(() => {
            if (supabase) {
                initAgendamentoSystem();
            }
        }, 500);
    }
});
// ========================================
// MELHORIAS: PREÇOS NO AGENDAMENTO + CLICK NA IMAGEM
// ========================================

// 1. Mostrar preço quando selecionar serviço
function initPriceDisplay() {
    const serviceSelect = document.getElementById('service');
    const priceDisplay = document.getElementById('price-display');
    
    if (!serviceSelect || !priceDisplay) return;
    
    serviceSelect.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        const price = selectedOption.getAttribute('data-price');
        
        if (price === 'consulta') {
            priceDisplay.innerHTML = `
                <span style="color: var(--warning);">
                    <i class="fas fa-info-circle"></i> Valores variam conforme avaliação personalizada
                </span>
            `;
        } else if (price) {
            priceDisplay.innerHTML = `
                <span style="color: var(--success);">
                    <i class="fas fa-tag"></i> Valor: R$ ${parseFloat(price).toFixed(2).replace('.', ',')}
                </span>
            `;
        } else {
            priceDisplay.innerHTML = '';
        }
    });
}

// 2. Fazer as imagens dos serviços clicáveis (redirecionam para agendamento)
function initServiceImageClicks() {
    document.querySelectorAll('.servico-image').forEach(image => {
        image.addEventListener('click', function(e) {
            // Evitar conflito com outros cliques
            if (e.target.closest('.btn-service') || e.target.closest('.servico-overlay')) {
                return;
            }
            
            // Rolar suavemente até a seção de agendamento
            const agendamentoSection = document.getElementById('agendamento');
            if (agendamentoSection) {
                agendamentoSection.scrollIntoView({ behavior: 'smooth' });
                
                // Adicionar um pequeno destaque visual
                agendamentoSection.style.boxShadow = '0 0 0 3px var(--primary-light)';
                setTimeout(() => {
                    agendamentoSection.style.boxShadow = 'none';
                }, 1000);
            }
        });
    });
}

// 3. Pré-selecionar serviço quando clicar na imagem (opcional)
function initServicePreselect() {
    document.querySelectorAll('.servico-card').forEach(card => {
        const serviceName = card.querySelector('h4')?.textContent;
        const priceElement = card.querySelector('.servico-price');
        
        if (serviceName) {
            card.addEventListener('click', function(e) {
                // Não ativar se clicar nos botões
                if (e.target.closest('.btn-service') || e.target.closest('.servico-overlay')) {
                    return;
                }
                
                const serviceSelect = document.getElementById('service');
                if (!serviceSelect) return;
                
                // Encontrar a opção correspondente
                for (let option of serviceSelect.options) {
                    if (option.text.includes(serviceName)) {
                        serviceSelect.value = option.value;
                        
                        // Disparar evento change para mostrar preço
                        const event = new Event('change');
                        serviceSelect.dispatchEvent(event);
                        
                        // Feedback visual
                        serviceSelect.style.borderColor = 'var(--success)';
                        setTimeout(() => {
                            serviceSelect.style.borderColor = '';
                        }, 1000);
                        break;
                    }
                }
            });
        }
    });
}

// Inicializar tudo quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    // ... outros códigos existentes ...
    
    // Inicializar as novas funcionalidades
    setTimeout(() => {
        initPriceDisplay();
        initServiceImageClicks();
        initServicePreselect();
    }, 1000);
});

// ========================================
// 3. INICIALIZAR SUPABASE
// ========================================
function initSupabase() {
    try {
        // Verificar se a biblioteca já está carregada
        if (typeof supabase === 'undefined' && window.supabase) {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            console.log("✅ Supabase conectado com sucesso!");
            return true;
        } else if (window.supabase) {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            console.log("✅ Supabase conectado com sucesso!");
            return true;
        } else {
            console.warn("⚠️ Supabase não disponível. Carregando...");
            // Tentar carregar dinamicamente
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.onload = () => {
                supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
                console.log("✅ Supabase carregado dinamicamente!");
                setTimeout(() => initAgendamentoSystem(), 500);
            };
            document.head.appendChild(script);
            return false;
        }
    } catch (err) {
        console.error("❌ Erro ao inicializar Supabase:", err);
        return false;
    }
}

// ========================================
// 4. SISTEMA DE AGENDAMENTO (CORRIGIDO - SEM MENSAGEM)
// ========================================
function initAgendamentoSystem() {
    const dateInput = document.getElementById('date');
    const timeSelect = document.getElementById('time');
    const contactForm = document.getElementById('contactForm');

    if (!dateInput || !timeSelect || !contactForm) {
        console.error("❌ Elementos do formulário não encontrados.");
        return;
    }

    // Carregar horários ao carregar a página
    setTimeout(() => {
        if (dateInput.value) {
            loadHorariosDisponiveis(dateInput.value);
        }
    }, 300);

    // Quando mudar a data -> Carregar horários
    dateInput.addEventListener('change', function() {
        const dataSelecionada = this.value;
        loadHorariosDisponiveis(dataSelecionada);
    });

    // Ao Enviar o Formulário
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!supabase) {
            alert("⚠️ Sistema de agendamento temporariamente indisponível. Por favor, ligue para (11) 96765-1240.");
            return;
        }

        console.log("📨 Tentando enviar agendamento...");
        
        const btn = contactForm.querySelector('button[type="submit"]');
        const btnTextoOriginal = btn.innerText;
        btn.innerText = "Processando...";
        btn.disabled = true;

        // Pegar valores (REMOVENDO mensagem)
        const nome = document.getElementById('name').value.trim();
        const telefone = document.getElementById('phone').value.trim();
        const servico = document.getElementById('service').value;
        const data = document.getElementById('date').value;
        const hora = document.getElementById('time').value;
        // REMOVI: const msg = document.getElementById('message').value.trim();

        // Validações básicas
        if (!nome || !telefone || !servico || !data || !hora) {
            alert("Por favor, preencha todos os campos obrigatórios.");
            btn.innerText = btnTextoOriginal;
            btn.disabled = false;
            return;
        }

        if (hora.includes("Selecione") || hora.includes("Carregando") || hora.includes("Fechado") || hora.includes("Nenhum")) {
            alert("Por favor, selecione um horário disponível.");
            btn.innerText = btnTextoOriginal;
            btn.disabled = false;
            return;
        }

        try {
            console.log("🚀 Enviando para Supabase...");
            
            // Formatar dados corretamente
            const telefoneLimpo = telefone.replace(/\D/g, '');
            const horaFormatada = hora.includes(':') ? hora : hora + ":00";
            
            console.log("📤 Dados formatados:", {
                nome,
                telefone: telefoneLimpo,
                servico,
                data_agendamento: data,
                horario: horaFormatada
            });
            
            // Inserir no Supabase (SEM mensagem)
            const { data: resultado, error } = await supabase
                .from('agendamentos')
                .insert([{ 
                    nome: nome, 
                    telefone: telefoneLimpo,
                    servico: servico, 
                    data_agendamento: data, 
                    horario: horaFormatada
                    // REMOVI: mensagem: msg || null
                }])
                .select();

            if (error) {
                console.error("❌ Erro Supabase:", error);
                
                // Erros específicos
                if (error.code === '23505') {
                    throw new Error("⏰ Este horário já está reservado. Por favor, escolha outro horário.");
                } else if (error.code === '42501') {
                    throw new Error("🔒 Erro de permissão. Contate o administrador.");
                } else if (error.message.includes('row violates')) {
                    throw new Error("📅 Data ou horário inválido. Por favor, verifique os dados.");
                } else {
                    // Mostrar erro detalhado
                    let erroMsg = "Erro ao salvar agendamento.";
                    if (error.message) erroMsg += ` Detalhes: ${error.message}`;
                    if (error.details) erroMsg += ` (${error.details})`;
                    if (error.hint) erroMsg += ` Dica: ${error.hint}`;
                    throw new Error(erroMsg);
                }
            }

            console.log("✅ Agendamento salvo!", resultado);

            // SUCESSO - Mostrar animação
            showSuccessAnimation(nome, data, hora);
            
            // Enviar para WhatsApp após 1 segundo
            setTimeout(() => {
                const dataBr = data.split('-').reverse().join('/');
                const textoZap = `Olá! Fiz um agendamento pelo site.\n\n*Nome:* ${nome}\n*Serviço:* ${servico}\n*Data:* ${dataBr}\n*Horário:* ${hora}\n\nPor favor, confirme meu agendamento.`;
                window.open(`https://wa.me/5511967651240?text=${encodeURIComponent(textoZap)}`, '_blank');
            }, 1000);

            // Recarregar página após 8 segundos
            setTimeout(() => {
                window.location.reload();
            }, 8000);

        } catch (erro) {
            console.error("❌ Erro no agendamento:", erro);
            alert("❌ " + erro.message);
        } finally {
            btn.innerText = btnTextoOriginal;
            btn.disabled = false;
        }
    });

    // Função para carregar horários disponíveis
    async function loadHorariosDisponiveis(dataSelecionada) {
        console.log(`📅 Carregando horários para: ${dataSelecionada}`);
        
        const diaSemana = new Date(dataSelecionada).getUTCDay();
        
        timeSelect.innerHTML = '<option value="">Carregando disponibilidade...</option>';
        timeSelect.disabled = true;

        // Domingo (0) e Segunda (1) fechado
        if (diaSemana === 0 || diaSemana === 1) {
            timeSelect.innerHTML = '<option value="" disabled>Fechado neste dia (Domingo/Segunda)</option>';
            return;
        }

        try {
            // Buscar agendamentos existentes para esta data
            const { data: agendamentos, error } = await supabase
                .from('agendamentos')
                .select('horario')
                .eq('data_agendamento', dataSelecionada);

            if (error) {
                console.error("Erro ao buscar agendamentos:", error);
                throw error;
            }

            // Horários ocupados
            const ocupados = agendamentos ? agendamentos.map(item => {
                // Garantir formato HH:MM
                let hora = item.horario;
                if (hora && hora.includes(':')) {
                    const partes = hora.split(':');
                    return partes[0] + ':' + partes[1]; // Remove segundos se existirem
                }
                return hora;
            }) : [];
            
            console.log(`📊 Horários ocupados:`, ocupados);

            // Filtrar horários disponíveis
            let disponiveis = HORARIOS_PADRAO.filter(h => !ocupados.includes(h));

            // Se for hoje, remover horários passados
            const hoje = new Date().toISOString().split('T')[0];
            if (dataSelecionada === hoje) {
                const agora = new Date();
                const horaAtual = agora.getHours();
                const minutoAtual = agora.getMinutes();
                disponiveis = disponiveis.filter(h => {
                    const [hora, minuto] = h.split(':').map(Number);
                    return hora > horaAtual || (hora === horaAtual && minuto > minutoAtual);
                });
            }

            console.log(`🎯 Horários disponíveis:`, disponiveis);

            // Preencher select
            timeSelect.innerHTML = '';
            
            if (disponiveis.length === 0) {
                const option = document.createElement('option');
                option.value = "";
                option.textContent = "Nenhum horário disponível";
                option.disabled = true;
                timeSelect.appendChild(option);
            } else {
                // Opção padrão
                const optionPadrao = document.createElement('option');
                optionPadrao.value = "";
                optionPadrao.textContent = "Selecione um horário";
                timeSelect.appendChild(optionPadrao);
                
                // Horários disponíveis
                disponiveis.forEach(hora => {
                    const option = document.createElement('option');
                    option.value = hora;
                    option.textContent = hora;
                    timeSelect.appendChild(option);
                });
                timeSelect.disabled = false;
            }

        } catch (erro) {
            console.error("Erro ao carregar horários:", erro);
            
            // Fallback: mostrar todos os horários
            timeSelect.innerHTML = '';
            const optionPadrao = document.createElement('option');
            optionPadrao.value = "";
            optionPadrao.textContent = "Selecione um horário";
            timeSelect.appendChild(optionPadrao);
            
            HORARIOS_PADRAO.forEach(hora => {
                const option = document.createElement('option');
                option.value = hora;
                option.textContent = hora;
                timeSelect.appendChild(option);
            });
            timeSelect.disabled = false;
        }
    }
}

// ========================================
// 5. FUNÇÕES UI E ANIMAÇÕES
// ========================================

function showSuccessAnimation(nome, data, hora) {
    const form = document.getElementById('contactForm');
    if (!form) return;
    
    const dataBr = data.split('-').reverse().join('/');
    
    form.innerHTML = `
        <div class="success-message">
            <i class="fas fa-check-circle"></i>
            <h3>✅ Agendamento Confirmado!</h3>
            <p><strong>${nome}</strong>, seu agendamento foi realizado com sucesso!</p>
            <p>📅 <strong>Data:</strong> ${dataBr}</p>
            <p>⏰ <strong>Horário:</strong> ${hora}</p>
            <p>Você será redirecionado para o WhatsApp em instantes...</p>
            <div class="loading-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    
    // Estilos para os dots
    const style = document.createElement('style');
    style.textContent = `
        .success-message {
            text-align: center;
            padding: 40px 20px;
            background: #f8fff8;
            border-radius: 12px;
            border: 2px solid #28a745;
        }
        .success-message i {
            font-size: 4rem;
            color: #28a745;
            margin-bottom: 20px;
        }
        .success-message h3 {
            color: #155724;
            margin-bottom: 15px;
        }
        .success-message p {
            margin: 10px 0;
            color: #333;
        }
        .loading-dots {
            display: flex;
            justify-content: center;
            gap: 8px;
            margin-top: 20px;
        }
        .loading-dots span {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background-color: #28a745;
            animation: pulse-dots 1.5s infinite ease-in-out;
        }
        .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
        .loading-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes pulse-dots {
            0%, 100% { opacity: 0.3; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.2); }
        }
    `;
    document.head.appendChild(style);
}

function initMenuHamburger() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    if (!hamburger || !navMenu) return;
    
    hamburger.addEventListener('click', (e) => {
        e.stopPropagation();
        navMenu.classList.toggle('active');
        hamburger.classList.toggle('active');
        document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    });
    
    // Fechar menu ao clicar em qualquer link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            hamburger.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
    
    // Fechar menu ao clicar fora (mas permitir clicar dentro do menu)
    document.addEventListener('click', (e) => {
        if (navMenu.classList.contains('active') && 
            !navMenu.contains(e.target) && 
            !hamburger.contains(e.target)) {
            navMenu.classList.remove('active');
            hamburger.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
    
    // Evitar que cliques dentro do menu fechem ele
    navMenu.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}

function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    
    let lastScroll = 0;
    const scrollThreshold = 100;
    let isNavbarHidden = false;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        // Adicionar/remover classe scrolled para mudança de cor
        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        // SÓ esconder a navbar se:
        // 1. O usuário está rolando PARA BAIXO
        // 2. Já passou do threshold
        // 3. O menu mobile NÃO está aberto
        if (currentScroll > lastScroll && 
            currentScroll > scrollThreshold &&
            !document.querySelector('.nav-menu.active')) {
            
            if (!isNavbarHidden) {
                navbar.style.transform = 'translateY(-100%)';
                navbar.style.transition = 'transform 0.3s ease';
                isNavbarHidden = true;
            }
        } else {
            // Sempre mostrar quando rola para cima
            if (isNavbarHidden || currentScroll <= scrollThreshold) {
                navbar.style.transform = 'translateY(0)';
                isNavbarHidden = false;
            }
        }
        
        lastScroll = currentScroll;
    });
    
    // Mostrar navbar ao fazer hover nela (opcional)
    navbar.addEventListener('mouseenter', () => {
        if (isNavbarHidden) {
            navbar.style.transform = 'translateY(0)';
            isNavbarHidden = false;
        }
    });
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Ignorar links vazios
            if (href === '#' || href === '#!') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                
                // Fechar menu mobile se estiver aberto
                const navMenu = document.querySelector('.nav-menu');
                const hamburger = document.querySelector('.hamburger');
                if (navMenu && navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                    hamburger.classList.remove('active');
                    document.body.style.overflow = '';
                }
                
                // Calcular posição
                const navHeight = document.querySelector('.navbar').offsetHeight;
                let targetPosition = 0;
                
                if (target.id === 'footer-contacts') {
                    // Para o rodapé, rolar até o final
                    targetPosition = document.body.scrollHeight - window.innerHeight;
                } else {
                    targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
                }
                
                // Scroll suave
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

function initCarrossel() {
    const slides = document.querySelectorAll('.carrossel-slide');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.querySelector('.carrossel-prev');
    const nextBtn = document.querySelector('.carrossel-next');
    
    if (!slides.length) return;
    
    let currentSlide = 0;
    let autoPlayInterval;
    
    function showSlide(index) {
        // Validar índice
        if (index < 0) index = slides.length - 1;
        if (index >= slides.length) index = 0;
        
        // Esconder todas
        slides.forEach(slide => {
            slide.classList.remove('active');
            slide.style.display = 'none';
        });
        
        // Mostrar slide atual
        slides[index].classList.add('active');
        slides[index].style.display = 'block';
        
        // Atualizar dots
        dots.forEach(dot => dot.classList.remove('active'));
        if (dots[index]) dots[index].classList.add('active');
        
        currentSlide = index;
    }
    
    function nextSlide() {
        showSlide(currentSlide + 1);
    }
    
    function prevSlide() {
        showSlide(currentSlide - 1);
    }
    
    // Event listeners
    if (nextBtn) nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        nextSlide();
        resetAutoPlay();
    });
    
    if (prevBtn) prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        prevSlide();
        resetAutoPlay();
    });
    
    // Dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', (e) => {
            e.preventDefault();
            showSlide(index);
            resetAutoPlay();
        });
    });
    
    // Auto-play
    function startAutoPlay() {
        autoPlayInterval = setInterval(nextSlide, 5000);
    }
    
    function resetAutoPlay() {
        clearInterval(autoPlayInterval);
        startAutoPlay();
    }
    
    // Iniciar
    showSlide(0);
    startAutoPlay();
    
    // Pausar auto-play quando hover
    const carrossel = document.querySelector('.avaliacoes-carrossel');
    if (carrossel) {
        carrossel.addEventListener('mouseenter', () => clearInterval(autoPlayInterval));
        carrossel.addEventListener('mouseleave', startAutoPlay);
    }
}

function initCounters() {
    const counters = document.querySelectorAll('.counter');
    if (!counters.length) return;
    
    // Observer para animar quando entrar na viewport
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = +counter.getAttribute('data-target');
                const duration = 2000; // 2 segundos
                const increment = target / (duration / 16); // 60fps
                let current = 0;
                
                const updateCounter = () => {
                    if (current < target) {
                        current += increment;
                        counter.innerText = Math.floor(current);
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.innerText = target;
                    }
                };
                
                updateCounter();
                observer.unobserve(counter);
            }
        });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => observer.observe(counter));
}

function initIntersectionObserver() {
    // Observer para animações de fade-in
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
            }
        });
    }, { threshold: 0.1 });
    
    // Observar elementos com classe .animate-on-scroll
    document.querySelectorAll('.servico-card, .feature, .missao-card').forEach(el => {
        observer.observe(el);
    });
}

function initMapFix() {
    // Corrigir links de mapa se necessário
    const mapLinks = document.querySelectorAll('a[href*="maps.google.com"]');
    mapLinks.forEach(link => {
        if (link.href.includes('embed')) {
            link.href = link.href.replace('embed', '');
        }
    });
}

function initImageFix() {
    // Fallback para imagens quebradas
    document.querySelectorAll('img').forEach(img => {
        img.onerror = function() {
            this.onerror = null;
            // Usar placeholder genérico para estética
            this.src = 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80';
            this.style.opacity = '0.7';
        };
    });
}

// ========================================
// 6. FUNÇÕES AUXILIARES
// ========================================

// Formatar telefone enquanto digita
const phoneInput = document.getElementById('phone');
if (phoneInput) {
    phoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.substring(0, 11);
        
        if (value.length > 10) {
            value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
        } else if (value.length > 6) {
            value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
        } else if (value.length > 2) {
            value = value.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
        } else if (value.length > 0) {
            value = value.replace(/^(\d*)/, '($1');
        }
        
        e.target.value = value;
    });
}

// Adicionar classe animated após carregamento
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
    
    // Tentar reconectar Supabase se necessário
    if (!supabase && window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log("✅ Supabase reconectado após load!");
        
        // Iniciar sistema de agendamento
        setTimeout(() => {
            initAgendamentoSystem();
        }, 500);
    }
});

// ========================================
// 7. DETECTAR DISPOSITIVO MOBILE
// ========================================
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Ajustes para mobile
if (isMobile()) {
    document.addEventListener('DOMContentLoaded', () => {
        // Melhorar toques em mobile
        document.querySelectorAll('button, a').forEach(el => {
            el.style.cursor = 'pointer';
        });
        
        // Prevenir zoom em inputs
        document.querySelectorAll('input, select, textarea').forEach(el => {
            el.addEventListener('focus', () => {
                setTimeout(() => {
                    window.scrollTo(0, 0);
                }, 100);
            });
        });
    });
}

console.log('✨ Scripts inicializados com sucesso!');

// Sistema de lembrete automático
async function enviarLembreteAutomatico() {
    // Rodaria 1x por dia (você configura no admin)
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const dataAmanha = amanha.toISOString().split('T')[0];
    
    // Buscar agendamentos de amanhã
    const { data: agendamentos } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('data_agendamento', dataAmanha);
    
    agendamentos.forEach(ag => {
        // WhatsApp
        const msgWhatsApp = `🔔 Lembrete: Seu agendamento é amanhã às ${ag.horario}. Confirmar?`;
        // Email (se tiver email cadastrado)
        const msgEmail = `Olá ${ag.nome}, lembrete do seu agendamento...`;
        
        // Aqui você integraria com serviço de email
    });
}