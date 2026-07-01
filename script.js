// ==================== CONFIGURAÇÃO ====================
const DISC_COLORS = [
    '#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#55efc4',
    '#fd79a8', '#fdcb6e', '#81ecec', '#a29bfe', '#fab1a0'
];

// ==================== ESTADO DO JOGO ====================
let numDiscos = 3;
let pilhas = { A: [], B: [], C: [] };
let pinoSelecionado = null;
let movimentos = 0;
let segundos = 0;
let timerInterval = null;
let cronometroAtivo = false;
let jogoConcluido = false;
let historicoMovimentos = [];

// ==================== REFERÊNCIAS DO DOM ====================
const inputNumDiscos = document.getElementById('numDiscos');
const checkboxCronometro = document.getElementById('usarCronometro');
const btnNovoJogo = document.getElementById('btnNovoJogo');
const btnVoltar = document.getElementById('btnVoltar');
const btnTutorial = document.getElementById('btnTutorial');
const contadorMovimentos = document.getElementById('contador-movimentos');
const objetivoMinimo = document.getElementById('objetivo-minimo');
const displayTempo = document.getElementById('display-tempo');
const spanSegundos = document.getElementById('segundos');
const notificacao = document.getElementById('notificacao');
const vitoriaOverlay = document.getElementById('vitoria-overlay');
const vitoriaMensagem = document.getElementById('vitoria-mensagem');
const btnJogarNovamente = document.getElementById('btn-jogar-novamente');
const tutorialOverlay = document.getElementById('tutorial-overlay');
const tutorialTitulo = document.getElementById('tutorial-titulo');
const tutorialTexto = document.getElementById('tutorial-texto');
const tutorialPasso = document.getElementById('tutorial-passo');
const btnFecharTutorial = document.getElementById('btn-fechar-tutorial');
const btnProximoTutorial = document.getElementById('btn-proximo-tutorial');

// ==================== REDIMENSIONAMENTO ====================
function redimensionarComponentes() {
    const tabuleiro = document.getElementById('tabuleiro');
    const larguraTabuleiro = tabuleiro.clientWidth;
    const alturaTela = window.innerHeight;

    const isLandscape = window.matchMedia('(orientation: landscape)').matches && alturaTela < 600;

    const totalDiscos = numDiscos;
    const baseDiscoWidth = isLandscape ? 12 : 18;
    const larguraMaiorDisco = 30 + totalDiscos * baseDiscoWidth;
    let larguraIdealBase = larguraMaiorDisco + (isLandscape ? 20 : 40);

    const maxLarguraPino = larguraTabuleiro * 0.30;
    if (larguraIdealBase > maxLarguraPino) larguraIdealBase = maxLarguraPino;
    if (larguraIdealBase < 24) larguraIdealBase = 24;

    const alturaDisco = isLandscape ? 16 : (window.innerWidth <= 500 ? 20 : 24);
    let alturaIdealPino = (totalDiscos * alturaDisco) + (isLandscape ? 30 : 60);

    const limiteAltura = isLandscape ? alturaTela * 0.65 : alturaTela * 0.5;
    if (alturaIdealPino > limiteAltura) alturaIdealPino = limiteAltura;
    if (alturaIdealPino < 100) alturaIdealPino = 100;

    document.querySelectorAll('.pino').forEach(pino => {
        pino.style.width = larguraIdealBase + 'px';
        pino.style.height = alturaIdealPino + 'px';
    });

    document.querySelectorAll('.disco').forEach(disco => {
        const tamanho = parseInt(disco.dataset.tamanho, 10);
        const largura = 30 + tamanho * baseDiscoWidth;
        disco.style.width = largura + 'px';
        disco.style.height = alturaDisco + 'px';
    });
}

window.addEventListener('resize', () => {
    if (!jogoConcluido) redimensionarComponentes();
});

window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        if (!jogoConcluido) redimensionarComponentes();
    }, 200);
});

// ==================== INICIALIZAÇÃO ====================
function inicializarJogo() {
    numDiscos = parseInt(inputNumDiscos.value, 10) || 3;
    if (numDiscos < 3) numDiscos = 3;
    if (numDiscos > 10) numDiscos = 10;
    inputNumDiscos.value = numDiscos;

    pilhas = { A: [], B: [], C: [] };
    for (let i = numDiscos; i >= 1; i--) pilhas.A.push(i);

    pinoSelecionado = null;
    movimentos = 0;
    jogoConcluido = false;
    historicoMovimentos = [];
    pararCronometro();
    segundos = 0;
    spanSegundos.textContent = '0';

    atualizarObjetivo();
    atualizarContador();
    atualizarCronometroDisplay();
    renderizarTodosPinos();
    vitoriaOverlay.classList.remove('mostrar');
}

