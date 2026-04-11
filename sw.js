const CACHE_NAME = 'jornada-guitarra-v1';

// Arquivos base que devem ser cacheados imediatamente quando o app é instalado
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/app.js',
    '/manifest.json',
    '/data/roadieDb.json',
    '/data/planData.json',
    '/data/chordDb.json',
    '/data/pedalData.json',
    '/data/digitechPresets.json'
];

// Instalação: Salva os arquivos essenciais
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Ativação: Limpa caches antigos se você mudar a versão (ex: v2)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) return caches.delete(key);
            }));
        })
    );
});

// Interceptador de Requisições: Estratégia Network First (Rede primeiro, depois Cache)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                // Se a internet funcionou, clonamos a resposta e atualizamos o cache
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            })
            .catch(() => {
                // Se a internet caiu, pegamos o arquivo salvo no cache
                return caches.match(event.request);
            })
    );
});