

const CACHE_VERSION = 'managercar-v1.3.0'
const STATIC_CACHE = `${CACHE_VERSION}-static`
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`
const API_CACHE = `${CACHE_VERSION}-api`

/** Nomes de cache válidos na versão atual (demais são removidos no activate). */
const CURRENT_CACHE_NAMES = new Set([STATIC_CACHE, DYNAMIC_CACHE, API_CACHE])

// Precache: apenas recursos estáveis. Não incluir HTML nem hashes de /_next/ (mudam a cada build).
const STATIC_ASSETS = [
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

// URLs da API para cache
const API_URLS = ['/api/vehicles', '/api/clients', '/api/dashboard/stats']

// Recursos que nunca devem ser cached
const NEVER_CACHE = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/refresh',
  '/api/uploads',
]

// Estratégias de cache
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only',
}

// Configurar logs condicionais (apenas em desenvolvimento)
const isDevelopment =
  self.location.hostname === 'localhost' ||
  self.location.hostname === '127.0.0.1'
const log = isDevelopment ? console.log : () => {}
const warn = isDevelopment ? console.warn : () => {}
const error = console.error // Manter erros sempre

// Install event - cachear recursos estáticos
self.addEventListener('install', event => {
  log('[SW] Install event')

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then(cache => {
        log('[SW] Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        log('[SW] Static assets cached successfully')
        return self.skipWaiting()
      })
      .catch(error => {
        error('[SW] Error caching static assets:', error)
      })
  )
})

// Activate event - limpar caches antigos
self.addEventListener('activate', event => {
  log('[SW] Activate event')

  event.waitUntil(
    Promise.all([
      // Limpar caches antigos
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => !CURRENT_CACHE_NAMES.has(cacheName))
            .map(cacheName => {
              log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            })
        )
      }),
      // Assumir controle de todas as abas
      self.clients.claim(),
    ])
  )
})

// Fetch event - interceptar todas as requisições
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Ignorar requisições não HTTP(S)
  if (!request.url.startsWith('http')) {
    return
  }

  // Determinar estratégia de cache baseada no tipo de recurso
  if (shouldNeverCache(request)) {
    event.respondWith(networkOnly(request))
  } else if (isStaticAsset(request)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request))
  } else if (isAuthPageNavigation(request)) {
    // Auth: sempre rede — nunca servir documento HTML antigo (quebrava JS e botões após deploy/F5).
    event.respondWith(networkOnly(request))
  } else if (isPageRequest(request)) {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE))
  } else {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE))
  }
})

// Estratégia: Cache First (para recursos estáticos)
async function cacheFirst(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    error('[SW] Cache first failed:', error)
    return new Response('Offline - Recurso não disponível', {
      status: 503,
      statusText: 'Service Unavailable',
    })
  }
}

// Estratégia: Network First (para conteúdo dinâmico)
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    warn('[SW] Network failed, trying cache:', error)

    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    return createOfflineResponse(request)
  }
}

// Estratégia: Stale While Revalidate (para páginas)
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cachedResponse = await cache.match(request)

  const fetchPromise = fetch(request)
    .then(networkResponse => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone())
      }
      return networkResponse
    })
    .catch(() => cachedResponse)

  return cachedResponse || fetchPromise
}

// Estratégia: Network Only (para recursos sensíveis)
async function networkOnly(request) {
  try {
    return await fetch(request)
  } catch (error) {
    return new Response('Network Error', {
      status: 500,
      statusText: 'Network Error',
    })
  }
}

// Tratamento especial para requisições de API
async function handleAPIRequest(request) {
  const url = new URL(request.url)

  // GET requests: usar cache com revalidação
  if (request.method === 'GET') {
    return staleWhileRevalidate(request, API_CACHE)
  }

  // POST/PUT/DELETE: sempre rede, mas manter cache para rollback
  try {
    const response = await fetch(request)

    // Se a requisição foi bem-sucedida, invalidar cache relacionado
    if (response.ok) {
      await invalidateRelatedCache(url.pathname)
    }

    return response
  } catch (error) {
    // Em caso de erro de rede, tentar cache para GET equivalente
    if (request.method !== 'GET') {
      const getRequest = new Request(request.url, { method: 'GET' })
      const cachedResponse = await caches.match(getRequest)

      if (cachedResponse) {
        // Retornar dados em cache com aviso
        return new Response(cachedResponse.body, {
          status: 202,
          statusText: 'Offline - Dados em cache',
          headers: {
            ...cachedResponse.headers,
            'X-SW-Cache': 'true',
            'X-SW-Offline': 'true',
          },
        })
      }
    }

    throw error
  }
}

// Invalidar cache relacionado após mutação
async function invalidateRelatedCache(pathname) {
  const cache = await caches.open(API_CACHE)
  const keys = await cache.keys()

  const relatedKeys = keys.filter(request => {
    const requestUrl = new URL(request.url)
    return requestUrl.pathname.includes(pathname.split('/')[2]) // Ex: /api/vehicles
  })

  await Promise.all(relatedKeys.map(key => cache.delete(key)))
}

// Criar resposta offline personalizada
function createOfflineResponse(request) {
  const url = new URL(request.url)

  if (request.headers.get('accept')?.includes('text/html')) {
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>ManagerCar - Offline</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .offline { color: #666; }
            .retry-btn { 
              background: #1D4ED8; 
              color: white; 
              padding: 10px 20px; 
              border: none; 
              border-radius: 5px; 
              cursor: pointer; 
            }
          </style>
        </head>
        <body>
          <div class="offline">
            <h1>ManagerCar</h1>
            <h2>Você está offline</h2>
            <p>Verifique sua conexão com a internet e tente novamente.</p>
            <button class="retry-btn" onclick="window.location.reload()">Tentar Novamente</button>
          </div>
        </body>
      </html>
    `,
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/html' },
      }
    )
  }

  return new Response(
    JSON.stringify({
      error: 'Offline',
      message: 'Sem conexão com a internet',
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' },
    }
  )
}