function atualizarObjetivo() {
    const minimo = Math.pow(2, numDiscos) - 1;
    objetivoMinimo.textContent = minimo;
}

function atualizarContador() {
    contadorMovimentos.textContent = movimentos;
}

function atualizarCronometroDisplay() {
    if (checkboxCronometro.checked) {
        displayTempo.style.display = 'block';
        spanSegundos.textContent = segundos;
    } else {
        displayTempo.style.display = 'none';
    }
}

function iniciarCronometro() {
    if (!checkboxCronometro.checked || cronometroAtivo || jogoConcluido) return;
    cronometroAtivo = true;
    atualizarCronometroDisplay();
    timerInterval = setInterval(() => {
        segundos++;
        spanSegundos.textContent = segundos;
    }, 1000);
}

function pararCronometro() {
    cronometroAtivo = false;
    clearInterval(timerInterval);
    timerInterval = null;
}

// ==================== RENDERIZAÇÃO ====================
function renderizarPino(nomePino) {
    const pinoEl = document.getElementById('pino' + nomePino);
    pinoEl.querySelectorAll('.disco').forEach(d => d.remove());

    pilhas[nomePino].forEach((tamanho) => {
        const disco = document.createElement('div');
        disco.className = 'disco';
        disco.dataset.tamanho = tamanho;
        disco.dataset.pino = nomePino;
        const largura = 30 + tamanho * 18;
        disco.style.width = largura + 'px';
        disco.style.backgroundColor = DISC_COLORS[(tamanho - 1) % DISC_COLORS.length];
        disco.draggable = true;
        disco.addEventListener('dragstart', handleDragStart);
        disco.addEventListener('dragend', handleDragEnd);
        pinoEl.appendChild(disco);
    });

    // Acessibilidade: descreve o estado atual do pino para leitores de tela
    const qtd = pilhas[nomePino].length;
    pinoEl.setAttribute('aria-label', `Pino ${nomePino}, ${qtd} disco${qtd === 1 ? '' : 's'}`);
}

function renderizarTodosPinos() {
    renderizarPino('A');
    renderizarPino('B');
    renderizarPino('C');
    document.querySelectorAll('.pino').forEach(p => p.classList.remove('selecionado'));
    pinoSelecionado = null;
    redimensionarComponentes();
}

// ==================== REGRAS DO JOGO ====================
function movimentoValido(origem, destino) {
    if (pilhas[origem].length === 0) return false;
    if (pilhas[destino].length === 0) return true;
    return pilhas[origem].slice(-1)[0] < pilhas[destino].slice(-1)[0];
}

function executarMovimento(origem, destino) {
    const disco = pilhas[origem].pop();
    pilhas[destino].push(disco);
    movimentos++;
    historicoMovimentos.push({ origem, destino, disco });
    atualizarContador();
    renderizarTodosPinos();

    const pinoDest = document.getElementById('pino' + destino);
    pinoDest.style.animation = 'none';
    pinoDest.offsetHeight; // força reflow para reiniciar a animação
    pinoDest.style.animation = 'vibrar 0.3s ease-out';
    setTimeout(() => { pinoDest.style.animation = ''; }, 300);
}

function handlePinoClick(nomePino) {
    if (jogoConcluido) return;

    if (pinoSelecionado === null) {
        if (pilhas[nomePino].length === 0) {
            mostrarNotificacao('Pino vazio! Escolha um pino com discos.', 'aviso');
            return;
        }
        pinoSelecionado = nomePino;
        document.getElementById('pino' + nomePino).classList.add('selecionado');
        iniciarCronometro();
        return;
    }

    if (pinoSelecionado === nomePino) {
        document.getElementById('pino' + nomePino).classList.remove('selecionado');
        pinoSelecionado = null;
        return;
    }

    const origem = pinoSelecionado;
    const destino = nomePino;

    if (movimentoValido(origem, destino)) {
        executarMovimento(origem, destino);
        document.getElementById('pino' + origem).classList.remove('selecionado');
        pinoSelecionado = null;
        verificarVitoria();
        return;
    }

    // Movimento inválido: limpa a seleção anterior e, se o pino clicado
    // tiver discos, já o aproveita como nova origem (evita "travar" o jogo).
    mostrarNotificacao('❌ Movimento inválido!', 'erro');
    document.getElementById('pino' + origem).classList.remove('selecionado');
    if (pilhas[destino].length > 0) {
        pinoSelecionado = destino;
        document.getElementById('pino' + destino).classList.add('selecionado');
    } else {
        pinoSelecionado = null;
    }
}

