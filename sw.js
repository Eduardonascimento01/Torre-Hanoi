// Aumente este número toda vez que fizer alterações no HTML/CSS/JS!
const NOME_DO_CACHE = "hanoi-cache-v2"; 

const ARQUIVOS_PARA_SALVAR = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./icone.png",
  "./manifest.json"
];

// 1. INSTALAÇÃO: Baixa os arquivos e guarda no cache atual
self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(NOME_DO_CACHE).then((cache) => {
      return cache.addAll(ARQUIVOS_PARA_SALVAR);
    })
  );
  // Garante que o SW seja instalado e ative a nova versão imediatamente
});

// 2. ATIVAÇÃO: A Faxina! Remove qualquer cache antigo (ex: v1)
self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys().then((chavesDosCaches) => {
      return Promise.all(
        chavesDosCaches.map((chave) => {
          // Se o nome do cache antigo não for igual ao novo, delete-o
          if (chave !== NOME_DO_CACHE) {
            console.log("[Service Worker] Limpando cache antigo:", chave);
            return caches.delete(chave);
          }
        })
      );
    })
  );
  // Garante que o SW controle as páginas imediatamente
  return self.clients.claim();
});

// 3. INTERCEPTAÇÃO (Stale-While-Revalidate)
self.addEventListener("fetch", (evento) => {
  evento.respondWith(
    caches.open(NOME_DO_CACHE).then((cache) => {
      return cache.match(evento.request).then((respostaEmCache) => {
        
        // A promessa de buscar na rede em segundo plano
        const buscaNaRede = fetch(evento.request).then((respostaDaRede) => {
          // Atualiza o cache silenciosamente com a versão mais nova
          cache.put(evento.request, respostaDaRede.clone());
          return respostaDaRede;
        }).catch(() => {
          // Silencia erros de rede caso o usuário esteja realmente offline
        });

        // Retorna o que está no cache IMEDIATAMENTE (Stale).
        // Se não tiver no cache, espera a rede responder.
        return respostaEmCache || buscaNaRede;
      });
    })
  );
});

// 4. MENSAGEM: Escuta quando o usuário clica em "Atualizar" no site
self.addEventListener('message', (evento) => {
  if (evento.data && evento.data.type === 'SKIP_WAITING') {
    self.skipWaiting(); // Força a nova versão a assumir o controle
  }
});