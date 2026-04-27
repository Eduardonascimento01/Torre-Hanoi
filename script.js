// --- VARIÁVEIS GLOBAIS ---
let estadoDoJogo = { A: [], B: [], C: [] };
let pinoOrigem = null;
let segundos = 0;
let intervaloCronometro = null;
let jogoAtivo = false;
let movimentos = 0;

// --- FUNÇÕES DE LÓGICA DO JOGO ---
function reiniciarJogo() {
    const totalDiscos = parseInt(document.getElementById("numDiscos").value);
    const querCronometro = document.getElementById("usarCronometro").checked;

    const larguraIdealBase = (totalDiscos * 25 + 20) + 40; 
    const alturaIdealPino = (totalDiscos * 21) + 60; 

    document.querySelectorAll('.pino').forEach(pino => {
        pino.style.width = larguraIdealBase + "px";
        pino.style.height = alturaIdealPino + "px";
    });

    movimentos = 0;
    document.getElementById("contador-movimentos").innerText = "0";
    
    const minMovimentos = Math.pow(2, totalDiscos) - 1;
    document.getElementById("objetivo-minimo").innerText = minMovimentos;

    estadoDoJogo = { A: [], B: [], C: [] };
    for (let i = totalDiscos; i > 0; i--) {
        estadoDoJogo.A.push(i);
    }

    pararCronometro();
    segundos = 0;
    document.getElementById("segundos").innerText = "0";
    document.getElementById("display-tempo").style.display = querCronometro ? "block" : "none";
    
    pinoOrigem = null;
    jogoAtivo = true;
    desenharDiscos();
    
    // --- NOVIDADE: Chama o ajuste de tela sempre que o jogo reinicia ---
    ajustarResponsividade();
}

function clicarPino(nomeDoPino) {
    if (!jogoAtivo) return;

    if (pinoOrigem === null) {
        if (estadoDoJogo[nomeDoPino].length > 0) {
            pinoOrigem = nomeDoPino;
            document.getElementById("pino" + pinoOrigem).classList.add("selecionado");
        }
    } else {
        let pinoDestino = nomeDoPino;
        if (pinoOrigem !== pinoDestino) {
            let discoMovido = estadoDoJogo[pinoOrigem][estadoDoJogo[pinoOrigem].length - 1];
            let topoDestino = estadoDoJogo[pinoDestino][estadoDoJogo[pinoDestino].length - 1];

            if (estadoDoJogo[pinoDestino].length === 0 || discoMovido < topoDestino) {
                estadoDoJogo[pinoOrigem].pop();
                estadoDoJogo[pinoDestino].push(discoMovido);
                
                movimentos++;
                document.getElementById("contador-movimentos").innerText = movimentos;

                if (document.getElementById("usarCronometro").checked) iniciarCronometro();
            } else {
                mostrarNotificacao("Movimento Inválido!");
            }
        }
        pinoOrigem = null;
        desenharDiscos();
        verificarVitoria();
    }
}

function verificarVitoria() {
    const totalDiscos = parseInt(document.getElementById("numDiscos").value);
    if (estadoDoJogo.C.length === totalDiscos) {
        pararCronometro();
        jogoAtivo = false;
        mostrarNotificacao(`Você venceu em ${movimentos} movimentos e ${segundos} segundos!`);
    }
}

// --- FUNÇÕES VISUAIS E DE TEMPO ---
function desenharDiscos() {
    for (let nomeDoPino in estadoDoJogo) {
        let elementoPino = document.getElementById("pino" + nomeDoPino);
        elementoPino.innerHTML = "";
        elementoPino.classList.remove("selecionado");
        
        estadoDoJogo[nomeDoPino].forEach(tamanho => {
            let disco = document.createElement("div");
            disco.className = "disco";
            disco.style.width = (tamanho * 25 + 20) + "px"; 
            
            const cores = ["#e74c3c", "#f1c40f", "#2ecc71", "#3498db", "#9b59b6", "#e67e22"];
            disco.style.backgroundColor = cores[tamanho % cores.length];

            elementoPino.appendChild(disco);
        });
    }
}

function iniciarCronometro() {
    if (intervaloCronometro) return;
    intervaloCronometro = setInterval(() => {
        segundos++;
        document.getElementById("segundos").innerText = segundos;
    }, 1000);
}

function pararCronometro() {
    clearInterval(intervaloCronometro);
    intervaloCronometro = null;
}

// --- A MÁGICA DA RESPONSIVIDADE (NOVO) ---
function ajustarResponsividade() {
    const tabuleiro = document.getElementById('tabuleiro');
    const conteiner = document.getElementById('container-tabuleiro');
    const larguraTela = window.innerWidth || document.documentElement.clientWidth;
    const totalDiscos = parseInt(document.getElementById("numDiscos").value);
    
    const larguraDeUmPino = (totalDiscos * 25 + 20) + 40;
    const larguraTotalDoJogo = (larguraDeUmPino * 3) + 140;

    // Se a tela do aparelho for menor que o tamanho do jogo...
    if (larguraTela < larguraTotalDoJogo) {
        // Reduz o tamanho do tabuleiro para caber na tela perfeitamente!
        const escala = larguraTela / larguraTotalDoJogo;
        tabuleiro.style.transform = `scale(${escala})`;
        tabuleiro.style.transformOrigin = "top center";
        const alturaOriginal = tabuleiro.offsetHeight;
        tabuleiro.style.height = (alturaOriginal * escala) + "px";
    } else {
        // Se a tela for grande (PC), o jogo fica no tamanho original
        tabuleiro.style.transform = "scale(1)";
        conteiner.style.height = "auto";
    }
}
// --- SISTEMA DE NOTIFICAÇÃO ---
function mostrarNotificacao(mensagem) {
    const notif = document.getElementById("notificacao");
    notif.innerText = mensagem;
    notif.classList.add("mostrar");

    // Removemos qualquer ouvinte de clique antigo por precaução
    document.removeEventListener('click', esconderNotificacao);
    
    // Usamos um pequeno atraso antes de "ligar" o clique na tela.
    // Se não fizermos isso, o mesmo clique que te fez errar a jogada vai fechar a notificação instantaneamente!
    setTimeout(() => {
        document.addEventListener('click', esconderNotificacao);
    }, 100);
}

function esconderNotificacao() {
    const notif = document.getElementById("notificacao");
    notif.classList.remove("mostrar");
    
    // Desliga o clique na tela para não ficar gastando memória à toa
    document.removeEventListener('click', esconderNotificacao);
}

// Fica prestando atenção: Se o jogador virar o celular deitado, reajusta a tela!
window.addEventListener('resize', ajustarResponsividade);

// Garante que o jogo só inicie depois que o HTML carregar
window.addEventListener('DOMContentLoaded', reiniciarJogo);