// Utilitários de verificação
function shouldNeverCache(request) {
  return NEVER_CACHE.some(url => request.url.includes(url))
}

function isStaticAsset(request) {
  const url = new URL(request.url)
  return (
    url.pathname.includes('/_next/static/') ||
    url.pathname.includes('/icons/') ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$/)
  )
}

function isAPIRequest(request) {
  return request.url.includes('/api/')
}

function isAuthPageNavigation(request) {
  if (request.method !== 'GET') return false
  const acceptHeader = request.headers.get('accept') || ''
  if (!acceptHeader.includes('text/html')) return false
  try {
    const url = new URL(request.url)
    const path = url.pathname.replace(/\/$/, '') || '/'
    return (
      path === '/login' ||
      path === '/register' ||
      path === '/forgot-password' ||
      path.startsWith('/reset-password')
    )
  } catch {
    return false
  }
}

function isPageRequest(request) {
  const acceptHeader = request.headers.get('accept') || ''
  return acceptHeader.includes('text/html')
}

// Message event - comunicação com a página
self.addEventListener('message', event => {
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting()
        break
      case 'CACHE_STATS':
        getCacheStats().then(stats => {
          event.ports[0].postMessage(stats)
        })
        break
      case 'CLEAR_CACHE':
        clearAllCaches().then(() => {
          event.ports[0].postMessage({ success: true })
        })
        break
    }
  }
})

// Obter estatísticas do cache
async function getCacheStats() {
  const cacheNames = await caches.keys()
  const stats = {}

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName)
    const keys = await cache.keys()
    stats[cacheName] = keys.length
  }

  return stats
}

// Limpar todos os caches
async function clearAllCaches() {
  const cacheNames = await caches.keys()
  return Promise.all(cacheNames.map(name => caches.delete(name)))
}

// Sync event - para sincronização em background
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  // Implementar sincronização de dados pendentes
  log('[SW] Background sync triggered')
}

// Push event - para notificações push
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json()

    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: data.tag || 'default',
        data: data.data,
      })
    )
  }
})

// Notification click - ação ao clicar na notificação
self.addEventListener('notificationclick', event => {
  event.notification.close()

  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(clients.openWindow(event.notification.data.url))
  }
})

log('[SW] Service Worker loaded successfully')
