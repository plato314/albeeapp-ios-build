/* 代購記帳工具 Service Worker */
const CACHE_VERSION = "purchase-ledger-v25.5.0";
const CORE_CACHE = `${CACHE_VERSION}-core`;

// 你的主檔若不是 index.html，請把這裡改成你的實際檔名
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./service-worker.js",
  "./xlsx.full.min.js",

  // icons
  "./app-icon-192.png",
  "./app-icon-512.png",
  "./app-icon-180.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CORE_CACHE);
      await cache.addAll(CORE_ASSETS);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (
            (key.startsWith("purchase-ledger-") ||
             key.startsWith("albee-room-") ||
             key.startsWith("muno-")) &&
            key !== CORE_CACHE
          ) {
            return caches.delete(key);
          }
        })
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// HTML 導覽：Network First，離線 fallback
async function handleNavigation(request) {
  try {
    const res = await fetch(request);
    const cache = await caches.open(CORE_CACHE);
    cache.put(request, res.clone());
    return res;
  } catch (e) {
    const cache = await caches.open(CORE_CACHE);
    return (
      (await cache.match(request)) ||
      (await cache.match("./")) ||
      (await cache.match("./index.html"))
    );
  }
}

// 靜態資源：Stale-While-Revalidate
async function handleAsset(request) {
  const cache = await caches.open(CORE_CACHE);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((res) => {
      if (res && (res.ok || res.type === "opaque")) {
        cache.put(request, res.clone());
      }
      return res;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  if (request.url.startsWith("https://open.er-api.com/")) {
    event.respondWith(fetch(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
    return;
  }

  event.respondWith(handleAsset(request));
});