// Desfazer com penalidade de +1 movimento (botão "Voltar")
function voltarJogada() {
    if (jogoConcluido || historicoMovimentos.length === 0) {
        mostrarNotificacao('Nada para voltar!', 'aviso');
        return;
    }
    const ultimo = historicoMovimentos.pop();
    pilhas[ultimo.destino].pop();
    pilhas[ultimo.origem].push(ultimo.disco);
    movimentos++; // penalidade
    atualizarContador();
    renderizarTodosPinos();
    mostrarNotificacao('↩ Voltar (+1 movimento)', 'info');
}

// Desfazer sem penalidade (atalho Ctrl+Z)
function desfazerMovimento() {
    if (jogoConcluido || historicoMovimentos.length === 0) return;
    const ultimo = historicoMovimentos.pop();
    pilhas[ultimo.destino].pop();
    pilhas[ultimo.origem].push(ultimo.disco);
    movimentos--;
    atualizarContador();
    renderizarTodosPinos();
    mostrarNotificacao('↩ Movimento desfeito', 'info');
}

function verificarVitoria() {
    if (pilhas.C.length === numDiscos) {
        jogoConcluido = true;
        pararCronometro();
        const minimo = Math.pow(2, numDiscos) - 1;
        let mensagem = `Completado em ${movimentos} movimentos`;
        if (movimentos === minimo) mensagem += ' ⭐ Solução perfeita!';
        if (cronometroAtivo || segundos > 0) mensagem += ` | Tempo: ${segundos}s`;
        vitoriaMensagem.textContent = mensagem;
        vitoriaOverlay.classList.add('mostrar');
        criarConfete();
    }
}

// ==================== NOTIFICAÇÕES ====================
let notificacaoTimeout;
function mostrarNotificacao(mensagem, tipo = 'info') {
    clearTimeout(notificacaoTimeout);
    notificacao.textContent = mensagem;
    notificacao.className = 'mostrar';

    if (tipo === 'erro') {
        notificacao.style.background = 'linear-gradient(135deg, #c0392b, #e74c3c)';
    } else if (tipo === 'vitoria') {
        notificacao.style.background = 'linear-gradient(135deg, #2ecc71, #27ae60)';
    } else if (tipo === 'aviso') {
        notificacao.style.background = 'linear-gradient(135deg, #f39c12, #e67e22)';
    } else {
        notificacao.style.background = 'linear-gradient(135deg, #1a1a2e, #0f3460)';
    }

    notificacaoTimeout = setTimeout(() => {
        notificacao.classList.remove('mostrar');
    }, 2500);
}

// ==================== CONFETE ====================
function criarConfete() {
    const colors = ['#e94560', '#f5c518', '#16c79a', '#48dbfb', '#ff9ff3', '#55efc4'];
    for (let i = 0; i < 40; i++) {
        const confete = document.createElement('div');
        confete.style.cssText = `
            position: fixed;
            width: ${Math.random() * 10 + 6}px;
            height: ${Math.random() * 10 + 6}px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            left: ${Math.random() * 100}vw;
            top: -20px;
            border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
            z-index: 3000;
            pointer-events: none;
            animation: cairConfete ${Math.random() * 2 + 2}s linear forwards;
        `;
        document.body.appendChild(confete);
        setTimeout(() => confete.remove(), 3000);
    }
}

// ==================== TUTORIAL ====================
const passosTutorial = [
    { titulo: '🎯 Objetivo', texto: 'Mova todos os discos do Pino A para o Pino C, sem colocar um disco maior sobre um menor.' },
    { titulo: '👆 Selecionar', texto: 'Clique em um pino para selecionar o disco do topo. Ele ficará azul brilhante.' },
    { titulo: '👉 Mover', texto: 'Clique em outro pino para mover o disco. Você também pode arrastar os discos!' },
    { titulo: '↩ Voltar', texto: 'Use o botão Voltar para desfazer uma jogada (custa +1 movimento). O atalho Ctrl+Z desfaz sem custo extra.' },
    { titulo: '⏱ Tempo', texto: 'Ative o Cronômetro se quiser desafiar a velocidade. O objetivo mínimo está na tela.' },
];
let passoTutorialAtual = 0;

function abrirTutorial() {
    passoTutorialAtual = 0;
    mostrarPassoTutorial();
    tutorialOverlay.classList.add('mostrar');
}

function fecharTutorial() {
    tutorialOverlay.classList.remove('mostrar');
}

function mostrarPassoTutorial() {
    const passo = passosTutorial[passoTutorialAtual];
    tutorialTitulo.textContent = passo.titulo;
    tutorialTexto.textContent = passo.texto;
    tutorialPasso.textContent = `Passo ${passoTutorialAtual + 1} de ${passosTutorial.length}`;
}

btnTutorial.addEventListener('click', abrirTutorial);
btnFecharTutorial.addEventListener('click', fecharTutorial);
btnProximoTutorial.addEventListener('click', () => {
    passoTutorialAtual = (passoTutorialAtual + 1) % passosTutorial.length;
    mostrarPassoTutorial();
});

// ==================== ARRASTAR E SOLTAR ====================
let discoArrastado = null;

function handleDragStart(e) {
    if (jogoConcluido) { e.preventDefault(); return; }
    discoArrastado = this;
    this.style.opacity = '0.6';
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.tamanho);
    iniciarCronometro();
}

function handleDragEnd() {
    if (discoArrastado) {
        discoArrastado.style.opacity = '1';
        discoArrastado = null;
    }
    document.querySelectorAll('.pino').forEach(p => p.classList.remove('drag-over'));
}

document.querySelectorAll('.pino').forEach(pino => {
    // Clique do mouse / toque
    pino.addEventListener('click', () => handlePinoClick(pino.dataset.pino));

    // Suporte a teclado: Enter ou Espaço selecionam/movem o pino focado
    pino.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handlePinoClick(pino.dataset.pino);
        }
    });

    pino.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        pino.classList.add('drag-over');
    });
    pino.addEventListener('dragleave', () => pino.classList.remove('drag-over'));
    pino.addEventListener('drop', function (e) {
        e.preventDefault();
        this.classList.remove('drag-over');
        if (!discoArrastado) return;

        const origem = discoArrastado.dataset.pino;
        const destino = this.dataset.pino;

        if (origem === destino) {
            discoArrastado.style.opacity = '1';
            discoArrastado = null;
            return;
        }

        const topoOrigem = pilhas[origem].slice(-1)[0];
        const discoTamanho = parseInt(discoArrastado.dataset.tamanho, 10);

        if (topoOrigem !== discoTamanho) {
            mostrarNotificacao('Apenas o disco do topo pode ser movido!', 'aviso');
            discoArrastado.style.opacity = '1';
            discoArrastado = null;
            return;
        }

        if (movimentoValido(origem, destino)) {
            executarMovimento(origem, destino);
            verificarVitoria();
        } else {
            mostrarNotificacao('❌ Movimento inválido!', 'erro');
        }

        discoArrastado.style.opacity = '1';
        discoArrastado = null;
    });
});

// ==================== EVENTOS GERAIS ====================
btnNovoJogo.addEventListener('click', () => {
    inicializarJogo();
    mostrarNotificacao('🔄 Novo jogo!', 'info');
});
btnJogarNovamente.addEventListener('click', () => {
    inicializarJogo();
    mostrarNotificacao('Boa sorte!', 'info');
});
btnVoltar.addEventListener('click', voltarJogada);
inputNumDiscos.addEventListener('change', inicializarJogo);
checkboxCronometro.addEventListener('change', () => {
    if (!checkboxCronometro.checked) pararCronometro();
    atualizarCronometroDisplay();
});

document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        desfazerMovimento();
    }
    // Atalho "R" para reiniciar, mas só quando o foco não está em um campo de texto
    if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey) {
        const tag = document.activeElement.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
            inicializarJogo();
        }
    }
});

// ==================== SERVICE WORKER ====================
let novoWorker;
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
        .then(registro => {
            console.log('✅ SW registrado');
            registro.addEventListener('updatefound', () => {
                novoWorker = registro.installing;
                novoWorker.addEventListener('statechange', () => {
                    if (novoWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        mostrarAvisoAtualizacao();
                    }
                });
            });
        })
        .catch(erro => console.log('Erro SW:', erro));

    let atualizando = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (atualizando) return;
        atualizando = true;
        window.location.reload();
    });
}

function mostrarAvisoAtualizacao() {
    notificacao.innerHTML = '';
    notificacao.textContent = '🔄 Nova versão disponível! ';

    const btnAtualizar = document.createElement('button');
    btnAtualizar.textContent = 'Atualizar';
    btnAtualizar.style.cssText = 'margin-top:8px;padding:8px 16px;background:#2ecc71;border:none;border-radius:20px;color:#fff;font-weight:bold;cursor:pointer;';
    btnAtualizar.addEventListener('click', () => {
        if (novoWorker) novoWorker.postMessage({ type: 'SKIP_WAITING' });
    });

    notificacao.appendChild(document.createElement('br'));
    notificacao.appendChild(btnAtualizar);
    notificacao.classList.add('mostrar');
}

// ==================== INÍCIO ====================
inicializarJogo();
atualizarCronometroDisplay();